import logging
import re
import torch
from pathlib import Path
from PIL import Image
from transformers import AutoModelForImageTextToText, AutoProcessor

from src.backends.base import OcrBackend, OcrResult

logger = logging.getLogger(__name__)

MODEL_ID = "zai-org/GLM-OCR"
_IMAGE_TOKEN = "<|image|>"


class _ModelSingleton:
    """Lazy-loaded singleton for the GLM-OCR transformers model."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._processor = None
            cls._instance._model = None
        return cls._instance

    def load(self):
        if self._processor is not None and self._model is not None:
            return self._processor, self._model

        logger.info(f"Loading GLM-OCR model from {MODEL_ID}...")
        processor = AutoProcessor.from_pretrained(
            MODEL_ID, trust_remote_code=True
        )

        if torch.cuda.is_available():
            device = "cuda"
            dtype = torch.float16
        elif torch.backends.mps.is_available():
            device = "mps"
            dtype = torch.float16
        else:
            device = "cpu"
            dtype = torch.float32

        model = AutoModelForImageTextToText.from_pretrained(
            MODEL_ID,
            trust_remote_code=True,
            dtype=dtype,
            device_map=device,
            low_cpu_mem_usage=True,
        )
        logger.info(f"GLM-OCR model loaded on {device} with {dtype}")
        self._processor = processor
        self._model = model
        return processor, model


def _strip_image_tokens(text: str) -> str:
    """Remove leaked <|image|> tokens and normalize whitespace."""
    text = text.replace(_IMAGE_TOKEN, "")
    # Collapse multiple blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


class TransformersDirectBackend(OcrBackend):
    """Backend that loads zai-org/GLM-OCR directly via transformers."""

    def __init__(self):
        self._singleton = _ModelSingleton()

    def parse(self, file_path: Path) -> OcrResult:
        logger.info(f"Parsing file with transformers direct: {file_path}")
        processor, model = self._singleton.load()

        image = Image.open(file_path).convert("RGB")
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": "Text Recognition:"},
                ],
            }
        ]

        prompt = processor.apply_chat_template(
            messages, add_generation_prompt=True
        )
        inputs = processor(images=image, text=prompt, return_tensors="pt")
        # Ensure inputs are on the same device as the model
        device = next(model.parameters()).device
        inputs = {k: v.to(device) if isinstance(v, torch.Tensor) else v for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model.generate(**inputs, max_new_tokens=4096, do_sample=False)

        raw_text = processor.batch_decode(
            outputs, skip_special_tokens=True
        )[0]
        text = _strip_image_tokens(raw_text)

        logger.info(
            "Transformers direct raw_len=%d sanitized_len=%d",
            len(raw_text),
            len(text),
        )
        if not text:
            logger.warning("Transformers direct returned empty text")

        return OcrResult(markdown=text, json_result={"raw": raw_text})

    def health_check(self) -> dict:
        try:
            self._singleton.load()
            return {
                "backend": "transformers_direct",
                "model": MODEL_ID,
                "status": "ok",
            }
        except Exception as e:
            return {
                "backend": "transformers_direct",
                "model": MODEL_ID,
                "status": "error",
                "error": str(e),
            }
