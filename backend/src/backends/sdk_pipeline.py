import logging
import re
from pathlib import Path
from typing import List

import torch
from PIL import Image

from glmocr.config import GlmOcrConfig
from glmocr.dataloader import PageLoader
from glmocr.layout.layout_detector import PPDocLayoutDetector

from src.backends.base import OcrBackend, OcrResult

logger = logging.getLogger(__name__)

_TASK_PROMPTS = {
    "text": "Text Recognition:",
    "table": "Table Recognition:",
    "formula": "Formula Recognition:",
}

# Regex per pulire l'output del modello
_IMAGE_TOKEN = "<|image|>"
_SPECIAL_TOKENS_RE = re.compile(
    r"<\|begin_of_image\|>|<\|end_of_image\|>|<\|endoftext\|>"
)


class _LayoutDetectorSingleton:
    """Lazy-loaded singleton for the layout detector."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._detector = None
        return cls._instance

    def load(self) -> PPDocLayoutDetector:
        if self._detector is not None:
            return self._detector

        logger.info("Loading layout detector (PP-DocLayoutV3)...")
        cfg = GlmOcrConfig.from_env()
        detector = PPDocLayoutDetector(cfg.pipeline.layout)
        detector.start()
        logger.info(f"Layout detector loaded on {detector._device}")
        self._detector = detector
        return detector


class _OcrModelSingleton:
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

        from transformers import AutoProcessor, GlmOcrForConditionalGeneration

        logger.info("Loading GLM-OCR model for pipeline...")
        model_id = "zai-org/GLM-OCR"
        processor = AutoProcessor.from_pretrained(
            model_id, trust_remote_code=True
        )

        if torch.cuda.is_available():
            device = "cuda"
            dtype = torch.float16
        elif torch.backends.mps.is_available():
            device = "mps"
            dtype = torch.bfloat16
        else:
            device = "cpu"
            dtype = torch.float32

        model = GlmOcrForConditionalGeneration.from_pretrained(
            model_id,
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
    """Remove leaked image tokens and normalize whitespace."""
    text = text.replace(_IMAGE_TOKEN, "")
    text = _SPECIAL_TOKENS_RE.sub("", text)
    text = re.sub(r"```markdown\s*```", "", text)
    text = re.sub(r"```\s*```", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _strip_task_prompt(text: str) -> str:
    """Remove task prompt prefix that the model echoes in the output."""
    for prompt in _TASK_PROMPTS.values():
        # Match prompt at start, optionally followed by newline
        pattern = re.escape(prompt) + r"\n?"
        text = re.sub(r"^" + pattern, "", text)
    return text.strip()


class SdkPipelineBackend(OcrBackend):
    """
    Backend that implements the official GLM-OCR pipeline:
    1. Load document (PDF/image) into pages
    2. Detect layout regions with PP-DocLayoutV3
    3. Crop each region
    4. OCR each region with GLM-OCR using task-specific prompt
    5. Reconstruct Markdown
    """

    def __init__(self):
        self._layout = _LayoutDetectorSingleton().load()
        self._processor, self._model = _OcrModelSingleton().load()
        self._page_loader = PageLoader(GlmOcrConfig.from_env().pipeline.page_loader)

    def _ocr_region(self, image: Image.Image, task_type: str) -> str:
        """Run OCR on a single cropped region."""
        prompt_text = _TASK_PROMPTS.get(task_type, "Text Recognition:")

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": prompt_text},
                ],
            }
        ]

        prompt = self._processor.apply_chat_template(
            messages, add_generation_prompt=True
        )
        inputs = self._processor(images=image, text=prompt, return_tensors="pt")
        device = next(self._model.parameters()).device
        inputs = {
            k: v.to(device) if isinstance(v, torch.Tensor) else v
            for k, v in inputs.items()
        }

        with torch.no_grad():
            outputs = self._model.generate(**inputs, max_new_tokens=4096, do_sample=False)

        raw_text = self._processor.batch_decode(outputs, skip_special_tokens=True)[0]
        text = _strip_image_tokens(raw_text)
        text = _strip_task_prompt(text)
        return text

    def parse(self, file_path: Path) -> OcrResult:
        logger.info(f"Parsing file with SDK pipeline: {file_path}")

        # 1. Load pages
        pages = self._page_loader.load_pages(str(file_path))
        logger.info(f"Loaded {len(pages)} page(s)")

        # 2. Layout detection
        layout_results, _ = self._layout.process(pages)
        logger.info(
            f"Layout detection: {[len(r) for r in layout_results]} region(s) per page"
        )

        # 3. OCR per region
        page_markdowns: List[str] = []
        for page_idx, (page_image, regions) in enumerate(zip(pages, layout_results)):
            logger.info(f"Processing page {page_idx + 1} with {len(regions)} region(s)")
            region_texts = []

            for region in regions:
                bbox = region["bbox_2d"]  # normalized 0-1000
                task_type = region["task_type"]
                label = region["label"]

                # Convert normalized bbox to absolute pixels
                w, h = page_image.size
                x1 = int(bbox[0] / 1000 * w)
                y1 = int(bbox[1] / 1000 * h)
                x2 = int(bbox[2] / 1000 * w)
                y2 = int(bbox[3] / 1000 * h)

                # Clamp
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w, x2), min(h, y2)

                if x2 <= x1 or y2 <= y1:
                    logger.warning(f"Skipping invalid bbox: {bbox}")
                    continue

                crop = page_image.crop((x1, y1, x2, y2))
                logger.info(
                    f"  Region {region['index']} ({label}, {task_type}): "
                    f"crop size {crop.size}"
                )

                text = self._ocr_region(crop, task_type)
                logger.info(f"    → {len(text)} chars extracted")

                if text:
                    region_texts.append(text)

            page_md = "\n\n".join(region_texts)
            if len(pages) > 1:
                page_markdowns.append(f"--- Page {page_idx + 1} ---\n{page_md}")
            else:
                page_markdowns.append(page_md)

        full_markdown = "\n\n".join(page_markdowns)
        return OcrResult(markdown=full_markdown, json_result={})

    def health_check(self) -> dict:
        try:
            self._layout.load()
            self._ocr_model.load()
            return {"backend": "sdk_pipeline", "status": "ok"}
        except Exception as e:
            return {"backend": "sdk_pipeline", "status": "error", "error": str(e)}
