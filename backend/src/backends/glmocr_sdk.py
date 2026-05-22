import logging
from pathlib import Path

from glmocr import parse

from src.backends.base import OcrBackend, OcrResult
from src.config import settings

logger = logging.getLogger(__name__)


class GlmOcrSdkBackend(OcrBackend):
    def __init__(self, config_path: str | None = None):
        self.config_path = config_path or settings.ocr_config_path

    def parse(self, file_path: Path) -> OcrResult:
        logger.info(f"Parsing file with GLM-OCR SDK: {file_path}")
        result = parse(
            str(file_path),
            config_path=self.config_path,
            mode="selfhosted",
            layout_device="cpu",
            no_save=True,
            stdout=True,
        )
        # result from glmocr parse with stdout=True returns the result object
        markdown = getattr(result, "markdown_result", "") or str(result)
        json_result = getattr(result, "json_result", {}) or {}
        return OcrResult(markdown=markdown, json_result=json_result)

    def health_check(self) -> dict:
        return {
            "backend": "glmocr_sdk",
            "config_path": self.config_path,
            "status": "ok",
        }
