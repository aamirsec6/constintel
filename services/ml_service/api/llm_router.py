# GENERATOR: OLLAMA_INTEGRATION
# LLM API endpoints for natural language insights
# ASSUMPTIONS: Ollama service available, llm_service.py imported
# HOW TO USE: Include router in main.py: app.include_router(llm_router)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/llm", tags=["llm"])

# Check if LLM features are enabled
LLM_ENABLED = os.getenv("ENABLE_LLM_INSIGHTS", "true").lower() == "true"


class InsightsRequest(BaseModel):
    revenue: Optional[Dict[str, Any]] = None
    orders: Optional[Dict[str, Any]] = None
    customers: Optional[Dict[str, Any]] = None
    segments: Optional[Dict[str, Any]] = None
    dateRange: Optional[Dict[str, str]] = None


class QueryRequest(BaseModel):
    question: str
    revenue: Optional[Dict[str, Any]] = None
    orders: Optional[Dict[str, Any]] = None
    customers: Optional[Dict[str, Any]] = None
    segments: Optional[Dict[str, Any]] = None
    dateRange: Optional[Dict[str, str]] = None
    brandContext: Optional[Dict[str, Any]] = None
    conversationHistory: Optional[str] = None


class AnomalyExplanationRequest(BaseModel):
    anomaly: Dict[str, Any]
    context: Optional[Dict[str, Any]] = None


class ReportRequest(BaseModel):
    revenue: Optional[Dict[str, Any]] = None
    orders: Optional[Dict[str, Any]] = None
    customers: Optional[Dict[str, Any]] = None
    segments: Optional[Dict[str, Any]] = None
    dateRange: Optional[Dict[str, str]] = None
    sections: Optional[List[str]] = None


@router.get("/health")
async def llm_health():
    """Check LLM service health"""
    try:
        from api.llm_service import check_ollama_health
        is_healthy = check_ollama_health()
        return {
            "status": "healthy" if is_healthy else "unavailable",
            "enabled": LLM_ENABLED,
            "service": "ollama"
        }
    except Exception as e:
        logger.error(f"LLM health check failed: {e}")
        return {
            "status": "error",
            "enabled": LLM_ENABLED,
            "error": str(e)
        }


@router.post("/insights")
async def generate_insights(request: InsightsRequest):
    """
    Generate natural language insights from analytics data
    
    Returns 3-5 key insights based on the provided analytics data
    """
    if not LLM_ENABLED:
        raise HTTPException(status_code=503, detail="LLM features are disabled")
    
    try:
        from api.llm_service import generate_insights
        
        analytics_data = {
            "revenue": request.revenue or {},
            "orders": request.orders or {},
            "customers": request.customers or {},
            "segments": request.segments or {},
            "dateRange": request.dateRange or {}
        }
        
        insights = generate_insights(analytics_data)
        
        if insights is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate insights. Ollama service may be unavailable."
            )
        
        return {
            "success": True,
            "data": {
                "insights": insights,
                "generatedAt": str(datetime.now())
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")


@router.post("/ask")
async def answer_question(request: QueryRequest):
    """
    Answer a natural language question about analytics data
    
    Allows users to ask questions like "What caused the revenue drop?"
    """
    if not LLM_ENABLED:
        raise HTTPException(status_code=503, detail="LLM features are disabled")
    
    if not request.question or len(request.question.strip()) == 0:
        raise HTTPException(status_code=400, detail="Question is required")
    
    try:
        from api.llm_service import answer_question
        
        context_data = {
            "revenue": request.revenue or {},
            "orders": request.orders or {},
            "customers": request.customers or {},
            "segments": request.segments or {},
            "dateRange": request.dateRange or {}
        }
        
        result = answer_question(
            request.question,
            context_data,
            conversation_history=request.conversationHistory,
            brand_context=request.brandContext
        )
        
        if result is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to answer question. Ollama service may be unavailable."
            )
        
        return {
            "success": True,
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error answering question: {e}")
        raise HTTPException(status_code=500, detail=f"Error answering question: {str(e)}")


@router.post("/explain-anomaly")
async def explain_anomaly(request: AnomalyExplanationRequest):
    """
    Generate explanation for a data anomaly
    
    Explains why an anomaly occurred in plain English
    """
    if not LLM_ENABLED:
        raise HTTPException(status_code=503, detail="LLM features are disabled")
    
    try:
        from api.llm_service import explain_anomaly
        
        explanation = explain_anomaly(
            request.anomaly,
            request.context or {}
        )
        
        if explanation is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate explanation. Ollama service may be unavailable."
            )
        
        return {
            "success": True,
            "data": {
                "explanation": explanation,
                "anomaly": request.anomaly
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error explaining anomaly: {e}")
        raise HTTPException(status_code=500, detail=f"Error explaining anomaly: {str(e)}")


@router.post("/generate-report")
async def generate_report(request: ReportRequest):
    """
    Generate a comprehensive analytics report
    
    Creates a markdown-formatted report with insights and recommendations
    """
    if not LLM_ENABLED:
        raise HTTPException(status_code=503, detail="LLM features are disabled")
    
    try:
        from api.llm_service import generate_report
        
        analytics_data = {
            "revenue": request.revenue or {},
            "orders": request.orders or {},
            "customers": request.customers or {},
            "segments": request.segments or {},
            "dateRange": request.dateRange or {}
        }
        
        sections = request.sections or [
            "executive_summary",
            "metrics",
            "insights",
            "recommendations"
        ]
        
        report = generate_report(analytics_data, sections)
        
        if report is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate report. Ollama service may be unavailable."
            )
        
        return {
            "success": True,
            "data": {
                "report": report,
                "format": "markdown",
                "sections": sections,
                "generatedAt": str(datetime.now())
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

