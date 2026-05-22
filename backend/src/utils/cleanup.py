import asyncio
import logging
import shutil
from datetime import datetime, timezone, timedelta
from pathlib import Path

from src.config import settings
from src.jobs.store import JobStore

logger = logging.getLogger(__name__)


async def cleanup_task(store: JobStore) -> None:
    """Background task that periodically cleans old files and jobs."""
    while True:
        try:
            await asyncio.sleep(3600)  # Run every hour
            now = datetime.now(timezone.utc)

            # Delete uploaded files older than JOB_CLEANUP_HOURS
            uploads_dir = Path(settings.uploads_dir)
            if uploads_dir.exists():
                for job_dir in uploads_dir.iterdir():
                    if job_dir.is_dir():
                        mtime = datetime.fromtimestamp(job_dir.stat().st_mtime, tz=timezone.utc)
                        if now - mtime > timedelta(hours=settings.job_cleanup_hours):
                            try:
                                shutil.rmtree(job_dir)
                                logger.info(f"Cleaned up old upload directory: {job_dir}")
                            except Exception as e:
                                logger.warning(f"Failed to remove {job_dir}: {e}")

            # Purge old job records
            deleted = await store.delete_old_jobs(settings.job_archive_days * 24)
            if deleted > 0:
                logger.info(f"Purged {deleted} old job records")

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.exception(f"Cleanup task error: {e}")
            await asyncio.sleep(60)
