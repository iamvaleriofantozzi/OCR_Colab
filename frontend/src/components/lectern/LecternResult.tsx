import React, { useState, useEffect, useRef } from "react";
import { lecternStyles as ls, lecternDark as ds } from "./styles";
import { FileViewer } from "./FileViewer";
import { CopyIcon, DownloadIcon, EyeIcon, FolderIcon } from "./Icons";
import { MarkdownRenderer } from "../MarkdownRenderer";
import type { FolderItem } from "./LecternSidebar";

function useTypewriter(text: string, enabled: boolean) {
  const [displayed, setDisplayed] = useState(text);
  const started = useRef(false);
  useEffect(() => {
    if (!enabled || started.current) return;
    started.current = true;
    setDisplayed("");
    const len = text.length;
    const targetMs = 1800; // reveal over ~1.8s
    const intervalMs = 16;
    const steps = Math.max(1, Math.floor(targetMs / intervalMs));
    const chunk = Math.max(1, Math.floor(len / steps));
    let i = 0;
    const interval = window.setInterval(() => {
      i += chunk;
      if (i >= len) {
        setDisplayed(text);
        clearInterval(interval);
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, intervalMs);
    return () => clearInterval(interval);
  }, [text, enabled]);
  return displayed;
}

interface LecternResultProps {
  isDark?: boolean;
  filename?: string;
  latency?: string;
  markdown?: string;
  file?: File | null;
  jobId?: string | null;
  folderId?: string | null;
  folders?: FolderItem[];
  onCopy?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onMoveFolder?: (jobId: string, folderId: string | null) => void;
}

export const LecternResult: React.FC<LecternResultProps> = ({
  isDark = false,
  filename = "result",
  latency = "",
  markdown = "",
  file,
  jobId,
  folderId,
  folders = [],
  onCopy,
  onDownload,
  onDelete,
  onMoveFolder,
}) => {
  const s = isDark ? ds : ls;
  const [tab, setTab] = useState<"Markdown" | "Preview">("Preview");
  const currentFolder = folders.find((f) => f.id === folderId);
  const revealed = useTypewriter(markdown, markdown.length > 0);

  return (
    <div
      style={{
        width: "100%",
        flex: 1,
        minHeight: 0,
        background: s.bg,
        color: s.ink,
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: 14,
        display: "flex",
        flexDirection: "column",
        letterSpacing: "-0.005em",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
        {/* Sub-toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 28px",
            borderBottom: `1px solid ${s.border}`,
            background: s.bg,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: 20,
                fontWeight: 400,
                color: s.ink,
              }}
            >
              {filename}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 999,
                background: `${s.success}1A`,
                color: s.success,
                fontWeight: 500,
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              ● completed
            </span>
            {latency && (
              <span
                style={{
                  fontSize: 12,
                  color: s.ink3,
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {latency}
              </span>
            )}
            {currentFolder && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 999,
                  background: s.surface,
                  color: s.ink2,
                  fontWeight: 500,
                  border: `1px solid ${s.border}`,
                }}
              >
                <FolderIcon size={10} />
                {currentFolder.name}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {jobId && onMoveFolder && folders.length > 0 && (
              <>
                <select
                  value={folderId || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    onMoveFolder(jobId, val || null);
                  }}
                  style={{
                    background: s.surface,
                    border: `1px solid ${s.border}`,
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 12,
                    color: s.ink,
                    fontFamily: '"Inter", system-ui, sans-serif',
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="">Move to folder…</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <div style={{ width: 1, height: 18, background: s.border, margin: "0 8px" }} />
              </>
            )}
            {(["Markdown", "Preview"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "6px 14px",
                  border: "none",
                  background: tab === t ? s.surface : "transparent",
                  color: tab === t ? s.ink : s.ink2,
                  fontSize: 12,
                  fontWeight: tab === t ? 500 : 400,
                  borderRadius: 8,
                  cursor: "pointer",
                  boxShadow: tab === t ? `0 0 0 1px ${s.border}` : "none",
                  fontFamily: '"Inter", system-ui, sans-serif',
                }}
              >
                {t}
              </button>
            ))}
            <div style={{ width: 1, height: 18, background: s.border, margin: "0 8px" }} />
            <button
              onClick={onCopy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 12px",
                border: `1px solid ${s.border}`,
                background: s.surface,
                borderRadius: 8,
                fontSize: 12,
                color: s.ink,
                cursor: "pointer",
                fontFamily: '"Inter", system-ui, sans-serif',
              }}
            >
              <CopyIcon size={13} /> Copy
            </button>
            <button
              onClick={onDownload}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 12px",
                border: `1px solid ${s.border}`,
                background: s.surface,
                borderRadius: 8,
                fontSize: 12,
                color: s.ink,
                cursor: "pointer",
                fontFamily: '"Inter", system-ui, sans-serif',
              }}
            >
              <DownloadIcon size={13} /> .md
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 12px",
                  border: `1px solid ${s.border}`,
                  background: s.surface,
                  borderRadius: 8,
                  fontSize: 12,
                  color: s.err,
                  cursor: "pointer",
                  fontFamily: '"Inter", system-ui, sans-serif',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Split view */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
          {/* Source */}
          <div
            style={{
              flex: 1,
              background: s.bg,
              display: "flex",
              flexDirection: "column",
              borderRight: `1px solid ${s.border}`,
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 20px",
                borderBottom: `1px solid ${s.border}`,
                fontSize: 11,
                color: s.ink3,
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <span>Source document</span>
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                padding: 32,
                overflow: "auto",
                minHeight: 0,
              }}
            >
              <FileViewer file={file} jobId={jobId} isDark={isDark} scale={1} />
            </div>
          </div>
          {/* Rendered */}
          <div
            style={{
              flex: 1.05,
              background: s.surface,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 20px",
                borderBottom: `1px solid ${s.border}`,
                fontSize: 11,
                color: s.ink3,
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              <span>Extracted</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <EyeIcon size={12} /> Reading mode
              </span>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "32px 40px", color: s.ink, minHeight: 0 }}>
              {tab === "Preview" && revealed ? (
                <div className="prose" style={{ maxWidth: "none" }}>
                  <MarkdownRenderer content={revealed} />
                </div>
              ) : tab === "Markdown" ? (
                <pre
                  style={{
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: 8,
                    padding: 16,
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    lineHeight: 1.6,
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                    color: s.ink2,
                  }}
                >
                  {revealed}
                </pre>
              ) : (
                <div style={{ textAlign: "center", color: s.ink3, marginTop: 60 }}>
                  <EyeIcon size={32} stroke={1} />
                  <div style={{ marginTop: 12, fontSize: 13 }}>Select Preview or Markdown tab</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
