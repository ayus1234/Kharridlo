from dataclasses import dataclass
from sqlalchemy.orm import Session


@dataclass
class AgentRequestContext:
    """
    Trusted server-side execution context for an AI agent interaction turn.
    Injects authoritative session identity and database handle into bounded tools.
    Prevents the LLM from supplying or spoofing another user's session ID.
    """
    session_id: str
    db: Session
