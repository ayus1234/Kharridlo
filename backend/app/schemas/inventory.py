from pydantic import BaseModel, ConfigDict


class InventoryResponse(BaseModel):
    product_id: str
    available_quantity: int
    reserved_quantity: int
    status: str

    model_config = ConfigDict(from_attributes=True)
