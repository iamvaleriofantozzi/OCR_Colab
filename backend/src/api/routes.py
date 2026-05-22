import logging
import uuid
import hashlib
import shutil
import os
from pathlib import Path
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
from typing import Any

from src.config import settings
from src.jobs.store import JobStore, JobStatus
from src.utils.preprocessing import preprocess_image

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"}
MAX_FILE_SIZE = settings.max_file_size_mb * 1024 * 1024


class UrlUploadRequest(BaseModel):
    url: HttpUrl
    filename: str | None = None


class FolderCreate(BaseModel):
    name: str


class UpdateJobFolder(BaseModel):
    folder_id: str | None = None


class JobResponse(BaseModel):
    job_id: str
    status: str
    created_at: str
    file_hash: str | None = None
    result: dict[str, Any] | None = None
    error_msg: str | None = None
    filename: str | None = None
    folder_id: str | None = None


def _compute_file_hash(file_path: Path) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def _job_to_response(job: dict[str, Any]) -> JobResponse:
    filename = None
    if job.get("original_file_path"):
        filename = Path(job["original_file_path"]).name
    return JobResponse(
        job_id=job["id"],
        status=job["status"],
        created_at=job["created_at"],
        file_hash=job.get("file_hash"),
        result=job.get("result"),
        error_msg=job.get("error_msg"),
        filename=filename,
        folder_id=job.get("folder_id"),
    )


async def _download_url(url: str, dest_path: Path, max_size: int) -> str:
    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        # HEAD request validation
        try:
            head_resp = await client.head(url)
            head_resp.raise_for_status()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=400, detail=f"URL validation failed: {e}")

        content_length = head_resp.headers.get("content-length")
        if content_length and int(content_length) > max_size:
            raise HTTPException(status_code=413, detail=f"Remote file too large")

        content_type = head_resp.headers.get("content-type", "").split(";")[0].strip()
        if content_type and content_type not in ALLOWED_MIME_TYPES:
            logger.warning(f"Content-Type {content_type} not in allowed list, proceeding anyway")

        # Streamed download
        total_size = 0
        async with client.stream("GET", url) as response:
            response.raise_for_status()
            with open(dest_path, "wb") as f:
                async for chunk in response.aiter_bytes(chunk_size=8192):
                    total_size += len(chunk)
                    if total_size > max_size:
                        os.remove(dest_path)
                        raise HTTPException(status_code=413, detail=f"Remote file exceeds max size")
                    f.write(chunk)

    return content_type


@router.post("/ocr/upload", response_model=JobResponse)
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
):
    store: JobStore = request.app.state.job_store

    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}. Allowed: {', '.join(ALLOWED_MIME_TYPES)}"
        )

    job_id = str(uuid.uuid4())
    upload_dir = Path(settings.uploads_dir) / job_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / (file.filename or "upload")

    total_size = 0
    with open(file_path, "wb") as buffer:
        while True:
            chunk = await file.read(8192)
            if not chunk:
                break
            total_size += len(chunk)
            if total_size > MAX_FILE_SIZE:
                shutil.rmtree(upload_dir, ignore_errors=True)
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Max size: {settings.max_file_size_mb}MB"
                )
            buffer.write(chunk)

    # Preprocess image (skip for PDFs — handled in T4.2)
    preprocessed_path = upload_dir / "preprocessed.png"
    if content_type.startswith("image/"):
        preprocess_image(file_path, preprocessed_path)
        processing_path = preprocessed_path
    else:
        processing_path = file_path

    file_hash = _compute_file_hash(processing_path)

    cached_job = await store.find_job_by_hash(file_hash)
    if cached_job:
        shutil.rmtree(upload_dir, ignore_errors=True)
        return _job_to_response(cached_job)

    job = await store.create_job(
        job_id=job_id,
        file_hash=file_hash,
        file_path=str(processing_path),
        original_file_path=str(file_path),
    )

    return _job_to_response(job)


@router.post("/ocr/url", response_model=JobResponse)
async def upload_url(
    request: Request,
    payload: UrlUploadRequest,
):
    store: JobStore = request.app.state.job_store

    url_str = str(payload.url)
    if not url_str.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL must use http or https scheme")

    job_id = str(uuid.uuid4())
    upload_dir = Path(settings.uploads_dir) / job_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = payload.filename or Path(url_str).name or "download"
    file_path = upload_dir / filename

    try:
        content_type = await _download_url(url_str, file_path, MAX_FILE_SIZE)
    except HTTPException:
        shutil.rmtree(upload_dir, ignore_errors=True)
        raise

    # Preprocess image (skip for PDFs — handled in T4.2)
    preprocessed_path = upload_dir / "preprocessed.png"
    if content_type.startswith("image/"):
        preprocess_image(file_path, preprocessed_path)
        processing_path = preprocessed_path
    else:
        processing_path = file_path

    file_hash = _compute_file_hash(processing_path)

    cached_job = await store.find_job_by_hash(file_hash)
    if cached_job:
        shutil.rmtree(upload_dir, ignore_errors=True)
        return _job_to_response(cached_job)

    job = await store.create_job(
        job_id=job_id,
        file_hash=file_hash,
        file_path=str(processing_path),
        original_file_path=str(file_path),
    )

    return _job_to_response(job)


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(
    request: Request,
    job_id: str,
):
    store: JobStore = request.app.state.job_store
    job = await store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    headers = {}
    if job["status"] == JobStatus.PROCESSING.value:
        headers["Retry-After"] = "2"

    return _job_to_response(job)


@router.get("/jobs", response_model=list[JobResponse])
async def list_jobs(
    request: Request,
    limit: int = 100,
    folder_id: str | None = None,
):
    store: JobStore = request.app.state.job_store
    jobs = await store.list_jobs(limit=limit, folder_id=folder_id)
    return [_job_to_response(j) for j in jobs]


@router.get("/jobs/{job_id}/file")
async def get_job_file(
    request: Request,
    job_id: str,
):
    store: JobStore = request.app.state.job_store
    job = await store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    file_path = job.get("original_file_path") or job.get("file_path")
    if not file_path:
        raise HTTPException(status_code=404, detail="File not found for this job")

    path = Path(file_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File no longer on disk")

    media_type = "application/octet-stream"
    suffix = path.suffix.lower()
    if suffix in (".pdf",):
        media_type = "application/pdf"
    elif suffix in (".png",):
        media_type = "image/png"
    elif suffix in (".jpg", ".jpeg"):
        media_type = "image/jpeg"
    elif suffix in (".webp",):
        media_type = "image/webp"
    elif suffix in (".gif",):
        media_type = "image/gif"

    return FileResponse(
        path=str(path),
        media_type=media_type,
        filename=path.name,
    )


@router.delete("/jobs/{job_id}")
async def delete_job(
    request: Request,
    job_id: str,
):
    store: JobStore = request.app.state.job_store
    job = await store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Delete associated files
    for key in ("original_file_path", "file_path"):
        fp = job.get(key)
        if fp:
            path = Path(fp)
            if path.exists():
                shutil.rmtree(path.parent, ignore_errors=True) if path.parent.name == job_id else path.unlink(missing_ok=True)

    deleted = await store.delete_job(job_id)
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete job")
    return {"deleted": True}


@router.put("/jobs/{job_id}/folder", response_model=JobResponse)
async def update_job_folder(
    request: Request,
    job_id: str,
    payload: UpdateJobFolder,
):
    store: JobStore = request.app.state.job_store
    job = await store.update_job_folder(job_id, payload.folder_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_to_response(job)


@router.get("/folders")
async def list_folders(request: Request):
    store: JobStore = request.app.state.job_store
    folders = await store.list_folders()
    return folders


@router.post("/folders")
async def create_folder(request: Request, payload: FolderCreate):
    store: JobStore = request.app.state.job_store
    folder = await store.create_folder(payload.name)
    return folder


@router.delete("/folders/{folder_id}")
async def delete_folder(request: Request, folder_id: str):
    store: JobStore = request.app.state.job_store
    deleted = await store.delete_folder(folder_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Folder not found")
    return {"deleted": True}


@router.get("/metrics")
async def get_metrics(request: Request):
    store: JobStore = request.app.state.job_store
    worker = request.app.state.job_worker

    jobs = await store.list_jobs(limit=1000)
    pending = sum(1 for j in jobs if j["status"] == JobStatus.PENDING.value)
    processing = sum(1 for j in jobs if j["status"] == JobStatus.PROCESSING.value)

    import psutil
    mem = psutil.virtual_memory()

    return {
        "queue_depth": pending,
        "active_jobs": processing,
        "avg_inference_ms": round(worker.get_avg_inference_ms(), 2),
        "system_memory_percent": mem.percent,
    }
