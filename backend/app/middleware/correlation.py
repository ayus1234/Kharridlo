"""
Kharridlo Request Correlation Middleware.
Injects or propagates X-Request-ID header across all incoming requests and outgoing responses.
Preserves correlation across checkout, payment, webhook, and audit events without leaking secrets.
"""
import uuid
import contextvars
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Context variable for logging and service tracking
correlation_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("correlation_id", default="")


def get_correlation_id() -> str:
    """Retrieve current request correlation ID, or generate a fresh one if outside request context."""
    cid = correlation_id_ctx.get()
    return cid if cid else f"req_{uuid.uuid4().hex[:12]}"


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """
    Middleware that ensures every HTTP request has an X-Request-ID.
    If the client provides one, it is validated and propagated.
    Otherwise, a secure random UUID4 identifier is generated.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Extract existing or generate new
        raw_cid = request.headers.get("X-Request-ID", "").strip()
        if raw_cid and len(raw_cid) <= 64 and raw_cid.replace("-", "").isalnum():
            cid = raw_cid
        else:
            cid = f"req_{uuid.uuid4().hex[:12]}"

        token = correlation_id_ctx.set(cid)
        request.state.correlation_id = cid

        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = cid
            return response
        finally:
            correlation_id_ctx.reset(token)
