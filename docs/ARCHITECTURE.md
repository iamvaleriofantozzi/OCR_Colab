# Architecture

## Overview

GLM-OCR Web Interface is a monorepo with two runtime processes:

1. **FastAPI Backend** — Orchestrates uploads, job queue, caching, OCR inference, and metrics on port 8000.
2. **React Frontend** — Vite-built SPA served by FastAPI in production.

## Data Flow

```
User -> Frontend -> FastAPI
                         |
       +-----------------+------------------+
       |                                    |
  Upload/File/URL                    Job Queue (SQLite)
       |                                    |
  Preprocess/Cache                         |
       |                                    |
  OCRBackend.parse() <---------------------
       |
  GLM-OCR Model (transformers / MPS / CPU)
```

## Environment Design

- **`.venv-sdk`** — Full environment with FastAPI, GLM-OCR via transformers, and all backend deps.

The previous dual-environment design (`.venv-mlx` + `.venv-sdk`) was abandoned because `mlx-vlm` has compatibility issues with the `mlx-community/GLM-OCR-bf16` model (returns empty output). The current default backend loads `zai-org/GLM-OCR` directly via `transformers` and runs on Apple Silicon MPS or CPU.

## Pluggable OCR Backends

The backend uses an `OcrBackend` Protocol. Available implementations:

- **`SdkPipelineBackend`** (default) — Full official GLM-OCR pipeline: `PP-DocLayoutV3` layout detection + region cropping + task-specific OCR with `transformers`. Runs on Apple Silicon MPS (OCR) and CPU (layout). No external server required.
- **`TransformersDirectBackend`** — Loads `zai-org/GLM-OCR` via `transformers` directly on MPS/CPU. No layout detection; passes entire page/image to model. Faster but less accurate for complex layouts.
- **`MlxVlmDirectBackend`** — Calls a local `mlx-vlm` microservice. Deprecated due to model output issues.
- **`GlmOcrSdkBackend`** — Wraps the official `glmocr` SDK. Requires external vLLM/SGLang server.

## Job Queue

- SQLite-backed (`aiosqlite`) for persistence across restarts.
- Single-worker `ThreadPoolExecutor(max_workers=1)` for inference.
- PDFs are rasterized to images (one job per page processed sequentially).

## Cache

- SHA-256 content-addressable cache.
- Preprocessing (resize, RGB, EXIF strip) happens before hashing.
- Duplicate files return the existing job instantly.

## File Lifecycle

- Uploads stored in `backend/uploads/{job_id}/`.
- Periodic cleanup removes files older than 24h and jobs older than 7d.
