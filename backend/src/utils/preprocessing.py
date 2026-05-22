import logging
from pathlib import Path
from PIL import Image, ExifTags

from src.config import settings

logger = logging.getLogger(__name__)


def preprocess_image(input_path: Path, output_path: Path) -> Path:
    """
    Preprocess image for OCR:
    - Resize if longest side > MAX_IMAGE_DIMENSION
    - Convert to RGB
    - Strip EXIF metadata
    - Save as optimized PNG
    """
    try:
        with Image.open(input_path) as img:
            # Handle orientation from EXIF
            try:
                exif = img._getexif()
                if exif:
                    orientation_tag = next(
                        (tag for tag, label in ExifTags.TAGS.items() if label == "Orientation"),
                        None,
                    )
                    if orientation_tag and orientation_tag in exif:
                        orientation = exif[orientation_tag]
                        if orientation == 3:
                            img = img.rotate(180, expand=True)
                        elif orientation == 6:
                            img = img.rotate(270, expand=True)
                        elif orientation == 8:
                            img = img.rotate(90, expand=True)
            except Exception:
                pass

            # Convert to RGB
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            elif img.mode != "RGB":
                img = img.convert("RGB")

            # Resize if needed
            max_dim = settings.max_image_dimension
            width, height = img.size
            if max(width, height) > max_dim:
                ratio = max_dim / max(width, height)
                new_size = (int(width * ratio), int(height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
                logger.info(f"Resized image from {width}x{height} to {new_size[0]}x{new_size[1]}")

            # Save as optimized PNG
            output_path.parent.mkdir(parents=True, exist_ok=True)
            img.save(output_path, format="PNG", optimize=True)
            logger.info(f"Preprocessed image saved to {output_path}")
            return output_path
    except Exception as e:
        logger.error(f"Preprocessing failed: {e}")
        # Fallback: copy original
        import shutil
        shutil.copy(input_path, output_path)
        return output_path
