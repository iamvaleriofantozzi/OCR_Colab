from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

logger = logging.getLogger(__name__)


class OCRProcessingError(Exception):
    def __init__(self, detail: str, job_id: str | None = None):
        self.detail = detail
        self.job_id = job_id


class MLXConnectionError(Exception):
    def __init__(self, detail: str):
        self.detail = detail


def register_exception_handlers(app):
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.warning(f"Validation error: {exc.errors()}")
        return JSONResponse(
            status_code=422,
            content={
                "detail": "Validation error",
                "error_code": "VALIDATION_ERROR",
                "errors": exc.errors(),
            },
        )

    @app.exception_handler(OCRProcessingError)
    async def ocr_processing_exception_handler(request: Request, exc: OCRProcessingError):
        logger.error(f"OCR processing error: {exc.detail}")
        return JSONResponse(
            status_code=422,
            content={
                "detail": exc.detail,
                "error_code": "OCR_PROCESSING_ERROR",
                "job_id": exc.job_id,
            },
        )

    @app.exception_handler(MLXConnectionError)
    async def mlx_connection_exception_handler(request: Request, exc: MLXConnectionError):
        logger.error(f"MLX connection error: {exc.detail}")
        return JSONResponse(
            status_code=503,
            content={
                "detail": exc.detail,
                "error_code": "MLX_CONNECTION_ERROR",
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception")
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "error_code": "INTERNAL_ERROR",
            },
        )
