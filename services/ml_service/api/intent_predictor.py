# GENERATOR: OMNICHANNEL_PLATFORM
# ASSUMPTIONS: Trained intent model available
# HOW TO RUN: Used by main.py for intent prediction API

import pickle
import os
import numpy as np
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

class IntentPredictor:
    def __init__(self):
        self.model = None
        self.model_version = None
        self.model_path = None
        
    def load_model(self):
        """Load the active intent prediction model"""
        try:
            conn = psycopg2.connect(os.getenv('DATABASE_URL', 'postgresql://constintel:constintel@localhost:5432/constintel'))
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT model_path, version 
                FROM model_version 
                WHERE model_type = 'intent' AND is_active = true
                ORDER BY training_date DESC
                LIMIT 1
            """)
            
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if result and os.path.exists(result['model_path']):
                with open(result['model_path'], 'rb') as f:
                    self.model = pickle.load(f)
                self.model_version = result['version']
                self.model_path = result['model_path']
                return True
            else:
                print("No active intent model found")
                return False
        except Exception as e:
            print(f"Error loading intent model: {e}")
            return False
    
    def predict(self, features):
        """
        Predict purchase probability for product intent
        
        Args:
            features: dict with keys:
                - intent_score: float
                - intent_type: str ('product_view', 'product_search', 'cart_add', 'wishlist_add')
                - view_duration: int (seconds)
                - hours_since_last_view: float
                - days_since_first_view: float
                - lifetime_value: float
                - total_orders: int
                - profile_strength: int
        
        Returns:
            dict with 'probability' (0-1) and 'prediction' (0 or 1)
        """
        if not self.model:
            if not self.load_model():
                return {
                    'probability': 0.5,
                    'prediction': 0,
                    'error': 'Model not loaded'
                }
        
        try:
            # Encode intent type
            intent_type_map = {
                'product_view': 1,
                'product_search': 2,
                'cart_add': 3,
                'wishlist_add': 4,
            }
            
            # Build feature vector
            feature_vector = np.array([[
                features.get('intent_score', 0),
                intent_type_map.get(features.get('intent_type', 'product_view'), 1),
                features.get('view_duration', 0),
                features.get('hours_since_last_view', 24),
                features.get('days_since_first_view', 1),
                features.get('lifetime_value', 0),
                features.get('total_orders', 0),
                features.get('profile_strength', 0),
            ]])
            
            # Predict
            probability = self.model.predict_proba(feature_vector)[0][1]
            prediction = self.model.predict(feature_vector)[0]
            
            return {
                'probability': float(probability),
                'prediction': int(prediction),
                'model_version': self.model_version
            }
        except Exception as e:
            print(f"Error predicting intent: {e}")
            return {
                'probability': 0.5,
                'prediction': 0,
                'error': str(e)
            }

# Singleton instance
_intent_predictor = None

def get_intent_predictor():
    """Get singleton intent predictor instance"""
    global _intent_predictor
    if _intent_predictor is None:
        _intent_predictor = IntentPredictor()
        _intent_predictor.load_model()
    return _intent_predictor

