import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from src.config import settings
from src.api.routes import router as api_router
from src.jobs.store import JobStore
from src.jobs.worker import JobWorker
from src.utils.logging import setup_logging
from src.utils.errors import register_exception_handlers
from src.utils.cleanup import cleanup_task

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()
    logger.info("Starting GLM-OCR API server")
    app.state.job_store = JobStore(settings.database_url)
    await app.state.job_store.init_db()
    await app.state.job_store.recover_orphaned_jobs()
    
    app.state.job_worker = JobWorker(app.state.job_store)
    app.state.job_worker.start()
    
    app.state.cleanup_task = asyncio.create_task(cleanup_task(app.state.job_store))
    
    logger.info("Database initialized and worker started")
    yield
    # Shutdown
    logger.info("Shutting down GLM-OCR API server")
    app.state.job_worker.stop()
    app.state.cleanup_task.cancel()
    try:
        await app.state.cleanup_task
    except asyncio.CancelledError:
        pass
    await app.state.job_store.close()


app = FastAPI(
    title="GLM-OCR API",
    description="Web API for GLM-OCR document OCR via MLX-VLM",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
register_exception_handlers(app)

# API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, Any]:
    return {
        "status": "healthy",
        "version": "1.0.0",
        "mlx_vlm_host": settings.mlx_vlm_host,
        "mlx_vlm_port": settings.mlx_vlm_port,
    }


# Serve static files from frontend/dist for production
import os
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.isdir(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # API routes are handled before this catch-all
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"detail": "Not found"}
