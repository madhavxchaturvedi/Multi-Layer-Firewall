// pages/Webhooks.jsx — Vantix Design System
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchWebhooks,
  addWebhook,
  deleteWebhook,
  toggleWebhook,
  testWebhook,
} from "../store/wafSlice";
import { useTheme } from "../components/ThemeProvider";
import { C, F, card } from "../lib/ds";

const TYPE_INFO = {
  slack: {
    label: "Slack",
    hint: "https://hooks.slack.com/services/…",
    color: "#c084fc",
  },
  discord: {
    label: "Discord",
    hint: "https://discord.com/api/webhooks/…",
    color: "#818cf8",
  },
  custom: {
    label: "Custom JSON",
    hint: "https://your-server.com/webhook",
    color: C.textSec,
  },
};
const SEV = ["low", "medium", "high", "critical"];
const SEV_COLOR = {
  low: C.greenL,
  medium: "#fbbf24",
  high: "#f59e0b",
  critical: C.crim,
};

export default function Webhooks() {
  const dispatch = useDispatch();
  const { webhooks } = useSelector((s) => s.waf);
  const { theme } = useTheme();
  const light = theme === "light";

  const [form, setForm] = useState({
    name: "",
    url: "",
    type: "slack",
    minSeverity: "high",
  });
  const [msg, setMsg] = useState(null);
  const [testing, setTesting] = useState(null);

  const tp = light ? C.lTextPri : C.textPri;
  const ts = light ? C.lTextSec : C.textSec;
  const tm = light ? C.lTextMut : C.textMut;
  const bdr = light ? C.lBdr : C.bdr;
  const bg2 = light ? C.lS2 : C.s2;

  useEffect(() => {
    dispatch(fetchWebhooks());
  }, [dispatch]);

  function showMsg(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name || !form.url) {
      showMsg("error", "Name and URL are required");
      return;
    }
    await dispatch(addWebhook(form));
    dispatch(fetchWebhooks());
    showMsg("success", `Webhook "${form.name}" added`);
    setForm({ name: "", url: "", type: "slack", minSeverity: "high" });
  }

  async function handleTest(id) {
    setTesting(id);
    const res = await dispatch(testWebhook(id));
    setTesting(null);
    if (res.payload?.ok) showMsg("success", "Test alert sent successfully!");
    else showMsg("error", "Test failed — check your webhook URL");
  }

  const inputStyle = {
    width: "100%",
    background: bg2,
    border: `1px solid ${bdr}`,
    borderRadius: "6px",
    padding: "8px 12px",
    fontFamily: F.mono,
    fontSize: "11px",
    color: tp,
    outline: "none",
  };

  const pillBtn = (active, color) => ({
    flex: 1,
    padding: "5px 10px",
    border: `1px solid ${active ? color + "55" : "transparent"}`,
    borderRadius: "5px",
    background: active ? `${color}18` : "transparent",
    color: active ? color : tm,
    fontFamily: F.mono,
    fontSize: "9px",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.15s",
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
          // Webhooks
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
          Alert Webhooks
        </div>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: "11px",
            color: tm,
            marginTop: "4px",
          }}
        >
          Send real-time attack alerts to Slack, Discord, or any HTTP endpoint
        </div>
      </div>

      {msg && (
        <div
          style={{
            padding: "9px 14px",
            borderRadius: "7px",
            fontFamily: F.mono,
            fontSize: "11px",
            border: "1px solid",
            background:
              msg.type === "success"
                ? "rgba(22,163,74,0.1)"
                : "rgba(196,18,48,0.1)",
            color: msg.type === "success" ? C.greenL : "#e55a73",
            borderColor:
              msg.type === "success"
                ? "rgba(22,163,74,0.25)"
                : "rgba(196,18,48,0.25)",
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Add form */}
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
          // Add Webhook
        </div>
        <form
          onSubmit={handleAdd}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div>
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
                Name
              </div>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Security Slack"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = C.crim)}
                onBlur={(e) => (e.target.style.borderColor = bdr)}
              />
            </div>
            <div>
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
                Type
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {Object.entries(TYPE_INFO).map(([t, info]) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    style={pillBtn(form.type === t, info.color)}
                  >
                    {info.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
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
              Webhook URL
            </div>
            <input
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder={TYPE_INFO[form.type]?.hint}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = C.crim)}
              onBlur={(e) => (e.target.style.borderColor = bdr)}
            />
          </div>
          <div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "9px",
                color: tm,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "6px",
              }}
            >
              Minimum Severity
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              {SEV.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, minSeverity: s }))}
                  style={pillBtn(form.minSeverity === s, SEV_COLOR[s])}
                >
                  {s}
                </button>
              ))}
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "10px",
                color: tm,
                marginTop: "6px",
              }}
            >
              Fires for <span style={{ color: tp }}>{form.minSeverity}</span>{" "}
              severity and above
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              style={{
                padding: "8px 22px",
                borderRadius: "6px",
                border: `1px solid rgba(37,99,235,0.4)`,
                background: "rgba(37,99,235,0.12)",
                color: "#60a5fa",
                fontFamily: F.mono,
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(37,99,235,0.22)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(37,99,235,0.12)")
              }
            >
              Add Webhook →
            </button>
          </div>
        </form>
      </div>

      {/* Webhook list */}
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
            // Active Webhooks
          </span>
          <span style={{ fontFamily: F.mono, fontSize: "9px", color: tm }}>
            {webhooks?.length || 0} configured
          </span>
        </div>
        {!webhooks || webhooks.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "11px",
                color: tm,
                marginBottom: "4px",
              }}
            >
              No webhooks configured
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "10px",
                color: light ? C.lTextMut : C.textMut,
              }}
            >
              Add a Slack or Discord URL above to get real-time attack alerts
            </div>
          </div>
        ) : (
          webhooks.map((wh, i) => (
            <div
              key={wh.id || i}
              style={{
                padding: "14px 20px",
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "3px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontFamily: F.display,
                      fontSize: "14px",
                      fontWeight: 600,
                      color: tp,
                    }}
                  >
                    {wh.name}
                  </span>
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontSize: "9px",
                      color: TYPE_INFO[wh.type]?.color || tm,
                    }}
                  >
                    {wh.type}
                  </span>
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontSize: "9px",
                      color: SEV_COLOR[wh.minSeverity] || tm,
                    }}
                  >
                    ≥ {wh.minSeverity}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: "10px",
                    color: tm,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {wh.url}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexShrink: 0,
                }}
              >
                {/* Test */}
                <button
                  onClick={() => handleTest(wh.id)}
                  disabled={testing === wh.id}
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
                    opacity: testing === wh.id ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = tp)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = ts)}
                >
                  {testing === wh.id ? "…" : "Test"}
                </button>
                {/* Toggle */}
                <button
                  onClick={() =>
                    dispatch(toggleWebhook(wh.id)).then(() =>
                      dispatch(fetchWebhooks()),
                    )
                  }
                  style={{
                    position: "relative",
                    width: "34px",
                    height: "18px",
                    borderRadius: "9px",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    background: wh.enabled
                      ? "rgba(196,18,48,0.4)"
                      : "rgba(255,255,255,0.08)",
                    padding: 0,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "2px",
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      background: wh.enabled ? C.crim : "#52525e",
                      transition: "all 0.2s",
                      left: wh.enabled ? "18px" : "2px",
                    }}
                  />
                </button>
                {/* Delete */}
                <button
                  onClick={() =>
                    dispatch(deleteWebhook(wh.id)).then(() =>
                      dispatch(fetchWebhooks()),
                    )
                  }
                  style={{
                    background: "none",
                    border: "none",
                    color: tm,
                    cursor: "pointer",
                    fontSize: "18px",
                    lineHeight: 1,
                    padding: "0 2px",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.crim)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = tm)}
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Setup guides */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
          gap: "10px",
        }}
      >
        {[
          {
            type: "Slack",
            color: "#c084fc",
            steps: [
              "Go to api.slack.com/apps → Create New App",
              'Add "Incoming Webhooks" feature',
              'Activate and click "Add New Webhook to Workspace"',
              "Copy the webhook URL and paste above",
            ],
          },
          {
            type: "Discord",
            color: "#818cf8",
            steps: [
              "Open Discord channel settings",
              "Go to Integrations → Webhooks",
              'Click "New Webhook", name it, copy URL',
              "Paste above and select Discord type",
            ],
          },
        ].map((g) => (
          <div key={g.type} style={{ ...card(light), padding: "18px" }}>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "9px",
                color: g.color,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                marginBottom: "10px",
              }}
            >
              // {g.type} Setup
            </div>
            <ol
              style={{
                paddingLeft: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {g.steps.map((step, i) => (
                <li
                  key={i}
                  style={{
                    fontFamily: F.mono,
                    fontSize: "10px",
                    color: ts,
                    lineHeight: 1.65,
                  }}
                >
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
