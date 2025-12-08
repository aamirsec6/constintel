# GENERATOR: OMNICHANNEL_PLATFORM
# ASSUMPTIONS: PostgreSQL database, customer journey data available
# HOW TO RUN: python3 train/train_journey_model.py --brand-id test-brand

import argparse
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.ensemble import RandomForestClassifier
import pickle
import os
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Get database connection"""
    database_url = os.getenv('DATABASE_URL', 'postgresql://constintel:constintel@localhost:5432/constintel')
    return psycopg2.connect(database_url)

def load_journey_data(brand_id=None):
    """Load customer journey data from database"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
    SELECT 
        cp.id as profile_id,
        cp.lifetime_value,
        cp.total_orders,
        cp.profile_strength,
        p.churn_score,
        p.ltv_score,
        p.segment,
        COUNT(DISTINCT cre.id) as total_events,
        COUNT(DISTINCT CASE WHEN cre.event_type = 'purchase' THEN cre.id END) as purchase_count,
        COUNT(DISTINCT CASE WHEN cre.event_type LIKE '%view%' THEN cre.id END) as view_count,
        MAX(cre.created_at) as last_event_at,
        MIN(cre.created_at) as first_event_at,
        CASE 
            WHEN cp.total_orders = 0 THEN 'awareness'
            WHEN cp.total_orders = 1 THEN 'consideration'
            WHEN cp.total_orders > 1 AND cp.lifetime_value < 500 THEN 'purchase'
            WHEN cp.lifetime_value >= 500 THEN 'retention'
            ELSE 'purchase'
        END as journey_stage
    FROM customer_profile cp
    LEFT JOIN predictions p ON cp.id = p.profile_id
    LEFT JOIN customer_raw_event cre ON cp.id = cre.customer_profile_id
    WHERE 1=1
    """
    
    if brand_id:
        query += f" AND cp.brand_id = '{brand_id}'"
    
    query += " GROUP BY cp.id, cp.lifetime_value, cp.total_orders, cp.profile_strength, p.churn_score, p.ltv_score, p.segment"
    
    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return pd.DataFrame(rows)

def build_features(df):
    """Build features for journey prediction"""
    df = df.copy()
    
    # Fill missing values
    df['lifetime_value'] = df['lifetime_value'].fillna(0)
    df['total_orders'] = df['total_orders'].fillna(0)
    df['profile_strength'] = df['profile_strength'].fillna(0)
    df['churn_score'] = df['churn_score'].fillna(0.5)
    df['ltv_score'] = df['ltv_score'].fillna(0)
    df['total_events'] = df['total_events'].fillna(0)
    df['purchase_count'] = df['purchase_count'].fillna(0)
    df['view_count'] = df['view_count'].fillna(0)
    
    # Time features
    if 'last_event_at' in df.columns:
        df['last_event_at'] = pd.to_datetime(df['last_event_at'], errors='coerce')
        df['first_event_at'] = pd.to_datetime(df['first_event_at'], errors='coerce')
        df['days_since_last_event'] = (datetime.now() - df['last_event_at']).dt.total_seconds() / (24 * 3600)
        df['days_since_first_event'] = (datetime.now() - df['first_event_at']).dt.total_seconds() / (24 * 3600)
        df['days_since_last_event'] = df['days_since_last_event'].fillna(0)
        df['days_since_first_event'] = df['days_since_first_event'].fillna(0)
    else:
        df['days_since_last_event'] = 0
        df['days_since_first_event'] = 0
    
    # Segment encoding
    segment_map = {
        'champion': 1,
        'loyal': 2,
        'at_risk': 3,
        'new_customer': 4,
    }
    df['segment_encoded'] = df['segment'].map(segment_map).fillna(0)
    
    # Feature columns
    feature_cols = [
        'lifetime_value',
        'total_orders',
        'profile_strength',
        'churn_score',
        'ltv_score',
        'segment_encoded',
        'total_events',
        'purchase_count',
        'view_count',
        'days_since_last_event',
        'days_since_first_event',
    ]
    
    return df[feature_cols], df['journey_stage']

def train_journey_model(brand_id=None):
    """Train customer journey stage prediction model"""
    print("Loading customer journey data...")
    df = load_journey_data(brand_id)
    
    if len(df) < 100:
        print(f"Warning: Only {len(df)} samples available. Need at least 100 for training.")
        return None
    
    print(f"Loaded {len(df)} customer profiles")
    
    # Build features
    X, y = build_features(df)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Training set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    
    # Train Random Forest model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    
    print("Training model...")
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\nModel Performance:")
    print(f"  Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save model
    version = datetime.now().strftime('%Y%m%d_%H%M%S')
    model_path = f'models/journey_{version}.pkl'
    os.makedirs('models', exist_ok=True)
    
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"\nModel saved to: {model_path}")
    
    # Save metrics to database
    save_model_version('journey', version, model_path, {
        'accuracy': float(accuracy),
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
            11,  # Number of features
            True
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        print(f"Model version saved to database")
    except Exception as e:
        print(f"Error saving model version: {e}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train customer journey prediction model')
    parser.add_argument('--brand-id', type=str, help='Brand ID to filter data')
    args = parser.parse_args()
    
    train_journey_model(args.brand_id)

