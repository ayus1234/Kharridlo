from sqlalchemy import Column, String, Text, BigInteger, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, index=True)
    sku = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(64), index=True, nullable=False)
    brand = Column(String(64), index=True, nullable=False)
    price_paise = Column(BigInteger, nullable=False)  # Stored in integer paise (₹1 = 100 paise)
    currency = Column(String(3), default="INR", nullable=False)
    specs = Column(JSON, nullable=False, default=dict)
    image_url = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # 1-to-1 relationship with Inventory
    inventory = relationship("Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan")
