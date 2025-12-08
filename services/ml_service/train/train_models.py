# GENERATOR: FULL_PLATFORM
# ASSUMPTIONS: PostgreSQL database, features built, DATABASE_URL in env
# HOW TO RUN: python train/train_models.py (or via Airflow DAG)

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
import json
import pickle
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from dotenv import load_dotenv
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, 
    roc_auc_score, confusion_matrix, classification_report,
    mean_squared_error, mean_absolute_error, r2_score,
    silhouette_score
)
import lightgbm as lgb
import xgboost as xgb

load_dotenv()

MODEL_PATH = os.getenv("ML_MODEL_PATH", "./models")
os.makedirs(MODEL_PATH, exist_ok=True)

def get_db_connection():
    db_url = os.getenv("DATABASE_URL", "postgresql://constintel:constintel@localhost:5432/constintel")
    # Remove schema parameter for psycopg2
    if "?schema=" in db_url:
        db_url = db_url.split("?")[0]
    return psycopg2.connect(
        db_url,
        cursor_factory=RealDictCursor
    )

def save_model_version(
    model_type: str,
    version: str,
    model_path: str,
    metrics: Dict[str, Any],
    training_samples: int,
    feature_count: int,
    hyperparameters: Optional[Dict] = None,
    notes: Optional[str] = None,
    is_active: bool = False
):
    """Save model version metadata to database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Deactivate previous versions of this model type if this one is active
        if is_active:
            cursor.execute("""
                UPDATE model_version 
                SET is_active = false 
                WHERE model_type = %s AND is_active = true
            """, [model_type])
        
        model_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO model_version 
            (id, model_type, version, model_path, metrics, training_date, is_active, 
             training_samples, feature_count, hyperparameters, notes, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, NOW(), %s, %s, %s, %s, %s, NOW(), NOW())
            ON CONFLICT (model_type, version) 
            DO UPDATE SET 
                metrics = EXCLUDED.metrics,
                is_active = EXCLUDED.is_active,
                updated_at = NOW()
        """, [
            model_id, model_type, version, model_path, json.dumps(metrics),
            is_active, training_samples, feature_count,
            json.dumps(hyperparameters) if hyperparameters else None,
            notes
        ])
        
        conn.commit()
        print(f"✅ Saved model version: {model_type} v{version}")
    except Exception as e:
        conn.rollback()
        print(f"⚠️  Error saving model version: {e}")
    finally:
        cursor.close()
        conn.close()

def load_training_data(brand_id: Optional[str] = None) -> pd.DataFrame:
    """Load profiles with features and labels for training"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get all profiles with features
        query = """
            SELECT 
                cp.id as profile_id,
                cp.brand_id,
                cp.lifetime_value,
                cp.total_orders,
                cp.profile_strength,
                jsonb_object_agg(f.feature_name, f.feature_value) as features
            FROM customer_profile cp
            LEFT JOIN features f ON cp.id = f.profile_id
            WHERE cp.brand_id = %s OR %s IS NULL
            GROUP BY cp.id, cp.brand_id, cp.lifetime_value, cp.total_orders, cp.profile_strength
            HAVING COUNT(f.id) > 0
        """
        
        cursor.execute(query, [brand_id, brand_id])
        rows = cursor.fetchall()
        
        if not rows:
            raise ValueError("No training data found")
        
        # Convert to DataFrame
        data = []
        for row in rows:
            features = row['features'] or {}
            data.append({
                'profile_id': row['profile_id'],
                'brand_id': row['brand_id'],
                'lifetime_value': float(row['lifetime_value'] or 0),
                'total_orders': row['total_orders'] or 0,
                'profile_strength': row['profile_strength'] or 0,
                **{k: (v if not isinstance(v, dict) else json.dumps(v)) for k, v in features.items()}
            })
        
        return pd.DataFrame(data)
        
    finally:
        cursor.close()
        conn.close()

def create_churn_labels(df: pd.DataFrame, reference_date: datetime) -> pd.Series:
    """
    Create churn labels: 1 if no purchase in next 90 days, 0 otherwise
    Note: This is a simplified version. In production, you'd check actual future events.
    """
    # For now, use heuristic: if recency > 90 days and frequency = 0, label as churn
    recency = df.get('recency', pd.Series([999.0] * len(df)))
    frequency = df.get('frequency', pd.Series([0] * len(df)))
    
    return ((recency > 90) & (frequency == 0)).astype(int)

def create_ltv_labels(df: pd.DataFrame) -> pd.Series:
    """Use actual lifetime_value as LTV label"""
    return df['lifetime_value']

def train_segmentation_model(df: pd.DataFrame) -> Dict[str, Any]:
    """Train KMeans clustering for customer segmentation with evaluation"""
    # Select features for clustering
    feature_cols = ['recency', 'frequency', 'monetary', 'profile_strength']
    available_cols = [col for col in feature_cols if col in df.columns]
    
    if not available_cols:
        raise ValueError("No features available for segmentation")
    
    X = df[available_cols].fillna(0).values
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train KMeans (4 segments)
    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    segments = kmeans.fit_predict(X_scaled)
    
    # Calculate evaluation metrics
    silhouette = silhouette_score(X_scaled, segments)
    inertia = kmeans.inertia_
    
    # Segment distribution
    segment_counts = pd.Series(segments).value_counts().to_dict()
    segment_names = ['champions', 'at_risk', 'new_customers', 'loyal']
    
    model_version = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    
    # Save model
    model_file = os.path.join(MODEL_PATH, f"segmentation_{model_version}.pkl")
    with open(model_file, 'wb') as f:
        pickle.dump({
            'model': kmeans,
            'scaler': scaler,
            'feature_cols': available_cols,
            'version': model_version,
        }, f)
    
    # Prepare metrics
    metrics = {
        'silhouette_score': float(silhouette),
        'inertia': float(inertia),
        'n_clusters': 4,
        'segment_distribution': {segment_names[i]: int(count) for i, count in segment_counts.items()},
        'n_samples': len(df)
    }
    
    # Save to database
    save_model_version(
        model_type='segmentation',
        version=model_version,
        model_path=model_file,
        metrics=metrics,
        training_samples=len(df),
        feature_count=len(available_cols),
        hyperparameters={'n_clusters': 4, 'random_state': 42, 'n_init': 10},
        is_active=True
    )
    
    return {
        'model_file': model_file,
        'version': model_version,
        'segments': segments.tolist(),
        'metrics': metrics
    }

def train_churn_model(df: pd.DataFrame) -> Dict[str, Any]:
    """Train LightGBM model for churn prediction with evaluation"""
    # Create labels
    labels = create_churn_labels(df, datetime.utcnow())
    
    # Select features
    feature_cols = [col for col in df.columns if col not in ['profile_id', 'brand_id', 'lifetime_value', 'total_orders']]
    X = df[feature_cols].fillna(0).select_dtypes(include=[np.number])
    
    if X.empty:
        raise ValueError("No numeric features available")
    
    # Split data for evaluation
    X_train, X_test, y_train, y_test = train_test_split(
        X, labels, test_size=0.2, random_state=42, stratify=labels
    )
    
    # Train LightGBM
    train_data = lgb.Dataset(X_train, label=y_train)
    val_data = lgb.Dataset(X_test, label=y_test, reference=train_data)
    
    params = {
        'objective': 'binary',
        'metric': 'binary_logloss',
        'boosting_type': 'gbdt',
        'num_leaves': 31,
        'learning_rate': 0.05,
        'feature_fraction': 0.9,
        'bagging_fraction': 0.8,
        'bagging_freq': 5,
        'verbose': -1
    }
    
    model = lgb.train(
        params, 
        train_data, 
        num_boost_round=100,
        valid_sets=[val_data],
        callbacks=[lgb.early_stopping(10), lgb.log_evaluation(0)]
    )
    
    # Predictions for evaluation
    y_pred_proba = model.predict(X_test, num_iteration=model.best_iteration)
    y_pred = (y_pred_proba >= 0.5).astype(int)
    
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    
    # ROC AUC (if both classes present)
    try:
        roc_auc = roc_auc_score(y_test, y_pred_proba)
    except ValueError:
        roc_auc = None
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
    
    model_version = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    model_file = os.path.join(MODEL_PATH, f"churn_{model_version}.pkl")
    
    with open(model_file, 'wb') as f:
        pickle.dump({
            'model': model,
            'feature_cols': X.columns.tolist(),
            'version': model_version,
        }, f)
    
    # Prepare metrics
    metrics = {
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1_score': float(f1),
        'roc_auc': float(roc_auc) if roc_auc is not None else None,
        'confusion_matrix': {
            'true_negative': int(tn),
            'false_positive': int(fp),
            'false_negative': int(fn),
            'true_positive': int(tp)
        },
        'test_samples': len(X_test),
        'train_samples': len(X_train),
        'churn_rate': float(labels.mean())
    }
    
    # Save to database
    save_model_version(
        model_type='churn',
        version=model_version,
        model_path=model_file,
        metrics=metrics,
        training_samples=len(df),
        feature_count=len(X.columns),
        hyperparameters=params,
        is_active=True
    )
    
    print(f"📊 Churn Model Metrics:")
    print(f"   Accuracy: {accuracy:.4f}")
    print(f"   Precision: {precision:.4f}")
    print(f"   Recall: {recall:.4f}")
    print(f"   F1 Score: {f1:.4f}")
    if roc_auc:
        print(f"   ROC AUC: {roc_auc:.4f}")
    
    return {
        'model_file': model_file,
        'version': model_version,
        'metrics': metrics
    }

def train_ltv_model(df: pd.DataFrame) -> Dict[str, Any]:
    """Train LightGBM regression model for LTV prediction with evaluation"""
    labels = create_ltv_labels(df)
    
    feature_cols = [col for col in df.columns if col not in ['profile_id', 'brand_id', 'lifetime_value', 'total_orders']]
    X = df[feature_cols].fillna(0).select_dtypes(include=[np.number])
    
    if X.empty:
        raise ValueError("No numeric features available")
    
    # Split data for evaluation
    X_train, X_test, y_train, y_test = train_test_split(
        X, labels, test_size=0.2, random_state=42
    )
    
    train_data = lgb.Dataset(X_train, label=y_train)
    val_data = lgb.Dataset(X_test, label=y_test, reference=train_data)
    
    params = {
        'objective': 'regression',
        'metric': 'rmse',
        'boosting_type': 'gbdt',
        'num_leaves': 31,
        'learning_rate': 0.05,
        'feature_fraction': 0.9,
        'bagging_fraction': 0.8,
        'bagging_freq': 5,
        'verbose': -1
    }
    
    model = lgb.train(
        params, 
        train_data, 
        num_boost_round=100,
        valid_sets=[val_data],
        callbacks=[lgb.early_stopping(10), lgb.log_evaluation(0)]
    )
    
    # Predictions for evaluation
    y_pred = model.predict(X_test, num_iteration=model.best_iteration)
    
    # Calculate metrics
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    # Additional metrics
    mean_ltv = float(y_test.mean())
    mape = np.mean(np.abs((y_test - y_pred) / (y_test + 1e-8))) * 100  # Avoid division by zero
    
    model_version = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    model_file = os.path.join(MODEL_PATH, f"ltv_{model_version}.pkl")
    
    with open(model_file, 'wb') as f:
        pickle.dump({
            'model': model,
            'feature_cols': X.columns.tolist(),
            'version': model_version,
        }, f)
    
    # Prepare metrics
    metrics = {
        'rmse': float(rmse),
        'mae': float(mae),
        'r2_score': float(r2),
        'mape': float(mape),
        'mean_ltv': float(mean_ltv),
        'test_samples': len(X_test),
        'train_samples': len(X_train),
        'predicted_mean': float(y_pred.mean()),
        'actual_mean': float(y_test.mean())
    }
    
    # Save to database
    save_model_version(
        model_type='ltv',
        version=model_version,
        model_path=model_file,
        metrics=metrics,
        training_samples=len(df),
        feature_count=len(X.columns),
        hyperparameters=params,
        is_active=True
    )
    
    print(f"📊 LTV Model Metrics:")
    print(f"   RMSE: ${rmse:.2f}")
    print(f"   MAE: ${mae:.2f}")
    print(f"   R² Score: {r2:.4f}")
    print(f"   MAPE: {mape:.2f}%")
    
    return {
        'model_file': model_file,
        'version': model_version,
        'metrics': metrics
    }

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument("--brand-id")
    args = parser.parse_args()
    
    print("Loading training data...")
    df = load_training_data(args.brand_id)
    print(f"Loaded {len(df)} profiles")
    
    print("\n" + "="*50)
    print("Training segmentation model...")
    print("="*50)
    seg_result = train_segmentation_model(df)
    print(f"✅ Segmentation model saved: {seg_result['model_file']}")
    print(f"   Silhouette Score: {seg_result['metrics']['silhouette_score']:.4f}")
    
    print("\n" + "="*50)
    print("Training churn model...")
    print("="*50)
    churn_result = train_churn_model(df)
    print(f"✅ Churn model saved: {churn_result['model_file']}")
    
    print("\n" + "="*50)
    print("Training LTV model...")
    print("="*50)
    ltv_result = train_ltv_model(df)
    print(f"✅ LTV model saved: {ltv_result['model_file']}")
    
    print("\n" + "="*50)
    print("✅ Training complete!")
    print("="*50)
