import time
from typing import Optional, Any
import redis
from ..core.config import settings

class RedisStub:
    """
    A simple in-memory mock Redis client used for local development fallbacks.
    Supports basic get, set, incr, expire, and delete with TTL.
    """
    def __init__(self):
        self._data = {}
        self._expires = {}

    def _cleanup(self, key: str):
        if key in self._expires and time.time() > self._expires[key]:
            self._data.pop(key, None)
            self._expires.pop(key, None)

    def get(self, key: str):
        self._cleanup(key)
        return self._data.get(key)

    def set(self, key: str, value: str, ex: Optional[int] = None):
        self._data[key] = str(value)
        if ex is not None:
            self._expires[key] = time.time() + ex
        else:
            self._expires.pop(key, None)
        return True

    def incr(self, key: str) -> int:
        self._cleanup(key)
        val = int(self._data.get(key, 0)) + 1
        self._data[key] = str(val)
        return val

    def expire(self, key: str, seconds: int) -> bool:
        if key in self._data:
            self._expires[key] = time.time() + seconds
            return True
        return False

    def delete(self, key: str):
        self._data.pop(key, None)
        self._expires.pop(key, None)
        return 1

    def ping(self):
        return True

class RedisClientManager:
    """
    Manages the application's connection to Redis.
    Guarantees that a Redis failure in production environment fails fast.
    """
    def __init__(self):
        self.client: Any = None
        self.is_stub = False

    def connect(self):
        if not settings.REDIS_URL:
            if settings.ENVIRONMENT == "production":
                raise ValueError("REDIS_URL must be specified in production environment.")
            else:
                self.client = RedisStub()
                self.is_stub = True
                return

        try:
            self.client = redis.from_url(
                settings.REDIS_URL, 
                decode_responses=True, 
                socket_timeout=1.0, 
                socket_connect_timeout=1.0
            )
            self.client.ping()
        except Exception as e:
            if settings.ENVIRONMENT == "production":
                print(f"CRITICAL: Failed to connect to Redis at {settings.REDIS_URL} in production!")
                raise e
            else:
                self.client = RedisStub()
                self.is_stub = True

    def get(self, key: str):
        if not self.client:
            self.connect()
        return self.client.get(key)

    def set(self, key: str, value: str, ex: Optional[int] = None):
        if not self.client:
            self.connect()
        return self.client.set(key, value, ex=ex)

    def incr(self, key: str) -> int:
        if not self.client:
            self.connect()
        return self.client.incr(key)

    def expire(self, key: str, seconds: int) -> bool:
        if not self.client:
            self.connect()
        return bool(self.client.expire(key, seconds))

    def delete(self, key: str):
        if not self.client:
            self.connect()
        return self.client.delete(key)

    def ping(self) -> bool:
        if not self.client:
            self.connect()
        return self.client.ping()

redis_client = RedisClientManager()
