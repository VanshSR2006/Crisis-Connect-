import os
from dotenv import load_dotenv

# Load env file from the backend folder if it exists
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_DB_FILE = os.path.join(BACKEND_DIR, "crisis_connect.db").replace("\\", "/")

class Settings:
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").lower()
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_FILE}")
    
    # Security
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "super-secret-temporary-key-change-in-prod")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION_MINUTES: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "1440")) # default 24 hours

    # CORS
    FRONTEND_ORIGINS: str = os.getenv("FRONTEND_ORIGINS", "")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "")

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "")

    # Sarvam AI
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
    SARVAM_MODEL: str = os.getenv("SARVAM_MODEL", "sarvam-105b-conversations")

    # Validate production environment requirements
    def validate(self):
        if self.ENVIRONMENT == "production":
            # Production database check
            if "sqlite" in self.DATABASE_URL:
                raise ValueError("Production mode cannot run on SQLite database. Please set DATABASE_URL to a PostgreSQL instance.")
            if self.DATABASE_URL == "sqlite:///./crisis_connect.db":
                raise ValueError("Production mode requires a valid non-default DATABASE_URL.")
            
            # Secret key check
            if self.JWT_SECRET_KEY == "super-secret-temporary-key-change-in-prod":
                raise ValueError("Production mode requires a secure JWT_SECRET_KEY environment variable.")
            
            # Redis URL check
            if not self.REDIS_URL:
                raise ValueError("Production mode requires a valid REDIS_URL environment variable.")

settings = Settings()
try:
    settings.validate()
except Exception as e:
    # Print warnings or raise during boot, we will validate inside main
    pass
