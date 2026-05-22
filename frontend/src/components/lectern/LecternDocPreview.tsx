import React from "react";
import { lecternStyles as ls, lecternDark as ds } from "./styles";

interface LecternDocPreviewProps {
  scale?: number;
  regions?: boolean;
  processing?: number | null;
  isDark?: boolean;
}

const resultRegions = [
  { type: "title", x: 12, y: 8, w: 60, h: 5, label: "title" },
  { type: "text", x: 12, y: 16, w: 76, h: 8, label: "text" },
  { type: "text", x: 12, y: 27, w: 76, h: 6, label: "text" },
  { type: "table", x: 12, y: 38, w: 76, h: 22, label: "table" },
  { type: "text", x: 12, y: 64, w: 76, h: 12, label: "text" },
  { type: "text", x: 12, y: 80, w: 76, h: 6, label: "text" },
];

export const LecternDocPreview: React.FC<LecternDocPreviewProps> = ({
  scale = 1,
  regions = false,
  processing = null,
  isDark = false,
}) => {
  const s = isDark ? ds : ls;
  return (
    <div
      style={{
        position: "relative",
        width: 360 * scale,
        height: 480 * scale,
        background: s.paper,
        borderRadius: 4,
        boxShadow: "0 1px 0 rgba(26,24,20,0.04), 0 8px 24px -8px rgba(26,24,20,0.12)",
        border: `1px solid ${s.border}`,
        padding: 32 * scale,
        fontSize: 9 * scale,
        color: s.ink2,
        lineHeight: 1.5,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 18 * scale,
          color: s.ink,
          marginBottom: 8 * scale,
          lineHeight: 1.1,
        }}
      >
        Q4 2025 Financial Summary
      </div>
      <div
        style={{
          fontSize: 7 * scale,
          color: s.ink3,
          marginBottom: 16 * scale,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        Reporting period · Oct–Dec 2025
      </div>

      <div style={{ marginBottom: 12 * scale }}>
        {[100, 94, 88, 60].map((w, i) => (
          <div
            key={i}
            style={{
              height: 1.5 * scale,
              background: s.ink2,
              opacity: 0.4,
              marginBottom: 4 * scale,
              width: `${w}%`,
              borderRadius: 1,
            }}
          />
        ))}
      </div>

      <div
        style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 13 * scale,
          color: s.ink,
          margin: `${10 * scale}px 0 ${6 * scale}px`,
        }}
      >
        Revenue Overview
      </div>
      <div style={{ marginBottom: 12 * scale }}>
        {[96, 92, 70].map((w, i) => (
          <div
            key={i}
            style={{
              height: 1.5 * scale,
              background: s.ink2,
              opacity: 0.4,
              marginBottom: 4 * scale,
              width: `${w}%`,
              borderRadius: 1,
            }}
          />
        ))}
      </div>

      <div
        style={{
          border: `1px solid ${s.border}`,
          borderRadius: 2,
          marginBottom: 12 * scale,
        }}
      >
        {[
          "Subscriptions · $11.4M · +40.7%",
          "Services · $1.9M · -20.8%",
          "Licenses · $0.9M · -10.0%",
          "Total · $14.2M · +23.4%",
        ].map((row, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              padding: `${4 * scale}px ${8 * scale}px`,
              borderBottom: i < 3 ? `1px solid ${s.border}` : "none",
              fontSize: 7 * scale,
              fontWeight: i === 3 ? 600 : 400,
              color: i === 3 ? s.ink : s.ink2,
              background: i === 0 ? s.bg : "transparent",
            }}
          >
            {row}
          </div>
        ))}
      </div>

      <div
        style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 13 * scale,
          color: s.ink,
          margin: `${10 * scale}px 0 ${6 * scale}px`,
        }}
      >
        Key Highlights
      </div>
      <div>
        {[92, 85, 78].map((w, i) => (
          <div
            key={i}
            style={{
              height: 1.5 * scale,
              background: s.ink2,
              opacity: 0.4,
              marginBottom: 4 * scale,
              width: `${w}%`,
              borderRadius: 1,
            }}
          />
        ))}
      </div>

      {regions &&
        resultRegions.map((r, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${r.x}%`,
              top: `${r.y}%`,
              width: `${r.w}%`,
              height: `${r.h}%`,
              border: `1.5px solid ${s.accent}`,
              borderRadius: 2,
              background: `${s.accent}10`,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -16,
                left: -1,
                fontSize: 9,
                fontFamily: '"JetBrains Mono", monospace',
                background: s.accent,
                color: "#fff",
                padding: "1px 6px",
                borderRadius: 2,
                lineHeight: 1.4,
              }}
            >
              {r.label}
            </div>
          </div>
        ))}

      {processing !== null && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(180deg, transparent 0%, transparent ${processing}%, ${s.bg}99 ${processing}%, ${s.bg}e6 100%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${processing}%`,
              height: 2,
              background: s.accent,
              boxShadow: `0 0 8px ${s.accent}`,
            }}
          />
        </>
      )}
    </div>
  );
};
