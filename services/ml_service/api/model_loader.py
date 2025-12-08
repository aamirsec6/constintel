# GENERATOR: ML_PHASE1
# Model loading and inference utilities
# HOW TO RUN: Import and use load_models(), predict_churn(), etc.

import os
import pickle
import glob
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd

MODEL_PATH = os.getenv("ML_MODEL_PATH", "./models")

# Global model cache
_models_cache: Dict[str, Any] = {}

def get_latest_model(model_type: str) -> Optional[str]:
    """Get the latest model file for a given type"""
    pattern = os.path.join(MODEL_PATH, f"{model_type}_*.pkl")
    models = glob.glob(pattern)
    if not models:
        return None
    # Sort by filename (which includes timestamp) and return latest
    return max(models, key=os.path.getmtime)

def load_models():
    """Load all trained models into cache"""
    global _models_cache
    
    # Load segmentation model
    seg_model_file = get_latest_model("segmentation")
    if seg_model_file:
        try:
            with open(seg_model_file, 'rb') as f:
                _models_cache['segmentation'] = pickle.load(f)
            print(f"Loaded segmentation model: {seg_model_file}")
        except Exception as e:
            print(f"Error loading segmentation model: {e}")
    
    # Load churn model
    churn_model_file = get_latest_model("churn")
    if churn_model_file:
        try:
            with open(churn_model_file, 'rb') as f:
                _models_cache['churn'] = pickle.load(f)
            print(f"Loaded churn model: {churn_model_file}")
        except Exception as e:
            print(f"Error loading churn model: {e}")
    
    # Load LTV model
    ltv_model_file = get_latest_model("ltv")
    if ltv_model_file:
        try:
            with open(ltv_model_file, 'rb') as f:
                _models_cache['ltv'] = pickle.load(f)
            print(f"Loaded LTV model: {ltv_model_file}")
        except Exception as e:
            print(f"Error loading LTV model: {e}")

def get_features_for_profile(profile_id: str) -> Optional[pd.DataFrame]:
    """Get features for a profile from database"""
    import psycopg2
    from psycopg2.extras import RealDictCursor
    import json
    
    db_url = os.getenv("DATABASE_URL", "postgresql://constintel:constintel@localhost:5432/constintel")
    if "?schema=" in db_url:
        db_url = db_url.split("?")[0]
    
    try:
        conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT feature_name, feature_value
            FROM features
            WHERE profile_id = %s
        """, [profile_id])
        
        rows = cursor.fetchall()
        if not rows:
            return None
        
        features_dict = {}
        for row in rows:
            name = row['feature_name']
            value = row['feature_value']
            # Parse JSON if needed
            if isinstance(value, str):
                try:
                    value = json.loads(value)
                except:
                    pass
            features_dict[name] = value
        
        # Convert to DataFrame with single row
        df = pd.DataFrame([features_dict])
        
        cursor.close()
        conn.close()
        
        return df
    except Exception as e:
        print(f"Error fetching features: {e}")
        return None

def predict_churn(profile_id: str) -> Optional[float]:
    """Predict churn score for a profile"""
    if 'churn' not in _models_cache:
        return None
    
    df = get_features_for_profile(profile_id)
    if df is None or df.empty:
        return None
    
    model_data = _models_cache['churn']
    model = model_data['model']
    feature_cols = model_data['feature_cols']
    
    # Select and order features
    X = df[feature_cols].fillna(0).values
    
    try:
        prediction = model.predict(X)[0]
        # LightGBM binary prediction returns probability
        if hasattr(model, 'predict_proba'):
            proba = model.predict_proba(X)[0]
            return float(proba[1])  # Return probability of churn (class 1)
        return float(prediction)
    except Exception as e:
        print(f"Error predicting churn: {e}")
        return None

def predict_ltv(profile_id: str) -> Optional[float]:
    """Predict LTV for a profile"""
    if 'ltv' not in _models_cache:
        return None
    
    df = get_features_for_profile(profile_id)
    if df is None or df.empty:
        return None
    
    model_data = _models_cache['ltv']
    model = model_data['model']
    feature_cols = model_data['feature_cols']
    
    # Select and order features
    X = df[feature_cols].fillna(0).values
    
    try:
        prediction = model.predict(X)[0]
        return float(max(0, prediction))  # Ensure non-negative
    except Exception as e:
        print(f"Error predicting LTV: {e}")
        return None

def predict_segment(profile_id: str) -> Optional[str]:
    """Predict customer segment for a profile"""
    if 'segmentation' not in _models_cache:
        return None
    
    df = get_features_for_profile(profile_id)
    if df is None or df.empty:
        return None
    
    model_data = _models_cache['segmentation']
    model = model_data['model']
    scaler = model_data['scaler']
    feature_cols = model_data['feature_cols']
    
    # Select and scale features
    X = df[feature_cols].fillna(0).values
    X_scaled = scaler.transform(X)
    
    try:
        segment_idx = model.predict(X_scaled)[0]
        segment_names = ['champions', 'at_risk', 'new_customers', 'loyal']
        if 0 <= segment_idx < len(segment_names):
            return segment_names[segment_idx]
        return 'unknown'
    except Exception as e:
        print(f"Error predicting segment: {e}")
        return None

# Load models on import
try:
    load_models()
except Exception as e:
    print(f"Warning: Could not load models on startup: {e}")

