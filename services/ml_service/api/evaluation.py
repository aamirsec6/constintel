# GENERATOR: ML_EVALUATION
# Evaluation API endpoints
# HOW TO RUN: Imported by main.py

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import os
import sys
import json
import uuid
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from evaluate.model_evaluator import ModelEvaluator
from evaluate.report_generator import ReportGenerator
from evaluate.validation_set import ValidationSetManager

load_dotenv()

router = APIRouter(prefix="/evaluate", tags=["evaluation"])


def get_db_connection():
    import psycopg2
    from psycopg2.extras import RealDictCursor
    
    db_url = os.getenv("DATABASE_URL", "postgresql://constintel:constintel@localhost:5432/constintel")
    if "?schema=" in db_url:
        db_url = db_url.split("?")[0]
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)


class EvaluationRequest(BaseModel):
    brand_id: Optional[str] = None
    model_types: Optional[List[str]] = None  # ['churn', 'ltv', 'segmentation'] or None for all
    profile_ids: Optional[List[str]] = None
    limit: Optional[int] = None
    validation_split: Optional[str] = None


class EvaluationResponse(BaseModel):
    evaluation_id: str
    status: str
    results: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


@router.post("/all", response_model=EvaluationResponse)
async def evaluate_all_models(request: EvaluationRequest):
    """Evaluate all available models"""
    try:
        evaluator = ModelEvaluator(brand_id=request.brand_id)
        
        # Get profiles
        profile_ids = request.profile_ids
        if not profile_ids and request.validation_split:
            split_manager = ValidationSetManager(brand_id=request.brand_id)
            _, validation_ids, test_ids = split_manager.load_validation_split(request.validation_split)
            profile_ids = validation_ids + test_ids
        elif not profile_ids:
            profile_ids = evaluator.load_test_profiles(limit=request.limit or 1000)
        
        # Filter by model types if specified
        if request.model_types:
            results = {
                'evaluation_date': datetime.utcnow().isoformat(),
                'brand_id': request.brand_id,
                'results': {}
            }
            for model_type in request.model_types:
                if model_type == 'churn':
                    results['results']['churn'] = evaluator.evaluate_churn_model(profile_ids)
                elif model_type == 'ltv':
                    results['results']['ltv'] = evaluator.evaluate_ltv_model(profile_ids)
                elif model_type == 'segmentation':
                    results['results']['segmentation'] = evaluator.evaluate_segmentation_model(profile_ids)
        else:
            results = evaluator.evaluate_all_models(profile_ids)
        
        # Save to database
        evaluation_id = str(uuid.uuid4())
        save_evaluation_results(evaluation_id, results)
        
        return EvaluationResponse(
            evaluation_id=evaluation_id,
            status="completed",
            results=results
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{model_type}", response_model=EvaluationResponse)
async def evaluate_model(model_type: str, request: EvaluationRequest):
    """Evaluate a specific model type"""
    valid_types = ['churn', 'ltv', 'segmentation', 'intent', 'journey']
    if model_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid model type. Must be one of: {valid_types}")
    
    try:
        evaluator = ModelEvaluator(brand_id=request.brand_id)
        
        # Get profiles
        profile_ids = request.profile_ids
        if not profile_ids and request.validation_split:
            split_manager = ValidationSetManager(brand_id=request.brand_id)
            _, validation_ids, test_ids = split_manager.load_validation_split(request.validation_split)
            profile_ids = validation_ids + test_ids
        elif not profile_ids:
            profile_ids = evaluator.load_test_profiles(limit=request.limit or 1000)
        
        # Evaluate specific model
        if model_type == 'churn':
            result = evaluator.evaluate_churn_model(profile_ids)
        elif model_type == 'ltv':
            result = evaluator.evaluate_ltv_model(profile_ids)
        elif model_type == 'segmentation':
            result = evaluator.evaluate_segmentation_model(profile_ids)
        else:
            raise HTTPException(status_code=501, detail=f"Evaluation for {model_type} not yet implemented")
        
        results = {
            'evaluation_date': datetime.utcnow().isoformat(),
            'brand_id': request.brand_id,
            'results': {model_type: result}
        }
        
        # Save to database
        evaluation_id = str(uuid.uuid4())
        save_evaluation_results(evaluation_id, results)
        
        return EvaluationResponse(
            evaluation_id=evaluation_id,
            status="completed",
            results=results
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{evaluation_id}")
async def get_evaluation_results(evaluation_id: str):
    """Get evaluation results by ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT results, created_at
            FROM model_evaluation
            WHERE id = %s
        """, [evaluation_id])
        
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        results = row['results']
        if isinstance(results, str):
            results = json.loads(results)
        
        return {
            'evaluation_id': evaluation_id,
            'results': results,
            'created_at': row['created_at'].isoformat()
        }
    finally:
        cursor.close()
        conn.close()


@router.get("/history")
async def get_evaluation_history(
    brand_id: Optional[str] = None,
    model_type: Optional[str] = None,
    limit: int = 50
):
    """Get evaluation history"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        query = "SELECT id, brand_id, model_type, created_at FROM model_evaluation WHERE 1=1"
        params = []
        
        if brand_id:
            query += " AND brand_id = %s"
            params.append(brand_id)
        
        if model_type:
            query += " AND model_type = %s"
            params.append(model_type)
        
        query += " ORDER BY created_at DESC LIMIT %s"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        return [
            {
                'evaluation_id': row['id'],
                'brand_id': row['brand_id'],
                'model_type': row['model_type'],
                'created_at': row['created_at'].isoformat()
            }
            for row in rows
        ]
    finally:
        cursor.close()
        conn.close()


def save_evaluation_results(evaluation_id: str, results: Dict[str, Any]):
    """Save evaluation results to database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Create table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS model_evaluation (
                id VARCHAR(255) PRIMARY KEY,
                brand_id VARCHAR(255),
                model_type VARCHAR(50),
                results JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        
        # Extract model types from results
        model_types = list(results.get('results', {}).keys())
        model_type = model_types[0] if len(model_types) == 1 else 'all'
        
        cursor.execute("""
            INSERT INTO model_evaluation (id, brand_id, model_type, results)
            VALUES (%s, %s, %s, %s)
        """, [evaluation_id, results.get('brand_id'), model_type, json.dumps(results)])
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Error saving evaluation results: {e}")
    finally:
        cursor.close()
        conn.close()

