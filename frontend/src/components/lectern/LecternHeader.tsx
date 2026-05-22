import React from "react";
import { lecternStyles as ls, lecternDark as ds } from "./styles";
import { SearchIcon, SunIcon, MoonIcon } from "./Icons";

export type NavView = "documents" | "library" | "settings";

interface LecternHeaderProps {
  isDark?: boolean;
  onToggleDark?: () => void;
  activeView?: NavView;
  onChangeView?: (v: NavView) => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const LecternHeader: React.FC<LecternHeaderProps> = ({
  isDark = false,
  onToggleDark,
  activeView = "documents",
  onChangeView,
  sidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const s = isDark ? ds : ls;
  const navItems: { k: NavView; label: string }[] = [
    { k: "documents", label: "Documents" },
    { k: "library", label: "Library" },
    { k: "settings", label: "Settings" },
  ];

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 36px",
        borderBottom: `1px solid ${s.border}`,
        background: s.bg,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onToggleSidebar}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: `1px solid ${s.border}`,
            background: sidebarCollapsed ? s.ink : s.surface,
            color: sidebarCollapsed ? s.bg : s.ink2,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            marginRight: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 6h18"/><path d="M3 12h12"/><path d="M3 18h18"/>
          </svg>
        </button>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: s.ink,
            color: s.bg,
            display: "grid",
            placeItems: "center",
            fontFamily: '"Instrument Serif", serif',
            fontSize: 18,
            fontStyle: "italic",
            lineHeight: 1,
          }}
        >
          L
        </div>
        <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, letterSpacing: "-0.01em", color: s.ink }}>
          Lectern
        </div>
        <span
          style={{
            fontSize: 11,
            color: s.ink3,
            padding: "3px 8px",
            borderRadius: 999,
            border: `1px solid ${s.border}`,
            marginLeft: 4,
          }}
        >
          OCR
        </span>
      </div>
      <nav style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 13, color: s.ink2, fontFamily: '"Inter", system-ui, sans-serif' }}>
        {navItems.map((n) => (
          <span
            key={n.k}
            onClick={() => onChangeView?.(n.k)}
            style={{
              color: activeView === n.k ? s.ink : s.ink2,
              fontWeight: activeView === n.k ? 500 : 400,
              cursor: "pointer",
              paddingBottom: 2,
              borderBottom: activeView === n.k ? `2px solid ${s.accent}` : "2px solid transparent",
            }}
          >
            {n.label}
          </span>
        ))}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 12px",
            border: `1px solid ${s.border}`,
            borderRadius: 999,
            background: s.surface,
            color: s.ink3,
            fontSize: 12,
            width: 200,
            fontFamily: '"Inter", system-ui, sans-serif',
          }}
        >
          <SearchIcon size={13} />
          <span>Search documents</span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              fontFamily: '"JetBrains Mono", monospace',
              background: s.bg,
              padding: "2px 5px",
              borderRadius: 4,
            }}
          >
            ⌘K
          </span>
        </div>
        <button
          onClick={onToggleDark}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: `1px solid ${s.border}`,
            background: s.surface,
            color: s.ink2,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
          aria-label="Toggle dark mode"
        >
          {isDark ? <SunIcon size={14} /> : <MoonIcon size={14} />}
        </button>
      </div>
    </header>
  );
};
