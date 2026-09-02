from fastapi import APIRouter
from app.core.config import settings
from app.schemas.status import StatusResponse
from app.api.v1.endpoints.products import router as products_router
from app.api.v1.endpoints.cart import router as cart_router
from app.api.v1.endpoints.policy import router as policy_router
from app.api.v1.endpoints.agent import router as agent_router

api_v1_router = APIRouter()

# Register endpoints
api_v1_router.include_router(products_router)
api_v1_router.include_router(cart_router)
api_v1_router.include_router(policy_router)
api_v1_router.include_router(agent_router)


@api_v1_router.get("/status", response_model=StatusResponse, tags=["Status"])
async def get_api_status() -> StatusResponse:
    return StatusResponse(
        project="DhanKriya",
        version="0.1.0",
        environment=settings.ENVIRONMENT
    )
