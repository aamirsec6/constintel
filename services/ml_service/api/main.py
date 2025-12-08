# GENERATOR: FULL_PLATFORM
# ASSUMPTIONS: DATABASE_URL, REDIS_URL in env, models trained and stored in ./models/
# HOW TO RUN: uvicorn api.main:app --host 0.0.0.0 --port 8000

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import json
from datetime import datetime

load_dotenv()

app = FastAPI(title="ConstIntel ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection (optional - only needed for some features)
def get_db_connection():
    try:
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            return None
        return psycopg2.connect(
            db_url,
            cursor_factory=RealDictCursor
        )
    except Exception:
        return None

# Redis connection (optional - gracefully handles missing Redis)
redis_client = None
try:
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    if redis_url:
        redis_client = redis.from_url(redis_url)
        # Test connection
        redis_client.ping()
except Exception:
    # Redis not available - continue without caching
    redis_client = None

# Model registry path
MODEL_PATH = os.getenv("ML_MODEL_PATH", "./models")

# Import model loader
try:
    from api.model_loader import predict_churn as ml_predict_churn, predict_ltv as ml_predict_ltv, predict_segment as ml_predict_segment, load_models
    # Reload models on startup
    print("Loading ML models on startup...")
    load_models()
    print("ML models loaded successfully")
    USE_TRAINED_MODELS = True
except Exception as e:
    # Fallback if model_loader not available
    print(f"Warning: Could not load ML models: {e}")
    ml_predict_churn = None
    ml_predict_ltv = None
    ml_predict_segment = None
    USE_TRAINED_MODELS = False

# Import model registry router
try:
    from api.model_registry import router as model_registry_router
    app.include_router(model_registry_router)
    print("✅ Model registry API enabled")
except Exception as e:
    print(f"⚠️  Warning: Could not load model registry: {e}")

# Import evaluation router
try:
    from api.evaluation import router as evaluation_router
    app.include_router(evaluation_router)
    print("✅ Model evaluation API enabled")
except Exception as e:
    print(f"⚠️  Warning: Could not load evaluation router: {e}")

# Import recommendation engine
try:
    from api.recommendation_engine import get_recommendations, load_recommendation_models
    # Reload recommendation models on startup
    load_recommendation_models()
    RECOMMENDATION_ENGINE_AVAILABLE = True
except Exception as e:
    print(f"⚠️  Warning: Could not load recommendation engine: {e}")
    get_recommendations = None
    RECOMMENDATION_ENGINE_AVAILABLE = False

# Import LLM router
try:
    from api.llm_router import router as llm_router
    app.include_router(llm_router)
    print("✅ LLM API enabled")
except Exception as e:
    print(f"⚠️  Warning: Could not load LLM router: {e}")

# Import intent predictor
try:
    from api.intent_predictor import get_intent_predictor
    intent_predictor = get_intent_predictor()
    INTENT_PREDICTOR_AVAILABLE = True
except Exception as e:
    print(f"⚠️  Warning: Could not load intent predictor: {e}")
    intent_predictor = None
    INTENT_PREDICTOR_AVAILABLE = False

class PredictionRequest(BaseModel):
    profile_id: str
    brand_id: Optional[str] = None

class PredictionResponse(BaseModel):
    profile_id: str
    churn_score: Optional[float] = None
    ltv_score: Optional[float] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    segment: Optional[str] = None
    model_version: str
    timestamp: str

@app.get("/health")
async def health():
    """Health check endpoint"""
    db_status = "disconnected"
    try:
        conn = get_db_connection()
        if conn:
            conn.close()
            db_status = "connected"
    except Exception:
        db_status = "disconnected"
    
    redis_status = "disconnected"
    try:
        if redis_client and redis_client.ping():
            redis_status = "connected"
    except Exception:
        redis_status = "disconnected"
    
    return {
        "status": "healthy",
        "database": db_status,
        "redis": redis_status,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/predict/churn", response_model=PredictionResponse)
async def predict_churn_endpoint(request: PredictionRequest):
    """
    Predict churn probability for a customer profile
    Returns churn_score (0-1) where 1 = high churn risk
    """
    # Check cache first (if Redis available)
    cache_key = f"churn:{request.profile_id}"
    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass  # Continue without cache
    
    # Try to use trained model
    churn_score = None
    model_version = "v1.0.0-mock"
    
    if ml_predict_churn:
        try:
            churn_score = ml_predict_churn(request.profile_id)
            if churn_score is not None:
                model_version = "v1.0.0-trained"
        except Exception as e:
            print(f"Model prediction error: {e}")
    
    # Fallback to mock if model not available
    if churn_score is None:
        churn_score = 0.25  # Mock prediction
    
    response = PredictionResponse(
        profile_id=request.profile_id,
        churn_score=churn_score,
        model_version=model_version,
        timestamp=datetime.utcnow().isoformat()
    )
    
    # Cache for 1 hour (if Redis available)
    if redis_client:
        try:
            redis_client.setex(cache_key, 3600, response.json())
        except Exception:
            pass  # Continue without caching
    
    return response

@app.post("/predict/ltv", response_model=PredictionResponse)
async def predict_ltv(request: PredictionRequest):
    """
    Predict lifetime value (LTV) for a customer profile
    Returns ltv_score as predicted monetary value
    """
    model_version = "v1.0.0-mock"
    
    cache_key = f"ltv:{request.profile_id}"
    if redis_client:
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
    
    # Mock prediction
    ltv_score = 1500.0  # Placeholder
    
    response = PredictionResponse(
        profile_id=request.profile_id,
        ltv_score=ltv_score,
        model_version=model_version,
        timestamp=datetime.utcnow().isoformat()
    )
    
    if redis_client:
        redis_client.setex(cache_key, 3600, response.json())
    
    return response

@app.post("/predict/recs", response_model=PredictionResponse)
async def predict_recommendations(request: PredictionRequest):
    """
    Get product/category recommendations for a customer profile
    Returns recommendations as array of {product_id, category, score}
    """
    cache_key = f"recs:{request.profile_id}"
    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass  # Continue without cache
    
    # Try to use recommendation engine
    recommendations = None
    model_version = "v1.0.0-mock"
    
    if get_recommendations:
        try:
            recommendations = get_recommendations(
                request.profile_id,
                top_k=10,
                brand_id=request.brand_id
            )
            if recommendations:
                model_version = "v1.0.0-trained"
        except Exception as e:
            print(f"Recommendation engine error: {e}")
    
    # Fallback to mock if engine not available
    if not recommendations:
        recommendations = [
            {"product_id": "prod_123", "category": "electronics", "score": 0.85},
            {"product_id": "prod_456", "category": "accessories", "score": 0.72},
        ]
    
    response = PredictionResponse(
        profile_id=request.profile_id,
        recommendations=recommendations,
        model_version=model_version,
        timestamp=datetime.utcnow().isoformat()
    )
    
    if redis_client:
        try:
            redis_client.setex(cache_key, 3600, response.json())
        except Exception:
            pass  # Continue without caching
    
    return response

@app.post("/predict/all", response_model=PredictionResponse)
async def predict_all(request: PredictionRequest):
    """
    Get all predictions (churn, LTV, recommendations, segment) in one call
    """
    cache_key = f"all:{request.profile_id}"
    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass  # Continue without cache
    
    # Try to use trained models
    churn_score = None
    ltv_score = None
    segment = None
    model_version = "v1.0.0-mock"
    
    if ml_predict_churn:
        try:
            churn_score = ml_predict_churn(request.profile_id)
            if churn_score is not None:
                model_version = "v1.0.0-trained"
        except Exception:
            pass
    
    if ml_predict_ltv:
        try:
            ltv_score = ml_predict_ltv(request.profile_id)
            if ltv_score is not None and model_version == "v1.0.0-mock":
                model_version = "v1.0.0-trained"
        except Exception:
            pass
    
    if ml_predict_segment:
        try:
            segment = ml_predict_segment(request.profile_id)
            if segment is not None and model_version == "v1.0.0-mock":
                model_version = "v1.0.0-trained"
        except Exception:
            pass
    
    # Fallback to mock values if models not available
    if churn_score is None:
        churn_score = 0.25
    if ltv_score is None:
        ltv_score = 1500.0
    if segment is None:
        segment = "high_value"
    
    # Get recommendations from engine
    recommendations = None
    if get_recommendations:
        try:
            recommendations = get_recommendations(
                request.profile_id,
                top_k=5,
                brand_id=request.brand_id
            )
        except Exception:
            pass
    
    # Fallback to mock if engine not available
    if not recommendations:
        recommendations = [
            {"product_id": "prod_123", "category": "electronics", "score": 0.85}
        ]
    
    response = PredictionResponse(
        profile_id=request.profile_id,
        churn_score=churn_score,
        ltv_score=ltv_score,
        recommendations=recommendations,
        segment=segment,
        model_version=model_version,
        timestamp=datetime.utcnow().isoformat()
    )
    
    if redis_client:
        try:
            redis_client.setex(cache_key, 3600, response.json())
        except Exception:
            pass  # Continue without caching
    
    return response

class IntentPredictionRequest(BaseModel):
    profile_id: str
    product_id: str
    intent_score: float
    intent_type: str
    view_duration: Optional[int] = None
    hours_since_last_view: Optional[float] = None
    days_since_first_view: Optional[float] = None
    lifetime_value: Optional[float] = None
    total_orders: Optional[int] = None
    profile_strength: Optional[int] = None

class IntentPredictionResponse(BaseModel):
    profile_id: str
    product_id: str
    probability: float
    prediction: int
    model_version: Optional[str] = None
    timestamp: str

@app.post("/predict/intent", response_model=IntentPredictionResponse)
async def predict_intent(request: IntentPredictionRequest):
    """
    Predict purchase probability for a product intent
    Returns probability (0-1) of customer purchasing the product
    """
    if not intent_predictor:
        raise HTTPException(status_code=503, detail="Intent predictor not available")
    
    try:
        # Get customer profile data if not provided
        if request.lifetime_value is None or request.total_orders is None:
            conn = get_db_connection()
            if conn:
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                cursor.execute("""
                    SELECT lifetime_value, total_orders, profile_strength
                    FROM customer_profile
                    WHERE id = %s
                """, (request.profile_id,))
                profile = cursor.fetchone()
                cursor.close()
                conn.close()
                
                if profile:
                    lifetime_value = float(request.lifetime_value or profile['lifetime_value'] or 0)
                    total_orders = int(request.total_orders or profile['total_orders'] or 0)
                    profile_strength = int(request.profile_strength or profile['profile_strength'] or 0)
                else:
                    lifetime_value = request.lifetime_value or 0
                    total_orders = request.total_orders or 0
                    profile_strength = request.profile_strength or 0
            else:
                lifetime_value = request.lifetime_value or 0
                total_orders = request.total_orders or 0
                profile_strength = request.profile_strength or 0
        else:
            lifetime_value = request.lifetime_value
            total_orders = request.total_orders
            profile_strength = request.profile_strength or 0
        
        # Predict
        result = intent_predictor.predict({
            'intent_score': request.intent_score,
            'intent_type': request.intent_type,
            'view_duration': request.view_duration or 0,
            'hours_since_last_view': request.hours_since_last_view or 24,
            'days_since_first_view': request.days_since_first_view or 1,
            'lifetime_value': lifetime_value,
            'total_orders': total_orders,
            'profile_strength': profile_strength,
        })
        
        return IntentPredictionResponse(
            profile_id=request.profile_id,
            product_id=request.product_id,
            probability=result['probability'],
            prediction=result['prediction'],
            model_version=result.get('model_version'),
            timestamp=datetime.utcnow().isoformat()
        )
    except Exception as e:
        print(f"Error predicting intent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("ML_SERVICE_PORT", 8000)))

