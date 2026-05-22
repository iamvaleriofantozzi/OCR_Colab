import React, { useState, useEffect } from "react";
import { lecternStyles as ls, lecternDark as ds } from "./styles";
import { SearchIcon, ClockIcon, CheckIcon, XIcon, LayersIcon, FolderIcon } from "./Icons";
import { fetchWithRetry } from "@/utils/api";
import type { FolderItem } from "./LecternSidebar";

interface LibraryJob {
  job_id: string;
  filename: string;
  status: string;
  created_at: string;
  file_hash?: string | null;
  folder_id?: string | null;
}

interface LecternLibraryProps {
  isDark?: boolean;
  selectedFolderId?: string | null;
  folders?: FolderItem[];
  onSelectJob?: (jobId: string) => void;
  onDeleteJob?: (jobId: string) => void;
  onMoveJob?: (jobId: string, folderId: string | null) => void;
}

export const LecternLibrary: React.FC<LecternLibraryProps> = ({
  isDark = false,
  selectedFolderId,
  folders = [],
  onSelectJob,
  onDeleteJob,
  onMoveJob,
}) => {
  const s = isDark ? ds : ls;
  const [jobs, setJobs] = useState<LibraryJob[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = selectedFolderId
      ? `/api/v1/jobs?limit=200&folder_id=${encodeURIComponent(selectedFolderId)}`
      : `/api/v1/jobs?limit=200`;
    fetchWithRetry(url)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load jobs");
        const data = await res.json();
        setJobs(data);
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [selectedFolderId]);

  const filtered = jobs.filter(
    (j) =>
      (j.filename || "").toLowerCase().includes(query.toLowerCase()) ||
      j.job_id.toLowerCase().includes(query.toLowerCase())
  );

  const statusIcon = (status: string) => {
    if (status === "completed")
      return <CheckIcon size={12} stroke={2.5} />;
    if (status === "failed")
      return <XIcon size={12} stroke={2.5} />;
    if (status === "processing")
      return <ClockIcon size={12} />;
    return <LayersIcon size={12} />;
  };

  const statusColor = (status: string) => {
    if (status === "completed") return s.success;
    if (status === "failed") return s.err;
    if (status === "processing") return s.accent;
    return s.ink3;
  };

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: s.bg,
        color: s.ink,
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: 14,
        display: "flex",
        flexDirection: "column",
        letterSpacing: "-0.005em",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "32px 48px", flex: 1, overflow: "auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontFamily: '"Instrument Serif", serif',
              fontSize: 36,
              margin: 0,
              fontWeight: 400,
              letterSpacing: "-0.01em",
              color: s.ink,
            }}
          >
            Library
          </h2>
          <p style={{ fontSize: 14, color: s.ink2, marginTop: 6 }}>
            {jobs.length} documents{selectedFolder ? ` in "${selectedFolder.name}"` : " in total"}
          </p>
        </div>

        {/* Folder filter pills */}
        {folders.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => { /* App handles selection via sidebar, but we can show All */ }}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${selectedFolderId === null ? s.ink : s.border}`,
                background: selectedFolderId === null ? s.ink : s.surface,
                color: selectedFolderId === null ? s.bg : s.ink,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: '"Inter", system-ui, sans-serif',
              }}
            >
              All
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => { /* selection handled in sidebar */ }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: `1px solid ${selectedFolderId === f.id ? s.ink : s.border}`,
                  background: selectedFolderId === f.id ? s.ink : s.surface,
                  color: selectedFolderId === f.id ? s.bg : s.ink,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: '"Inter", system-ui, sans-serif',
                }}
              >
                <FolderIcon size={10} />
                {f.name}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: s.surface,
            border: `1px solid ${s.border}`,
            borderRadius: 10,
            fontSize: 13,
            color: s.ink3,
            maxWidth: 400,
            marginBottom: 24,
          }}
        >
          <SearchIcon size={14} />
          <input
            type="text"
            placeholder="Search by name or job ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: s.ink,
              fontFamily: "inherit",
              fontSize: "inherit",
              width: "100%",
            }}
          />
        </div>

        {loading ? (
          <div style={{ color: s.ink3, fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: s.ink3, fontSize: 13 }}>No documents found.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 800 }}>
            {filtered.map((j) => (
              <div
                key={j.job_id}
                onClick={() => onSelectJob?.(j.job_id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: 14,
                  background: s.surface,
                  border: `1px solid ${s.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 52,
                    borderRadius: 4,
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    display: "grid",
                    placeItems: "center",
                    color: statusColor(j.status),
                    flexShrink: 0,
                  }}
                >
                  {statusIcon(j.status)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: s.ink,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {j.filename || j.job_id}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: s.ink3,
                      marginTop: 2,
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    {j.job_id} · {new Date(j.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Folder assignment dropdown */}
                <select
                  value={j.folder_id || ""}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    const val = e.target.value;
                    onMoveJob?.(j.job_id, val || null);
                    setJobs((prev) =>
                      prev.map((x) =>
                        x.job_id === j.job_id ? { ...x, folder_id: val || null } : x
                      )
                    );
                  }}
                  style={{
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 11,
                    color: s.ink2,
                    fontFamily: '"Inter", system-ui, sans-serif',
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="">—</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: statusColor(j.status),
                    fontFamily: '"JetBrains Mono", monospace',
                    textTransform: "uppercase",
                  }}
                >
                  {j.status}
                </span>
                {onDeleteJob && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteJob(j.job_id);
                      setJobs((prev) => prev.filter((x) => x.job_id !== j.job_id));
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: "none",
                      background: "transparent",
                      color: s.ink3,
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                    }}
                    title="Delete"
                  >
                    <XIcon size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
