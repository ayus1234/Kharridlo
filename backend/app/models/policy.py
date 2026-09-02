import uuid
from sqlalchemy import Column, String, BigInteger, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.db.base import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Policy(Base):
    __tablename__ = "policies"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    tier = Column(String(32), unique=True, index=True, nullable=False)  # STANDARD, ELEVATED, RESTRICTED
    name = Column(String(64), nullable=False)
    description = Column(Text, nullable=True)
    max_single_transaction_paise = Column(BigInteger, nullable=False)  # e.g., 7,000,000 paise (₹70,000)
    max_cart_total_paise = Column(BigInteger, nullable=False)          # e.g., 7,000,000 paise (₹70,000)
    authorization_required = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class SessionPolicy(Base):
    __tablename__ = "session_policies"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    session_id = Column(String(64), unique=True, index=True, nullable=False)
    policy_tier = Column(String(32), default="STANDARD", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
