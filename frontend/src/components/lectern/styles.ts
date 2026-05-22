// Lectern style constants + animation injection
// Direction 01 — Editorial calm. Cream + ink. Document-translator layout.

export const lecternStyles = {
  bg: "#F7F4ED",
  surface: "#FFFFFF",
  ink: "#1A1814",
  ink2: "#5C5851",
  ink3: "#9E9A92",
  border: "#E8E2D5",
  accent: "#2C3E7A",
  accentSoft: "#E4E8F2",
  success: "#5A7A4F",
  err: "#B5453A",
  paper: "#FBF8F1",
};

export type LecternTheme = typeof lecternStyles;

export const lecternDark = {
  bg: "#14110C",
  surface: "#1B1813",
  ink: "#F7F4ED",
  ink2: "#A89F8E",
  ink3: "#665E51",
  border: "#2A251D",
  accent: "#7B8FBF",
  accentSoft: "#1F2438",
  success: "#7A9A6F",
  err: "#D5655A",
  paper: "#181410",
};

export type LecternDarkTheme = typeof lecternDark;

let injected = false;
export function injectLecternAnimations() {
  if (typeof document === "undefined" || injected) return;
  injected = true;
  const st = document.createElement("style");
  st.id = "lectern-anim";
  st.textContent = `
    @keyframes lectern-blink { 0%,49% { opacity:1 } 50%,100% { opacity:0 } }
    @keyframes lectern-scan { 0% { top:0% } 100% { top:100% } }
    @keyframes lectern-progress { 0% { width:0% } 100% { width:62% } }
    @keyframes lectern-pulse { 0%,100% { transform:scale(1); opacity:0.7 } 50% { transform:scale(1.06); opacity:1 } }
    @keyframes lectern-drift { 0%,100% { transform:translateY(0) rotate(-4deg) } 50% { transform:translateY(-4px) rotate(-3deg) } }
    @keyframes lectern-spin { 0% { transform:rotate(0deg) } 100% { transform:rotate(360deg) } }
    @keyframes lectern-fade { 0% { opacity:0; transform:translateY(4px) } 100% { opacity:1; transform:translateY(0) } }
    @keyframes lectern-tick { 0%,25% { opacity:0.3 } 30%,75% { opacity:1 } 80%,100% { opacity:0.3 } }
    @keyframes lectern-line-scan { 0% { background-position:-120% 0 } 100% { background-position:220% 0 } }
    .lec-cursor { display:inline-block; width:8px; height:14px; background:#2C3E7A; margin-left:2px; vertical-align:middle; animation:lectern-blink 1s infinite }
    .lec-scan { animation:lectern-scan 3.5s ease-in-out infinite }
    .lec-progress { animation:lectern-progress 2.5s ease-out forwards }
    .lec-pulse { animation:lectern-pulse 1.6s ease-in-out infinite }
    .lec-drift { animation:lectern-drift 3s ease-in-out infinite }
    .lec-spin { animation:lectern-spin 1.4s linear infinite; transform-origin:center }
    .lec-fade { animation:lectern-fade 0.6s ease-out backwards }
    .lec-tick { animation:lectern-tick 1.6s ease-in-out infinite }
    .lec-line-scan { background: linear-gradient(90deg, transparent 0%, rgba(44,62,122,0.18) 45%, rgba(44,62,122,0.18) 55%, transparent 100%); background-size: 50% 100%; background-repeat: no-repeat; animation: lectern-line-scan 0.7s ease-out forwards }
  `;
  document.head.appendChild(st);
}
