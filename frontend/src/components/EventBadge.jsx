// EventBadge.jsx — Vantix Design System
import { CAT_COLORS, SEV_COLORS, C, F, CATEGORY_LABEL } from "../lib/ds";

export { CATEGORY_LABEL } from "../lib/ds";

export function CategoryBadge({ category }) {
  const col = CAT_COLORS[category] || {
    bg: "rgba(100,100,110,0.12)",
    text: "#a1a1aa",
    border: "rgba(100,100,110,0.25)",
  };
  return (
    <span
      style={{
        fontFamily: F.mono,
        fontSize: "9px",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: "3px",
        background: col.bg,
        color: col.text,
        border: `1px solid ${col.border}`,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {CATEGORY_LABEL[category] || category || "—"}
    </span>
  );
}

export function SeverityDot({ severity }) {
  const col = SEV_COLORS[severity] || SEV_COLORS.low;
  return (
    <span
      style={{
        display: "inline-block",
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: col.dot,
        flexShrink: 0,
        boxShadow: `0 0 6px ${col.dot}55`,
      }}
    />
  );
}

export function SeverityBadge({ severity }) {
  const col = SEV_COLORS[severity] || SEV_COLORS.low;
  return (
    <span
      style={{
        fontFamily: F.mono,
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: "3px",
        background: col.bg,
        color: col.text,
      }}
    >
      {severity || "—"}
    </span>
  );
}

export function BlockedBadge({ blocked }) {
  return blocked ? (
    <span
      style={{
        fontFamily: F.mono,
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "0.06em",
        padding: "2px 7px",
        borderRadius: "3px",
        background: "rgba(196,18,48,0.12)",
        color: "#e55a73",
        border: "1px solid rgba(196,18,48,0.25)",
      }}
    >
      BLOCKED
    </span>
  ) : (
    <span
      style={{
        fontFamily: F.mono,
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "0.06em",
        padding: "2px 7px",
        borderRadius: "3px",
        background: "rgba(22,163,74,0.1)",
        color: "#4ade80",
        border: "1px solid rgba(22,163,74,0.25)",
      }}
    >
      PASSED
    </span>
  );
}
