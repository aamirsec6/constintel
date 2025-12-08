# GENERATOR: ML_PHASE1
# ASSUMPTIONS: Trained item2vec model and FAISS index available
# HOW TO RUN: Import and use: get_recommendations(profile_id, top_k=10)
# TODO: Add category filtering, popularity boost, diversity

import os
import pickle
import glob
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import faiss

try:
    from gensim.models import Word2Vec
    GENSIM_AVAILABLE = True
except ImportError:
    GENSIM_AVAILABLE = False

MODEL_PATH = os.getenv("ML_MODEL_PATH", "./models")

# Global cache
_recommendation_models: Dict[str, Any] = {}

def get_latest_recommendation_model() -> Optional[Dict[str, Any]]:
    """Get the latest recommendation model metadata"""
    pattern = os.path.join(MODEL_PATH, "recommendations_metadata_*.pkl")
    models = glob.glob(pattern)
    if not models:
        return None
    return max(models, key=os.path.getmtime)

def load_recommendation_models():
    """Load item2vec model and FAISS index"""
    global _recommendation_models
    
    if not GENSIM_AVAILABLE:
        print("⚠️  Warning: gensim not available, recommendations will use fallback")
        return
    
    metadata_file = get_latest_recommendation_model()
    if not metadata_file:
        print("⚠️  Warning: No recommendation models found")
        return
    
    try:
        with open(metadata_file, 'rb') as f:
            metadata = pickle.load(f)
        
        # Load item2vec model
        item2vec_model = Word2Vec.load(metadata['item2vec_path'])
        
        # Load FAISS index
        faiss_index = faiss.read_index(metadata['faiss_path'])
        
        _recommendation_models = {
            'item2vec': item2vec_model,
            'faiss_index': faiss_index,
            'product_to_idx': metadata['product_to_idx'],
            'idx_to_product': {idx: pid for pid, idx in metadata['product_to_idx'].items()},
            'vector_size': metadata['vector_size'],
            'version': metadata['version'],
        }
        
        print(f"✅ Loaded recommendation model v{metadata['version']} ({metadata['num_products']} products)")
    except Exception as e:
        print(f"⚠️  Error loading recommendation models: {e}")
        _recommendation_models = {}

def get_customer_item_history(profile_id: str, brand_id: Optional[str] = None) -> List[str]:
    """
    Get customer's purchase history (list of product IDs)
    """
    import psycopg2
    from psycopg2.extras import RealDictCursor
    import json
    
    db_url = os.getenv("DATABASE_URL", "postgresql://constintel:constintel@localhost:5432/constintel")
    if "?schema=" in db_url:
        db_url = db_url.split("?")[0]
    
    try:
        conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        query = """
            SELECT payload
            FROM customer_raw_event
            WHERE event_type = 'purchase'
            AND customer_profile_id = %s
            AND (brand_id = %s OR %s IS NULL)
            ORDER BY created_at DESC
            LIMIT 100
        """
        
        cursor.execute(query, [profile_id, brand_id, brand_id])
        rows = cursor.fetchall()
        
        product_ids = []
        for row in rows:
            payload = row['payload']
            if isinstance(payload, str):
                payload = json.loads(payload)
            
            # Extract product IDs
            if 'items' in payload:
                for item in payload['items']:
                    if isinstance(item, dict):
                        pid = item.get('product_id') or item.get('id') or item.get('sku')
                        if pid:
                            product_ids.append(str(pid))
            
            if 'line_items' in payload:
                for item in payload['line_items']:
                    if isinstance(item, dict):
                        pid = item.get('product_id') or item.get('id') or item.get('sku')
                        if pid:
                            product_ids.append(str(pid))
        
        cursor.close()
        conn.close()
        
        return list(set(product_ids))  # Remove duplicates
        
    except Exception as e:
        print(f"Error fetching customer history: {e}")
        return []

def get_recommendations(
    profile_id: str,
    top_k: int = 10,
    brand_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get product recommendations for a customer profile
    
    Returns: List of {product_id, score, category} dictionaries
    """
    if not _recommendation_models or 'item2vec' not in _recommendation_models:
        # Fallback to simple recommendations
        return get_fallback_recommendations(profile_id, top_k)
    
    try:
        # Get customer's purchase history
        customer_items = get_customer_item_history(profile_id, brand_id)
        
        if not customer_items:
            # New customer - recommend popular items
            return get_popular_recommendations(top_k)
        
        # Get embeddings for customer's items
        item2vec = _recommendation_models['item2vec']
        faiss_index = _recommendation_models['faiss_index']
        product_to_idx = _recommendation_models['product_to_idx']
        idx_to_product = _recommendation_models['idx_to_product']
        
        # Filter to items in vocabulary
        known_items = [item for item in customer_items if item in item2vec.wv]
        
        if not known_items:
            return get_popular_recommendations(top_k)
        
        # Average embeddings of customer's items to get customer vector
        customer_vector = np.mean([item2vec.wv[item] for item in known_items], axis=0)
        customer_vector = customer_vector.reshape(1, -1).astype('float32')
        
        # Normalize for cosine similarity
        faiss.normalize_L2(customer_vector)
        
        # Search FAISS index
        k = min(top_k * 2, len(product_to_idx))  # Get more to filter out purchased items
        distances, indices = faiss_index.search(customer_vector, k)
        
        # Convert indices to product IDs and filter out already purchased
        recommendations = []
        purchased_set = set(customer_items)
        
        for idx, distance in zip(indices[0], distances[0]):
            if idx < len(idx_to_product):
                product_id = idx_to_product[idx]
                if product_id not in purchased_set:
                    recommendations.append({
                        'product_id': product_id,
                        'score': float(distance),  # Cosine similarity (higher is better)
                        'category': 'unknown',  # TODO: Add category from product metadata
                    })
                    if len(recommendations) >= top_k:
                        break
        
        return recommendations
        
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        return get_fallback_recommendations(profile_id, top_k)

def get_fallback_recommendations(profile_id: str, top_k: int) -> List[Dict[str, Any]]:
    """Fallback recommendations when model not available"""
    return [
        {"product_id": f"prod_{i}", "category": "general", "score": 0.8 - (i * 0.1)}
        for i in range(1, top_k + 1)
    ]

def get_popular_recommendations(top_k: int) -> List[Dict[str, Any]]:
    """Get popular items (fallback for new customers)"""
    if not _recommendation_models or 'item2vec' not in _recommendation_models:
        return get_fallback_recommendations('', top_k)
    
    # Get most frequent items from vocabulary
    item2vec = _recommendation_models['item2vec']
    idx_to_product = _recommendation_models['idx_to_product']
    
    # Get items sorted by frequency (approximate)
    items = list(item2vec.wv.index_to_key)[:top_k]
    
    return [
        {
            'product_id': item,
            'score': 0.7,
            'category': 'popular',
        }
        for item in items[:top_k]
    ]

# Load models on import
try:
    load_recommendation_models()
except Exception as e:
    print(f"Warning: Could not load recommendation models on startup: {e}")

