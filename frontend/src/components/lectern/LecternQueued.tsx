import React from "react";
import { lecternStyles as ls, lecternDark as ds } from "./styles";
import { ArrowRightIcon, XIcon, LayersIcon } from "./Icons";

interface QueuedFile {
  name: string;
  size: string;
  pages: number;
}

interface LecternQueuedProps {
  isDark?: boolean;
  files: QueuedFile[];
  onRemove?: (idx: number) => void;
  onAddMore?: () => void;
  onReadAll?: () => void;
}

export const LecternQueued: React.FC<LecternQueuedProps> = ({
  isDark = false,
  files,
  onRemove,
  onAddMore,
  onReadAll,
}) => {
  const s = isDark ? ds : ls;
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
      }}
    >
      <div style={{ flex: 1, display: "flex" }}>
        <main style={{ flex: 1, padding: "32px 48px", overflow: "hidden" }}>
          <div style={{ marginBottom: 24, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: s.ink3,
                  marginBottom: 6,
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                NEW BATCH · {files.length} FILE{files.length !== 1 ? "S" : ""}
              </div>
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
                Ready when you are
              </h2>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={onAddMore}
                style={{
                  padding: "8px 14px",
                  background: s.surface,
                  color: s.ink2,
                  border: `1px solid ${s.border}`,
                  borderRadius: 10,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Add more
              </button>
              <button
                onClick={onReadAll}
                style={{
                  padding: "8px 18px",
                  background: s.ink,
                  color: s.bg,
                  border: "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Read all <ArrowRightIcon size={14} />
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 800 }}>
            {files.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: 16,
                  background: s.surface,
                  border: `1px solid ${s.border}`,
                  borderRadius: 14,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 72,
                    borderRadius: 6,
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    flexShrink: 0,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {f.name.endsWith(".pdf") ? (
                    <>
                      <div style={{ height: 1, background: s.ink3, margin: "10px 6px 2px" }} />
                      <div style={{ height: 1, background: s.ink3, margin: "0 6px 2px", width: "60%" }} />
                      <div style={{ height: 1, background: s.ink3, margin: "0 6px 2px", width: "80%" }} />
                      <div style={{ height: 1, background: s.ink3, margin: "0 6px 2px", width: "70%" }} />
                      <div style={{ position: "absolute", bottom: 4, left: 6, fontSize: 7, fontFamily: '"JetBrains Mono", monospace', color: s.ink3 }}>
                        PDF
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: `linear-gradient(135deg, ${s.accentSoft}, ${s.bg})`,
                        display: "grid",
                        placeItems: "center",
                        color: s.ink3,
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M21 16l-5-5L5 21"/></svg>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: s.ink, marginBottom: 4 }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: s.ink2, fontFamily: '"JetBrains Mono", monospace' }}>
                    {f.size} · {f.pages} {f.pages === 1 ? "page" : "pages"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: s.ink3 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <LayersIcon size={12} /> Ready
                  </span>
                </div>
                <button
                  onClick={() => onRemove?.(i)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: `1px solid ${s.border}`,
                    background: s.bg,
                    display: "grid",
                    placeItems: "center",
                    color: s.ink3,
                    cursor: "pointer",
                  }}
                >
                  <XIcon size={14} />
                </button>
              </div>
            ))}
          </div>

            <div
              style={{
                marginTop: 24,
                padding: 16,
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 12,
                maxWidth: 800,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: s.surface,
                  border: `1px solid ${s.border}`,
                  display: "grid",
                  placeItems: "center",
                  color: s.ink2,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
              </div>
              <div style={{ flex: 1, fontSize: 13 }}>
                <span style={{ color: s.ink }}>Processing defaults</span>
                <span style={{ color: s.ink2 }}>
                  {" "}
                  · Auto-detect layout · Preserve tables · Up to 20MB
                </span>
              </div>
            </div>
        </main>
      </div>
    </div>
  );
};
