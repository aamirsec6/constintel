# GENERATOR: ML_EVALUATION
# Ground truth data loading for model evaluation
# HOW TO RUN: Import and use to get actual outcomes for comparison

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    db_url = os.getenv("DATABASE_URL", "postgresql://constintel:constintel@localhost:5432/constintel")
    if "?schema=" in db_url:
        db_url = db_url.split("?")[0]
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)


def get_actual_churn(profile_ids: List[str], lookback_days: int = 90) -> Dict[str, bool]:
    """
    Get actual churn status: True if no purchase in last N days, False otherwise
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)
        placeholders = ','.join(['%s'] * len(profile_ids))
        
        cursor.execute(f"""
            SELECT DISTINCT
                cp.id as profile_id,
                CASE 
                    WHEN MAX(cre.created_at) < %s OR MAX(cre.created_at) IS NULL THEN true
                    ELSE false
                END as is_churned
            FROM customer_profile cp
            LEFT JOIN customer_raw_event cre ON cp.id = cre.customer_profile_id
                AND cre.event_type = 'purchase'
            WHERE cp.id IN ({placeholders})
            GROUP BY cp.id
        """, [cutoff_date] + profile_ids)
        
        rows = cursor.fetchall()
        return {row['profile_id']: row['is_churned'] for row in rows}
    finally:
        cursor.close()
        conn.close()


def get_actual_ltv(profile_ids: List[str]) -> Dict[str, float]:
    """
    Get actual lifetime value from customer_profile table
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        placeholders = ','.join(['%s'] * len(profile_ids))
        
        cursor.execute(f"""
            SELECT id, lifetime_value
            FROM customer_profile
            WHERE id IN ({placeholders})
        """, profile_ids)
        
        rows = cursor.fetchall()
        return {row['id']: float(row['lifetime_value'] or 0) for row in rows}
    finally:
        cursor.close()
        conn.close()


def get_actual_segments(profile_ids: List[str]) -> Dict[str, str]:
    """
    Get actual customer segments using RFM analysis
    Returns segment based on recency, frequency, monetary values
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        placeholders = ','.join(['%s'] * len(profile_ids))
        
        cursor.execute(f"""
            SELECT 
                cp.id as profile_id,
                cp.total_orders as frequency,
                cp.lifetime_value as monetary,
                COALESCE(MAX(cre.created_at), cp.created_at) as last_activity,
                CASE
                    WHEN cp.total_orders = 0 THEN 'new_customers'
                    WHEN cp.lifetime_value >= 1000 AND cp.total_orders >= 5 THEN 'champions'
                    WHEN cp.lifetime_value >= 500 THEN 'loyal'
                    WHEN EXTRACT(EPOCH FROM (NOW() - COALESCE(MAX(cre.created_at), cp.created_at)))/86400 > 90 THEN 'at_risk'
                    ELSE 'regular'
                END as segment
            FROM customer_profile cp
            LEFT JOIN customer_raw_event cre ON cp.id = cre.customer_profile_id
                AND cre.event_type = 'purchase'
            WHERE cp.id IN ({placeholders})
            GROUP BY cp.id, cp.total_orders, cp.lifetime_value, cp.created_at
        """, profile_ids)
        
        rows = cursor.fetchall()
        return {row['profile_id']: row['segment'] for row in rows}
    finally:
        cursor.close()
        conn.close()


def get_actual_intent_outcomes(profile_ids: List[str], lookback_days: int = 30) -> Dict[str, Dict]:
    """
    Get actual intent outcomes: check if product intents led to purchases
    Returns dict with profile_id -> {converted: bool, intent_count: int, purchase_count: int}
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)
        placeholders = ','.join(['%s'] * len(profile_ids))
        
        cursor.execute(f"""
            SELECT 
                pi.profile_id,
                COUNT(DISTINCT pi.id) as intent_count,
                COUNT(DISTINCT cre.id) as purchase_count
            FROM product_intent pi
            LEFT JOIN customer_raw_event cre ON pi.profile_id = cre.customer_profile_id
                AND cre.event_type = 'purchase'
                AND cre.created_at BETWEEN pi.first_seen_at AND pi.first_seen_at + INTERVAL '30 days'
            WHERE pi.profile_id IN ({placeholders})
                AND pi.first_seen_at >= %s
            GROUP BY pi.profile_id
        """, profile_ids + [cutoff_date])
        
        rows = cursor.fetchall()
        result = {}
        for row in rows:
            result[row['profile_id']] = {
                'converted': row['purchase_count'] > 0,
                'intent_count': row['intent_count'],
                'purchase_count': row['purchase_count']
            }
        return result
    finally:
        cursor.close()
        conn.close()


def get_actual_journey_stages(profile_ids: List[str]) -> Dict[str, str]:
    """
    Determine actual journey stage from customer behavior
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        placeholders = ','.join(['%s'] * len(profile_ids))
        
        cursor.execute(f"""
            SELECT 
                cp.id as profile_id,
                cp.total_orders,
                cp.lifetime_value,
                MAX(cre.created_at) as last_event_date,
                COUNT(DISTINCT CASE WHEN cre.event_type = 'purchase' THEN cre.id END) as purchase_count,
                COUNT(DISTINCT CASE WHEN cre.event_type = 'product_view' THEN cre.id END) as view_count,
                COUNT(DISTINCT CASE WHEN cre.event_type = 'cart_add' THEN cre.id END) as cart_count,
                CASE
                    WHEN cp.total_orders = 0 AND COUNT(DISTINCT CASE WHEN cre.event_type = 'page_view' THEN cre.id END) > 0 THEN 'awareness'
                    WHEN cp.total_orders = 0 AND COUNT(DISTINCT CASE WHEN cre.event_type = 'cart_add' THEN cre.id END) > 0 THEN 'consideration'
                    WHEN cp.total_orders = 0 THEN 'awareness'
                    WHEN cp.total_orders = 1 THEN 'purchase'
                    WHEN cp.total_orders BETWEEN 2 AND 5 THEN 'retention'
                    WHEN cp.total_orders > 5 THEN 'advocacy'
                    ELSE 'awareness'
                END as journey_stage
            FROM customer_profile cp
            LEFT JOIN customer_raw_event cre ON cp.id = cre.customer_profile_id
            WHERE cp.id IN ({placeholders})
            GROUP BY cp.id, cp.total_orders, cp.lifetime_value
        """, profile_ids)
        
        rows = cursor.fetchall()
        return {row['profile_id']: row['journey_stage'] for row in rows}
    finally:
        cursor.close()
        conn.close()


def load_ground_truth_for_evaluation(
    profile_ids: List[str],
    model_type: str,
    **kwargs
) -> Dict[str, any]:
    """
    Load ground truth data for a specific model type
    """
    if model_type == 'churn':
        return get_actual_churn(profile_ids, kwargs.get('lookback_days', 90))
    elif model_type == 'ltv':
        return get_actual_ltv(profile_ids)
    elif model_type == 'segmentation':
        return get_actual_segments(profile_ids)
    elif model_type == 'intent':
        return get_actual_intent_outcomes(profile_ids, kwargs.get('lookback_days', 30))
    elif model_type == 'journey':
        return get_actual_journey_stages(profile_ids)
    else:
        raise ValueError(f"Unknown model type: {model_type}")

