"""
Kharridlo Rate Limiting Middleware.
Protects sensitive payment and checkout endpoints against brute force, replay storms, and race conditions.
Implements development-safe sliding-window rate limiting with clear HTTP 429 responses and Retry-After headers.
"""
import time
from collections import defaultdict
from typing import Dict, List, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class RateLimiter:
    """In-memory sliding window rate limiter."""

    def __init__(self):
        # Map key -> list of timestamps
        self._history: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int = 60) -> Tuple[bool, int]:
        """
        Check if request is allowed under rate limit.
        Returns (is_allowed, retry_after_seconds).
        """
        now = time.time()
        cutoff = now - window_seconds

        # Clean old timestamps
        timestamps = [t for t in self._history[key] if t > cutoff]
        self._history[key] = timestamps

        if len(timestamps) >= max_requests:
            oldest = timestamps[0]
            retry_after = max(1, int(oldest + window_seconds - now))
            return False, retry_after

        self._history[key].append(now)
        return True, 0

    def reset(self):
        """Reset rate limiter state (useful for tests)."""
        self._history.clear()


# Singleton rate limiter instance
limiter = RateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware applying conservative rate limits to sensitive financial endpoints.
    Allows high throughput for general catalog and static assets while safeguarding order creation and payments.
    """

    # Route rules: (path_prefix, method, max_requests_per_minute)
    SENSITIVE_RULES = [
        ("/api/v1/payments/orders", "POST", 20),
        ("/api/v1/payments/verify", "POST", 20),
        ("/api/v1/payments/webhook", "POST", 60),
        ("/api/v1/checkout/confirm", "POST", 25),
        ("/api/v1/policy/evaluate", "POST", 40),
    ]

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        method = request.method

        # Check if route matches any sensitive rule
        rule_match = next(
            (max_req for prefix, meth, max_req in self.SENSITIVE_RULES if path.startswith(prefix) and method == meth),
            None
        )

        if rule_match is not None:
            # Derive client key (Prefer X-Session-ID or client IP)
            client_ip = request.client.host if request.client else "unknown"
            session_id = request.headers.get("X-Session-ID") or request.query_params.get("session_id") or ""
            key = f"{path}:{session_id or client_ip}"

            allowed, retry_after = limiter.is_allowed(key, max_requests=rule_match, window_seconds=60)
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": f"Too many requests to sensitive endpoint '{path}'. Please retry after {retry_after} seconds.",
                            "retry_after_seconds": retry_after,
                        }
                    },
                    headers={"Retry-After": str(retry_after)},
                )

        return await call_next(request)
