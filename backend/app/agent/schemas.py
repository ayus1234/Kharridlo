from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.cart import CartResponse
from app.schemas.policy import PolicyEvaluationResponse


class AgentChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Buyer message or question to the shopping assistant")
    session_id: Optional[str] = Field(None, description="Optional session override; otherwise extracted from header or context")


class ToolCallRecord(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    result: Dict[str, Any] = Field(default_factory=dict)


class AgentChatResponse(BaseModel):
    message: str
    session_id: str
    tool_calls: List[ToolCallRecord] = Field(default_factory=list)
    cart: Optional[CartResponse] = None
    policy: Optional[PolicyEvaluationResponse] = None
    execution_mode: str = Field(default="deterministic_fallback", description="Pipeline used: 'live_gemini' or 'deterministic_fallback'")
    model: Optional[str] = Field(default=None, description="Model identifier if live Gemini was used")
