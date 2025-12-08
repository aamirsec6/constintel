# GENERATOR: OMNICHANNEL_PLATFORM
# ASSUMPTIONS: PostgreSQL database, product intent data available
# HOW TO RUN: python3 train/train_intent_model.py --brand-id test-brand

import argparse
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import lightgbm as lgb
import pickle
import os
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Get database connection"""
    database_url = os.getenv('DATABASE_URL', 'postgresql://constintel:constintel@localhost:5432/constintel')
    return psycopg2.connect(database_url)

def load_intent_data(brand_id=None):
    """Load product intent data from database"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
    SELECT 
        pi.id,
        pi.profile_id,
        pi.product_id,
        pi.intent_score,
        pi.intent_type,
        pi.view_duration,
        pi.last_seen_at,
        pi.first_seen_at,
        cp.lifetime_value,
        cp.total_orders,
        cp.profile_strength,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM customer_raw_event cre
                WHERE cre.customer_profile_id = pi.profile_id
                AND cre.event_type IN ('purchase', 'pos_transaction')
                AND cre.payload::jsonb @> jsonb_build_object('items', jsonb_build_array(jsonb_build_object('product_id', pi.product_id)))
                AND cre.created_at > pi.last_seen_at
            ) THEN 1
            ELSE 0
        END as converted
    FROM product_intent pi
    JOIN customer_profile cp ON pi.profile_id = cp.id
    WHERE pi.status = 'active'
    """
    
    if brand_id:
        query += f" AND pi.brand_id = '{brand_id}'"
    
    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return pd.DataFrame(rows)

def build_features(df):
    """Build features for intent prediction"""
    df = df.copy()
    
    # Time features
    df['last_seen_at'] = pd.to_datetime(df['last_seen_at'])
    df['first_seen_at'] = pd.to_datetime(df['first_seen_at'])
    df['hours_since_last_view'] = (datetime.now() - df['last_seen_at']).dt.total_seconds() / 3600
    df['days_since_first_view'] = (datetime.now() - df['first_seen_at']).dt.total_seconds() / (24 * 3600)
    
    # Intent type encoding
    intent_type_map = {
        'product_view': 1,
        'product_search': 2,
        'cart_add': 3,
        'wishlist_add': 4,
    }
    df['intent_type_encoded'] = df['intent_type'].map(intent_type_map).fillna(0)
    
    # View duration (fill missing with 0)
    df['view_duration'] = df['view_duration'].fillna(0)
    
    # Customer features
    df['lifetime_value'] = df['lifetime_value'].fillna(0)
    df['total_orders'] = df['total_orders'].fillna(0)
    df['profile_strength'] = df['profile_strength'].fillna(0)
    
    # Feature columns
    feature_cols = [
        'intent_score',
        'intent_type_encoded',
        'view_duration',
        'hours_since_last_view',
        'days_since_first_view',
        'lifetime_value',
        'total_orders',
        'profile_strength',
    ]
    
    return df[feature_cols], df['converted']

def train_intent_model(brand_id=None):
    """Train product intent prediction model"""
    print("Loading product intent data...")
    df = load_intent_data(brand_id)
    
    if len(df) < 100:
        print(f"Warning: Only {len(df)} samples available. Need at least 100 for training.")
        return None
    
    print(f"Loaded {len(df)} intent records")
    
    # Build features
    X, y = build_features(df)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Training set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    
    # Train LightGBM model
    model = lgb.LGBMClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        random_state=42,
        verbose=-1
    )
    
    print("Training model...")
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_pred_proba) if len(np.unique(y_test)) > 1 else 0.0
    
    print(f"\nModel Performance:")
    print(f"  Accuracy: {accuracy:.4f}")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall: {recall:.4f}")
    print(f"  F1 Score: {f1:.4f}")
    print(f"  ROC-AUC: {roc_auc:.4f}")
    
    # Save model
    version = datetime.now().strftime('%Y%m%d_%H%M%S')
    model_path = f'models/intent_{version}.pkl'
    os.makedirs('models', exist_ok=True)
    
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"\nModel saved to: {model_path}")
    
    # Save metrics to database
    save_model_version('intent', version, model_path, {
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1': float(f1),
        'roc_auc': float(roc_auc),
    }, len(X_train))
    
    return model_path

def save_model_version(model_type, version, model_path, metrics, training_samples):
    """Save model version to database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Deactivate previous models of this type
        cursor.execute("""
            UPDATE model_version 
            SET is_active = false 
            WHERE model_type = %s
        """, (model_type,))
        
        # Insert new model version
        cursor.execute("""
            INSERT INTO model_version (
                model_type, version, model_path, metrics, 
                training_samples, feature_count, is_active
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            model_type,
            version,
            model_path,
            str(metrics).replace("'", '"'),
            training_samples,
            8,  # Number of features
            True
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        print(f"Model version saved to database")
    except Exception as e:
        print(f"Error saving model version: {e}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train product intent prediction model')
    parser.add_argument('--brand-id', type=str, help='Brand ID to filter data')
    args = parser.parse_args()
    
    train_intent_model(args.brand_id)

