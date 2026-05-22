import React from "react";
import { lecternStyles as ls, lecternDark as ds } from "./styles";
import { SunIcon, MoonIcon, TrashIcon } from "./Icons";

interface LecternSettingsProps {
  isDark?: boolean;
  onToggleDark?: () => void;
}

export const LecternSettings: React.FC<LecternSettingsProps> = ({
  isDark = false,
  onToggleDark,
}) => {
  const s = isDark ? ds : ls;

  const handleClearHistory = () => {
    if (!window.confirm("Clear all local history? This cannot be undone.")) return;
    localStorage.removeItem("glm_ocr_history");
    window.location.reload();
  };

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
        overflow: "auto",
      }}
    >
      <div style={{ padding: "32px 48px", maxWidth: 640 }}>
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
          Settings
        </h2>
        <p style={{ fontSize: 14, color: s.ink2, marginTop: 6, marginBottom: 32 }}>
          Customize your experience.
        </p>

        <div
          style={{
            background: s.surface,
            border: `1px solid ${s.border}`,
            borderRadius: 14,
            padding: 24,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: s.ink }}>
                Appearance
              </div>
              <div style={{ fontSize: 12, color: s.ink2, marginTop: 2 }}>
                Switch between light and dark mode
              </div>
            </div>
            <button
              onClick={onToggleDark}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                fontSize: 13,
                color: s.ink,
                cursor: "pointer",
                fontFamily: '"Inter", system-ui, sans-serif',
              }}
            >
              {isDark ? <SunIcon size={14} /> : <MoonIcon size={14} />}
              {isDark ? "Light" : "Dark"}
            </button>
          </div>
        </div>

        <div
          style={{
            background: s.surface,
            border: `1px solid ${s.border}`,
            borderRadius: 14,
            padding: 24,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: s.ink }}>
                Clear history
              </div>
              <div style={{ fontSize: 12, color: s.ink2, marginTop: 2 }}>
                Remove all locally stored history entries
              </div>
            </div>
            <button
              onClick={handleClearHistory}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                fontSize: 13,
                color: s.err,
                cursor: "pointer",
                fontFamily: '"Inter", system-ui, sans-serif',
              }}
            >
              <TrashIcon size={14} />
              Clear
            </button>
          </div>
        </div>

        <div
          style={{
            background: s.surface,
            border: `1px solid ${s.border}`,
            borderRadius: 14,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 500, color: s.ink, marginBottom: 4 }}>
            About
          </div>
          <div style={{ fontSize: 12, color: s.ink2, lineHeight: 1.5 }}>
            GLM-OCR Frontend — Lectern edition.
            <br />
            Built with React, Tailwind, and Vite.
          </div>
        </div>
      </div>
    </div>
  );
};
