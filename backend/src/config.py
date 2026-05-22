from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # Server
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")

    # CORS
    cors_origins: list[str] = Field(default=["http://localhost:5173"], alias="CORS_ORIGINS")

    # MLX-VLM Server
    mlx_vlm_host: str = Field(default="localhost", alias="MLX_VLM_HOST")
    mlx_vlm_port: int = Field(default=8080, alias="MLX_VLM_PORT")

    # OCR Backend
    ocr_backend: str = Field(default="sdk_pipeline", alias="OCR_BACKEND")
    ocr_config_path: str = Field(default="backend/config.yaml", alias="OCR_CONFIG_PATH")

    # File Upload
    max_file_size_mb: int = Field(default=20, alias="MAX_FILE_SIZE_MB")
    max_image_dimension: int = Field(default=2048, alias="MAX_IMAGE_DIMENSION")
    uploads_dir: str = Field(default="backend/uploads", alias="UPLOADS_DIR")

    # Database
    database_url: str = Field(default="sqlite+aiosqlite:///backend/jobs.db", alias="DATABASE_URL")

    # Job Queue
    max_concurrent_jobs: int = Field(default=1, alias="MAX_CONCURRENT_JOBS")
    job_cleanup_hours: int = Field(default=24, alias="JOB_CLEANUP_HOURS")
    job_archive_days: int = Field(default=7, alias="JOB_ARCHIVE_DAYS")

    # Metrics
    metrics_window_size: int = Field(default=10, alias="METRICS_WINDOW_SIZE")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
