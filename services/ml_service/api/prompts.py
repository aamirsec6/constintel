# GENERATOR: OLLAMA_INTEGRATION
# Prompt templates for LLM interactions
# ASSUMPTIONS: Used by llm_service.py for generating prompts
# HOW TO USE: from api.prompts import get_insights_prompt

from typing import Dict, Any, List
from datetime import datetime


def format_number(value: float, decimals: int = 2) -> str:
    """Format number for display in prompts"""
    if value is None:
        return "N/A"
    return f"{value:,.{decimals}f}"


def format_percentage(value: float) -> str:
    """Format percentage for display"""
    if value is None:
        return "N/A"
    return f"{value:.1f}%"


def get_insights_prompt(analytics_data: Dict[str, Any]) -> str:
    """
    Generate prompt for insights generation
    
    Args:
        analytics_data: Dictionary with revenue, orders, segments, etc.
    
    Returns:
        Formatted prompt string
    """
    revenue_data = analytics_data.get("revenue", {})
    orders_data = analytics_data.get("orders", {})
    customers_data = analytics_data.get("customers", {})
    segments_data = analytics_data.get("segments", {})
    date_range = analytics_data.get("dateRange", {})
    
    prompt = f"""You are an expert data analyst. Analyze the following analytics data and provide 3-5 key insights in plain English.

Revenue Data:
- Total Revenue: ${format_number(revenue_data.get('total', 0))}
- Average Daily Revenue: ${format_number(revenue_data.get('average', 0))}
- Growth: {format_percentage(revenue_data.get('growth', 0))}
- Trend: {revenue_data.get('trend', 'stable')}

Orders Data:
- Total Orders: {format_number(orders_data.get('total', 0), 0)}
- Average Order Value: ${format_number(orders_data.get('avgOrderValue', 0))}
- Growth: {format_percentage(orders_data.get('growth', 0))}

Customers Data:
- Total Customers: {format_number(customers_data.get('total', 0), 0)}
- New Customers: {format_number(customers_data.get('new', 0), 0)}
- Active Customers: {format_number(customers_data.get('active', 0), 0)}

Customer Segments:
"""
    
    if segments_data:
        for segment_name, segment_info in segments_data.items():
            if isinstance(segment_info, dict):
                prompt += f"- {segment_name}: {format_number(segment_info.get('count', 0), 0)} customers, ${format_number(segment_info.get('revenue', 0))} revenue\n"
    
    prompt += f"""
Time Range: {date_range.get('startDate', 'N/A')} to {date_range.get('endDate', 'N/A')}

Provide insights that are:
- Actionable and specific
- Based on actual data trends
- Clear and easy to understand
- Focused on business impact

Return ONLY a valid JSON array with this exact structure:
[
  {{
    "title": "Brief title (max 50 chars)",
    "description": "Detailed explanation (2-3 sentences)",
    "type": "positive|negative|neutral",
    "metric": "revenue|orders|customers|segments",
    "impact": "high|medium|low"
  }}
]

Do not include any markdown formatting, code blocks, or explanatory text outside the JSON array."""
    
    return prompt


def get_query_prompt(question: str, context_data: Dict[str, Any]) -> str:
    """
    Generate prompt for natural language query
    
    Args:
        question: User's question
        context_data: Relevant analytics data
    
    Returns:
        Formatted prompt string
    """
    revenue_summary = context_data.get("revenue", {})
    orders_summary = context_data.get("orders", {})
    customers_summary = context_data.get("customers", {})
    segments_summary = context_data.get("segments", {})
    date_range = context_data.get("dateRange", {})
    
    prompt = f"""You are an analytics assistant. Answer the user's question about their business data clearly and accurately.

Question: {question}

Available Data:

Revenue Summary:
- Total: ${format_number(revenue_summary.get('total', 0))}
- Average: ${format_number(revenue_summary.get('average', 0))}
- Growth: {format_percentage(revenue_summary.get('growth', 0))}

Orders Summary:
- Total: {format_number(orders_summary.get('total', 0), 0)}
- Average Order Value: ${format_number(orders_summary.get('avgOrderValue', 0))}

Customers Summary:
- Total: {format_number(customers_summary.get('total', 0), 0)}
- New: {format_number(customers_summary.get('new', 0), 0)}
- Active: {format_number(customers_summary.get('active', 0), 0)}

Customer Segments:
"""
    
    if segments_summary:
        for segment_name, segment_info in segments_summary.items():
            if isinstance(segment_info, dict):
                prompt += f"- {segment_name}: {format_number(segment_info.get('count', 0), 0)} customers, ${format_number(segment_info.get('revenue', 0))} revenue\n"
    
    prompt += f"""
Time Range: {date_range.get('startDate', 'N/A')} to {date_range.get('endDate', 'N/A')}

Instructions:
- Provide a clear, concise answer (2-3 sentences)
- Base your answer on the actual data provided
- If you don't have enough information, say so
- Cite specific numbers from the data

Return ONLY a valid JSON object with this exact structure:
{{
  "answer": "Clear answer to the question (2-3 sentences)",
  "sources": [
    {{ "metric": "revenue", "value": 1234.56, "period": "last week", "description": "Brief description" }}
  ],
  "confidence": 0.85
}}

The confidence should be between 0 and 1. Include 1-3 sources that support your answer.
Do not include any markdown formatting, code blocks, or explanatory text outside the JSON object."""
    
    return prompt


def get_conversational_query_prompt(
    question: str,
    context_data: Dict[str, Any],
    conversation_history: str = "",
    brand_context: Dict[str, Any] = None
) -> str:
    """
    Generate prompt for conversational natural language query with history and brand context
    
    Args:
        question: User's current question
        context_data: Relevant analytics data
        conversation_history: Previous conversation messages
        brand_context: Brand information (name, industry, etc.)
    
    Returns:
        Formatted prompt string
    """
    revenue_summary = context_data.get("revenue", {})
    orders_summary = context_data.get("orders", {})
    customers_summary = context_data.get("customers", {})
    segments_summary = context_data.get("segments", {})
    date_range = context_data.get("dateRange", {})
    
    # Build brand context section
    brand_section = ""
    if brand_context:
        brand_name = brand_context.get("name", "the business")
        brand_industry = brand_context.get("industry", "")
        
        brand_section = f"""Brand Context:
- Brand Name: {brand_name}
"""
        if brand_industry:
            brand_section += f"- Industry: {brand_industry}\n"
        
        if brand_context.get("historicalPatterns"):
            patterns = brand_context["historicalPatterns"]
            brand_section += "\nHistorical Patterns:\n"
            if patterns.get("averageRevenue"):
                brand_section += f"- Typical Daily Revenue: ${format_number(patterns['averageRevenue'])}\n"
            if patterns.get("typicalGrowth"):
                brand_section += f"- Typical Growth Rate: {format_percentage(patterns['typicalGrowth'])}\n"
        
        brand_section += "\n"
    
    # Build conversation history section
    history_section = ""
    if conversation_history and conversation_history.strip():
        history_section = f"""Previous Conversation:
{conversation_history}

"""
    
    prompt = f"""You are a Siri-like conversational analytics assistant for {brand_context.get('name', 'this business') if brand_context else 'this business'}. 
You remember previous conversations and provide context-aware, natural responses. Use the brand name naturally in your responses.

{brand_section}{history_section}Current Question: {question}

Available Data:

Revenue Summary:
- Total: ${format_number(revenue_summary.get('total', 0))}
- Average: ${format_number(revenue_summary.get('average', 0))}
- Growth: {format_percentage(revenue_summary.get('growth', 0))}

Orders Summary:
- Total: {format_number(orders_summary.get('total', 0), 0)}
- Average Order Value: ${format_number(orders_summary.get('avgOrderValue', 0))}

Customers Summary:
- Total: {format_number(customers_summary.get('total', 0), 0)}
- New: {format_number(customers_summary.get('new', 0), 0)}
- Active: {format_number(customers_summary.get('active', 0), 0)}

Customer Segments:
"""
    
    if segments_summary:
        for segment_name, segment_info in segments_summary.items():
            if isinstance(segment_info, dict):
                prompt += f"- {segment_name}: {format_number(segment_info.get('count', 0), 0)} customers, ${format_number(segment_info.get('revenue', 0))} revenue\n"
    
    prompt += f"""
Time Range: {date_range.get('startDate', 'N/A')} to {date_range.get('endDate', 'N/A')}

Instructions:
- Answer naturally and conversationally, like Siri would
- Reference previous conversation if relevant (e.g., "As I mentioned earlier...")
- Use the brand name naturally in your response
- Provide a clear, helpful answer (2-4 sentences)
- If the question references something from conversation history, use that context
- Suggest 2-3 relevant follow-up questions the user might want to ask
- If you notice interesting patterns in the data, mention them proactively

Return ONLY a valid JSON object with this exact structure:
{{
  "answer": "Natural, conversational answer (2-4 sentences, use brand name naturally)",
  "sources": [
    {{ "metric": "revenue", "value": 1234.56, "period": "last week", "description": "Brief description" }}
  ],
  "confidence": 0.85,
  "followUpQuestions": [
    "Suggested question 1",
    "Suggested question 2",
    "Suggested question 3"
  ],
  "proactiveInsights": [
    "Interesting insight about the data (optional)"
  ],
  "conversationSummary": "Brief summary of what was discussed (1 sentence)"
}}

The confidence should be between 0 and 1. Include 1-3 sources that support your answer.
Include 2-3 follow-up questions that are relevant to the current answer.
Include 0-2 proactive insights if you notice interesting patterns.
Do not include any markdown formatting, code blocks, or explanatory text outside the JSON object."""
    
    return prompt


def get_anomaly_explanation_prompt(anomaly_data: Dict[str, Any], context_data: Dict[str, Any]) -> str:
    """
    Generate prompt for anomaly explanation
    
    Args:
        anomaly_data: Anomaly details
        context_data: Additional context
    
    Returns:
        Formatted prompt string
    """
    date = anomaly_data.get("date", "unknown")
    metric = anomaly_data.get("metric", "unknown")
    value = anomaly_data.get("value", 0)
    expected = anomaly_data.get("expected", 0)
    deviation = anomaly_data.get("deviation", 0)
    anomaly_type = anomaly_data.get("type", "unknown")
    
    prompt = f"""You are an expert data analyst. Explain this data anomaly in plain English.

Anomaly Details:
- Date: {date}
- Metric: {metric}
- Actual Value: {format_number(value)}
- Expected Value: {format_number(expected)}
- Deviation: {format_percentage(deviation)}
- Type: {anomaly_type}

Context:
- This is {"higher" if anomaly_type == "spike" else "lower"} than expected
- Deviation is {abs(deviation):.1f}% from expected

Provide a brief explanation (2-3 sentences) that:
- Explains what happened
- Suggests possible causes
- Is written in plain, business-friendly language

Return ONLY the explanation text, no JSON, no markdown formatting."""
    
    return prompt


def get_report_prompt(analytics_data: Dict[str, Any], sections: List[str]) -> str:
    """
    Generate prompt for comprehensive report
    
    Args:
        analytics_data: Complete analytics data
        sections: Sections to include in report
    
    Returns:
        Formatted prompt string
    """
    date_range = analytics_data.get("dateRange", {})
    
    prompt = f"""You are an expert business analyst. Generate a comprehensive analytics report in markdown format.

Time Period: {date_range.get('startDate', 'N/A')} to {date_range.get('endDate', 'N/A')}

Sections to Include: {', '.join(sections)}

Available Data:
"""
    
    # Add relevant data summaries
    if "revenue" in analytics_data:
        revenue = analytics_data["revenue"]
        prompt += f"""
## Revenue Metrics
- Total: ${format_number(revenue.get('total', 0))}
- Average Daily: ${format_number(revenue.get('average', 0))}
- Growth: {format_percentage(revenue.get('growth', 0))}
"""
    
    if "orders" in analytics_data:
        orders = analytics_data["orders"]
        prompt += f"""
## Orders Metrics
- Total: {format_number(orders.get('total', 0), 0)}
- Average Order Value: ${format_number(orders.get('avgOrderValue', 0))}
"""
    
    if "customers" in analytics_data:
        customers = analytics_data["customers"]
        prompt += f"""
## Customers Metrics
- Total: {format_number(customers.get('total', 0), 0)}
- New: {format_number(customers.get('new', 0), 0)}
- Active: {format_number(customers.get('active', 0), 0)}
"""
    
    if "segments" in analytics_data:
        segments = analytics_data["segments"]
        prompt += "\n## Customer Segments\n"
        for segment_name, segment_info in segments.items():
            if isinstance(segment_info, dict):
                prompt += f"- {segment_name}: {format_number(segment_info.get('count', 0), 0)} customers\n"
    
    prompt += f"""
Instructions:
- Write a professional, executive-style report
- Use markdown formatting with proper headers
- Include the following sections: {', '.join(sections)}
- Make it actionable and insights-driven
- Keep it concise (500-800 words total)
- Use bullet points and clear structure

Generate the report now. Return ONLY the markdown-formatted report, no additional text."""
    
    return prompt

