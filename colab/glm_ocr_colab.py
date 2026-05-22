"""
GLM-OCR Colab Standalone Module
=================================
OCR diretto da immagini e PDF in Google Colab, senza server web né UI.

Uso:
    from colab.glm_ocr_colab import ColabOCR, ocr
    text = ocr("/content/document.pdf", backend="transformers_direct")
    print(text)
"""

from __future__ import annotations

import logging
import re
import sys
from pathlib import Path
from typing import Union

# ── Logging ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
)
logger = logging.getLogger("glm_ocr_colab")

# ── Device detection ───────────────────────────────────────
def _get_device() -> str:
    import torch
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


# ── Transformers Direct Backend (self-contained) ──────────
_MODEL_ID = "zai-org/GLM-OCR"
_IMAGE_TOKEN = "<|image|>"


class _TransformersBackend:
    """Self-contained GLM-OCR via transformers (no project deps)."""

    def __init__(self):
        self._processor = None
        self._model = None
        self._device = _get_device()

    def _load(self):
        if self._processor is not None:
            return self._processor, self._model

        from transformers import AutoModelForImageTextToText, AutoProcessor

        logger.info(f"Loading GLM-OCR model ({_MODEL_ID}) on {self._device} ...")
        self._processor = AutoProcessor.from_pretrained(
            _MODEL_ID, trust_remote_code=True
        )

        if self._device == "cuda":
            dtype = "float16"
        elif self._device == "mps":
            dtype = "float16"
        else:
            dtype = "float32"

        self._model = AutoModelForImageTextToText.from_pretrained(
            _MODEL_ID,
            trust_remote_code=True,
            torch_dtype=dtype,
            device_map=self._device,
            low_cpu_mem_usage=True,
        )
        logger.info("Model ready.")
        return self._processor, self._model

    def ocr(self, image, prompt_text: str = "Text Recognition:") -> str:
        import torch
        processor, model = self._load()

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": prompt_text},
                ],
            }
        ]

        prompt = processor.apply_chat_template(
            messages, add_generation_prompt=True
        )
        inputs = processor(images=image, text=prompt, return_tensors="pt")
        inputs = {
            k: v.to(self._device) if isinstance(v, torch.Tensor) else v
            for k, v in inputs.items()
        }

        with torch.no_grad():
            outputs = model.generate(**inputs, max_new_tokens=4096, do_sample=False)

        raw_text = processor.batch_decode(outputs, skip_special_tokens=True)[0]
        text = raw_text.replace(_IMAGE_TOKEN, "")
        text = re.sub(r"\n{3,}", "\n\n", text).strip()
        return text


# ── SDK Pipeline Backend (needs project + glm-ocr-repo) ─────
class _SdkPipelineBackend:
    """Full pipeline: layout detection + task-specific OCR."""

    def __init__(self):
        # Ensure project paths are importable when repo is cloned in Colab
        _repo = Path(__file__).resolve().parent.parent
        for p in (
            _repo / "backend",
            _repo / "backend" / "glm-ocr-repo",
        ):
            if str(p) not in sys.path:
                sys.path.insert(0, str(p))

        from glmocr.config import GlmOcrConfig
        from glmocr.dataloader import PageLoader
        from glmocr.layout.layout_detector import PPDocLayoutDetector

        self._device = _get_device()
        logger.info(f"Initializing SDK pipeline (device={self._device}) …")

        cfg = GlmOcrConfig.from_env()
        # Force CUDA if available
        if self._device == "cuda":
            cfg.pipeline.layout.device = "cuda"
            cfg.pipeline.layout.cuda_visible_devices = "0"

        self._layout = PPDocLayoutDetector(cfg.pipeline.layout)
        self._layout.start()
        logger.info(f"Layout detector on {self._layout._device}")

        self._page_loader = PageLoader(cfg.pipeline.page_loader)
        self._ocr = _TransformersBackend()

    def ocr(self, file_path: Union[str, Path]) -> str:
        file_path = Path(file_path)
        pages = self._page_loader.load_pages(str(file_path))
        logger.info(f"Loaded {len(pages)} page(s)")

        layout_results, _ = self._layout.process(pages)
        logger.info(f"Regions per page: {[len(r) for r in layout_results]}")

        page_markdowns = []
        for page_idx, (page_image, regions) in enumerate(zip(pages, layout_results)):
            region_texts = []
            for region in regions:
                bbox = region["bbox_2d"]          # normalized 0-1000
                task_type = region["task_type"]
                w, h = page_image.size
                x1 = int(bbox[0] / 1000 * w)
                y1 = int(bbox[1] / 1000 * h)
                x2 = int(bbox[2] / 1000 * w)
                y2 = int(bbox[3] / 1000 * h)
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w, x2), min(h, y2)
                if x2 <= x1 or y2 <= y1:
                    continue
                crop = page_image.crop((x1, y1, x2, y2))
                prompt = _TASK_PROMPTS.get(task_type, "Text Recognition:")
                text = self._ocr.ocr(crop, prompt)
                text = _strip_task_prompt(text)
                if text:
                    region_texts.append(text)

            page_md = "\n\n".join(region_texts)
            if len(pages) > 1:
                page_markdowns.append(f"--- Page {page_idx + 1} ---\n{page_md}")
            else:
                page_markdowns.append(page_md)

        return "\n\n".join(page_markdowns)


_TASK_PROMPTS = {
    "text": "Text Recognition:",
    "table": "Table Recognition:",
    "formula": "Formula Recognition:",
}


def _strip_task_prompt(text: str) -> str:
    for prompt in _TASK_PROMPTS.values():
        text = re.sub(r"^" + re.escape(prompt) + r"\n?", "", text)
    return text.strip()


# ── Public API ────────────────────────────────────────────

class ColabOCR:
    """Entry-point per OCR in Colab.

    Args:
        backend: "transformers_direct" (veloce, semplice) oppure
                 "sdk_pipeline" (accurato, rileva tabelle/formule).
    """

    def __init__(self, backend: str = "transformers_direct"):
        if backend == "transformers_direct":
            self._be = _TransformersBackend()
        elif backend == "sdk_pipeline":
            self._be = _SdkPipelineBackend()
        else:
            raise ValueError(f"Backend sconosciuto: {backend}")
        self._name = backend

    def ocr_image(self, path: Union[str, Path]) -> str:
        """OCR su singola immagine."""
        from PIL import Image
        img = Image.open(path).convert("RGB")
        if self._name == "transformers_direct":
            return self._be.ocr(img)
        return self._be.ocr(path)

    def ocr_pdf(self, path: Union[str, Path]) -> str:
        """OCR su PDF (converte pagine in immagini)."""
        import fitz  # PyMuPDF
        from PIL import Image

        doc = fitz.open(path)
        texts = []
        for i, page in enumerate(doc):
            pix = page.get_pixmap(dpi=200)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            if self._name == "transformers_direct":
                text = self._be.ocr(img)
            else:
                # sdk_pipeline expects file path; save temp image
                tmp = Path(path).with_suffix(f".page_{i+1}.png")
                img.save(tmp)
                text = self._be.ocr(tmp)
                tmp.unlink(missing_ok=True)
            if len(doc) > 1:
                texts.append(f"--- Page {i + 1} ---\n{text}")
            else:
                texts.append(text)
        return "\n\n".join(texts)

    def ocr(self, path: Union[str, Path]) -> str:
        """Auto-detect file type e esegue OCR."""
        path = Path(path)
        suffix = path.suffix.lower()
        if suffix == ".pdf":
            return self.ocr_pdf(path)
        return self.ocr_image(path)


def ocr(path: Union[str, Path], backend: str = "transformers_direct") -> str:
    """Funzione one-shot per OCR rapido."""
    engine = ColabOCR(backend=backend)
    return engine.ocr(path)
