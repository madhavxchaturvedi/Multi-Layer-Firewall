// pages/IPManager.jsx — Vantix Design System
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBanned,
  banIP,
  unbanIP,
  fetchSuspicious,
  allowIP,
} from "../store/wafSlice";
import { useTheme } from "../components/ThemeProvider";
import { C, F, card } from "../lib/ds";

export default function IPManager() {
  const dispatch = useDispatch();
  const { banned, suspicious } = useSelector((s) => s.waf);
  const { theme } = useTheme();
  const light = theme === "light";

  const [tab, setTab] = useState("banned");
  const [form, setForm] = useState({ ip: "", reason: "", permanent: false });
  const [allowForm, setAllowForm] = useState("");
  const [msg, setMsg] = useState(null);

  const tp = light ? C.lTextPri : C.textPri;
  const ts = light ? C.lTextSec : C.textSec;
  const tm = light ? C.lTextMut : C.textMut;
  const bdr = light ? C.lBdr : C.bdr;
  const bg1 = light ? C.lSurface : C.s1;
  const bg2 = light ? C.lS2 : C.s2;

  useEffect(() => {
    dispatch(fetchBanned());
    dispatch(fetchSuspicious());
  }, [dispatch]);

  function showMsg(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  }

  async function handleBan(e) {
    e.preventDefault();
    if (!form.ip) return;
    await dispatch(banIP(form));
    dispatch(fetchBanned());
    showMsg("success", `${form.ip} banned`);
    setForm({ ip: "", reason: "", permanent: false });
  }
  async function handleUnban(ip) {
    await dispatch(unbanIP(ip));
    showMsg("info", `${ip} unbanned`);
  }
  async function handleAllow(e) {
    e.preventDefault();
    if (!allowForm) return;
    await dispatch(allowIP(allowForm));
    showMsg("success", `${allowForm} added to allowlist`);
    setAllowForm("");
  }
  async function handleBanSuspicious(ip) {
    await dispatch(
      banIP({ ip, reason: "Promoted from suspicious list", permanent: false }),
    );
    dispatch(fetchBanned());
    dispatch(fetchSuspicious());
    showMsg("success", `${ip} banned`);
  }

  const TABS = [
    { id: "banned", label: `Banned (${banned.length})` },
    { id: "suspicious", label: `Suspicious (${suspicious?.length || 0})` },
    { id: "allowlist", label: "Allowlist" },
    { id: "honeypot", label: "Honeypot" },
  ];

  const tabBtn = (id) => ({
    padding: "6px 14px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontFamily: F.mono,
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    transition: "all 0.15s",
    background: tab === id ? "rgba(196,18,48,0.15)" : "transparent",
    color: tab === id ? C.crim : tm,
    fontWeight: tab === id ? 600 : 400,
  });

  const inputStyle = {
    background: bg2,
    border: `1px solid ${bdr}`,
    borderRadius: "6px",
    padding: "8px 12px",
    fontFamily: F.mono,
    fontSize: "11px",
    color: tp,
    outline: "none",
    width: "100%",
  };

  function ScoreBar({ score = 0 }) {
    const pct = Math.min((score / 80) * 100, 100);
    const color = score >= 80 ? C.crim : score >= 40 ? "#d97706" : "#ca8a04";
    return (
      <div
        style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}
      >
        <div
          style={{
            flex: 1,
            height: "4px",
            background: light ? C.lS2 : C.s3,
            borderRadius: "2px",
            overflow: "hidden",
            maxWidth: "100px",
          }}
        >
          <div
            style={{
              height: "100%",
              background: color,
              borderRadius: "2px",
              width: `${pct}%`,
              transition: "width 0.5s ease",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: "10px",
            color,
            fontWeight: 600,
            width: "24px",
          }}
        >
          {score}
        </span>
      </div>
    );
  }

  const MsgBanner = () =>
    msg ? (
      <div
        style={{
          padding: "9px 14px",
          borderRadius: "7px",
          fontFamily: F.mono,
          fontSize: "11px",
          border: `1px solid`,
          background:
            msg.type === "success"
              ? "rgba(22,163,74,0.1)"
              : msg.type === "error"
                ? "rgba(196,18,48,0.1)"
                : "rgba(37,99,235,0.1)",
          color:
            msg.type === "success"
              ? C.greenL
              : msg.type === "error"
                ? "#e55a73"
                : "#60a5fa",
          borderColor:
            msg.type === "success"
              ? "rgba(22,163,74,0.25)"
              : msg.type === "error"
                ? "rgba(196,18,48,0.25)"
                : "rgba(37,99,235,0.25)",
        }}
      >
        {msg.text}
      </div>
    ) : null;

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
          // IP Manager
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
          IP Intelligence
        </div>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: "11px",
            color: tm,
            marginTop: "4px",
          }}
        >
          Manage bans, suspicious IPs, allowlist and honeypot traps
        </div>
      </div>

      <MsgBanner />

      {/* Manual ban form */}
      <div style={{ ...card(light), padding: "20px" }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: "9px",
            color: tm,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            marginBottom: "16px",
          }}
        >
          // Manual IP Ban
        </div>
        <form
          onSubmit={handleBan}
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: "1 1 140px", minWidth: "130px" }}>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "9px",
                color: tm,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "5px",
              }}
            >
              IP Address
            </div>
            <input
              value={form.ip}
              onChange={(e) => setForm((f) => ({ ...f, ip: e.target.value }))}
              placeholder="192.168.1.100"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = C.crim)}
              onBlur={(e) => (e.target.style.borderColor = bdr)}
            />
          </div>
          <div style={{ flex: "2 1 200px", minWidth: "160px" }}>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "9px",
                color: tm,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "5px",
              }}
            >
              Reason
            </div>
            <input
              value={form.reason}
              onChange={(e) =>
                setForm((f) => ({ ...f, reason: e.target.value }))
              }
              placeholder="Suspicious activity"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = C.crim)}
              onBlur={(e) => (e.target.style.borderColor = bdr)}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingBottom: "2px",
            }}
          >
            <input
              type="checkbox"
              id="perm"
              checked={form.permanent}
              onChange={(e) =>
                setForm((f) => ({ ...f, permanent: e.target.checked }))
              }
              style={{ accentColor: C.crim, width: "14px", height: "14px" }}
            />
            <label
              htmlFor="perm"
              style={{
                fontFamily: F.mono,
                fontSize: "11px",
                color: ts,
                cursor: "pointer",
              }}
            >
              Permanent
            </label>
          </div>
          <button
            type="submit"
            style={{
              padding: "8px 20px",
              background: "rgba(196,18,48,0.15)",
              border: `1px solid rgba(196,18,48,0.35)`,
              borderRadius: "6px",
              color: C.crim,
              fontFamily: F.mono,
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.18s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(196,18,48,0.25)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(196,18,48,0.15)")
            }
          >
            Ban IP
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          background: bg1,
          border: `1px solid ${bdr}`,
          borderRadius: "8px",
          padding: "4px",
          gap: "2px",
          width: "fit-content",
          flexWrap: "wrap",
        }}
      >
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={tabBtn(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BANNED ── */}
      {tab === "banned" && (
        <div style={{ ...card(light), overflow: "hidden", padding: 0 }}>
          <div
            style={{
              padding: "12px 20px",
              borderBottom: `1px solid ${bdr}`,
              display: "flex",
              justifyContent: "space-between",
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
              // Banned IPs
            </span>
            <span style={{ fontFamily: F.mono, fontSize: "9px", color: tm }}>
              {banned.length} entries
            </span>
          </div>
          {banned.length === 0 ? (
            <div
              style={{
                padding: "36px",
                textAlign: "center",
                fontFamily: F.mono,
                fontSize: "11px",
                color: tm,
              }}
            >
              No IPs currently banned
            </div>
          ) : (
            banned.map((b, i) => (
              <div
                key={i}
                style={{
                  padding: "11px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
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
                <div style={{ width: "140px", flexShrink: 0 }}>
                  <div
                    style={{ fontFamily: F.mono, fontSize: "11px", color: tp }}
                  >
                    {b.ip}
                  </div>
                  <div
                    style={{ fontFamily: F.mono, fontSize: "9px", color: tm }}
                  >
                    {b.geo?.country || "—"}
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    fontFamily: F.mono,
                    fontSize: "10px",
                    color: ts,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {b.reason || "No reason"}
                </div>
                {b.permanent && (
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontSize: "8px",
                      color: C.crim,
                      border: `1px solid rgba(196,18,48,0.3)`,
                      padding: "2px 6px",
                      borderRadius: "3px",
                      flexShrink: 0,
                    }}
                  >
                    PERM
                  </span>
                )}
                <button
                  onClick={() => handleUnban(b.ip)}
                  style={{
                    padding: "4px 12px",
                    border: `1px solid ${bdr}`,
                    borderRadius: "5px",
                    background: "transparent",
                    color: ts,
                    fontFamily: F.mono,
                    fontSize: "10px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(22,163,74,0.4)";
                    e.currentTarget.style.color = C.greenL;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = bdr;
                    e.currentTarget.style.color = ts;
                  }}
                >
                  Unban
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── SUSPICIOUS ── */}
      {tab === "suspicious" && (
        <div style={{ ...card(light), overflow: "hidden", padding: 0 }}>
          <div
            style={{
              padding: "12px 20px",
              borderBottom: `1px solid ${bdr}`,
              display: "flex",
              justifyContent: "space-between",
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
              // Suspicious IPs
            </span>
            <span style={{ fontFamily: F.mono, fontSize: "9px", color: tm }}>
              Score ≥ 80 = auto-ban
            </span>
          </div>
          {!suspicious || suspicious.length === 0 ? (
            <div
              style={{
                padding: "36px",
                textAlign: "center",
                fontFamily: F.mono,
                fontSize: "11px",
                color: tm,
              }}
            >
              No suspicious IPs tracked yet
            </div>
          ) : (
            suspicious.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "11px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
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
                <div style={{ width: "140px", flexShrink: 0 }}>
                  <div
                    style={{ fontFamily: F.mono, fontSize: "11px", color: tp }}
                  >
                    {s.ip}
                  </div>
                  <div
                    style={{ fontFamily: F.mono, fontSize: "9px", color: tm }}
                  >
                    {s.geo?.country || "—"}
                  </div>
                </div>
                <ScoreBar score={s.score || 0} />
                <span
                  style={{
                    fontFamily: F.mono,
                    fontSize: "10px",
                    color: tm,
                    flexShrink: 0,
                  }}
                >
                  {s.hits?.length || 0} hits
                </span>
                <button
                  onClick={() => handleBanSuspicious(s.ip)}
                  style={{
                    padding: "4px 12px",
                    border: `1px solid ${bdr}`,
                    borderRadius: "5px",
                    background: "transparent",
                    color: ts,
                    fontFamily: F.mono,
                    fontSize: "10px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(196,18,48,0.4)";
                    e.currentTarget.style.color = C.crim;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = bdr;
                    e.currentTarget.style.color = ts;
                  }}
                >
                  Ban
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── ALLOWLIST ── */}
      {tab === "allowlist" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ ...card(light), padding: "20px" }}>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "9px",
                color: tm,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                marginBottom: "8px",
              }}
            >
              // Add to Allowlist
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "11px",
                color: ts,
                lineHeight: 1.7,
                marginBottom: "14px",
              }}
            >
              Allowlisted IPs skip all WAF checks and are never blocked.
            </div>
            <form
              onSubmit={handleAllow}
              style={{ display: "flex", gap: "10px" }}
            >
              <input
                value={allowForm}
                onChange={(e) => setAllowForm(e.target.value)}
                placeholder="IP address to allowlist…"
                style={{ ...inputStyle, flex: 1 }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(22,163,74,0.5)")
                }
                onBlur={(e) => (e.target.style.borderColor = bdr)}
              />
              <button
                type="submit"
                style={{
                  padding: "8px 20px",
                  background: "rgba(22,163,74,0.12)",
                  border: `1px solid rgba(22,163,74,0.3)`,
                  borderRadius: "6px",
                  color: C.greenL,
                  fontFamily: F.mono,
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.18s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(22,163,74,0.2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(22,163,74,0.12)")
                }
              >
                Add
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── HONEYPOT ── */}
      {tab === "honeypot" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ ...card(light), padding: "20px" }}>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "9px",
                color: tm,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                marginBottom: "8px",
              }}
            >
              // Active Honeypot Paths
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "11px",
                color: ts,
                lineHeight: 1.7,
                marginBottom: "16px",
              }}
            >
              Requests to these paths permanently ban the attacker instantly.
              Zero false positives.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {"/admin-secret,/wp-admin,/.env,/config.php,/backup.sql"
                .split(",")
                .map((p, i) => (
                  <span
                    key={i}
                    style={{
                      fontFamily: F.mono,
                      fontSize: "11px",
                      color: C.crim,
                      background: "rgba(196,18,48,0.1)",
                      border: `1px solid rgba(196,18,48,0.25)`,
                      padding: "5px 12px",
                      borderRadius: "5px",
                    }}
                  >
                    {p.trim()}
                  </span>
                ))}
            </div>
          </div>
          <div style={{ ...card(light), padding: "20px" }}>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "9px",
                color: tm,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                marginBottom: "8px",
              }}
            >
              // How to Change
            </div>
            <pre
              style={{
                fontFamily: F.mono,
                fontSize: "11px",
                color: ts,
                background: light ? C.lS2 : C.s2,
                borderRadius: "6px",
                padding: "12px",
                margin: 0,
                overflowX: "auto",
              }}
            >
              HONEYPOT_PATHS=/admin-secret,/wp-admin,/.env
            </pre>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "10px",
                color: tm,
                marginTop: "8px",
              }}
            >
              Edit in <code style={{ color: ts }}>backend/.env</code> then
              restart.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
