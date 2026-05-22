import logging
from pathlib import Path
from typing import List

from src.config import settings

logger = logging.getLogger(__name__)


def pdf_to_images(pdf_path: Path, output_dir: Path, dpi: int = 150) -> List[Path]:
    """Convert PDF pages to PNG images using pymupdf."""
    try:
        import fitz  # pymupdf
    except ImportError:
        logger.error("pymupdf not installed")
        raise RuntimeError("PDF processing requires pymupdf")

    output_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(str(pdf_path))
    paths: List[Path] = []

    for i in range(len(doc)):
        page = doc.load_page(i)
        pix = page.get_pixmap(dpi=dpi)
        img_path = output_dir / f"page_{i + 1}.png"
        pix.save(str(img_path))
        paths.append(img_path)
        logger.info(f"Rasterized page {i + 1} to {img_path}")

    doc.close()
    return paths
