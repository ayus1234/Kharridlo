from fastapi import APIRouter
from app.core.config import settings
from app.schemas.status import StatusResponse

api_v1_router = APIRouter()


@api_v1_router.get("/status", response_model=StatusResponse)
async def get_api_status() -> StatusResponse:
    return StatusResponse(
        project="DhanKriya",
        version="0.1.0",
        environment=settings.ENVIRONMENT
    )
