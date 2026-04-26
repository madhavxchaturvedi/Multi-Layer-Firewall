// pages/Simulator.jsx — Vantix Design System
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { simulateAttack, clearSimResult } from "../store/wafSlice";
import { useTheme } from "../components/ThemeProvider";
import { C, F, card, SEV_COLORS } from "../lib/ds";
import axios from "axios";

const ATTACKS = [
  {
    id: "sqli",
    label: "SQL Injection",
    sev: "critical",
    desc: "Sends ' OR 1=1 -- to the WAF",
    payload: "' OR 1=1 -- ",
    url: "/api/login",
    paramKey: "id",
    paramVal: "' OR 1=1 -- ",
  },
  {
    id: "xss",
    label: "XSS Attack",
    sev: "high",
    desc: "Injects <script>alert('xss')</script>",
    payload: "<script>alert('xss')</script>",
    url: "/search",
    paramKey: "q",
    paramVal: "<script>alert('xss')</script>",
  },
  {
    id: "path",
    label: "Path Traversal",
    sev: "high",
    desc: "Tries ../../etc/passwd traversal",
    payload: "../../etc/passwd",
    url: "/file",
    paramKey: "name",
    paramVal: "../../etc/passwd",
  },
  {
    id: "cmdi",
    label: "Cmd Injection",
    sev: "critical",
    desc: "Sends ; cat /etc/passwd payload",
    payload: "; cat /etc/passwd",
    url: "/exec",
    paramKey: "cmd",
    paramVal: "; cat /etc/passwd",
  },
  {
    id: "ssrf",
    label: "SSRF",
    sev: "critical",
    desc: "Tries cloud metadata endpoint",
    payload: "http://169.254.169.254",
    url: "/fetch",
    paramKey: "url",
    paramVal: "http://169.254.169.254",
  },
  {
    id: "scanner",
    label: "Scanner Bot",
    sev: "medium",
    desc: "Sends sqlmap user-agent header",
    payload: "sqlmap/1.7.8",
    url: "/login",
    paramKey: null,
  },
  {
    id: "honeypot",
    label: "Honeypot Trip",
    sev: "critical",
    desc: "Requests /wp-admin to trip honeypot",
    payload: "/wp-admin",
    url: "/wp-admin",
  },
  {
    id: "blind_sqli",
    label: "Blind SQLi",
    sev: "critical",
    desc: "Time-based blind SQL via SLEEP()",
    payload: "1; SELECT SLEEP(5)--",
    url: "/api/user",
    paramKey: "id",
    paramVal: "1; SELECT SLEEP(5)--",
  },
];

const SEV_ACCENT = {
  critical: {
    border: "rgba(196,18,48,0.3)",
    bg: "rgba(196,18,48,0.06)",
    hover: "rgba(196,18,48,0.12)",
    text: C.crim,
  },
  high: {
    border: "rgba(217,119,6,0.3)",
    bg: "rgba(217,119,6,0.06)",
    hover: "rgba(217,119,6,0.12)",
    text: "#f59e0b",
  },
  medium: {
    border: "rgba(202,138,4,0.3)",
    bg: "rgba(202,138,4,0.06)",
    hover: "rgba(202,138,4,0.12)",
    text: "#fbbf24",
  },
  low: {
    border: "rgba(22,163,74,0.3)",
    bg: "rgba(22,163,74,0.06)",
    hover: "rgba(22,163,74,0.12)",
    text: C.greenL,
  },
};

export default function Simulator() {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const light = theme === "light";

  const [firing, setFiring] = useState(null);
  const [results, setResults] = useState([]);
  const [customPayload, setCustomPayload] = useState("");
  const [customUrl, setCustomUrl] = useState("/test");
  const [firingAll, setFiringAll] = useState(false);

  const tp = light ? C.lTextPri : C.textPri;
  const ts = light ? C.lTextSec : C.textSec;
  const tm = light ? C.lTextMut : C.textMut;
  const bdr = light ? C.lBdr : C.bdr;
  const bg2 = light ? C.lS2 : C.s2;

  async function fireAttack(attack) {
    setFiring(attack.id);
    try {
      let res;
      if (attack.id === "scanner") {
        res = await axios.get(`http://localhost:4000${attack.url}`, {
          headers: { "User-Agent": attack.payload },
          validateStatus: () => true,
        });
      } else if (attack.id === "honeypot") {
        res = await axios.get(`http://localhost:4000${attack.url}`, {
          validateStatus: () => true,
        });
      } else if (attack.paramKey) {
        res = await axios.get(`http://localhost:4000${attack.url}`, {
          params: { [attack.paramKey]: attack.paramVal },
          validateStatus: () => true,
        });
      } else {
        res = await axios.get(`http://localhost:4000${attack.url}`, {
          validateStatus: () => true,
        });
      }
      setResults((prev) =>
        [
          {
            id: Date.now(),
            attack: attack.label,
            sev: attack.sev,
            blocked: res.status === 403,
            status: res.status,
            payload: attack.payload,
            ts: new Date().toLocaleTimeString(),
          },
          ...prev,
        ].slice(0, 25),
      );
    } catch {
      setResults((prev) =>
        [
          {
            id: Date.now(),
            attack: attack.label,
            sev: attack.sev,
            blocked: true,
            status: "ERR",
            payload: attack.payload,
            ts: new Date().toLocaleTimeString(),
          },
          ...prev,
        ].slice(0, 25),
      );
    }
    setFiring(null);
  }

  async function fireAll() {
    setFiringAll(true);
    for (const a of ATTACKS) {
      await fireAttack(a);
      await new Promise((r) => setTimeout(r, 280));
    }
    setFiringAll(false);
  }

  async function fireCustom() {
    setFiring("custom");
    try {
      const res = await axios.get(`http://localhost:4000${customUrl}`, {
        params: { payload: customPayload },
        validateStatus: () => true,
      });
      setResults((prev) =>
        [
          {
            id: Date.now(),
            attack: "Custom",
            sev: "unknown",
            blocked: res.status === 403,
            status: res.status,
            payload: customPayload,
            ts: new Date().toLocaleTimeString(),
          },
          ...prev,
        ].slice(0, 25),
      );
    } catch {}
    setFiring(null);
  }

  const blockedCount = results.filter((r) => r.blocked).length;
  const detectionRate =
    results.length > 0 ? Math.round((blockedCount / results.length) * 100) : 0;

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
            // Attack Simulator
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
            Test Your Defenses
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: "11px",
              color: tm,
              marginTop: "4px",
            }}
          >
            Fire real attacks against the WAF — watch them get caught in the
            Live Feed
          </div>
        </div>
        <button
          onClick={fireAll}
          disabled={!!firing || firingAll}
          style={{
            padding: "9px 22px",
            borderRadius: "6px",
            border: `1px solid rgba(196,18,48,0.4)`,
            background: firingAll
              ? "rgba(196,18,48,0.2)"
              : "rgba(196,18,48,0.12)",
            color: C.crim,
            fontFamily: F.mono,
            fontSize: "11px",
            fontWeight: 600,
            cursor: firing || firingAll ? "not-allowed" : "pointer",
            transition: "all 0.18s",
            opacity: firing || firingAll ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!firing && !firingAll)
              e.currentTarget.style.background = "rgba(196,18,48,0.22)";
          }}
          onMouseLeave={(e) => {
            if (!firingAll)
              e.currentTarget.style.background = "rgba(196,18,48,0.12)";
          }}
        >
          {firingAll ? "⟳ Firing all…" : "⚡ Fire All Attacks"}
        </button>
      </div>

      {/* Results summary */}
      {results.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "10px",
          }}
        >
          {[
            { l: "Blocked", v: blockedCount, c: C.crim },
            { l: "Passed", v: results.length - blockedCount, c: C.greenL },
            { l: "Detection Rate", v: `${detectionRate}%`, c: "#fbbf24" },
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
                  fontSize: "26px",
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
      )}

      {/* Attack cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
          gap: "10px",
        }}
      >
        {ATTACKS.map((attack) => {
          const lastResult = results.find((r) => r.attack === attack.label);
          const ac = SEV_ACCENT[attack.sev] || SEV_ACCENT.medium;
          const isFiring = firing === attack.id;
          return (
            <button
              key={attack.id}
              onClick={() => fireAttack(attack)}
              disabled={!!firing || firingAll}
              style={{
                border: `1px solid ${ac.border}`,
                background: ac.bg,
                borderRadius: "8px",
                padding: "16px",
                textAlign: "left",
                cursor: firing || firingAll ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                opacity: firing && !isFiring ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!firing && !firingAll)
                  e.currentTarget.style.background = ac.hover;
              }}
              onMouseLeave={(e) => (e.currentTarget.style.background = ac.bg)}
            >
              {/* Top row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    fontFamily: F.mono,
                    fontSize: "9px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: ac.text,
                    background: `${ac.text}18`,
                    padding: "2px 7px",
                    borderRadius: "3px",
                  }}
                >
                  {attack.sev}
                </span>
                {lastResult && (
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: "3px",
                      background: lastResult.blocked
                        ? "rgba(22,163,74,0.15)"
                        : "rgba(196,18,48,0.15)",
                      color: lastResult.blocked ? C.greenL : C.crim,
                    }}
                  >
                    {lastResult.blocked ? "✓ BLOCKED" : "✗ PASSED"}
                  </span>
                )}
                {isFiring && (
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontSize: "9px",
                      color: tm,
                      animation: "pulseCrim 1s ease-in-out infinite",
                    }}
                  >
                    firing…
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: F.display,
                  fontSize: "15px",
                  fontWeight: 600,
                  color: tp,
                  letterSpacing: "-0.01em",
                  marginBottom: "5px",
                }}
              >
                {attack.label}
              </div>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: "10px",
                  color: ts,
                  lineHeight: 1.65,
                  marginBottom: "8px",
                }}
              >
                {attack.desc}
              </div>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: "9px",
                  color: tm,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {attack.payload}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom payload */}
      <div style={{ ...card(light), padding: "18px" }}>
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
          // Custom Payload
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="/api/endpoint"
            style={{
              width: "130px",
              background: bg2,
              border: `1px solid ${bdr}`,
              borderRadius: "6px",
              padding: "8px 12px",
              fontFamily: F.mono,
              fontSize: "11px",
              color: tp,
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = C.crim)}
            onBlur={(e) => (e.target.style.borderColor = bdr)}
          />
          <input
            value={customPayload}
            onChange={(e) => setCustomPayload(e.target.value)}
            placeholder="Enter any payload…"
            style={{
              flex: 1,
              minWidth: "180px",
              background: bg2,
              border: `1px solid ${bdr}`,
              borderRadius: "6px",
              padding: "8px 12px",
              fontFamily: F.mono,
              fontSize: "11px",
              color: tp,
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = C.crim)}
            onBlur={(e) => (e.target.style.borderColor = bdr)}
          />
          <button
            onClick={fireCustom}
            disabled={!!firing || !customPayload}
            style={{
              padding: "8px 20px",
              borderRadius: "6px",
              border: `1px solid rgba(124,58,237,0.4)`,
              background: "rgba(124,58,237,0.12)",
              color: C.purpleL,
              fontFamily: F.mono,
              fontSize: "11px",
              fontWeight: 600,
              cursor: !firing && customPayload ? "pointer" : "not-allowed",
              transition: "all 0.18s",
              opacity: !firing && customPayload ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (!firing && customPayload)
                e.currentTarget.style.background = "rgba(124,58,237,0.22)";
            }}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(124,58,237,0.12)")
            }
          >
            Fire
          </button>
        </div>
      </div>

      {/* Result log */}
      {results.length > 0 && (
        <div style={{ ...card(light), overflow: "hidden", padding: 0 }}>
          <div
            style={{
              padding: "11px 18px",
              borderBottom: `1px solid ${bdr}`,
              display: "flex",
              alignItems: "center",
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
              // Simulation Log
            </span>
            <button
              onClick={() => setResults([])}
              style={{
                fontFamily: F.mono,
                fontSize: "9px",
                color: tm,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>
          {results.map((r) => (
            <div
              key={r.id}
              style={{
                padding: "9px 18px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                borderBottom: `1px solid ${light ? C.lBdr : C.bdrS}`,
                animation: "slideUp 0.25s ease-out",
              }}
            >
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: "9px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "3px",
                  flexShrink: 0,
                  background: r.blocked
                    ? "rgba(22,163,74,0.15)"
                    : "rgba(196,18,48,0.15)",
                  color: r.blocked ? C.greenL : C.crim,
                }}
              >
                {r.blocked ? "BLOCKED" : "PASSED"}
              </span>
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: "11px",
                  color: ts,
                  width: "110px",
                  flexShrink: 0,
                }}
              >
                {r.attack}
              </span>
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: "10px",
                  color: tm,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.payload}
              </span>
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: "9px",
                  color: tm,
                  flexShrink: 0,
                }}
              >
                HTTP {r.status}
              </span>
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: "9px",
                  color: tm,
                  flexShrink: 0,
                }}
              >
                {r.ts}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
