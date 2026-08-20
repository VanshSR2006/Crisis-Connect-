import redis
from ..core.config import settings

class RedisStub:
    """
    A simple in-memory mock Redis client used for local development fallbacks.
    """
    def __init__(self):
        self._data = {}

    def get(self, key: str):
        return self._data.get(key)

    def set(self, key: str, value: str, ex: int = None):
        self._data[key] = str(value)
        return True

    def delete(self, key: str):
        if key in self._data:
            del self._data[key]
            return 1
        return 0

    def ping(self):
        return True

class RedisClientManager:
    """
    Manages the application's connection to Redis.
    Guarantees that a Redis failure in production environment fails fast.
    """
    def __init__(self):
        self.client = None
        self.is_stub = False

    def connect(self):
        if not settings.REDIS_URL:
            if settings.ENVIRONMENT == "production":
                raise ValueError("REDIS_URL must be specified in production environment.")
            else:
                print("WARNING: REDIS_URL not configured. Using local Redis stub in-memory.")
                self.client = RedisStub()
                self.is_stub = True
                return

        try:
            self.client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            self.client.ping()
        except Exception as e:
            if settings.ENVIRONMENT == "production":
                print(f"CRITICAL: Failed to connect to Redis at {settings.REDIS_URL} in production!")
                raise e
            else:
                print(f"WARNING: Failed to connect to Redis. Falling back to local Redis stub. Error: {e}")
                self.client = RedisStub()
                self.is_stub = True

    def get(self, key: str):
        if not self.client:
            self.connect()
        return self.client.get(key)

    def set(self, key: str, value: str, ex: int = None):
        if not self.client:
            self.connect()
        return self.client.set(key, value, ex=ex)

    def delete(self, key: str):
        if not self.client:
            self.connect()
        return self.client.delete(key)

    def ping(self) -> bool:
        if not self.client:
            self.connect()
        return self.client.ping()

redis_client = RedisClientManager()
