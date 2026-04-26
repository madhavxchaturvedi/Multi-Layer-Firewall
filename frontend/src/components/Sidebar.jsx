// Sidebar.jsx — Vantix Design System
import { useDispatch, useSelector } from "react-redux";
import { setActiveTab, activateDemo, deactivateDemo } from "../store/wafSlice";
import { useTheme } from "./ThemeProvider";
import { useToast } from "./Toast";
import { generatePDFReport } from "../lib/pdfReport";
import { C, F } from "../lib/ds";

const NAV = [
  { id: "dashboard", label: "Dashboard", dot: null },
  { id: "livefeed", label: "Live Feed", dot: "blocked" },
  { id: "worldmap", label: "World Map", dot: "blocked" },
  { id: "timeline", label: "Threat Timeline", dot: null },
  { id: "rules", label: "Rule Engine", dot: null },
  { id: "ips", label: "IP Manager", dot: null },
  { id: "webhooks", label: "Webhooks", dot: null },
  { id: "simulator", label: "Simulator", dot: null },
  { id: "logs", label: "Audit Logs", dot: null },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { theme, toggle } = useTheme();
  const { activeTab, connected, stats, rules, events, demoMode } = useSelector(
    (s) => s.waf,
  );
  const light = theme === "light";
  const bg = light ? C.lSurface : C.s1;
  const bdr = light ? C.lBdr : C.bdr;
  const tp = light ? C.lTextPri : C.textPri;
  const ts = light ? C.lTextSec : C.textSec;
  const tm = light ? C.lTextMut : C.textMut;

  function handleDemo() {
    if (demoMode) {
      dispatch(deactivateDemo());
      toast.push({
        type: "info",
        title: "Demo Off",
        message: "Showing live backend data.",
      });
    } else {
      dispatch(activateDemo());
      toast.push({
        type: "success",
        title: "Demo Mode On",
        message: "80 realistic attacks loaded.",
        duration: 6000,
      });
    }
  }
  function handlePDF() {
    if (!stats && !events.length) {
      toast.push({
        type: "error",
        title: "No Data",
        message: "Enable Demo Mode first.",
      });
      return;
    }
    toast.push({
      type: "info",
      title: "Generating…",
      message: "Opening PDF in new window.",
    });
    setTimeout(() => generatePDFReport(stats, events, rules), 200);
  }

  const s = (id) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    padding: "8px 10px",
    borderRadius: "6px",
    border:
      activeTab === id
        ? `1px solid rgba(196,18,48,0.3)`
        : "1px solid transparent",
    background: activeTab === id ? "rgba(196,18,48,0.1)" : "transparent",
    color: activeTab === id ? C.textPri : ts,
    fontFamily: F.sans,
    fontSize: "13px",
    fontWeight: activeTab === id ? 500 : 400,
    cursor: "pointer",
    transition: "all 0.18s ease",
    textAlign: "left",
  });

  const actionBtn = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "7px 10px",
    borderRadius: "6px",
    border: `1px solid ${bdr}`,
    background: "transparent",
    color: ts,
    fontFamily: F.mono,
    fontSize: "11px",
    cursor: "pointer",
    transition: "all 0.18s ease",
  };

  return (
    <aside
      style={{
        width: "220px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: bg,
        borderRight: `1px solid ${bdr}`,
      }}
    >
      {/* Logo */}
      <div
        style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${bdr}` }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Icon mark */}
          <div
            style={{
              width: "30px",
              height: "30px",
              background: C.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                border: `2px solid ${C.crim}`,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: "3px",
                  height: "3px",
                  background: C.crim,
                }}
              />
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: F.display,
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: tp,
                lineHeight: 1,
              }}
            >
              VANTIX
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "8px",
                color: tm,
                letterSpacing: "0.18em",
                marginTop: "2px",
              }}
            >
              WAF DASHBOARD
            </div>
          </div>
        </div>
      </div>

      {/* Connection status */}
      <div
        style={{ padding: "8px 16px 10px", borderBottom: `1px solid ${bdr}` }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: connected ? C.greenL : "#52525e",
              flexShrink: 0,
              boxShadow: connected ? `0 0 6px ${C.greenL}` : "none",
            }}
          />
          <span style={{ fontFamily: F.mono, fontSize: "10px", color: ts }}>
            {demoMode ? "⚡ Demo mode" : connected ? "Live" : "Offline"}
          </span>
          {stats && (
            <span
              style={{
                marginLeft: "auto",
                fontFamily: F.mono,
                fontSize: "9px",
                color: tm,
              }}
            >
              {stats.totalRequests} req
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => dispatch(setActiveTab(item.id))}
            style={s(item.id)}
            onMouseEnter={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.color = tp;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = ts;
              }
            }}
          >
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.dot === "blocked" && stats?.totalBlocked > 0 && (
              <span
                style={{
                  background: C.crim,
                  color: "#fff",
                  fontFamily: F.mono,
                  fontSize: "9px",
                  padding: "1px 6px",
                  borderRadius: "100px",
                  flexShrink: 0,
                }}
              >
                {stats.totalBlocked}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Mini stats */}
      {stats && (
        <div
          style={{
            padding: "10px 16px",
            borderTop: `1px solid ${bdr}`,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "8px",
                color: tm,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Blocked
            </div>
            <div
              style={{
                fontFamily: F.display,
                fontSize: "18px",
                fontWeight: 700,
                color: C.crim,
                letterSpacing: "-0.02em",
              }}
            >
              {(stats.totalBlocked || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "8px",
                color: tm,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Rate
            </div>
            <div
              style={{
                fontFamily: F.display,
                fontSize: "18px",
                fontWeight: 700,
                color: C.textPri,
                letterSpacing: "-0.02em",
              }}
            >
              {stats.blockRate || 0}%
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          padding: "8px 8px 10px",
          borderTop: `1px solid ${bdr}`,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <button
          onClick={handleDemo}
          style={{
            ...actionBtn,
            background: demoMode ? "rgba(124,58,237,0.12)" : "transparent",
            color: demoMode ? C.purpleL : ts,
            borderColor: demoMode ? "rgba(124,58,237,0.3)" : bdr,
          }}
          onMouseEnter={(e) => {
            if (!demoMode) e.currentTarget.style.color = tp;
          }}
          onMouseLeave={(e) => {
            if (!demoMode) e.currentTarget.style.color = ts;
          }}
        >
          <span style={{ fontSize: "10px" }}>{demoMode ? "●" : "○"}</span>
          <span>{demoMode ? "Exit Demo" : "Demo Mode"}</span>
          {demoMode && (
            <span
              style={{
                marginLeft: "auto",
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: C.purpleL,
                animation: "pulseCrim 1.5s ease-in-out infinite",
              }}
            />
          )}
        </button>
        <button
          onClick={handlePDF}
          style={actionBtn}
          onMouseEnter={(e) => (e.currentTarget.style.color = tp)}
          onMouseLeave={(e) => (e.currentTarget.style.color = ts)}
        >
          <span style={{ fontSize: "10px" }}>↓</span>
          <span>Export Report</span>
        </button>
        <button
          onClick={toggle}
          style={actionBtn}
          onMouseEnter={(e) => (e.currentTarget.style.color = tp)}
          onMouseLeave={(e) => (e.currentTarget.style.color = ts)}
        >
          <span style={{ fontSize: "10px" }}>{light ? "☾" : "☀"}</span>
          <span>{light ? "Dark Mode" : "Light Mode"}</span>
        </button>
      </div>

      {/* WAF mode */}
      <div style={{ padding: "10px 16px 14px", borderTop: `1px solid ${bdr}` }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: "8px",
            color: tm,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            marginBottom: "6px",
          }}
        >
          Mode
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            border: `1px solid rgba(196,18,48,0.3)`,
            background: "rgba(196,18,48,0.08)",
            padding: "4px 10px",
            borderRadius: "4px",
          }}
        >
          <div
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: C.crim,
              animation: "pulseCrim 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontFamily: F.mono,
              fontSize: "10px",
              fontWeight: 600,
              color: C.crim,
              letterSpacing: "0.12em",
            }}
          >
            BLOCK
          </span>
        </div>
      </div>
    </aside>
  );
}
