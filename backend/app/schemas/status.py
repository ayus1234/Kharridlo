from pydantic import BaseModel


class RootResponse(BaseModel):
    service: str
    status: str


class HealthResponse(BaseModel):
    status: str
    service: str


class StatusResponse(BaseModel):
    project: str
    version: str
    environment: str
