# API Reference

> Postman collection: `docs/GLM-OCR-API.postman_collection.json`

## Base URL

- Development: `http://localhost:8000`
- API prefix: `/api/v1`

## Endpoints

### `POST /api/v1/ocr/upload`

Upload a file (image or PDF) for OCR processing.

**Request**: `multipart/form-data`
- `file` (required): Image or PDF file

**Response**:
```json
{
  "job_id": "uuid",
  "status": "pending",
  "created_at": "2026-04-29T20:00:00+00:00",
  "file_hash": "sha256..."
}
```

### `POST /api/v1/ocr/url`

Submit a public URL for OCR processing.

**Request**: `application/json`
```json
{
  "url": "https://example.com/image.png",
  "filename": "optional.pdf"
}
```

**Response**: Same as upload.

### `GET /api/v1/jobs/{job_id}`

Get job status and result.

**Response**:
```json
{
  "job_id": "uuid",
  "status": "completed",
  "created_at": "...",
  "file_hash": "sha256...",
  "result": {
    "markdown": "# Extracted text..."
  },
  "error_msg": null
}
```

**Headers when processing**:
- `Retry-After: 2`

### `GET /api/v1/jobs`

List recent jobs.

**Query params**:
- `limit` (default 100)

### `GET /api/v1/metrics`

System metrics.

**Response**:
```json
{
  "queue_depth": 0,
  "active_jobs": 0,
  "avg_inference_ms": 1234.5,
  "system_memory_percent": 45.2
}
```

### `GET /health`

Health check.

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "mlx_vlm_host": "localhost",
  "mlx_vlm_port": 8080
}
```

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| VALIDATION_ERROR | 422 | Missing or invalid field |
| OCR_PROCESSING_ERROR | 422 | SDK failure |
| MLX_CONNECTION_ERROR | 503 | MLX-VLM server unreachable |
| INTERNAL_ERROR | 500 | Unexpected error |
