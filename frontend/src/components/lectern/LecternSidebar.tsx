import React, { useState, useEffect } from "react";
import { lecternStyles as ls, lecternDark as ds } from "./styles";
import { FolderIcon, PlusIcon, XIcon } from "./Icons";
import { fetchWithRetry } from "@/utils/api";

export interface HistoryItem {
  id: string;
  name: string;
  status: string;
  time: string;
  pages: number;
}

export interface FolderItem {
  id: string;
  name: string;
  created_at: string;
}

interface LecternSidebarProps {
  history: HistoryItem[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  isDark?: boolean;
  selectedFolderId?: string | null;
  onSelectFolder?: (folderId: string | null) => void;
}

export const LecternSidebar: React.FC<LecternSidebarProps> = ({
  history,
  activeId,
  onSelect,
  isDark = false,
  selectedFolderId,
  onSelectFolder,
}) => {
  const s = isDark ? ds : ls;
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [folderLoading, setFolderLoading] = useState(false);

  const fetchFolders = async () => {
    setFolderLoading(true);
    try {
      const res = await fetchWithRetry(`/api/v1/folders`);
      if (!res.ok) throw new Error("Failed to fetch folders");
      const data = await res.json();
      setFolders(data);
    } catch {
      setFolders([]);
    } finally {
      setFolderLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleCreateFolder = async () => {
    const name = window.prompt("New folder name:");
    if (!name || !name.trim()) return;
    try {
      const res = await fetchWithRetry(`/api/v1/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create folder");
      const data = await res.json();
      setFolders((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      // swallow
    }
  };

  const handleDeleteFolder = async (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this folder? Documents inside will become unassigned.")) return;
    try {
      const res = await fetchWithRetry(`/api/v1/folders/${folderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete folder");
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      if (selectedFolderId === folderId) {
        onSelectFolder?.(null);
      }
    } catch {
      // swallow
    }
  };

  return (
    <aside
      style={{
        width: 260,
        borderRight: `1px solid ${s.border}`,
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        background: s.bg,
        flexShrink: 0,
        overflow: "auto",
      }}
    >
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: s.ink,
          color: s.bg,
          border: "none",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          marginBottom: 16,
          fontFamily: '"Inter", system-ui, sans-serif',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
        New document
      </button>
      <div
        style={{
          fontSize: 11,
          color: s.ink3,
          padding: "4px 10px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginTop: 4,
          marginBottom: 4,
          fontWeight: 500,
          fontFamily: '"Inter", system-ui, sans-serif',
        }}
      >
        Recent
      </div>
      {history.slice(0, 6).map((h) => (
        <div
          key={h.id}
          onClick={() => onSelect?.(h.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 8,
            background: h.id === activeId ? s.surface : "transparent",
            color: s.ink,
            fontSize: 13,
            cursor: "pointer",
            border: h.id === activeId ? `1px solid ${s.border}` : "1px solid transparent",
            fontFamily: '"Inter", system-ui, sans-serif',
          }}
        >
          <div
            style={{
              width: 22,
              height: 28,
              borderRadius: 3,
              background: s.surface,
              border: `1px solid ${s.border}`,
              flexShrink: 0,
              position: "relative",
            }}
          >
            <div style={{ height: 1, background: s.ink3, margin: "8px 4px 2px" }} />
            <div style={{ height: 1, background: s.ink3, margin: "0 4px 2px", width: "60%" }} />
            <div style={{ height: 1, background: s.ink3, margin: "0 4px", width: "70%" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 13,
              }}
            >
              {h.name}
            </div>
            <div style={{ fontSize: 11, color: s.ink3, marginTop: 1 }}>
              {h.time} · {h.pages}p
            </div>
          </div>
          {h.status === "failed" && (
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.err }} />
          )}
        </div>
      ))}

      {/* Folders section */}
      <div
        style={{
          fontSize: 11,
          color: s.ink3,
          padding: "12px 10px 4px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 500,
          fontFamily: '"Inter", system-ui, sans-serif',
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Folders</span>
        <button
          onClick={handleCreateFolder}
          title="New folder"
          style={{
            background: "none",
            border: "none",
            color: s.ink3,
            cursor: "pointer",
            padding: 2,
            display: "grid",
            placeItems: "center",
            borderRadius: 4,
          }}
        >
          <PlusIcon size={12} />
        </button>
      </div>
      {folderLoading ? (
        <div style={{ fontSize: 11, color: s.ink3, padding: "4px 10px" }}>Loading…</div>
      ) : (
        folders.map((f) => (
          <div
            key={f.id}
            onClick={() => onSelectFolder?.(f.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 8,
              background: f.id === selectedFolderId ? s.surface : "transparent",
              color: s.ink,
              fontSize: 13,
              cursor: "pointer",
              border: f.id === selectedFolderId ? `1px solid ${s.border}` : "1px solid transparent",
              fontFamily: '"Inter", system-ui, sans-serif',
            }}
          >
            <FolderIcon size={14} />
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {f.name}
            </span>
            <button
              onClick={(e) => handleDeleteFolder(e, f.id)}
              title="Delete folder"
              style={{
                background: "none",
                border: "none",
                color: s.ink3,
                cursor: "pointer",
                padding: 2,
                display: "grid",
                placeItems: "center",
                borderRadius: 4,
                opacity: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0"; }}
            >
              <XIcon size={12} />
            </button>
          </div>
        ))
      )}
    </aside>
  );
};
