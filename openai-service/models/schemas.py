"""
Pydantic models for request and response schemas
"""
from typing import Dict, List, Any, Optional
from pydantic import BaseModel

class PromptRequest(BaseModel):
    """Request model for the OpenAI prompt endpoint"""
    scanner_key: str
    content: str
    context: Dict[str, Any] = {}

class ScannerMetric(BaseModel):
    """Model representing a scanner metric result"""
    key: str
    name: str
    value: Any
    score: Optional[float] = None
    details: Optional[str] = None

class OpenAIResponse(BaseModel):
    """Response model from OpenAI API"""
    scanner_key: str
    metrics: List[ScannerMetric]
    summary: str
    raw_response: Optional[str] = None
    tokens_used: Optional[int] = None

class TokenUsage(BaseModel):
    """Model for tracking token usage"""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int