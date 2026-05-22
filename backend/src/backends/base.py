from typing import Protocol, runtime_checkable
from pathlib import Path


class OcrResult:
    def __init__(self, markdown: str, json_result: dict | None = None):
        self.markdown = markdown
        self.json_result = json_result or {}


@runtime_checkable
class OcrBackend(Protocol):
    def parse(self, file_path: Path) -> OcrResult:
        ...

    def health_check(self) -> dict:
        ...
