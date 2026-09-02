from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    available_quantity = Column(Integer, default=0, nullable=False)
    reserved_quantity = Column(Integer, default=0, nullable=False)
    low_stock_threshold = Column(Integer, default=5, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship to Product
    product = relationship("Product", back_populates="inventory")

    @property
    def status(self) -> str:
        """Determines inventory status deterministically."""
        if self.available_quantity <= 0:
            return "out_of_stock"
        elif self.available_quantity <= self.low_stock_threshold:
            return "low_stock"
        return "in_stock"
