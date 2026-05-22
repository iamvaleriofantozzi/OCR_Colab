import aiosqlite
import json
from datetime import datetime, timezone
from enum import Enum
from typing import Any
from pathlib import Path


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class JobStore:
    def __init__(self, database_url: str):
        self.database_url = database_url.replace("sqlite+aiosqlite:///", "").replace("sqlite+aiosqlite://", "")
        self.db: aiosqlite.Connection | None = None

    async def init_db(self) -> None:
        Path(self.database_url).parent.mkdir(parents=True, exist_ok=True)
        self.db = await aiosqlite.connect(self.database_url)
        self.db.row_factory = aiosqlite.Row
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                status TEXT NOT NULL DEFAULT 'pending',
                file_hash TEXT,
                file_path TEXT,
                original_file_path TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                result_json TEXT,
                error_msg TEXT,
                retry_count INTEGER NOT NULL DEFAULT 0
            )
        """)
        await self.db.execute("""
            CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)
        """)
        await self.db.execute("""
            CREATE INDEX IF NOT EXISTS idx_jobs_hash ON jobs(file_hash)
        """)
        # Migrate: add original_file_path if missing
        try:
            await self.db.execute("ALTER TABLE jobs ADD COLUMN original_file_path TEXT")
            await self.db.commit()
        except Exception:
            pass
        # Migrate: add folder_id if missing
        try:
            await self.db.execute("ALTER TABLE jobs ADD COLUMN folder_id TEXT")
            await self.db.commit()
        except Exception:
            pass
        # Create folders table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        await self.db.commit()

    async def recover_orphaned_jobs(self) -> None:
        if self.db is None:
            return
        now = datetime.now(timezone.utc).isoformat()
        cursor = await self.db.execute(
            "UPDATE jobs SET status = ?, updated_at = ? WHERE status = ? RETURNING id",
            (JobStatus.PENDING.value, now, JobStatus.PROCESSING.value),
        )
        rows = await cursor.fetchall()
        if rows:
            for row in rows:
                print(f"Recovered orphaned job {row['id']} to pending")
        await self.db.commit()

    async def create_job(
        self,
        job_id: str,
        file_hash: str | None,
        file_path: str | None,
        original_file_path: str | None = None,
    ) -> dict[str, Any]:
        if self.db is None:
            raise RuntimeError("Database not initialized")
        now = datetime.now(timezone.utc).isoformat()
        await self.db.execute(
            """
            INSERT INTO jobs (id, status, file_hash, file_path, original_file_path, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (job_id, JobStatus.PENDING.value, file_hash, file_path, original_file_path, now, now),
        )
        await self.db.commit()
        return await self.get_job(job_id)

    async def get_job(self, job_id: str) -> dict[str, Any] | None:
        if self.db is None:
            return None
        cursor = await self.db.execute(
            "SELECT * FROM jobs WHERE id = ?",
            (job_id,),
        )
        row = await cursor.fetchone()
        if row is None:
            return None
        return self._row_to_dict(row)

    async def find_job_by_hash(self, file_hash: str) -> dict[str, Any] | None:
        if self.db is None:
            return None
        cursor = await self.db.execute(
            "SELECT * FROM jobs WHERE file_hash = ? AND status = ? ORDER BY created_at DESC LIMIT 1",
            (file_hash, JobStatus.COMPLETED.value),
        )
        row = await cursor.fetchone()
        if row is None:
            return None
        return self._row_to_dict(row)

    async def update_job_status(
        self,
        job_id: str,
        status: JobStatus,
        result_json: str | None = None,
        error_msg: str | None = None,
    ) -> dict[str, Any] | None:
        if self.db is None:
            return None
        now = datetime.now(timezone.utc).isoformat()
        await self.db.execute(
            """
            UPDATE jobs
            SET status = ?, updated_at = ?, result_json = ?, error_msg = ?
            WHERE id = ?
            """,
            (status.value, now, result_json, error_msg, job_id),
        )
        await self.db.commit()
        return await self.get_job(job_id)

    async def list_jobs(self, limit: int = 100, folder_id: str | None = None) -> list[dict[str, Any]]:
        if self.db is None:
            return []
        if folder_id is not None:
            cursor = await self.db.execute(
                "SELECT * FROM jobs WHERE folder_id = ? ORDER BY created_at DESC LIMIT ?",
                (folder_id, limit),
            )
        else:
            cursor = await self.db.execute(
                "SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?",
                (limit,),
            )
        rows = await cursor.fetchall()
        return [self._row_to_dict(row) for row in rows]

    async def delete_old_jobs(self, hours: int) -> int:
        if self.db is None:
            return 0
        from datetime import timedelta
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
        cursor = await self.db.execute(
            "DELETE FROM jobs WHERE updated_at < ?",
            (cutoff,),
        )
        await self.db.commit()
        return cursor.rowcount

    async def delete_job(self, job_id: str) -> bool:
        if self.db is None:
            return False
        cursor = await self.db.execute(
            "DELETE FROM jobs WHERE id = ?",
            (job_id,),
        )
        await self.db.commit()
        return cursor.rowcount > 0

    async def create_folder(self, name: str) -> dict[str, Any]:
        if self.db is None:
            raise RuntimeError("Database not initialized")
        import uuid
        folder_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        await self.db.execute(
            "INSERT INTO folders (id, name, created_at) VALUES (?, ?, ?)",
            (folder_id, name, now),
        )
        await self.db.commit()
        cursor = await self.db.execute("SELECT * FROM folders WHERE id = ?", (folder_id,))
        row = await cursor.fetchone()
        return dict(row) if row else {"id": folder_id, "name": name, "created_at": now}

    async def list_folders(self) -> list[dict[str, Any]]:
        if self.db is None:
            return []
        cursor = await self.db.execute("SELECT * FROM folders ORDER BY name ASC")
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

    async def delete_folder(self, folder_id: str) -> bool:
        if self.db is None:
            return False
        await self.db.execute("UPDATE jobs SET folder_id = NULL WHERE folder_id = ?", (folder_id,))
        cursor = await self.db.execute("DELETE FROM folders WHERE id = ?", (folder_id,))
        await self.db.commit()
        return cursor.rowcount > 0

    async def update_job_folder(self, job_id: str, folder_id: str | None) -> dict[str, Any] | None:
        if self.db is None:
            return None
        await self.db.execute(
            "UPDATE jobs SET folder_id = ?, updated_at = ? WHERE id = ?",
            (folder_id, datetime.now(timezone.utc).isoformat(), job_id),
        )
        await self.db.commit()
        return await self.get_job(job_id)

    async def close(self) -> None:
        if self.db:
            await self.db.close()

    def _row_to_dict(self, row: aiosqlite.Row) -> dict[str, Any]:
        d = dict(row)
        if d.get("result_json"):
            try:
                d["result"] = json.loads(d["result_json"])
            except json.JSONDecodeError:
                d["result"] = None
        else:
            d["result"] = None
        return d
