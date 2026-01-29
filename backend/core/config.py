from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_URL: str 

    class Config:
        env_file=".env"
        extra="allow"
settings = Settings()


SECRET_KEY="f82a9c5b7e1d44dfbfa8c4d39e51a67cbd43e9f2107bd9d2c8b6a4f7d12c3e9f"

ALGORITHM_TOKEN = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 100  # Ví dụ: 30 phút
REFRESH_TOKEN_EXPIRE_DAYS = 100