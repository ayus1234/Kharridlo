from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.schemas.status import RootResponse, HealthResponse
from app.api.v1.router import api_v1_router

app = FastAPI(
    title=settings.APP_NAME,
    description="Kharridlo Backend API — From AI intent to trusted transactions.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

from app.middleware.correlation import CorrelationIdMiddleware
from app.middleware.rate_limit import RateLimitMiddleware

# Middlewares (RateLimit -> CorrelationId -> CORS)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(CorrelationIdMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["http://localhost:3000", "http://127.0.0.1:3000", "https://kharridlo.vercel.app"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "Retry-After"],
)

# Include v1 API router
app.include_router(api_v1_router, prefix="/api/v1", tags=["Status"])


@app.get("/", response_model=RootResponse, tags=["General"])
async def root() -> RootResponse:
    return RootResponse(
        service="Kharridlo API",
        status="running"
    )


@app.get("/health", response_model=HealthResponse, tags=["General"])
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        service="Kharridlo API"
    )


if __name__ == "__main__":
    import uvicorn  # type: ignore
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
