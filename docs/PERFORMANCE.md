# Performance Tuning

## Concurrency

- **Inference worker**: `max_workers=1` (configurable via `MAX_CONCURRENT_JOBS`).
- **Rationale**: Apple Silicon uses unified memory. Parallel GPU jobs compete for memory bandwidth and often cause OOM. Single-worker sequential processing maximizes throughput for document OCR.

## Cache Strategy

- **SHA-256 content-addressable cache**: Duplicate files return instantly without GPU work.
- **Preprocessing**: Images >2048px are resized before hashing and inference, reducing memory pressure.

## Memory Expectations

- Model weights (`zai-org/GLM-OCR`, loaded via transformers in float16 on MPS): ~2 GB
- Peak memory during inference: ~4–6 GB depending on image resolution
- Recommended: 8 GB+ unified memory

## Observed Performance

With `SdkPipelineBackend` on Apple M4 Max (MPS bfloat16 for OCR, CPU for layout):
- Single image (test document): ~11s
- 3-page invoice PDF: ~120s total (~40s per page, includes layout detection + multiple regions)
- 1-page attendance summary PDF: ~90s (complex table with 28 rows)

With `TransformersDirectBackend` on Apple M4 Max (MPS, float16):
- Single image (test document): ~11s
- 3-page invoice PDF: ~74s total (~25s per page)
- 1-page attendance summary PDF: ~90s

## Backends Compared

| Backend | Speed | Accuracy | Setup Complexity | Status |
|---------|-------|----------|------------------|--------|
| `sdk_pipeline` (MPS+CPU) | Medium | **Excellent** | Low | ✅ **Default** |
| `transformers_direct` (MPS) | Medium | Good (no layout) | Low | ✅ Working |
| `mlx_direct` | Fast | Empty/broken | Medium | ❌ Broken (mlx-vlm bug) |
| `sdk` + vLLM | Fast | High | High | ⚠️ Requires server |

## Benchmarks

Run benchmarks with:

```bash
# 1 job at a time
python scripts/benchmark.py --pages 5 --concurrent 1

# 2 concurrent jobs (not recommended)
python scripts/benchmark.py --pages 5 --concurrent 2
```

Document results in this file.
