import logging
import re
from pathlib import Path
import httpx

from src.backends.base import OcrBackend, OcrResult

logger = logging.getLogger(__name__)

MLX_VLM_DIRECT_URL = "http://localhost:8081/infer"

# Tokens that may leak from the model output and should be stripped
_SPECIAL_TOKENS = [
    r"<\|begin_of_image\|>",
    r"<\|end_of_image\|>",
    r"<\|endoftext\|>",
    r"<\|im_start\|>",
    r"<\|im_end\|>",
    r"<\|user\|>",
    r"<\|assistant\|>",
]
_SPECIAL_TOKEN_RE = re.compile("|".join(_SPECIAL_TOKENS))


def _sanitize_output(text: str) -> str:
    """Remove special tokens and normalize whitespace."""
    text = _SPECIAL_TOKEN_RE.sub("", text)
    # Remove empty markdown code blocks
    text = re.sub(r"```markdown\s*```", "", text)
    text = re.sub(r"```\s*```", "", text)
    # Collapse multiple blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


class MlxVlmDirectBackend(OcrBackend):
    """Backend that calls the mlx-vlm direct inference microservice."""

    def __init__(self, api_url: str | None = None):
        self.api_url = api_url or MLX_VLM_DIRECT_URL

    def parse(self, file_path: Path) -> OcrResult:
        logger.info(f"Parsing file with mlx-vlm direct: {file_path}")
        response = httpx.post(
            self.api_url,
            json={
                "file_path": str(file_path),
                "prompt": "Text Recognition:",
                "max_tokens": 4096,
            },
            timeout=120.0,
        )
        response.raise_for_status()
        data = response.json()
        raw_text = data.get("text", "")
        text = _sanitize_output(raw_text)
        logger.info(
            "mlx-vlm-direct raw_len=%d sanitized_len=%d tokens=%s",
            len(raw_text),
            len(text),
            data.get("generation_tokens"),
        )
        if not text:
            logger.warning("mlx-vlm-direct returned empty text after sanitization")
        return OcrResult(markdown=text, json_result=data)

    def health_check(self) -> dict:
        return {
            "backend": "mlx_vlm_direct",
            "api_url": self.api_url,
            "status": "ok",
        }
