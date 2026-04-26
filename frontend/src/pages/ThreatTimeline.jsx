// pages/ThreatTimeline.jsx — Vantix Design System
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { banIP, unbanIP } from "../store/wafSlice";
import { CategoryBadge, SeverityDot } from "../components/EventBadge";
import { useTheme } from "../components/ThemeProvider";
import { C, F, card, SEV_COLORS } from "../lib/ds";
import { formatTime, timeAgo } from "../lib/utils";

function threatLevel(score) {
  if (score >= 80) return { label: "CRITICAL", color: C.crim };
  if (score >= 40) return { label: "HIGH", color: "#d97706" };
  if (score >= 15) return { label: "MEDIUM", color: "#ca8a04" };
  return { label: "LOW", color: C.greenL };
}

function ScoreArc({ score }) {
  const pct = Math.min(score / 80, 1);
  const R = 28,
    stroke = 5,
    circ = 2 * Math.PI * R;
  const color =
    score >= 80
      ? C.crim
      : score >= 40
        ? "#d97706"
        : score >= 15
          ? "#ca8a04"
          : C.greenL;
  return (
    <svg width="70" height="70" style={{ flexShrink: 0 }}>
      <circle
        cx="35"
        cy="35"
        r={R}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      <circle
        cx="35"
        cy="35"
        r={R}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform="rotate(-90 35 35)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text
        x="35"
        y="38"
        textAnchor="middle"
        fontFamily={F.display}
        fontSize="13"
        fontWeight="700"
        fill={color}
      >
        {score}
      </text>
    </svg>
  );
}

export default function ThreatTimeline() {
  const dispatch = useDispatch();
  const { events, banned } = useSelector((s) => s.waf);
  const { theme } = useTheme();
  const light = theme === "light";
  const [selectedIP, setSelectedIP] = useState(null);
  const [search, setSearch] = useState("");

  const tp = light ? C.lTextPri : C.textPri;
  const ts = light ? C.lTextSec : C.textSec;
  const tm = light ? C.lTextMut : C.textMut;
  const bdr = light ? C.lBdr : C.bdr;
  const bg1 = light ? C.lSurface : C.s1;
  const bg2 = light ? C.lS2 : C.s2;

  // Build per-IP map
  const ipMap = {};
  for (const ev of events) {
    if (!ev.ip) continue;
    if (!ipMap[ev.ip])
      ipMap[ev.ip] = {
        ip: ev.ip,
        country: ev.country || "XX",
        total: 0,
        blocked: 0,
        score: 0,
        firstSeen: ev.timestamp,
        lastSeen: ev.timestamp,
        events: [],
        categories: {},
      };
    const e = ipMap[ev.ip];
    e.total++;
    e.lastSeen = ev.timestamp;
    e.events.push(ev);
    if (ev.blocked) {
      e.blocked++;
      const pts = { critical: 40, high: 25, medium: 15, low: 5 };
      e.score += pts[ev.severity] || 0;
      if (ev.category)
        e.categories[ev.category] = (e.categories[ev.category] || 0) + 1;
    }
  }

  const ipList = Object.values(ipMap)
    .filter((e) => e.blocked > 0 || e.total > 5)
    .filter(
      (e) => !search || e.ip.includes(search) || e.country?.includes(search),
    )
    .sort((a, b) => b.score - a.score);

  const selected = selectedIP ? ipMap[selectedIP] : null;
  const isBanned = selected ? banned.some((b) => b.ip === selected.ip) : false;
  const tl = selected ? threatLevel(selected.score) : null;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Left: IP list */}
      <div
        style={{
          width: "260px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: `1px solid ${bdr}`,
          background: bg1,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px",
            borderBottom: `1px solid ${bdr}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: F.mono,
              fontSize: "9px",
              color: C.crim,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              marginBottom: "10px",
            }}
          >
            // Threat Timeline
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search IP or country…"
            style={{
              width: "100%",
              background: bg2,
              border: `1px solid ${bdr}`,
              borderRadius: "6px",
              padding: "7px 11px",
              fontFamily: F.mono,
              fontSize: "11px",
              color: tp,
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = C.crim)}
            onBlur={(e) => (e.target.style.borderColor = bdr)}
          />
        </div>
        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {ipList.length === 0 ? (
            <div
              style={{
                padding: "24px 16px",
                fontFamily: F.mono,
                fontSize: "11px",
                color: tm,
                textAlign: "center",
                lineHeight: 1.8,
              }}
            >
              No threat data yet.
              <br />
              Fire some attacks in
              <br />
              the Simulator.
            </div>
          ) : (
            ipList.map((entry) => {
              const tl = threatLevel(entry.score);
              const isSel = selectedIP === entry.ip;
              return (
                <div
                  key={entry.ip}
                  onClick={() => setSelectedIP(entry.ip)}
                  style={{
                    padding: "12px 14px",
                    cursor: "pointer",
                    borderLeft: `2px solid ${isSel ? C.crim : "transparent"}`,
                    borderBottom: `1px solid ${light ? C.lBdr : C.bdrS}`,
                    background: isSel
                      ? light
                        ? "rgba(196,18,48,0.04)"
                        : C.s2
                      : "transparent",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSel)
                      e.currentTarget.style.background = light ? C.lS1 : C.s2;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSel)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: F.mono,
                        fontSize: "11px",
                        color: tp,
                        fontWeight: 500,
                      }}
                    >
                      {entry.ip}
                    </span>
                    <span
                      style={{
                        fontFamily: F.mono,
                        fontSize: "8px",
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: "3px",
                        background: `${tl.color}18`,
                        color: tl.color,
                      }}
                    >
                      {tl.label}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      fontFamily: F.mono,
                      fontSize: "9px",
                      color: tm,
                    }}
                  >
                    <span>{entry.country}</span>
                    <span style={{ color: C.crim }}>
                      {entry.blocked} blocked
                    </span>
                    <span>score {entry.score}</span>
                  </div>
                  <div
                    style={{
                      fontFamily: F.mono,
                      fontSize: "9px",
                      color: light ? C.lTextMut : C.textMut,
                      marginTop: "2px",
                    }}
                  >
                    {timeAgo(entry.lastSeen)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: detail */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: light ? C.lS1 : C.surface,
        }}
      >
        {!selected ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "10px",
              color: tm,
            }}
          >
            <div style={{ fontSize: "32px", opacity: 0.3 }}>◎</div>
            <div style={{ fontFamily: F.mono, fontSize: "11px" }}>
              Select an IP to view threat timeline
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {/* IP header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <ScoreArc score={selected.score} />
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: F.display,
                        fontSize: "22px",
                        fontWeight: 700,
                        color: tp,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {selected.ip}
                    </span>
                    <span
                      style={{
                        fontFamily: F.mono,
                        fontSize: "9px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: `${tl.color}18`,
                        color: tl.color,
                        border: `1px solid ${tl.color}40`,
                      }}
                    >
                      {tl.label} THREAT
                    </span>
                    {isBanned && (
                      <span
                        style={{
                          fontFamily: F.mono,
                          fontSize: "9px",
                          color: C.crim,
                          border: `1px solid rgba(196,18,48,0.3)`,
                          padding: "3px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        BANNED
                      </span>
                    )}
                  </div>
                  <div
                    style={{ fontFamily: F.mono, fontSize: "11px", color: tm }}
                  >
                    {selected.country}
                    {selected.city ? ` / ${selected.city}` : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {isBanned ? (
                  <button
                    onClick={() => dispatch(unbanIP(selected.ip))}
                    style={{
                      padding: "7px 18px",
                      borderRadius: "6px",
                      border: `1px solid rgba(22,163,74,0.35)`,
                      background: "rgba(22,163,74,0.1)",
                      color: C.greenL,
                      fontFamily: F.mono,
                      fontSize: "11px",
                      cursor: "pointer",
                      transition: "all 0.18s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(22,163,74,0.2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "rgba(22,163,74,0.1)")
                    }
                  >
                    Unban
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      dispatch(
                        banIP({
                          ip: selected.ip,
                          reason: "Manual ban from timeline",
                          permanent: false,
                        }),
                      )
                    }
                    style={{
                      padding: "7px 18px",
                      borderRadius: "6px",
                      border: `1px solid rgba(196,18,48,0.35)`,
                      background: "rgba(196,18,48,0.1)",
                      color: C.crim,
                      fontFamily: F.mono,
                      fontSize: "11px",
                      cursor: "pointer",
                      transition: "all 0.18s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(196,18,48,0.2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "rgba(196,18,48,0.1)")
                    }
                  >
                    Ban IP
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))",
                gap: "10px",
              }}
            >
              {[
                {
                  l: "Threat Score",
                  v: selected.score,
                  c:
                    selected.score >= 80
                      ? C.crim
                      : selected.score >= 40
                        ? "#d97706"
                        : "#ca8a04",
                },
                { l: "Total Requests", v: selected.total, c: C.blueL },
                { l: "Blocked", v: selected.blocked, c: C.crim },
                {
                  l: "Block Rate",
                  v: `${selected.total > 0 ? Math.round((selected.blocked / selected.total) * 100) : 0}%`,
                  c: "#fbbf24",
                },
              ].map((s) => (
                <div key={s.l} style={{ ...card(light), padding: "14px 16px" }}>
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
                      fontSize: "22px",
                      fontWeight: 700,
                      color: s.c,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {s.v}
                  </div>
                </div>
              ))}
            </div>

            {/* Categories */}
            {Object.keys(selected.categories).length > 0 && (
              <div style={{ ...card(light), padding: "16px" }}>
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: "9px",
                    color: tm,
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    marginBottom: "12px",
                  }}
                >
                  // Attack categories used
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {Object.entries(selected.categories)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => (
                      <div
                        key={cat}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          background: light ? bg2 : C.s2,
                          border: `1px solid ${bdr}`,
                          borderRadius: "6px",
                          padding: "5px 10px",
                        }}
                      >
                        <CategoryBadge category={cat} />
                        <span
                          style={{
                            fontFamily: F.mono,
                            fontSize: "10px",
                            color: tm,
                          }}
                        >
                          {count}×
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div style={{ ...card(light), overflow: "hidden", padding: 0 }}>
              <div
                style={{
                  padding: "12px 18px",
                  borderBottom: `1px solid ${bdr}`,
                }}
              >
                <span
                  style={{
                    fontFamily: F.mono,
                    fontSize: "9px",
                    color: tm,
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                  }}
                >
                  // Full event timeline ({selected.events.length} events)
                </span>
              </div>
              <div>
                {selected.events.slice(0, 50).map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 18px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
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
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        flexShrink: 0,
                        marginTop: "3px",
                      }}
                    >
                      <SeverityDot severity={ev.severity} />
                      {i < selected.events.length - 1 && (
                        <div
                          style={{
                            width: "1px",
                            height: "16px",
                            background: bdr,
                            margin: "4px 0",
                          }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginBottom: "2px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: F.mono,
                            fontSize: "10px",
                            color: tm,
                          }}
                        >
                          {formatTime(ev.timestamp)}
                        </span>
                        {ev.blocked ? (
                          <span
                            style={{
                              fontFamily: F.mono,
                              fontSize: "9px",
                              color: C.crim,
                            }}
                          >
                            BLOCKED
                          </span>
                        ) : (
                          <span
                            style={{
                              fontFamily: F.mono,
                              fontSize: "9px",
                              color: C.greenL,
                            }}
                          >
                            PASSED
                          </span>
                        )}
                        {ev.category && (
                          <CategoryBadge category={ev.category} />
                        )}
                      </div>
                      <div
                        style={{
                          fontFamily: F.mono,
                          fontSize: "10px",
                          color: ts,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ev.method} {ev.url}
                      </div>
                      {ev.reason && (
                        <div
                          style={{
                            fontFamily: F.mono,
                            fontSize: "9px",
                            color: tm,
                            marginTop: "2px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ev.reason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
