from fastapi import APIRouter
from app.core.config import settings
from app.schemas.status import StatusResponse
from app.api.v1.endpoints.products import router as products_router

api_v1_router = APIRouter()

# Register product catalog endpoints
api_v1_router.include_router(products_router)


@api_v1_router.get("/status", response_model=StatusResponse, tags=["Status"])
async def get_api_status() -> StatusResponse:
    return StatusResponse(
        project="DhanKriya",
        version="0.1.0",
        environment=settings.ENVIRONMENT
    )
