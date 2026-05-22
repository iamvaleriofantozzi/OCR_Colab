import asyncio
import logging
import json
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

from src.jobs.store import JobStore, JobStatus
from src.backends.factory import get_ocr_backend
from src.config import settings
from src.utils.preprocessing import preprocess_image
from src.utils.pdf import pdf_to_images

logger = logging.getLogger(__name__)


class JobWorker:
    def __init__(self, store: JobStore):
        self.store = store
        self.executor = ThreadPoolExecutor(max_workers=settings.max_concurrent_jobs)
        self._task: asyncio.Task | None = None
        self._running = False
        self._inference_times: list[float] = []

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._running = True
            self._task = asyncio.create_task(self._poll_loop())
            logger.info("Job worker started")

    def stop(self) -> None:
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
        self.executor.shutdown(wait=False)
        logger.info("Job worker stopped")

    async def _poll_loop(self) -> None:
        while self._running:
            try:
                job = await self._fetch_pending_job()
                if job:
                    await self._process_job(job)
                else:
                    await asyncio.sleep(1)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.exception("Worker poll loop error: %s", e)
                await asyncio.sleep(2)

    async def _fetch_pending_job(self) -> dict | None:
        jobs = await self.store.list_jobs(limit=100)
        for job in jobs:
            if job["status"] == JobStatus.PENDING.value:
                return job
        return None

    async def _process_job(self, job: dict) -> None:
        job_id = job["id"]
        file_path = job.get("file_path")

        if not file_path or not Path(file_path).exists():
            await self.store.update_job_status(
                job_id, JobStatus.FAILED, error_msg="File not found"
            )
            return

        await self.store.update_job_status(job_id, JobStatus.PROCESSING)
        logger.info(f"Processing job {job_id}: {file_path}")

        start_time = datetime.now(timezone.utc)
        try:
            backend = get_ocr_backend()
            path = Path(file_path)

            # Handle PDF: convert to images
            if path.suffix.lower() == ".pdf":
                images = await asyncio.to_thread(
                    pdf_to_images, path, path.parent / "pages"
                )
                markdown_parts = []
                for idx, img_path in enumerate(images, start=1):
                    preprocessed = img_path.parent / f"preprocessed_{idx}.png"
                    preprocess_image(img_path, preprocessed)
                    page_result = await asyncio.to_thread(backend.parse, preprocessed)
                    markdown_parts.append(f"--- Page {idx} ---\n{page_result.markdown}")
                full_markdown = "\n\n".join(markdown_parts)
            else:
                result = await asyncio.to_thread(backend.parse, path)
                full_markdown = result.markdown

            elapsed_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            self._inference_times.append(elapsed_ms)
            if len(self._inference_times) > settings.metrics_window_size:
                self._inference_times.pop(0)

            result_json = json.dumps({
                "markdown": full_markdown,
            })

            await self.store.update_job_status(
                job_id, JobStatus.COMPLETED, result_json=result_json
            )
            logger.info(f"Job {job_id} completed in {elapsed_ms:.0f}ms")

        except Exception as e:
            elapsed_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            logger.exception(f"Job {job_id} failed after {elapsed_ms:.0f}ms: {e}")
            await self.store.update_job_status(
                job_id, JobStatus.FAILED, error_msg=str(e)
            )

    def get_avg_inference_ms(self) -> float:
        if not self._inference_times:
            return 0.0
        return sum(self._inference_times) / len(self._inference_times)
