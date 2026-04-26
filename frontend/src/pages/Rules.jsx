// pages/Rules.jsx — Vantix Design System
import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import { useTheme } from "../components/ThemeProvider";
import { toggleRule, addCustomRule } from "../store/wafSlice";
import { C, F, card, SEV_COLORS } from "../lib/ds";

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const TARGETS = ["url", "query", "body", "headers"];

function SevBadge({ sev }) {
  const col = SEV_COLORS[sev] || SEV_COLORS.low;
  return (
    <span
      style={{
        fontFamily: F.mono,
        fontSize: "8px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: "3px",
        background: col.bg,
        color: col.text,
      }}
    >
      {sev}
    </span>
  );
}

function Toggle({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        width: "34px",
        height: "18px",
        borderRadius: "9px",
        border: "none",
        cursor: "pointer",
        transition: "background 0.2s",
        background: on ? "rgba(196,18,48,0.4)" : "rgba(255,255,255,0.08)",
        flexShrink: 0,
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
          background: on ? C.crim : "#52525e",
          transition: "all 0.2s",
          left: on ? "18px" : "2px",
        }}
      />
    </button>
  );
}

export default function Rules() {
  const dispatch = useDispatch();
  const { rules, disabledRules, stats } = useSelector((s) => s.waf);
  const { theme } = useTheme();
  const light = theme === "light";

  const [filterCat, setFilterCat] = useState("all");
  const [filterSev, setFilterSev] = useState("all");
  const [showBuilder, setShowBuilder] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    category: "custom",
    severity: "medium",
    pattern: "",
    description: "",
    targets: ["query", "body"],
  });
  const [builderMsg, setBuilderMsg] = useState(null);

  const tp = light ? C.lTextPri : C.textPri;
  const ts = light ? C.lTextSec : C.textSec;
  const tm = light ? C.lTextMut : C.textMut;
  const bdr = light ? C.lBdr : C.bdr;
  const bg1 = light ? C.lSurface : C.s1;
  const bg2 = light ? C.lS2 : C.s2;

  const categories = [...new Set(rules.map((r) => r.category))];
  const hitMap = stats?.attacksByCategory || {};
  const enabledCount = rules.filter(
    (r) => !disabledRules?.includes(r.id),
  ).length;

  const filtered = rules
    .filter((r) => filterCat === "all" || r.category === filterCat)
    .filter((r) => filterSev === "all" || r.severity === filterSev)
    .sort(
      (a, b) => (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9),
    );

  function handleAddRule(e) {
    e.preventDefault();
    if (!newRule.name || !newRule.pattern) {
      setBuilderMsg({ type: "error", text: "Name and pattern are required" });
      return;
    }
    try {
      new RegExp(newRule.pattern);
    } catch {
      setBuilderMsg({ type: "error", text: "Invalid regex pattern" });
      return;
    }
    dispatch(
      addCustomRule({ ...newRule, id: "CUSTOM-" + Date.now(), isCustom: true }),
    );
    setBuilderMsg({ type: "success", text: `Rule "${newRule.name}" added` });
    setNewRule({
      name: "",
      category: "custom",
      severity: "medium",
      pattern: "",
      description: "",
      targets: ["query", "body"],
    });
    setTimeout(() => setBuilderMsg(null), 3000);
  }

  function toggleTarget(t) {
    setNewRule((r) => ({
      ...r,
      targets: r.targets.includes(t)
        ? r.targets.filter((x) => x !== t)
        : [...r.targets, t],
    }));
  }

  const pillBtn = (active) => ({
    padding: "4px 12px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontFamily: F.mono,
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    transition: "all 0.15s",
    background: active ? "rgba(196,18,48,0.15)" : "transparent",
    color: active ? C.crim : tm,
    fontWeight: active ? 600 : 400,
  });

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
            // Rule Engine
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
            Detection Rules
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: "11px",
              color: tm,
              marginTop: "4px",
            }}
          >
            {enabledCount} of {rules.length} rules active · OWASP Top 10
            coverage
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontFamily: F.mono,
              fontSize: "10px",
              color: tm,
              background: bg1,
              border: `1px solid ${bdr}`,
              padding: "6px 14px",
              borderRadius: "6px",
            }}
          >
            {Object.values(hitMap).reduce((a, b) => a + b, 0)} total hits
          </div>
          <button
            onClick={() => setShowBuilder((b) => !b)}
            style={{
              padding: "7px 16px",
              borderRadius: "6px",
              border: `1px solid ${showBuilder ? "rgba(124,58,237,0.4)" : bdr}`,
              background: showBuilder ? "rgba(124,58,237,0.12)" : "transparent",
              color: showBuilder ? C.purpleL : ts,
              fontFamily: F.mono,
              fontSize: "11px",
              cursor: "pointer",
              transition: "all 0.18s",
            }}
          >
            {showBuilder ? "× Close Builder" : "+ Custom Rule"}
          </button>
        </div>
      </div>

      {/* Custom rule builder */}
      {showBuilder && (
        <div
          style={{
            ...card(light),
            padding: "20px",
            border: `1px solid rgba(124,58,237,0.3)`,
          }}
        >
          <div
            style={{
              fontFamily: F.mono,
              fontSize: "9px",
              color: C.purpleL,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              marginBottom: "16px",
            }}
          >
            // Custom Rule Builder
          </div>
          {builderMsg && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "5px",
                fontFamily: F.mono,
                fontSize: "11px",
                marginBottom: "12px",
                background:
                  builderMsg.type === "success"
                    ? "rgba(22,163,74,0.1)"
                    : "rgba(196,18,48,0.1)",
                color: builderMsg.type === "success" ? C.greenL : "#e55a73",
                border: `1px solid ${builderMsg.type === "success" ? "rgba(22,163,74,0.25)" : "rgba(196,18,48,0.25)"}`,
              }}
            >
              {builderMsg.text}
            </div>
          )}
          <form
            onSubmit={handleAddRule}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: "9px",
                    color: tm,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: "5px",
                  }}
                >
                  Rule Name *
                </div>
                <input
                  value={newRule.name}
                  onChange={(e) =>
                    setNewRule((r) => ({ ...r, name: e.target.value }))
                  }
                  placeholder="My custom rule"
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "rgba(124,58,237,0.5)")
                  }
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
                    letterSpacing: "0.12em",
                    marginBottom: "5px",
                  }}
                >
                  Category
                </div>
                <input
                  value={newRule.category}
                  onChange={(e) =>
                    setNewRule((r) => ({ ...r, category: e.target.value }))
                  }
                  placeholder="custom"
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "rgba(124,58,237,0.5)")
                  }
                  onBlur={(e) => (e.target.style.borderColor = bdr)}
                />
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: "9px",
                  color: tm,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: "5px",
                }}
              >
                Regex Pattern *
              </div>
              <input
                value={newRule.pattern}
                onChange={(e) =>
                  setNewRule((r) => ({ ...r, pattern: e.target.value }))
                }
                placeholder="e.g. (eval\s*\(|base64_decode)"
                style={{ ...inputStyle, fontFamily: F.mono }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(124,58,237,0.5)")
                }
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
                  letterSpacing: "0.12em",
                  marginBottom: "5px",
                }}
              >
                Description
              </div>
              <input
                value={newRule.description}
                onChange={(e) =>
                  setNewRule((r) => ({ ...r, description: e.target.value }))
                }
                placeholder="What does this rule detect?"
                style={inputStyle}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(124,58,237,0.5)")
                }
                onBlur={(e) => (e.target.style.borderColor = bdr)}
              />
            </div>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: "9px",
                    color: tm,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: "6px",
                  }}
                >
                  Severity
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  {["low", "medium", "high", "critical"].map((s) => {
                    const col = SEV_COLORS[s];
                    const active = newRule.severity === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setNewRule((r) => ({ ...r, severity: s }))
                        }
                        style={{
                          padding: "4px 12px",
                          borderRadius: "5px",
                          border: `1px solid ${active ? col.dot + "55" : "transparent"}`,
                          background: active ? col.bg : "transparent",
                          color: active ? col.text : tm,
                          fontFamily: F.mono,
                          fontSize: "9px",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: "9px",
                    color: tm,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: "6px",
                  }}
                >
                  Inspect Targets
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  {TARGETS.map((t) => {
                    const active = newRule.targets.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTarget(t)}
                        style={{
                          padding: "4px 12px",
                          borderRadius: "5px",
                          border: `1px solid ${active ? "rgba(124,58,237,0.4)" : "transparent"}`,
                          background: active
                            ? "rgba(124,58,237,0.12)"
                            : "transparent",
                          color: active ? C.purpleL : tm,
                          fontFamily: F.mono,
                          fontSize: "9px",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                style={{
                  padding: "8px 22px",
                  borderRadius: "6px",
                  border: `1px solid rgba(124,58,237,0.4)`,
                  background: "rgba(124,58,237,0.15)",
                  color: C.purpleL,
                  fontFamily: F.mono,
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.18s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(124,58,237,0.25)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(124,58,237,0.15)")
                }
              >
                Add Rule →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            background: bg1,
            border: `1px solid ${bdr}`,
            borderRadius: "7px",
            padding: "3px",
            gap: "2px",
            flexWrap: "wrap",
          }}
        >
          {["all", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              style={pillBtn(filterCat === c)}
            >
              {c}
            </button>
          ))}
        </div>
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
          {["all", "critical", "high", "medium", "low"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterSev(s)}
              style={pillBtn(filterSev === s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Rules grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))",
          gap: "1px",
          background: bdr,
        }}
      >
        {filtered.map((rule) => {
          const hits = hitMap[rule.category] || 0;
          const isDisabled = disabledRules?.includes(rule.id);
          return (
            <div
              key={rule.id}
              style={{
                background: bg1,
                padding: "18px",
                opacity: isDisabled ? 0.45 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {/* Top row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontSize: "8px",
                      color: tm,
                      background: light ? C.lS2 : C.s2,
                      padding: "2px 6px",
                      borderRadius: "3px",
                    }}
                  >
                    {rule.id}
                  </span>
                  <SevBadge sev={rule.severity} />
                  {rule.isCustom && (
                    <span
                      style={{
                        fontFamily: F.mono,
                        fontSize: "8px",
                        color: C.purpleL,
                        background: "rgba(124,58,237,0.12)",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        border: "1px solid rgba(124,58,237,0.25)",
                      }}
                    >
                      CUSTOM
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexShrink: 0,
                  }}
                >
                  {hits > 0 && (
                    <span
                      style={{
                        fontFamily: F.mono,
                        fontSize: "9px",
                        color: C.crim,
                        background: "rgba(196,18,48,0.1)",
                        padding: "2px 8px",
                        borderRadius: "100px",
                      }}
                    >
                      {hits} hits
                    </span>
                  )}
                  <Toggle
                    on={!isDisabled}
                    onClick={() => dispatch(toggleRule(rule.id))}
                  />
                </div>
              </div>
              {/* Name */}
              <div
                style={{
                  fontFamily: F.display,
                  fontSize: "15px",
                  fontWeight: 600,
                  color: isDisabled ? tm : tp,
                  letterSpacing: "-0.01em",
                  marginBottom: "5px",
                }}
              >
                {rule.name}
              </div>
              {/* Description */}
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: "10px",
                  color: tm,
                  lineHeight: 1.7,
                  marginBottom: "10px",
                }}
              >
                {rule.description}
              </div>
              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{ fontFamily: F.mono, fontSize: "9px", color: tm }}
                >
                  {rule.category}
                </span>
                <span
                  style={{ color: light ? C.lBdrM : C.bdrM, fontSize: "10px" }}
                >
                  ·
                </span>
                <span
                  style={{ fontFamily: F.mono, fontSize: "9px", color: tm }}
                >
                  targets: {rule.targets?.join(", ")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
            gap: "8px",
            color: tm,
          }}
        >
          <div style={{ fontSize: "28px", opacity: 0.3 }}>⊞</div>
          <div style={{ fontFamily: F.mono, fontSize: "11px" }}>
            No rules match current filter
          </div>
        </div>
      )}
    </div>
  );
}
