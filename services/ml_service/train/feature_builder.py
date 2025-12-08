# GENERATOR: FULL_PLATFORM
# ASSUMPTIONS: PostgreSQL database with customer_profile, customer_raw_event tables
# HOW TO RUN: python train/feature_builder.py --profile-id <id> or run via Airflow DAG

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    db_url = os.getenv("DATABASE_URL", "postgresql://constintel:constintel@localhost:5432/constintel")
    # Remove schema parameter for psycopg2
    if "?schema=" in db_url:
        db_url = db_url.split("?")[0]
    return psycopg2.connect(
        db_url,
        cursor_factory=RealDictCursor
    )

def calculate_recency(events_df: pd.DataFrame, reference_date: datetime) -> float:
    """Calculate recency: days since last purchase"""
    if events_df.empty:
        return 999.0  # No events = very old
    
    purchase_events = events_df[events_df['event_type'] == 'purchase']
    if purchase_events.empty:
        return 999.0
    
    last_purchase = purchase_events['created_at'].max()
    return (reference_date - last_purchase).days

def calculate_frequency(events_df: pd.DataFrame, days: int = 90) -> int:
    """Calculate frequency: number of purchases in last N days"""
    purchase_events = events_df[events_df['event_type'] == 'purchase']
    if purchase_events.empty:
        return 0
    
    cutoff = datetime.utcnow() - timedelta(days=days)
    return len(purchase_events[purchase_events['created_at'] >= cutoff])

def calculate_monetary(events_df: pd.DataFrame, days: int = 90) -> float:
    """Calculate monetary: total spend in last N days"""
    purchase_events = events_df[events_df['event_type'] == 'purchase']
    if purchase_events.empty:
        return 0.0
    
    cutoff = datetime.utcnow() - timedelta(days=days)
    recent_purchases = purchase_events[purchase_events['created_at'] >= cutoff]
    
    total = 0.0
    for _, event in recent_purchases.iterrows():
        payload = event['payload']
        if isinstance(payload, str):
            payload = json.loads(payload)
        if isinstance(payload, dict) and 'total' in payload:
            total += float(payload.get('total', 0))
    
    return total

def calculate_online_offline_ratio(events_df: pd.DataFrame) -> float:
    """Calculate ratio of online vs offline events"""
    if events_df.empty:
        return 0.5
    
    online_count = len(events_df[events_df['event_type'].str.contains('online|web|app', case=False, na=False)])
    offline_count = len(events_df[events_df['event_type'].str.contains('pos|store|offline', case=False, na=False)])
    
    total = online_count + offline_count
    if total == 0:
        return 0.5
    
    return online_count / total

def calculate_category_affinity(events_df: pd.DataFrame) -> Dict[str, float]:
    """Extract category preferences from events"""
    categories = {}
    
    for _, event in events_df.iterrows():
        payload = event['payload']
        if isinstance(payload, str):
            payload = json.loads(payload)
        
        if isinstance(payload, dict):
            # Extract categories from various payload structures
            if 'category' in payload:
                cat = payload['category']
                categories[cat] = categories.get(cat, 0) + 1
            elif 'categories' in payload:
                for cat in payload['categories']:
                    categories[cat] = categories.get(cat, 0) + 1
            elif 'line_items' in payload:
                for item in payload['line_items']:
                    if 'category' in item:
                        cat = item['category']
                        categories[cat] = categories.get(cat, 0) + 1
    
    # Normalize to probabilities
    total = sum(categories.values())
    if total > 0:
        return {k: v / total for k, v in categories.items()}
    return {}

def calculate_session_counts(events_df: pd.DataFrame) -> int:
    """Count unique sessions (simplified: count page_view events)"""
    return len(events_df[events_df['event_type'] == 'page_view'])

def build_features_for_profile(profile_id: str, brand_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Build all features for a customer profile
    Returns dict of feature_name -> feature_value
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get profile
        query = "SELECT * FROM customer_profile WHERE id = %s"
        params = [profile_id]
        if brand_id:
            query += " AND brand_id = %s"
            params.append(brand_id)
        
        cursor.execute(query, params)
        profile = cursor.fetchone()
        
        if not profile:
            raise ValueError(f"Profile {profile_id} not found")
        
        # Get all events for this profile
        cursor.execute(
            "SELECT * FROM customer_raw_event WHERE customer_profile_id = %s ORDER BY created_at",
            [profile_id]
        )
        events = cursor.fetchall()
        
        if not events:
            # No events - return default features
            return {
                "recency": 999.0,
                "frequency": 0,
                "monetary": 0.0,
                "online_offline_ratio": 0.5,
                "category_affinity": {},
                "session_counts": 0,
                "profile_strength": profile['profile_strength'],
            }
        
        # Convert to DataFrame
        events_df = pd.DataFrame(events)
        events_df['created_at'] = pd.to_datetime(events_df['created_at'])
        
        reference_date = datetime.utcnow()
        
        # Calculate all features
        features = {
            "recency": calculate_recency(events_df, reference_date),
            "frequency": calculate_frequency(events_df, days=90),
            "monetary": calculate_monetary(events_df, days=90),
            "online_offline_ratio": calculate_online_offline_ratio(events_df),
            "category_affinity": calculate_category_affinity(events_df),
            "session_counts": calculate_session_counts(events_df),
            "profile_strength": profile['profile_strength'],
        }
        
        return features
        
    finally:
        cursor.close()
        conn.close()

def save_features_to_db(profile_id: str, features: Dict[str, Any]):
    """Save features to the features table"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        for feature_name, feature_value in features.items():
            # Generate UUID in Python
            feature_id = str(uuid.uuid4())
            
            cursor.execute(
                """
                INSERT INTO features (id, profile_id, feature_name, feature_value, updated_at)
                VALUES (%s, %s, %s, %s, NOW())
                ON CONFLICT (profile_id, feature_name)
                DO UPDATE SET feature_value = EXCLUDED.feature_value, updated_at = NOW()
                """,
                [feature_id, profile_id, feature_name, json.dumps(feature_value)]
            )
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument("--profile-id", required=True)
    parser.add_argument("--brand-id")
    args = parser.parse_args()
    
    features = build_features_for_profile(args.profile_id, args.brand_id)
    save_features_to_db(args.profile_id, features)
    print(f"Features built and saved for profile {args.profile_id}")
    print(json.dumps(features, indent=2))

