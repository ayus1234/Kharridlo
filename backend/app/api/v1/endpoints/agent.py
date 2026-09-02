import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.agent.service import AgentService
from app.agent.schemas import AgentChatRequest, AgentChatResponse

router = APIRouter(prefix="/agent", tags=["AI Agent"])


@router.post("/chat", response_model=AgentChatResponse)
def chat_with_agent(
    payload: AgentChatRequest,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    db: Session = Depends(get_db),
) -> AgentChatResponse:
    """
    Conversational AI Shopping Assistant endpoint.
    Interprets buyer intent, invokes bounded commerce tools, and returns grounded recommendations.
    Enforces strict policy boundaries: AI proposes, deterministic systems verify and authorize.
    """
    session_id = payload.session_id or x_session_id or f"sess_{uuid.uuid4().hex[:12]}"
    return AgentService.chat(db=db, session_id=session_id, user_message=payload.message)
