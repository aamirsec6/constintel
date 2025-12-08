# GENERATOR: ML_PHASE1
# ASSUMPTIONS: PostgreSQL database with customer_raw_event table, purchase events contain product data
# HOW TO RUN: python train/train_recommendations.py --brand-id <brand_id>
# TODO: Add product metadata table for better recommendations

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
import json
import pickle
import numpy as np
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
from dotenv import load_dotenv
from collections import defaultdict
import faiss

# For item2vec (Word2Vec for items)
try:
    from gensim.models import Word2Vec
    GENSIM_AVAILABLE = True
except ImportError:
    print("⚠️  Warning: gensim not installed. Install with: pip install gensim")
    GENSIM_AVAILABLE = False

load_dotenv()

MODEL_PATH = os.getenv("ML_MODEL_PATH", "./models")
os.makedirs(MODEL_PATH, exist_ok=True)

def get_db_connection():
    db_url = os.getenv("DATABASE_URL", "postgresql://constintel:constintel@localhost:5432/constintel")
    if "?schema=" in db_url:
        db_url = db_url.split("?")[0]
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)

def extract_item_sequences(brand_id: Optional[str] = None) -> List[List[str]]:
    """
    Extract item sequences from purchase events
    Returns list of sequences, where each sequence is a list of product_ids
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get all purchase events with product data
        query = """
            SELECT 
                customer_profile_id,
                payload,
                created_at
            FROM customer_raw_event
            WHERE event_type = 'purchase'
            AND (brand_id = %s OR %s IS NULL)
            AND customer_profile_id IS NOT NULL
            ORDER BY customer_profile_id, created_at
        """
        
        cursor.execute(query, [brand_id, brand_id])
        rows = cursor.fetchall()
        
        # Group by customer profile
        customer_sequences = defaultdict(list)
        
        for row in rows:
            profile_id = row['customer_profile_id']
            payload = row['payload']
            
            if isinstance(payload, str):
                payload = json.loads(payload)
            
            # Extract product IDs from various payload structures
            product_ids = []
            
            # Structure 1: items array
            if 'items' in payload:
                for item in payload['items']:
                    if isinstance(item, dict):
                        product_id = item.get('product_id') or item.get('id') or item.get('sku')
                        if product_id:
                            product_ids.append(str(product_id))
            
            # Structure 2: line_items array
            if 'line_items' in payload:
                for item in payload['line_items']:
                    if isinstance(item, dict):
                        product_id = item.get('product_id') or item.get('id') or item.get('sku')
                        if product_id:
                            product_ids.append(str(product_id))
            
            # Structure 3: products array
            if 'products' in payload:
                for item in payload['products']:
                    if isinstance(item, dict):
                        product_id = item.get('product_id') or item.get('id') or item.get('sku')
                        if product_id:
                            product_ids.append(str(product_id))
                    elif isinstance(item, str):
                        product_ids.append(item)
            
            # Structure 4: single product_id
            if 'product_id' in payload and not product_ids:
                product_ids.append(str(payload['product_id']))
            
            if product_ids:
                customer_sequences[profile_id].extend(product_ids)
        
        # Convert to sequences (each customer's purchase history)
        sequences = []
        for profile_id, products in customer_sequences.items():
            if len(products) >= 2:  # Need at least 2 items for training
                sequences.append(products)
        
        return sequences
        
    finally:
        cursor.close()
        conn.close()

def train_item2vec(sequences: List[List[str]], vector_size: int = 64, window: int = 5) -> Word2Vec:
    """
    Train item2vec model (Word2Vec for products)
    """
    if not GENSIM_AVAILABLE:
        raise ImportError("gensim is required for item2vec. Install with: pip install gensim")
    
    if len(sequences) < 10:
        raise ValueError(f"Need at least 10 customer sequences, got {len(sequences)}")
    
    print(f"Training item2vec on {len(sequences)} customer sequences...")
    
    model = Word2Vec(
        sentences=sequences,
        vector_size=vector_size,
        window=window,
        min_count=2,  # Product must appear at least 2 times
        workers=4,
        sg=1,  # Skip-gram (better for small datasets)
        epochs=10
    )
    
    return model

def build_faiss_index(item2vec_model: Word2Vec, dimension: int = 64) -> Tuple[faiss.Index, Dict[str, int]]:
    """
    Build FAISS index for fast similarity search
    Returns: FAISS index and product_id to index mapping
    """
    # Get all product vectors
    product_ids = list(item2vec_model.wv.index_to_key)
    vectors = np.array([item2vec_model.wv[pid] for pid in product_ids], dtype='float32')
    
    # Normalize vectors for cosine similarity
    faiss.normalize_L2(vectors)
    
    # Build FAISS index (L2 distance for normalized vectors = cosine similarity)
    index = faiss.IndexFlatIP(dimension)  # Inner product for normalized vectors = cosine similarity
    index.add(vectors)
    
    # Create mapping: product_id -> index position
    product_to_idx = {pid: idx for idx, pid in enumerate(product_ids)}
    
    print(f"✅ Built FAISS index with {len(product_ids)} products")
    
    return index, product_to_idx

def get_customer_item_history(profile_id: str, brand_id: Optional[str] = None) -> List[str]:
    """
    Get customer's purchase history (list of product IDs)
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
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
            
            # Extract product IDs (same logic as extract_item_sequences)
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
        
        return list(set(product_ids))  # Remove duplicates
        
    finally:
        cursor.close()
        conn.close()

def save_recommendation_model(
    item2vec_model: Word2Vec,
    faiss_index: faiss.Index,
    product_to_idx: Dict[str, int],
    vector_size: int
):
    """Save recommendation model components"""
    model_version = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    
    # Save item2vec model
    item2vec_path = os.path.join(MODEL_PATH, f"item2vec_{model_version}.model")
    item2vec_model.save(item2vec_path)
    
    # Save FAISS index
    faiss_path = os.path.join(MODEL_PATH, f"faiss_index_{model_version}.index")
    faiss.write_index(faiss_index, faiss_path)
    
    # Save metadata
    metadata_path = os.path.join(MODEL_PATH, f"recommendations_metadata_{model_version}.pkl")
    with open(metadata_path, 'wb') as f:
        pickle.dump({
            'product_to_idx': product_to_idx,
            'vector_size': vector_size,
            'item2vec_path': item2vec_path,
            'faiss_path': faiss_path,
            'version': model_version,
            'num_products': len(product_to_idx),
        }, f)
    
    print(f"✅ Saved recommendation model:")
    print(f"   Item2Vec: {item2vec_path}")
    print(f"   FAISS Index: {faiss_path}")
    print(f"   Metadata: {metadata_path}")
    
    return {
        'item2vec_path': item2vec_path,
        'faiss_path': faiss_path,
        'metadata_path': metadata_path,
        'version': model_version,
    }

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument("--brand-id")
    parser.add_argument("--vector-size", type=int, default=64)
    parser.add_argument("--window", type=int, default=5)
    args = parser.parse_args()
    
    if not GENSIM_AVAILABLE:
        print("❌ Error: gensim is required. Install with: pip install gensim")
        sys.exit(1)
    
    print("=" * 50)
    print("Training Recommendation Engine (item2vec + FAISS)")
    print("=" * 50)
    
    # Extract item sequences
    print("\n1. Extracting item sequences from purchase events...")
    sequences = extract_item_sequences(args.brand_id)
    print(f"   Found {len(sequences)} customer sequences")
    
    if len(sequences) < 10:
        print(f"❌ Error: Need at least 10 customer sequences, got {len(sequences)}")
        print("   Generate more test data or wait for real purchase events")
        sys.exit(1)
    
    total_items = sum(len(seq) for seq in sequences)
    unique_products = len(set(item for seq in sequences for item in seq))
    print(f"   Total items: {total_items}, Unique products: {unique_products}")
    
    # Train item2vec
    print("\n2. Training item2vec model...")
    item2vec_model = train_item2vec(sequences, vector_size=args.vector_size, window=args.window)
    print(f"   Vocabulary size: {len(item2vec_model.wv)}")
    
    # Build FAISS index
    print("\n3. Building FAISS index...")
    faiss_index, product_to_idx = build_faiss_index(item2vec_model, dimension=args.vector_size)
    
    # Save models
    print("\n4. Saving models...")
    result = save_recommendation_model(item2vec_model, faiss_index, product_to_idx, args.vector_size)
    
    print("\n" + "=" * 50)
    print("✅ Recommendation engine training complete!")
    print("=" * 50)
    print(f"Model version: {result['version']}")
    print(f"Products in index: {len(product_to_idx)}")

