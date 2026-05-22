import React from "react";
import { lecternStyles as ls, lecternDark as ds } from "./styles";
import { DocIcon } from "./Icons";

interface LecternDraggingProps {
  isDark?: boolean;
  fileCount?: number;
  fileNames?: string;
}

export const LecternDragging: React.FC<LecternDraggingProps> = ({
  isDark = false,
  fileCount = 3,
  fileNames = "annual-report-2025.pdf, receipt-uber.png, meeting-whiteboard.jpg",
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
        <main
          style={{
            flex: 1,
            padding: 40,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 24,
              background: s.accentSoft,
              borderRadius: 20,
              opacity: 0.5,
            }}
          />
          <div
            style={{
              width: "100%",
              maxWidth: 720,
              height: 480,
              border: `2.5px dashed ${s.accent}`,
              borderRadius: 20,
              background: s.surface,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              position: "relative",
              boxShadow: "0 24px 60px -20px rgba(139,90,43,0.25)",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 22,
                background: s.accent,
                color: "#fff",
                display: "grid",
                placeItems: "center",
                transform: "rotate(-4deg)",
              }}
            >
              <DocIcon size={36} stroke={1.5} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: '"Instrument Serif", serif',
                  fontSize: 36,
                  color: s.ink,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                Drop to begin
              </div>
              <div style={{ fontSize: 14, color: s.ink2, marginTop: 8 }}>
                {fileCount} file{fileCount !== 1 ? "s" : ""} detected · {fileNames}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {Array.from({ length: Math.min(fileCount, 3) }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: s.accent,
                    opacity: 0.4 + i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
