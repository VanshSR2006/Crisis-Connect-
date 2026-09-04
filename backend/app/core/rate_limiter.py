from typing import Optional
from fastapi import Request, HTTPException, status
from .redis import redis_client
from .security import decode_access_token

class RateLimiter:
    """
    Reusable FastAPI rate-limiting dependency using RedisClientManager.
    Falls back gracefully to the in-memory RedisStub during development / tests.

    Client identification priority:
    1. Authenticated user ID (if Bearer token present and valid)
    2. Client IP address (X-Forwarded-For header or direct client host)
    """
    def __init__(self, times: int, seconds: int = 60, key_prefix: str = "rl"):
        self.times = times
        self.seconds = seconds
        self.key_prefix = key_prefix

    async def __call__(self, request: Request):
        client_id: Optional[str] = None

        # 1. Try to extract authenticated user from Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
            payload = decode_access_token(token)
            if payload and payload.get("sub"):
                client_id = f"user:{payload['sub']}"

        # 2. Otherwise fall back to IP address
        if not client_id:
            forwarded_for = request.headers.get("x-forwarded-for")
            if forwarded_for:
                client_id = f"ip:{forwarded_for.split(',')[0].strip()}"
            elif request.client and request.client.host:
                client_id = f"ip:{request.client.host}"
            else:
                client_id = "ip:unknown"

        key = f"rate_limit:{self.key_prefix}:{client_id}"

        try:
            count = redis_client.incr(key)
            if count == 1:
                redis_client.expire(key, self.seconds)

            if count > self.times:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many requests. Limit is {self.times} requests per {self.seconds} seconds."
                )
        except HTTPException:
            raise
        except Exception:
            # If Redis operations fail unexpectedly, do not block users unless strict mode is enabled
            pass
