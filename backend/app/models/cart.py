import uuid
from typing import List
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, String, Integer, BigInteger, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped
from app.db.base import Base

DEFAULT_CART_TTL_MINUTES = 30


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_default_cart_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=DEFAULT_CART_TTL_MINUTES)


class Cart(Base):
    __tablename__ = "carts"

    id: Mapped[str] = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    session_id: Mapped[str] = Column(String(64), unique=True, index=True, nullable=False)
    status: Mapped[str] = Column(String(32), default="active", nullable=False, index=True)  # active, expired, cleared, converted
    currency: Mapped[str] = Column(String(3), default="INR", nullable=False)
    subtotal_paise: Mapped[int] = Column(BigInteger, default=0, nullable=False)
    total_paise: Mapped[int] = Column(BigInteger, default=0, nullable=False)
    expires_at: Mapped[datetime] = Column(DateTime(timezone=True), default=get_default_cart_expiry, nullable=False, index=True)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # 1-to-Many with CartItem
    items: Mapped[List["CartItem"]] = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan", order_by="CartItem.created_at.asc()")

    @property
    def is_expired(self) -> bool:
        """Determines if the cart is past its expiration timestamp."""
        now = datetime.now(timezone.utc)
        expires = self.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        return now > expires


class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[str] = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    cart_id: Mapped[str] = Column(String(36), ForeignKey("carts.id", ondelete="CASCADE"), index=True, nullable=False)
    product_id: Mapped[str] = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False)
    quantity: Mapped[int] = Column(Integer, default=1, nullable=False)
    unit_price_paise: Mapped[int] = Column(BigInteger, nullable=False)  # Immutable price snapshot at addition time
    line_total_paise: Mapped[int] = Column(BigInteger, nullable=False)  # unit_price_paise * quantity
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("cart_id", "product_id", name="uq_cart_product"),
    )

    # Relationships
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")
