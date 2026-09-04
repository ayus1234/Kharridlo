from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, computed_field


class AddCartItemRequest(BaseModel):
    product_id: str = Field(..., description="Unique product ID or SKU")
    quantity: int = Field(1, ge=1, le=100, description="Quantity of product to add (must be >= 1)")


class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(..., ge=1, le=100, description="New target quantity for the item (must be >= 1)")


class PutCartItemRequest(BaseModel):
    product_id: Optional[str] = Field(None, description="Unique product ID or SKU")
    quantity: int = Field(..., description="Target quantity for the item")


class CartItemResponse(BaseModel):
    id: str
    cart_id: str
    product_id: str
    sku: str
    name: str
    brand: str
    category: str
    image_url: Optional[str] = None
    quantity: int
    unit_price_paise: int
    line_total_paise: int
    availability_status: str = "in_stock"

    @computed_field
    @property
    def unit_price_inr(self) -> float:
        """Calculates display unit price in INR from integer paise."""
        return round(self.unit_price_paise / 100.0, 2)

    @computed_field
    @property
    def line_total_inr(self) -> float:
        """Calculates display line total in INR from integer paise."""
        return round(self.line_total_paise / 100.0, 2)

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    id: str
    session_id: str
    status: str
    currency: str = "INR"
    subtotal_paise: int
    total_paise: int
    expires_at: datetime
    is_expired: bool
    items: List[CartItemResponse] = []

    @computed_field
    @property
    def subtotal_inr(self) -> float:
        """Calculates display subtotal in INR from integer paise."""
        return round(self.subtotal_paise / 100.0, 2)

    @computed_field
    @property
    def total_inr(self) -> float:
        """Calculates display total in INR from integer paise."""
        return round(self.total_paise / 100.0, 2)

    @computed_field
    @property
    def total_items_count(self) -> int:
        """Total aggregate quantity of items in the cart."""
        return sum(item.quantity for item in self.items)

    model_config = ConfigDict(from_attributes=True)


class CartValidationIssue(BaseModel):
    code: str  # e.g., OUT_OF_STOCK, INSUFFICIENT_STOCK, PRODUCT_INACTIVE, CART_EXPIRED
    product_id: Optional[str] = None
    message: str


class CartValidationResponse(BaseModel):
    valid: bool
    issues: List[CartValidationIssue] = []
    cart: Optional[CartResponse] = None
