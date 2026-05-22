# GLM-OCR Web Interface

A robust, high-performance WebApp + API for GLM-OCR document OCR on Apple Silicon.

## Quick Start

Requires: macOS 14+, Apple Silicon M-series, Python 3.12+, Node.js 20+.

```bash
# 1. Setup environments (already done in this repo)
# 2. Start entire stack
./scripts/start.sh
```

Open:
- Frontend: http://localhost:8000
- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## API

The backend exposes a REST API. Import the Postman collection:

```bash
# docs/GLM-OCR-API.postman_collection.json
```

Or use `curl`:

```bash
# Upload a file
curl -X POST http://localhost:8000/api/v1/ocr/upload \
  -F "file=@/path/to/document.pdf"

# Check job status
curl http://localhost:8000/api/v1/jobs/<job_id>

# List all jobs
curl "http://localhost:8000/api/v1/jobs?limit=100"

# System metrics
curl http://localhost:8000/api/v1/metrics
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/ocr/upload` | Upload file (multipart/form-data) |
| `POST` | `/api/v1/ocr/url` | Upload from URL (JSON) |
| `GET` | `/api/v1/jobs/{job_id}` | Get job status & result |
| `GET` | `/api/v1/jobs` | List jobs |
| `GET` | `/api/v1/metrics` | System metrics |

## Architecture

- `backend/` — FastAPI + SQLite job queue + SHA cache + GLM-OCR via transformers
- `frontend/` — React + Vite + Tailwind CSS v4 + Nothing Design System
- `scripts/` — Startup and test scripts
- `docs/` — API, architecture, design, performance docs

## OCR Backends

The backend supports pluggable OCR backends via the `OCR_BACKEND` env var:

| Backend | Description | Status |
|---------|-------------|--------|
| `sdk_pipeline` (default) | Full official GLM-OCR pipeline: layout detection (PP-DocLayoutV3) + region OCR with task-specific prompts | ✅ Working, recommended |
| `transformers_direct` | Loads `zai-org/GLM-OCR` directly via transformers (MPS/CPU), no layout detection | ✅ Working |
| `mlx_direct` | Calls `mlx-vlm` microservice (deprecated — mlx-vlm has compatibility issues with GLM-OCR) | ⚠️ Broken |
| `sdk` | Uses official GLM-OCR SDK with external vLLM/SGLang server | ⚠️ Requires setup |

Set via env var:
```bash
OCR_BACKEND=sdk_pipeline ./scripts/start.sh
```

### `sdk_pipeline` (Recommended)

This backend implements the official GLM-OCR pipeline:
1. **Page Loading** — PDFs are rasterized to images (via `pymupdf`)
2. **Layout Detection** — `PP-DocLayoutV3` detects regions (text, tables, formulas, etc.)
3. **Region Cropping** — Each detected region is cropped from the original image
4. **Task-Specific OCR** — Each region is processed with the appropriate prompt:
   - `"Text Recognition:"` for text blocks
   - `"Table Recognition:"` for tables (outputs HTML)
   - `"Formula Recognition:"` for formulas (outputs LaTeX)
5. **Markdown Reconstruction** — Results are assembled into structured Markdown

This is the most accurate backend for complex documents with tables, mixed layouts, and multi-column text.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 8000 in use | Kill existing uvicorn or change `PORT` |
| Out of memory | Reduce `MAX_IMAGE_DIMENSION` or close other apps |
| First request slow | Model loading on first inference is normal (~5-10s) |
| Cached bad result | Delete `backend/jobs.db` to clear SQLite cache |

## Testing

```bash
./scripts/test.sh
```

## Documentation

- `docs/ARCHITECTURE.md` — System design & data flow
- `docs/API.md` — REST API reference
- `docs/PERFORMANCE.md` — Concurrency limits & tuning
- `docs/DESIGN.md` — Nothing Design System tokens
- `docs/GLM-OCR-API.postman_collection.json` — Postman collection
