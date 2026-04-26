// pages/AuditLogs.jsx — Vantix Design System
import { useSelector } from "react-redux";
import { useState } from "react";
import { CategoryBadge, BlockedBadge } from "../components/EventBadge";
import { formatTime } from "../lib/utils";
import { useTheme } from "../components/ThemeProvider";
import { C, F, card } from "../lib/ds";

export default function AuditLogs() {
  const { events } = useSelector((s) => s.waf);
  const { theme } = useTheme();
  const light = theme === "light";
  const [page, setPage] = useState(0);
  const [filterBlocked, setFilterBlocked] = useState("all");
  const PER_PAGE = 50;

  const tp = light ? C.lTextPri : C.textPri;
  const ts = light ? C.lTextSec : C.textSec;
  const tm = light ? C.lTextMut : C.textMut;
  const bdr = light ? C.lBdr : C.bdr;
  const bg1 = light ? C.lSurface : C.s1;
  const bg2 = light ? C.lS2 : C.s2;

  const filtered = events.filter((e) => {
    if (filterBlocked === "blocked") return e.blocked;
    if (filterBlocked === "allowed") return !e.blocked;
    return true;
  });

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const slice = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const blockedCount = events.filter((e) => e.blocked).length;
  const allowedCount = events.length - blockedCount;

  function downloadCSV() {
    const headers = [
      "timestamp",
      "blocked",
      "category",
      "severity",
      "method",
      "url",
      "ip",
      "country",
      "ruleId",
      "reason",
    ];
    const rows = events.map((e) =>
      headers
        .map((h) => {
          const val = e[h] ?? "";
          return typeof val === "string" && val.includes(",")
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        })
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vantix-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(events, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vantix-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filterBtn = (f) => ({
    padding: "5px 14px",
    border: "none",
    borderRadius: "5px",
    fontFamily: F.mono,
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    cursor: "pointer",
    transition: "all 0.15s",
    background: filterBlocked === f ? "rgba(196,18,48,0.15)" : "transparent",
    color: filterBlocked === f ? C.crim : tm,
    fontWeight: filterBlocked === f ? 600 : 400,
  });

  const exportBtn = (color) => ({
    padding: "7px 16px",
    border: `1px solid ${color}55`,
    borderRadius: "6px",
    background: `${color}10`,
    color: color,
    fontFamily: F.mono,
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.18s",
  });

  return (
    <div
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: "9px",
              color: C.crim,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            // Audit Logs
          </div>
          <div
            style={{
              fontFamily: F.display,
              fontSize: "24px",
              fontWeight: 700,
              color: tp,
              letterSpacing: "-0.02em",
            }}
          >
            Event History
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: "11px",
              color: tm,
              marginTop: "4px",
            }}
          >
            {events.length} events in memory
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={downloadCSV}
            style={exportBtn(C.greenL)}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = `${C.greenL}22`)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = `${C.greenL}10`)
            }
          >
            ↓ CSV
          </button>
          <button
            onClick={downloadJSON}
            style={exportBtn(ts)}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = `rgba(255,255,255,0.08)`)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0)")
            }
          >
            ↓ JSON
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "10px",
        }}
      >
        {[
          { l: "Total Events", v: events.length, c: "#60a5fa" },
          { l: "Blocked", v: blockedCount, c: C.crim },
          { l: "Allowed", v: allowedCount, c: C.greenL },
        ].map((s) => (
          <div key={s.l} style={{ ...card(light), padding: "14px 18px" }}>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "8px",
                color: tm,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                marginBottom: "4px",
              }}
            >
              {s.l}
            </div>
            <div
              style={{
                fontFamily: F.display,
                fontSize: "24px",
                fontWeight: 700,
                color: s.c,
                letterSpacing: "-0.02em",
              }}
            >
              {s.v.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            background: bg1,
            border: `1px solid ${bdr}`,
            borderRadius: "7px",
            padding: "3px",
            gap: "2px",
          }}
        >
          {["all", "blocked", "allowed"].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilterBlocked(f);
                setPage(0);
              }}
              style={filterBtn(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <span style={{ fontFamily: F.mono, fontSize: "10px", color: tm }}>
          {filtered.length} matching
        </span>
      </div>

      {/* Table */}
      <div style={{ ...card(light), overflow: "hidden", padding: 0 }}>
        {/* Column headers */}
        <div
          style={{
            padding: "8px 18px",
            borderBottom: `1px solid ${bdr}`,
            display: "grid",
            gridTemplateColumns: "72px 66px 110px 52px 1fr 110px 36px",
            gap: "0 12px",
            fontFamily: F.mono,
            fontSize: "8px",
            color: tm,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          <span>Time</span>
          <span>Status</span>
          <span>Category</span>
          <span>Method</span>
          <span>URL</span>
          <span>IP</span>
          <span>CC</span>
        </div>

        {/* Rows */}
        <div>
          {slice.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                fontFamily: F.mono,
                fontSize: "11px",
                color: tm,
              }}
            >
              No log entries yet
            </div>
          ) : (
            slice.map((ev, i) => (
              <div
                key={ev.id || i}
                style={{
                  padding: "9px 18px",
                  display: "grid",
                  gridTemplateColumns: "72px 66px 110px 52px 1fr 110px 36px",
                  gap: "0 12px",
                  alignItems: "center",
                  borderBottom: `1px solid ${light ? C.lBdr : C.bdrS}`,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = light ? C.lS1 : C.s2)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <span
                  style={{ fontFamily: F.mono, fontSize: "10px", color: tm }}
                >
                  {formatTime(ev.timestamp)}
                </span>
                <BlockedBadge blocked={ev.blocked} />
                <CategoryBadge category={ev.category} />
                <span
                  style={{ fontFamily: F.mono, fontSize: "10px", color: ts }}
                >
                  {ev.method}
                </span>
                <span
                  style={{
                    fontFamily: F.mono,
                    fontSize: "11px",
                    color: ts,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {ev.url}
                </span>
                <span
                  style={{
                    fontFamily: F.mono,
                    fontSize: "10px",
                    color: tm,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {ev.ip}
                </span>
                <span
                  style={{ fontFamily: F.mono, fontSize: "10px", color: tm }}
                >
                  {ev.country || "—"}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div
            style={{
              padding: "11px 18px",
              borderTop: `1px solid ${bdr}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: "10px", color: tm }}>
              Page {page + 1} of {pages}
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                [
                  "← Prev",
                  () => setPage((p) => Math.max(0, p - 1)),
                  page === 0,
                ],
                [
                  "Next →",
                  () => setPage((p) => Math.min(pages - 1, p + 1)),
                  page >= pages - 1,
                ],
              ].map(([label, fn, disabled]) => (
                <button
                  key={label}
                  onClick={fn}
                  disabled={disabled}
                  style={{
                    padding: "5px 14px",
                    border: `1px solid ${bdr}`,
                    borderRadius: "5px",
                    background: "transparent",
                    color: disabled ? tm : ts,
                    fontFamily: F.mono,
                    fontSize: "10px",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.4 : 1,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled) e.currentTarget.style.color = tp;
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled) e.currentTarget.style.color = ts;
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
