# GENERATOR: ML_EVALUATION
# Main model evaluator class
# HOW TO RUN: Import and use ModelEvaluator to evaluate models

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.model_loader import (
    load_models, predict_churn, predict_ltv, predict_segment,
    get_features_for_profile
)
from evaluate.ground_truth_loader import load_ground_truth_for_evaluation
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    mean_squared_error, mean_absolute_error, r2_score,
    silhouette_score, adjusted_rand_score
)

load_dotenv()

MODEL_PATH = os.getenv("ML_MODEL_PATH", "./models")


def get_db_connection():
    db_url = os.getenv("DATABASE_URL", "postgresql://constintel:constintel@localhost:5432/constintel")
    if "?schema=" in db_url:
        db_url = db_url.split("?")[0]
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)


class ModelEvaluator:
    """Comprehensive model evaluator for all ML models"""
    
    def __init__(self, brand_id: Optional[str] = None):
        self.brand_id = brand_id
        load_models()  # Load models into cache
        
    def load_test_profiles(self, limit: Optional[int] = None) -> List[str]:
        """Load profile IDs for evaluation"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            query = """
                SELECT id FROM customer_profile
                WHERE (%s IS NULL OR brand_id = %s)
                AND id IN (SELECT DISTINCT profile_id FROM features)
            """
            if limit:
                query += f" LIMIT {limit}"
            
            cursor.execute(query, [self.brand_id, self.brand_id])
            rows = cursor.fetchall()
            return [row['id'] for row in rows]
        finally:
            cursor.close()
            conn.close()
    
    def evaluate_churn_model(self, profile_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """Evaluate churn prediction model"""
        if profile_ids is None:
            profile_ids = self.load_test_profiles(limit=1000)
        
        # Get predictions
        predictions = {}
        actual_values = {}
        
        for profile_id in profile_ids:
            pred = predict_churn(profile_id)
            if pred is not None:
                predictions[profile_id] = pred
                actual_values[profile_id] = None  # Will fill with ground truth
        
        # Get ground truth
        ground_truth = load_ground_truth_for_evaluation(
            list(predictions.keys()),
            'churn',
            lookback_days=90
        )
        
        # Match predictions with ground truth
        y_true = []
        y_pred_proba = []
        y_pred = []
        
        for profile_id, pred_proba in predictions.items():
            if profile_id in ground_truth:
                y_true.append(1 if ground_truth[profile_id] else 0)
                y_pred_proba.append(pred_proba)
                y_pred.append(1 if pred_proba >= 0.5 else 0)
        
        if len(y_true) == 0:
            return {'error': 'No matching ground truth data found'}
        
        # Calculate metrics
        y_true = np.array(y_true)
        y_pred = np.array(y_pred)
        y_pred_proba = np.array(y_pred_proba)
        
        accuracy = accuracy_score(y_true, y_pred)
        precision = precision_score(y_true, y_pred, zero_division=0)
        recall = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        
        try:
            roc_auc = roc_auc_score(y_true, y_pred_proba)
        except ValueError:
            roc_auc = None
        
        cm = confusion_matrix(y_true, y_pred)
        tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
        
        return {
            'model_type': 'churn',
            'test_samples': len(y_true),
            'metrics': {
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
                }
            },
            'evaluation_date': datetime.utcnow().isoformat()
        }
    
    def evaluate_ltv_model(self, profile_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """Evaluate LTV prediction model"""
        if profile_ids is None:
            profile_ids = self.load_test_profiles(limit=1000)
        
        # Get predictions
        predictions = {}
        for profile_id in profile_ids:
            pred = predict_ltv(profile_id)
            if pred is not None:
                predictions[profile_id] = pred
        
        # Get ground truth
        ground_truth = load_ground_truth_for_evaluation(
            list(predictions.keys()),
            'ltv'
        )
        
        # Match predictions with ground truth
        y_true = []
        y_pred = []
        
        for profile_id, pred in predictions.items():
            if profile_id in ground_truth:
                y_true.append(ground_truth[profile_id])
                y_pred.append(pred)
        
        if len(y_true) == 0:
            return {'error': 'No matching ground truth data found'}
        
        # Calculate metrics
        y_true = np.array(y_true)
        y_pred = np.array(y_pred)
        
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        mae = mean_absolute_error(y_true, y_pred)
        r2 = r2_score(y_true, y_pred)
        mape = np.mean(np.abs((y_true - y_pred) / (y_true + 1e-8))) * 100
        
        return {
            'model_type': 'ltv',
            'test_samples': len(y_true),
            'metrics': {
                'rmse': float(rmse),
                'mae': float(mae),
                'r2_score': float(r2),
                'mape': float(mape),
                'mean_actual_ltv': float(np.mean(y_true)),
                'mean_predicted_ltv': float(np.mean(y_pred))
            },
            'evaluation_date': datetime.utcnow().isoformat()
        }
    
    def evaluate_segmentation_model(self, profile_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """Evaluate segmentation model"""
        if profile_ids is None:
            profile_ids = self.load_test_profiles(limit=1000)
        
        # Get predictions
        predictions = {}
        for profile_id in profile_ids:
            pred = predict_segment(profile_id)
            if pred is not None:
                predictions[profile_id] = pred
        
        # Get ground truth
        ground_truth = load_ground_truth_for_evaluation(
            list(predictions.keys()),
            'segmentation'
        )
        
        # Match predictions with ground truth
        y_true = []
        y_pred = []
        
        for profile_id, pred in predictions.items():
            if profile_id in ground_truth:
                y_true.append(ground_truth[profile_id])
                y_pred.append(pred)
        
        if len(y_true) == 0:
            return {'error': 'No matching ground truth data found'}
        
        # Calculate metrics
        # Adjusted Rand Index for clustering evaluation
        try:
            ari = adjusted_rand_score(y_true, y_pred)
        except:
            ari = None
        
        # Segment distribution
        unique_segments = set(y_true + y_pred)
        segment_counts = {seg: {'actual': y_true.count(seg), 'predicted': y_pred.count(seg)} 
                         for seg in unique_segments}
        
        # Accuracy (if segments match exactly)
        accuracy = sum(1 for a, p in zip(y_true, y_pred) if a == p) / len(y_true)
        
        return {
            'model_type': 'segmentation',
            'test_samples': len(y_true),
            'metrics': {
                'adjusted_rand_index': float(ari) if ari is not None else None,
                'accuracy': float(accuracy),
                'segment_distribution': segment_counts,
                'unique_segments_actual': len(set(y_true)),
                'unique_segments_predicted': len(set(y_pred))
            },
            'evaluation_date': datetime.utcnow().isoformat()
        }
    
    def evaluate_all_models(self, profile_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """Evaluate all available models"""
        results = {
            'evaluation_date': datetime.utcnow().isoformat(),
            'brand_id': self.brand_id,
            'results': {}
        }
        
        # Evaluate each model
        try:
            results['results']['churn'] = self.evaluate_churn_model(profile_ids)
        except Exception as e:
            results['results']['churn'] = {'error': str(e)}
        
        try:
            results['results']['ltv'] = self.evaluate_ltv_model(profile_ids)
        except Exception as e:
            results['results']['ltv'] = {'error': str(e)}
        
        try:
            results['results']['segmentation'] = self.evaluate_segmentation_model(profile_ids)
        except Exception as e:
            results['results']['segmentation'] = {'error': str(e)}
        
        return results

