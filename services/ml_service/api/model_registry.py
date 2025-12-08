# GENERATOR: ML_PHASE1
# Model registry API endpoints
# HOW TO RUN: Imported by main.py

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/models", tags=["model-registry"])

class ModelVersionResponse(BaseModel):
    id: str
    model_type: str
    version: str
    model_path: str
    metrics: dict
    training_date: datetime
    is_active: bool
    training_samples: int
    feature_count: int
    hyperparameters: Optional[dict] = None
    notes: Optional[str] = None

def get_db_connection():
    db_url = os.getenv("DATABASE_URL", "postgresql://constintel:constintel@localhost:5432/constintel")
    if "?schema=" in db_url:
        db_url = db_url.split("?")[0]
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)

@router.get("/versions", response_model=List[ModelVersionResponse])
async def list_model_versions(
    model_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = 50
):
    """List all model versions with optional filters"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        query = "SELECT * FROM model_version WHERE 1=1"
        params = []
        
        if model_type:
            query += " AND model_type = %s"
            params.append(model_type)
        
        if is_active is not None:
            query += " AND is_active = %s"
            params.append(is_active)
        
        query += " ORDER BY training_date DESC LIMIT %s"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        return [
            ModelVersionResponse(
                id=row['id'],
                model_type=row['model_type'],
                version=row['version'],
                model_path=row['model_path'],
                metrics=row['metrics'],
                training_date=row['training_date'],
                is_active=row['is_active'],
                training_samples=row['training_samples'],
                feature_count=row['feature_count'],
                hyperparameters=row.get('hyperparameters'),
                notes=row.get('notes')
            )
            for row in rows
        ]
    finally:
        cursor.close()
        conn.close()

@router.get("/versions/{model_type}/active", response_model=ModelVersionResponse)
async def get_active_model(model_type: str):
    """Get the currently active model for a given type"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT * FROM model_version 
            WHERE model_type = %s AND is_active = true 
            ORDER BY training_date DESC 
            LIMIT 1
        """, [model_type])
        
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"No active {model_type} model found")
        
        return ModelVersionResponse(
            id=row['id'],
            model_type=row['model_type'],
            version=row['version'],
            model_path=row['model_path'],
            metrics=row['metrics'],
            training_date=row['training_date'],
            is_active=row['is_active'],
            training_samples=row['training_samples'],
            feature_count=row['feature_count'],
            hyperparameters=row.get('hyperparameters'),
            notes=row.get('notes')
        )
    finally:
        cursor.close()
        conn.close()

@router.get("/metrics/summary")
async def get_metrics_summary():
    """Get summary of all active model metrics"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT model_type, version, metrics, training_date
            FROM model_version 
            WHERE is_active = true
            ORDER BY model_type
        """)
        
        rows = cursor.fetchall()
        
        summary = {}
        for row in rows:
            summary[row['model_type']] = {
                'version': row['version'],
                'metrics': row['metrics'],
                'training_date': row['training_date'].isoformat()
            }
        
        return summary
    finally:
        cursor.close()
        conn.close()

