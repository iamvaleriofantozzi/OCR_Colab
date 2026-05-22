import React from "react";
import { lecternStyles as ls, lecternDark as ds } from "./styles";
import { UploadIcon, LinkIcon, SparkleIcon } from "./Icons";

interface LecternEmptyProps {
  isDark?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onBrowse?: () => void;
  onUrlChange?: (v: string) => void;
  url?: string;
  onFetch?: () => void;
}

export const LecternEmpty: React.FC<LecternEmptyProps> = ({
  isDark = false,
  inputRef,
  onBrowse,
  url = "",
  onUrlChange,
  onFetch,
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
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
            position: "relative",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 32, maxWidth: 520 }}>
            <div style={{ fontSize: 13, color: s.ink2, marginBottom: 12 }}>
              Welcome back
            </div>
            <h1
              style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: 56,
                lineHeight: 1.05,
                margin: 0,
                letterSpacing: "-0.02em",
                fontWeight: 400,
                color: s.ink,
              }}
            >
              What would you like
              <br />
              to <em style={{ fontStyle: "italic" }}>read</em> today?
            </h1>
            <p
              style={{
                fontSize: 14,
                color: s.ink2,
                marginTop: 16,
                lineHeight: 1.55,
              }}
            >
              Drop a PDF, image, or paste a link. We'll extract clean, editable text — preserving tables, formulas, and layout.
            </p>
          </div>
          <div
            onClick={onBrowse}
            style={{
              width: "100%",
              maxWidth: 640,
              border: `1.5px dashed ${s.border}`,
              borderRadius: 18,
              padding: 40,
              background: s.surface,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              cursor: "pointer",
            }}
          >
            <input ref={inputRef} type="file" accept="image/*,.pdf" multiple className="hidden" style={{ display: "none" }} />
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: s.accentSoft,
                color: s.accent,
                display: "grid",
                placeItems: "center",
              }}
            >
              <UploadIcon size={22} stroke={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 16, color: s.ink, fontWeight: 500, marginBottom: 4 }}>
                Drop a file here
              </div>
              <div style={{ fontSize: 13, color: s.ink2 }}>
                or <span style={{ color: s.accent, textDecoration: "underline", textUnderlineOffset: 3 }}>browse from your computer</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
              {["PDF", "PNG", "JPG", "TIFF", "WEBP"].map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 10,
                    padding: "3px 8px",
                    borderRadius: 999,
                    border: `1px solid ${s.border}`,
                    color: s.ink2,
                    background: s.bg,
                    fontFamily: '"JetBrains Mono", monospace',
                    letterSpacing: "0.04em",
                  }}
                >
                  {t}
                </span>
              ))}
              <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, color: s.ink3, fontFamily: '"JetBrains Mono", monospace' }}>
                · up to 20MB
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, width: "100%", maxWidth: 360 }}>
              <div style={{ flex: 1, height: 1, background: s.border }} />
              <span style={{ fontSize: 11, color: s.ink3, textTransform: "uppercase", letterSpacing: "0.08em" }}>or</span>
              <div style={{ flex: 1, height: 1, background: s.border }} />
            </div>
            <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 420 }}>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  border: `1px solid ${s.border}`,
                  borderRadius: 10,
                  background: s.bg,
                  fontSize: 13,
                  color: s.ink3,
                }}
              >
                <LinkIcon size={14} />
                <input
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => onUrlChange?.(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "inherit",
                    fontFamily: "inherit",
                    fontSize: "inherit",
                    width: "100%",
                  }}
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFetch?.();
                }}
                style={{
                  padding: "10px 18px",
                  background: s.ink,
                  color: s.bg,
                  border: "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Fetch
              </button>
            </div>
          </div>
          <div style={{ marginTop: 28, display: "flex", gap: 24, fontSize: 12, color: s.ink3 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <SparkleIcon size={12} /> Tables preserved
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <SparkleIcon size={12} /> Formulas as LaTeX
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <SparkleIcon size={12} /> Multi-column layouts
            </span>
          </div>
        </main>
      </div>
    </div>
  );
};
