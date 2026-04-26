// StatCard.jsx — Vantix Design System
import { C, F } from "../lib/ds";
import { useTheme } from "./ThemeProvider";

const ACCENT = {
  red: {
    text: C.crim,
    glow: "rgba(196,18,48,0.15)",
    border: "rgba(196,18,48,0.2)",
  },
  green: {
    text: C.greenL,
    glow: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.2)",
  },
  blue: {
    text: "#60a5fa",
    glow: "rgba(96,165,250,0.1)",
    border: "rgba(96,165,250,0.2)",
  },
  yellow: {
    text: "#fbbf24",
    glow: "rgba(251,191,36,0.1)",
    border: "rgba(251,191,36,0.2)",
  },
  purple: {
    text: "#c084fc",
    glow: "rgba(192,132,252,0.1)",
    border: "rgba(192,132,252,0.2)",
  },
  cyan: {
    text: "#22d3ee",
    glow: "rgba(34,211,238,0.1)",
    border: "rgba(34,211,238,0.2)",
  },
};

export default function StatCard({ label, value, sub, color = "red", icon }) {
  const { theme } = useTheme();
  const light = theme === "light";
  const ac = ACCENT[color] || ACCENT.red;

  return (
    <div
      style={{
        background: light ? C.lSurface : C.s1,
        border: `1px solid ${light ? C.lBdr : C.bdr}`,
        borderRadius: "10px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = ac.border)}
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = light ? C.lBdr : C.bdr)
      }
    >
      {/* Subtle glow top-right */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "80px",
          height: "80px",
          background: ac.glow,
          borderRadius: "0 10px 0 80px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          fontFamily: F.mono,
          fontSize: "9px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: light ? C.lTextMut : C.textMut,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: F.display,
          fontSize: "clamp(24px,3vw,32px)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: ac.text,
          lineHeight: 1,
        }}
      >
        {value ?? "—"}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: F.mono,
            fontSize: "10px",
            color: light ? C.lTextMut : C.textMut,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
