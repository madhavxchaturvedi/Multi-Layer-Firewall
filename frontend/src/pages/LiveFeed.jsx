// pages/LiveFeed.jsx — Vantix Design System
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  CategoryBadge,
  BlockedBadge,
  SeverityDot,
} from "../components/EventBadge";
import { formatTime } from "../lib/utils";
import { allowIP } from "../store/wafSlice";
import { useTheme } from "../components/ThemeProvider";
import { C, F, card } from "../lib/ds";
import axios from "axios";

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 14px",
        borderRadius: "5px",
        fontFamily: F.mono,
        fontSize: "10px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        cursor: "pointer",
        border: "none",
        background: active ? "rgba(196,18,48,0.15)" : "transparent",
        color: active ? C.crim : C.textMut,
        transition: "all 0.18s",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = C.textPri;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = C.textMut;
      }}
    >
      {children}
    </button>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontFamily: F.mono,
          fontSize: "9px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: C.textMut,
          marginBottom: "3px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: F.mono,
          fontSize: "11px",
          color: C.textPri,
          wordBreak: "break-all",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

export default function LiveFeed() {
  const { events, connected } = useSelector((s) => s.waf);
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const light = theme === "light";

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [replayResult, setReplay] = useState(null);
  const [replayLoading, setRepLoad] = useState(false);
  const [fpMsg, setFpMsg] = useState(null);

  const bdr = light ? C.lBdr : C.bdr;
  const bg1 = light ? C.lSurface : C.s1;
  const bg2 = light ? C.lS1 : C.s2;
  const tp = light ? C.lTextPri : C.textPri;
  const ts = light ? C.lTextSec : C.textSec;
  const tm = light ? C.lTextMut : C.textMut;

  const filtered = events.filter((e) => {
    if (filter === "blocked" && !e.blocked) return false;
    if (filter === "allowed" && e.blocked) return false;
    if (
      search &&
      !e.url?.includes(search) &&
      !e.ip?.includes(search) &&
      !e.category?.includes(search)
    )
      return false;
    return true;
  });

  async function handleReplay(ev) {
    setRepLoad(true);
    setReplay(null);
    try {
      const res = await axios.get(`http://localhost:4000${ev.url || "/"}`, {
        headers: {
          "X-Replay": "true",
          "User-Agent": ev.userAgent || "WAF-Replay/1.0",
        },
        validateStatus: () => true,
      });
      setReplay({ status: res.status, blocked: res.status === 403 });
    } catch {
      setReplay({ status: "ERR", blocked: true });
    }
    setRepLoad(false);
  }

  async function handleFP(ev) {
    await dispatch(allowIP(ev.ip));
    setFpMsg(`${ev.ip} added to allowlist`);
    setTimeout(() => setFpMsg(null), 4000);
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* ── Main list ─────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            padding: "12px 20px",
            borderBottom: `1px solid ${bdr}`,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
            background: bg1,
          }}
        >
          {/* Filter tabs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: light ? "rgba(10,10,10,0.04)" : C.s2,
              borderRadius: "7px",
              padding: "3px",
            }}
          >
            {["all", "blocked", "allowed"].map((f) => (
              <FilterBtn
                key={f}
                active={filter === f}
                onClick={() => setFilter(f)}
              >
                {f}
              </FilterBtn>
            ))}
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search IP, URL, category…"
            style={{
              flex: 1,
              background: light ? "rgba(10,10,10,0.04)" : C.s2,
              border: `1px solid ${bdr}`,
              borderRadius: "7px",
              padding: "6px 12px",
              fontFamily: F.mono,
              fontSize: "11px",
              color: tp,
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = C.crim)}
            onBlur={(e) => (e.target.style.borderColor = bdr)}
          />

          {/* Live dot + count */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: connected ? C.greenL : "#52525e",
                boxShadow: connected ? `0 0 6px ${C.greenL}` : "none",
              }}
            />
            <span style={{ fontFamily: F.mono, fontSize: "10px", color: tm }}>
              {filtered.length} events
            </span>
          </div>
        </div>

        {/* FP message */}
        {fpMsg && (
          <div
            style={{
              margin: "10px 20px 0",
              padding: "8px 14px",
              background: "rgba(22,163,74,0.1)",
              border: "1px solid rgba(22,163,74,0.25)",
              borderRadius: "6px",
              fontFamily: F.mono,
              fontSize: "11px",
              color: C.greenL,
            }}
          >
            {fpMsg}
          </div>
        )}

        {/* Column headers */}
        <div
          style={{
            padding: "6px 20px",
            display: "grid",
            gridTemplateColumns:
              "20px 72px 80px minmax(90px,auto) 1fr 110px 36px",
            gap: "0 12px",
            alignItems: "center",
            borderBottom: `1px solid ${bdr}`,
            flexShrink: 0,
          }}
        >
          {["", "Time", "Status", "Category", "URL", "IP", "CC"].map((h, i) => (
            <span
              key={i}
              style={{
                fontFamily: F.mono,
                fontSize: "9px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: tm,
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "10px",
              }}
            >
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: "28px",
                  color: C.textMut,
                }}
              >
                ◎
              </div>
              <div style={{ fontFamily: F.mono, fontSize: "12px", color: tm }}>
                No events match your filter
              </div>
            </div>
          ) : (
            filtered.map((ev, i) => {
              const isSel = selected?.id === ev.id;
              return (
                <div
                  key={ev.id || i}
                  onClick={() => {
                    setSelected(isSel ? null : ev);
                    setReplay(null);
                  }}
                  style={{
                    padding: "9px 20px",
                    display: "grid",
                    gridTemplateColumns:
                      "20px 72px 80px minmax(90px,auto) 1fr 110px 36px",
                    gap: "0 12px",
                    alignItems: "center",
                    borderBottom: `1px solid ${bdr}`,
                    borderLeft: isSel
                      ? `2px solid ${C.crim}`
                      : "2px solid transparent",
                    background: isSel
                      ? light
                        ? "rgba(196,18,48,0.04)"
                        : C.s2
                      : "transparent",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSel)
                      e.currentTarget.style.background = light
                        ? "rgba(10,10,10,0.03)"
                        : C.s2;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSel)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <SeverityDot severity={ev.severity} />
                  <span
                    style={{ fontFamily: F.mono, fontSize: "10px", color: tm }}
                  >
                    {formatTime(ev.timestamp)}
                  </span>
                  <div>
                    <BlockedBadge blocked={ev.blocked} />
                  </div>
                  <div>
                    <CategoryBadge category={ev.category} />
                  </div>
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
                    {ev.method} {ev.url}
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
              );
            })
          )}
        </div>
      </div>

      {/* ── Detail panel ──────────────────────────────────────────── */}
      {selected && (
        <div
          style={{
            width: "300px",
            flexShrink: 0,
            borderLeft: `1px solid ${bdr}`,
            background: bg1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${bdr}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "9px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: tm,
              }}
            >
              Event Detail
            </div>
            <button
              onClick={() => {
                setSelected(null);
                setReplay(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: tm,
                fontSize: "16px",
                cursor: "pointer",
                lineHeight: 1,
                padding: "0 2px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = tp)}
              onMouseLeave={(e) => (e.currentTarget.style.color = tm)}
            >
              ×
            </button>
          </div>

          {/* Panel body */}
          <div
            style={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <BlockedBadge blocked={selected.blocked} />

            {[
              ["Request ID", selected.requestId?.slice(0, 14) + "…"],
              ["Timestamp", new Date(selected.timestamp).toLocaleString()],
              ["IP Address", selected.ip],
              [
                "Country",
                `${selected.country || "—"}${selected.city ? " / " + selected.city : ""}`,
              ],
              ["Method", selected.method],
              ["URL", selected.url],
              [
                "User Agent",
                selected.userAgent?.slice(0, 55) +
                  (selected.userAgent?.length > 55 ? "…" : ""),
              ],
            ].map(([k, v]) => (
              <DetailRow key={k} label={k} value={v} />
            ))}

            {selected.blocked && (
              <>
                <div style={{ height: "1px", background: bdr }} />
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: "9px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: C.crim,
                  }}
                >
                  Attack Info
                </div>
                {[
                  ["Rule ID", selected.ruleId],
                  ["Rule Name", selected.ruleName],
                  ["Category", selected.category],
                  ["Severity", selected.severity],
                  ["Matched In", selected.matchedIn],
                  ["Reason", selected.reason],
                ].map(([k, v]) => (
                  <DetailRow key={k} label={k} value={v} />
                ))}

                {selected.payload && (
                  <div>
                    <div
                      style={{
                        fontFamily: F.mono,
                        fontSize: "9px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: tm,
                        marginBottom: "6px",
                      }}
                    >
                      Payload
                    </div>
                    <pre
                      style={{
                        fontFamily: F.mono,
                        fontSize: "10px",
                        color: "#f59e0b",
                        background: "rgba(245,158,11,0.06)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        borderRadius: "5px",
                        padding: "10px",
                        overflowX: "auto",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      {selected.payload.slice(0, 280)}
                    </pre>
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div style={{ height: "1px", background: bdr }} />
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "9px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: tm,
              }}
            >
              Actions
            </div>

            <button
              onClick={() => handleReplay(selected)}
              disabled={replayLoading}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: light ? "rgba(10,10,10,0.05)" : C.s2,
                border: `1px solid ${bdr}`,
                borderRadius: "6px",
                fontFamily: F.mono,
                fontSize: "11px",
                color: ts,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.18s",
                opacity: replayLoading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.crim;
                e.currentTarget.style.color = tp;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = bdr;
                e.currentTarget.style.color = ts;
              }}
            >
              {replayLoading ? "⟳  Replaying…" : "↺  Replay Request"}
            </button>

            {replayResult && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontFamily: F.mono,
                  fontSize: "11px",
                  background: replayResult.blocked
                    ? "rgba(196,18,48,0.1)"
                    : "rgba(22,163,74,0.1)",
                  color: replayResult.blocked ? "#e55a73" : "#4ade80",
                  border: `1px solid ${replayResult.blocked ? "rgba(196,18,48,0.25)" : "rgba(22,163,74,0.25)"}`,
                }}
              >
                HTTP {replayResult.status} —{" "}
                {replayResult.blocked ? "Blocked ✓" : "Passed"}
              </div>
            )}

            {selected.blocked && (
              <button
                onClick={() => handleFP(selected)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  borderRadius: "6px",
                  fontFamily: F.mono,
                  fontSize: "11px",
                  color: "#fbbf24",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.18s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(245,158,11,0.14)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(245,158,11,0.08)")
                }
              >
                ⚑ Mark as False Positive
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
