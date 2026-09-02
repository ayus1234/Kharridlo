from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, computed_field
from app.schemas.inventory import InventoryResponse


class ProductBase(BaseModel):
    sku: str
    name: str
    description: str
    category: str
    brand: str
    price_paise: int  # Stored in integer paise (₹1 = 100 paise)
    currency: str = "INR"
    specs: Dict[str, Any] = {}
    image_url: Optional[str] = None


class ProductResponse(ProductBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    inventory: Optional[InventoryResponse] = None

    @computed_field
    @property
    def price_inr(self) -> float:
        """Calculates display price in INR from integer paise."""
        return round(self.price_paise / 100.0, 2)

    @computed_field
    @property
    def availability_status(self) -> str:
        """Returns inventory status or 'out_of_stock' by default."""
        if self.inventory:
            return self.inventory.status
        return "out_of_stock"

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    limit: int
    offset: int
