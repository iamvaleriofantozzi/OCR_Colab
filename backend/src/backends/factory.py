from src.backends.base import OcrBackend
from src.backends.glmocr_sdk import GlmOcrSdkBackend
from src.backends.mlx_vlm_direct import MlxVlmDirectBackend
from src.backends.transformers_direct import TransformersDirectBackend
from src.backends.sdk_pipeline import SdkPipelineBackend
from src.config import settings


def get_ocr_backend() -> OcrBackend:
    backend_name = settings.ocr_backend.lower()
    if backend_name == "mlx_direct":
        return MlxVlmDirectBackend()
    if backend_name == "sdk":
        return GlmOcrSdkBackend()
    if backend_name == "transformers_direct":
        return TransformersDirectBackend()
    if backend_name == "sdk_pipeline":
        return SdkPipelineBackend()
    raise ValueError(f"Unknown OCR backend: {backend_name}")
