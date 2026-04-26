// lib/ds.js — Vantix Design System
// Single source of truth. Every dashboard component imports from here.
// Dark mode: ink-black base, crimson accent, cream text
// Light mode: cream base, ink text, crimson accent

export const C = {
  ink: "#0a0a0a",
  surface: "#0f1115",
  s1: "#141418",
  s2: "#1a1a1f",
  s3: "#222228",
  cream: "#fafaf8",
  lSurface: "#ffffff",
  lS1: "#f5f5f3",
  lS2: "#eeede9",
  crim: "#c41230",
  crimH: "#e8112d",
  crimD: "#9a0e24",
  green: "#16a34a",
  greenL: "#22c55e",
  amber: "#d97706",
  amberL: "#f59e0b",
  blue: "#2563eb",
  blueL: "#3b82f6",
  purple: "#7c3aed",
  purpleL: "#a855f7",
  cyan: "#0891b2",
  cyanL: "#06b6d4",
  textPri: "#f0ede8",
  textSec: "#8a8a94",
  textMut: "#52525e",
  lTextPri: "#0a0a0a",
  lTextSec: "#5c6b7a",
  lTextMut: "#9aa5af",
  bdr: "rgba(255,255,255,0.06)",
  bdrM: "rgba(255,255,255,0.1)",
  bdrS: "rgba(255,255,255,0.04)",
  lBdr: "rgba(10,10,10,0.08)",
  lBdrM: "rgba(10,10,10,0.14)",
};

export const F = {
  display: '"Clash Display", sans-serif',
  sans: '"DM Sans", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
  serif: '"Instrument Serif", serif',
};

export function card(isLight) {
  return {
    background: isLight ? C.lSurface : C.s1,
    border: `1px solid ${isLight ? C.lBdr : C.bdr}`,
    borderRadius: "10px",
  };
}

export function sectionLabel() {
  return {
    fontFamily: F.mono,
    fontSize: "9px",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: C.crim,
    marginBottom: "12px",
  };
}

export function pageHeading(isLight) {
  return {
    fontFamily: F.display,
    fontWeight: 700,
    fontSize: "clamp(22px,3vw,30px)",
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
    color: isLight ? C.lTextPri : C.textPri,
  };
}

export function sectionHeading(isLight) {
  return {
    fontFamily: F.mono,
    fontSize: "9px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: isLight ? C.lTextMut : C.textMut,
    marginBottom: "16px",
  };
}

export function dataText(isLight) {
  return {
    fontFamily: F.mono,
    fontSize: "11px",
    color: isLight ? C.lTextSec : C.textSec,
  };
}

export const CAT_COLORS = {
  sqli: {
    bg: "rgba(196,18,48,0.12)",
    text: "#e55a73",
    border: "rgba(196,18,48,0.25)",
  },
  xss: {
    bg: "rgba(217,119,6,0.12)",
    text: "#f59e0b",
    border: "rgba(217,119,6,0.25)",
  },
  path_traversal: {
    bg: "rgba(124,58,237,0.12)",
    text: "#a78bfa",
    border: "rgba(124,58,237,0.25)",
  },
  cmdi: {
    bg: "rgba(8,145,178,0.12)",
    text: "#22d3ee",
    border: "rgba(8,145,178,0.25)",
  },
  ssrf: {
    bg: "rgba(37,99,235,0.12)",
    text: "#60a5fa",
    border: "rgba(37,99,235,0.25)",
  },
  xxe: {
    bg: "rgba(236,72,153,0.12)",
    text: "#f472b6",
    border: "rgba(236,72,153,0.25)",
  },
  scanner: {
    bg: "rgba(100,100,110,0.12)",
    text: "#a1a1aa",
    border: "rgba(100,100,110,0.25)",
  },
  header_injection: {
    bg: "rgba(22,163,74,0.12)",
    text: "#4ade80",
    border: "rgba(22,163,74,0.25)",
  },
  rate_limit: {
    bg: "rgba(217,119,6,0.12)",
    text: "#fbbf24",
    border: "rgba(217,119,6,0.25)",
  },
  honeypot: {
    bg: "rgba(196,18,48,0.12)",
    text: "#e55a73",
    border: "rgba(196,18,48,0.25)",
  },
  geo_block: {
    bg: "rgba(8,145,178,0.12)",
    text: "#38bdf8",
    border: "rgba(8,145,178,0.25)",
  },
  ip_ban: {
    bg: "rgba(196,18,48,0.12)",
    text: "#e55a73",
    border: "rgba(196,18,48,0.25)",
  },
  test: {
    bg: "rgba(100,100,110,0.12)",
    text: "#a1a1aa",
    border: "rgba(100,100,110,0.25)",
  },
};

export const SEV_COLORS = {
  critical: { bg: "rgba(196,18,48,0.12)", text: "#e55a73", dot: "#c41230" },
  high: { bg: "rgba(217,119,6,0.12)", text: "#f59e0b", dot: "#d97706" },
  medium: { bg: "rgba(234,179,8,0.1)", text: "#facc15", dot: "#ca8a04" },
  low: { bg: "rgba(22,163,74,0.1)", text: "#4ade80", dot: "#16a34a" },
};

export function chartTooltip(isLight) {
  return {
    background: isLight ? C.lSurface : "#18181c",
    border: `1px solid ${isLight ? C.lBdrM : C.bdrM}`,
    borderRadius: "6px",
    padding: "8px 12px",
    fontFamily: F.mono,
    fontSize: "11px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
  };
}

export const CHART_COLORS = [
  "#c41230",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#2563eb",
  "#16a34a",
  "#9333ea",
];

export function axisStyle(isLight) {
  return {
    fill: isLight ? "#9aa5af" : "#52525e",
    fontSize: 9,
    fontFamily: "JetBrains Mono, monospace",
  };
}

export const CATEGORY_LABEL = {
  sqli: "SQL Injection",
  xss: "XSS",
  path_traversal: "Path Traversal",
  cmdi: "Cmd Injection",
  ssrf: "SSRF",
  xxe: "XXE",
  scanner: "Scanner",
  header_injection: "Header Injection",
  rate_limit: "Rate Limit",
  honeypot: "Honeypot",
  geo_block: "Geo Block",
  ip_ban: "IP Ban",
  test: "Test",
};
