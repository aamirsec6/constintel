# GENERATOR: ML_EVALUATION
# Validation set management for model evaluation
# HOW TO RUN: Import and use to create/manage validation sets

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
from typing import List, Optional, Tuple
from dotenv import load_dotenv
from sklearn.model_selection import train_test_split
import json

load_dotenv()

def get_db_connection():
    db_url = os.getenv("DATABASE_URL", "postgresql://constintel:constintel@localhost:5432/constintel")
    if "?schema=" in db_url:
        db_url = db_url.split("?")[0]
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)


class ValidationSetManager:
    """Manage validation set splits for model evaluation"""
    
    def __init__(self, brand_id: Optional[str] = None):
        self.brand_id = brand_id
    
    def get_all_profiles(self) -> List[str]:
        """Get all profile IDs that have features"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            query = """
                SELECT DISTINCT cp.id
                FROM customer_profile cp
                INNER JOIN features f ON cp.id = f.profile_id
                WHERE (%s IS NULL OR cp.brand_id = %s)
            """
            cursor.execute(query, [self.brand_id, self.brand_id])
            rows = cursor.fetchall()
            return [row['id'] for row in rows]
        finally:
            cursor.close()
            conn.close()
    
    def create_validation_split(
        self,
        train_size: float = 0.7,
        validation_size: float = 0.15,
        test_size: float = 0.15,
        random_state: int = 42
    ) -> Tuple[List[str], List[str], List[str]]:
        """
        Create train/validation/test split
        
        Returns:
            (train_ids, validation_ids, test_ids)
        """
        profile_ids = self.get_all_profiles()
        
        if len(profile_ids) < 3:
            raise ValueError("Need at least 3 profiles for validation split")
        
        # First split: train vs (validation + test)
        train_ids, temp_ids = train_test_split(
            profile_ids,
            test_size=(validation_size + test_size),
            random_state=random_state
        )
        
        # Second split: validation vs test
        val_ratio = validation_size / (validation_size + test_size)
        validation_ids, test_ids = train_test_split(
            temp_ids,
            test_size=(1 - val_ratio),
            random_state=random_state
        )
        
        return train_ids, validation_ids, test_ids
    
    def save_validation_split(
        self,
        split_name: str,
        train_ids: List[str],
        validation_ids: List[str],
        test_ids: List[str]
    ) -> None:
        """Save validation split to database"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Create validation_splits table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS validation_splits (
                    id SERIAL PRIMARY KEY,
                    split_name VARCHAR(255) NOT NULL,
                    brand_id VARCHAR(255),
                    split_type VARCHAR(50) NOT NULL,
                    profile_ids JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(split_name, split_type)
                )
            """)
            
            # Save each split
            for split_type, profile_ids in [
                ('train', train_ids),
                ('validation', validation_ids),
                ('test', test_ids)
            ]:
                cursor.execute("""
                    INSERT INTO validation_splits (split_name, brand_id, split_type, profile_ids)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (split_name, split_type)
                    DO UPDATE SET profile_ids = EXCLUDED.profile_ids
                """, [split_name, self.brand_id, split_type, json.dumps(profile_ids)])
            
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            conn.close()
    
    def load_validation_split(self, split_name: str) -> Tuple[List[str], List[str], List[str]]:
        """Load validation split from database"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            splits = {}
            for split_type in ['train', 'validation', 'test']:
                cursor.execute("""
                    SELECT profile_ids
                    FROM validation_splits
                    WHERE split_name = %s AND split_type = %s
                """, [split_name, split_type])
                
                row = cursor.fetchone()
                if row:
                    splits[split_type] = json.loads(row['profile_ids'])
                else:
                    splits[split_type] = []
            
            return splits.get('train', []), splits.get('validation', []), splits.get('test', [])
        finally:
            cursor.close()
            conn.close()

