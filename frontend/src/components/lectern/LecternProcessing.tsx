import React, { useState, useEffect } from "react";
import { lecternStyles as ls, lecternDark as ds } from "./styles";
import { FileViewer } from "./FileViewer";
import { ClockIcon } from "./Icons";

const LINES = [
  "Extracting structural elements...",
  "Identifying text regions...",
  "Running OCR inference...",
  "Reconstructing reading order...",
  "Applying formatting rules...",
  "Optimizing layout...",
  "Finalizing output...",
];

const STAGES = [
  { label: "Preprocessing", duration: 600 },
  { label: "Text recognition", duration: 1600 },
  { label: "Formatting", duration: 2600 },
];

interface LecternProcessingProps {
  isDark?: boolean;
  filename?: string;
  progress?: number;
  file?: File | null;
  jobId?: string | null;
}

export const LecternProcessing: React.FC<LecternProcessingProps> = ({
  isDark = false,
  filename = "document",
  progress = 0,
  file,
  jobId,
}) => {
  const s = isDark ? ds : ls;
  const [activeStage, setActiveStage] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setActiveStage(0);
    setVisibleCount(0);
    const timers = STAGES.map((st, i) =>
      window.setTimeout(() => setActiveStage(i), st.duration)
    );
    return () => timers.forEach(clearTimeout);
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    setVisibleCount(0);
    let idx = 0;
    const interval = window.setInterval(() => {
      idx += 1;
      setVisibleCount(idx);
      if (idx >= LINES.length) clearInterval(interval);
    }, 180);
    return () => clearInterval(interval);
  }, [jobId]);

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
        <main style={{ flex: 1, display: "flex" }}>
          {/* Left: source preview */}
          <div
            style={{
              flex: 1,
              padding: 40,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRight: `1px solid ${s.border}`,
              background: s.bg,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: s.ink3,
                marginBottom: 16,
                fontFamily: '"JetBrains Mono", monospace',
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Source document
            </div>
            <FileViewer file={file} jobId={jobId} isDark={isDark} scale={0.9} scanning={true} />
          </div>
          {/* Right: status */}
          <div
            style={{
              width: 480,
              padding: 40,
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ position: "relative", width: 28, height: 28 }}>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      border: `2px solid ${s.border}`,
                      borderRadius: "50%",
                    }}
                  />
                  <div
                    className="lec-spin"
                    style={{
                      position: "absolute",
                      inset: 0,
                      border: `2px solid ${s.accent}`,
                      borderRadius: "50%",
                      borderRightColor: "transparent",
                      borderBottomColor: "transparent",
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: s.ink }}>
                    Reading your document
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: s.ink2,
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    {filename}
                  </div>
                </div>
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 999,
                  background: s.border,
                  overflow: "hidden",
                  marginBottom: 8,
                }}
              >
                <div
                  className="lec-progress"
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: s.accent,
                    borderRadius: 999,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: s.ink3,
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                <span>{progress}% · processing</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ClockIcon size={11} /> please wait
                </span>
              </div>
            </div>

            {/* Pipeline stages */}
            <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  color: s.ink3,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 12,
                }}
              >
                Pipeline
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {STAGES.map((st, i) => {
                  const active = i <= activeStage;
                  const current = i === activeStage;
                  return (
                    <div key={st.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: `2px solid ${active ? s.accent : s.border}`,
                          display: "grid",
                          placeItems: "center",
                          transition: "border-color 0.4s",
                        }}
                      >
                        {active && !current && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {current && (
                          <div
                            className="lec-pulse"
                            style={{ width: 8, height: 8, borderRadius: "50%", background: s.accent }}
                          />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          color: active ? s.ink : s.ink3,
                          fontWeight: active ? 500 : 400,
                          transition: "color 0.4s",
                        }}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live preview — line-by-line */}
            <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 20, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  color: s.ink3,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 12,
                }}
              >
                Live preview
              </div>
              <div
                style={{
                  flex: 1,
                  background: s.paper,
                  border: `1px solid ${s.border}`,
                  borderRadius: 8,
                  padding: 16,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: s.ink2,
                  overflow: "auto",
                }}
              >
                {LINES.slice(0, visibleCount).map((line, i) => (
                  <div key={i} className="lec-fade" style={{ animationDelay: `${i * 40}ms` }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
