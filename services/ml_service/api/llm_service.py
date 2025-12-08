# GENERATOR: OLLAMA_INTEGRATION
# Ollama LLM client service
# ASSUMPTIONS: OLLAMA_URL in env, Ollama server running
# HOW TO USE: from api.llm_service import generate_insights, answer_question

import os
import json
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3:8b")
OLLAMA_ENABLED = os.getenv("OLLAMA_ENABLED", "true").lower() == "true"
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "30"))
OLLAMA_MAX_TOKENS = int(os.getenv("OLLAMA_MAX_TOKENS", "1000"))


def check_ollama_health() -> bool:
    """Check if Ollama service is available"""
    if not OLLAMA_ENABLED:
        return False
    
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        return response.status_code == 200
    except Exception as e:
        logger.warning(f"Ollama health check failed: {e}")
        return False


def call_ollama(prompt: str, system_prompt: Optional[str] = None, stream: bool = False) -> Optional[Dict[str, Any]]:
    """
    Call Ollama API with a prompt
    
    Args:
        prompt: User prompt
        system_prompt: System prompt (optional)
        stream: Whether to stream the response
    
    Returns:
        Response from Ollama or None if error
    """
    if not OLLAMA_ENABLED:
        logger.warning("Ollama is disabled")
        return None
    
    if not check_ollama_health():
        logger.error("Ollama service is not available")
        return None
    
    try:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "num_predict": OLLAMA_MAX_TOKENS,
                "temperature": 0.7,
            }
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json=payload,
            timeout=OLLAMA_TIMEOUT
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "response": data.get("response", ""),
                "model": data.get("model", OLLAMA_MODEL),
                "done": data.get("done", True),
            }
        else:
            logger.error(f"Ollama API error: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        logger.error(f"Ollama request timed out after {OLLAMA_TIMEOUT} seconds")
        return None
    except Exception as e:
        logger.error(f"Error calling Ollama: {e}")
        return None


def parse_json_response(text: str) -> Optional[Dict[str, Any]]:
    """Extract JSON from LLM response, handling markdown code blocks"""
    try:
        # Remove markdown code blocks if present
        if "```json" in text:
            start = text.find("```json") + 7
            end = text.find("```", start)
            text = text[start:end].strip()
        elif "```" in text:
            start = text.find("```") + 3
            end = text.find("```", start)
            text = text[start:end].strip()
        
        # Try to find JSON object/array
        start_brace = text.find("{")
        start_bracket = text.find("[")
        
        if start_brace != -1:
            # Find matching closing brace
            brace_count = 0
            for i, char in enumerate(text[start_brace:], start_brace):
                if char == "{":
                    brace_count += 1
                elif char == "}":
                    brace_count -= 1
                    if brace_count == 0:
                        json_text = text[start_brace:i+1]
                        return json.loads(json_text)
        elif start_bracket != -1:
            # Find matching closing bracket
            bracket_count = 0
            for i, char in enumerate(text[start_bracket:], start_bracket):
                if char == "[":
                    bracket_count += 1
                elif char == "]":
                    bracket_count -= 1
                    if bracket_count == 0:
                        json_text = text[start_bracket:i+1]
                        return json.loads(json_text)
        
        # Fallback: try parsing entire text
        return json.loads(text)
    except Exception as e:
        logger.warning(f"Failed to parse JSON from response: {e}")
        return None


def generate_insights(analytics_data: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
    """
    Generate insights from analytics data using LLM
    
    Args:
        analytics_data: Dictionary containing revenue, orders, segments, etc.
    
    Returns:
        List of insight dictionaries or None if error
    """
    from api.prompts import get_insights_prompt
    
    prompt = get_insights_prompt(analytics_data)
    system_prompt = "You are an expert data analyst. Provide actionable insights in JSON format."
    
    result = call_ollama(prompt, system_prompt)
    
    if not result or not result.get("response"):
        return None
    
    parsed = parse_json_response(result["response"])
    
    if isinstance(parsed, list):
        return parsed
    elif isinstance(parsed, dict) and "insights" in parsed:
        return parsed["insights"]
    
    return None


def answer_question(
    question: str,
    context_data: Dict[str, Any],
    conversation_history: Optional[str] = None,
    brand_context: Optional[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    """
    Answer a natural language question about analytics data with conversation support
    
    Args:
        question: User's question
        context_data: Relevant analytics data
        conversation_history: Previous conversation messages (optional)
        brand_context: Brand information (optional)
    
    Returns:
        Answer dictionary with response, sources, follow-up questions, and proactive insights
    """
    from api.prompts import get_query_prompt, get_conversational_query_prompt
    
    # Use conversational prompt if history or brand context provided
    if conversation_history or brand_context:
        prompt = get_conversational_query_prompt(
            question,
            context_data,
            conversation_history or "",
            brand_context
        )
        system_prompt = "You are a Siri-like conversational analytics assistant. Provide natural, context-aware responses and suggest relevant follow-up questions."
    else:
        prompt = get_query_prompt(question, context_data)
        system_prompt = "You are an analytics assistant. Answer questions clearly and cite data sources."
    
    result = call_ollama(prompt, system_prompt)
    
    if not result or not result.get("response"):
        return None
    
    parsed = parse_json_response(result["response"])
    
    if isinstance(parsed, dict):
        # Ensure all expected fields are present
        return {
            "answer": parsed.get("answer", ""),
            "sources": parsed.get("sources", []),
            "confidence": parsed.get("confidence", 0.7),
            "followUpQuestions": parsed.get("followUpQuestions", []),
            "proactiveInsights": parsed.get("proactiveInsights", []),
            "conversationSummary": parsed.get("conversationSummary", ""),
        }
    
    # Fallback: return as text answer
    return {
        "answer": result["response"],
        "sources": [],
        "confidence": 0.7,
        "followUpQuestions": [],
        "proactiveInsights": [],
        "conversationSummary": "",
    }


def explain_anomaly(anomaly_data: Dict[str, Any], context_data: Dict[str, Any]) -> Optional[str]:
    """
    Generate explanation for an anomaly
    
    Args:
        anomaly_data: Anomaly details (date, metric, value, expected)
        context_data: Additional context data
    
    Returns:
        Explanation string or None if error
    """
    from api.prompts import get_anomaly_explanation_prompt
    
    prompt = get_anomaly_explanation_prompt(anomaly_data, context_data)
    system_prompt = "You are an expert data analyst. Explain anomalies clearly and concisely."
    
    result = call_ollama(prompt, system_prompt)
    
    if not result or not result.get("response"):
        return None
    
    return result["response"].strip()


def generate_report(analytics_data: Dict[str, Any], sections: List[str]) -> Optional[str]:
    """
    Generate a comprehensive analytics report
    
    Args:
        analytics_data: Complete analytics data
        sections: List of sections to include
    
    Returns:
        Report text (markdown) or None if error
    """
    from api.prompts import get_report_prompt
    
    prompt = get_report_prompt(analytics_data, sections)
    system_prompt = "You are an expert business analyst. Write clear, professional reports in markdown format."
    
    result = call_ollama(prompt, system_prompt)
    
    if not result or not result.get("response"):
        return None
    
    return result["response"].strip()

