// pages/Simulator.jsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { simulateAttack, clearSimResult } from "../store/wafSlice";
import { cn } from "../lib/utils";

const ATTACKS = [
  {
    id: "sqli",
    label: "SQL Injection",
    color: "red",
    icon: "⬡",
    severity: "critical",
    description: "Sends ' OR 1=1 -- to the WAF proxy",
    payload: "' OR 1=1 -- ",
    url: "/?id=1",
    paramKey: "id",
    paramVal: "' OR 1=1 -- ",
  },
  {
    id: "xss",
    label: "XSS Attack",
    color: "orange",
    icon: "◈",
    severity: "high",
    description: "Injects <script>alert('xss')</script>",
    payload: "<script>alert('xss')</script>",
    url: "/search",
    paramKey: "q",
    paramVal: "<script>alert('xss')</script>",
  },
  {
    id: "path",
    label: "Path Traversal",
    color: "yellow",
    icon: "⊛",
    severity: "high",
    description: "Tries ../../etc/passwd traversal",
    payload: "../../etc/passwd",
    url: "/file",
    paramKey: "name",
    paramVal: "../../etc/passwd",
  },
  {
    id: "cmdi",
    label: "Command Injection",
    color: "purple",
    icon: "⊕",
    severity: "critical",
    description: "Sends ; cat /etc/passwd payload",
    payload: "; cat /etc/passwd",
    url: "/exec",
    paramKey: "cmd",
    paramVal: "; cat /etc/passwd",
  },
  {
    id: "ssrf",
    label: "SSRF",
    color: "cyan",
    icon: "⊗",
    severity: "critical",
    description: "Tries to reach cloud metadata endpoint",
    payload: "http://169.254.169.254/latest/meta-data",
    url: "/fetch",
    paramKey: "url",
    paramVal: "http://169.254.169.254/latest/meta-data",
  },
  {
    id: "scanner",
    label: "Scanner Bot",
    color: "gray",
    icon: "◎",
    severity: "medium",
    description: "Sends sqlmap user-agent header",
    payload: "sqlmap/1.7.8",
    url: "/login",
    paramKey: null,
  },
  {
    id: "honeypot",
    label: "Honeypot Trip",
    color: "red",
    icon: "⚠",
    severity: "critical",
    description: "Requests /wp-admin to trip the honeypot",
    payload: "/wp-admin",
    url: "/wp-admin",
  },
  {
    id: "blind_sqli",
    label: "Blind SQLi",
    color: "red",
    icon: "⬡",
    severity: "critical",
    description: "Time-based blind SQL injection via SLEEP()",
    payload: "1; SELECT SLEEP(5)--",
    url: "/api/user",
    paramKey: "id",
    paramVal: "1; SELECT SLEEP(5)--",
  },
];

const COLOR_MAP = {
  red: "border-accent-red/30 bg-accent-red/5 hover:bg-accent-red/10 text-accent-red",
  orange:
    "border-accent-orange/30 bg-accent-orange/5 hover:bg-accent-orange/10 text-accent-orange",
  yellow:
    "border-accent-yellow/30 bg-accent-yellow/5 hover:bg-accent-yellow/10 text-accent-yellow",
  purple:
    "border-accent-purple/30 bg-accent-purple/5 hover:bg-accent-purple/10 text-accent-purple",
  cyan: "border-accent-cyan/30 bg-accent-cyan/5 hover:bg-accent-cyan/10 text-accent-cyan",
  gray: "border-gray-600/30 bg-gray-600/5 hover:bg-gray-600/10 text-gray-400",
};

export default function Simulator() {
  const dispatch = useDispatch();
  const { simulationResult } = useSelector((s) => s.waf);
  const [firing, setFiring] = useState(null);
  const [results, setResults] = useState([]);
  const [customPayload, setCustomPayload] = useState("");
  const [customUrl, setCustomUrl] = useState("/test");

  async function fireAttack(attack) {
    setFiring(attack.id);
    dispatch(clearSimResult());
    try {
      const sim = await dispatch(simulateAttack({ type: attack.id })).unwrap();
      const blocked = !!sim.blocked;
      setResults((prev) =>
        [
          {
            id: Date.now(),
            attack: attack.label,
            severity: attack.severity,
            blocked,
            status: sim.status,
            payload: sim.payload || attack.payload,
            url: sim.url || attack.url,
            ts: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 20),
      );
    } catch (_) {
      setResults((prev) =>
        [
          {
            id: Date.now(),
            attack: attack.label,
            severity: attack.severity,
            blocked: false,
            status: "ERR",
            payload: attack.payload,
            url: attack.url,
            ts: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 20),
      );
    }
    setFiring(null);
  }

  async function fireAllAttacks() {
    for (const attack of ATTACKS) {
      await fireAttack(attack);
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  async function fireCustom() {
    setFiring("custom");
    try {
      const sim = await dispatch(
        simulateAttack({
          type: "custom",
          url: customUrl,
          payload: customPayload,
        }),
      ).unwrap();
      setResults((prev) =>
        [
          {
            id: Date.now(),
            attack: "Custom",
            severity: "unknown",
            blocked: !!sim.blocked,
            status: sim.status,
            payload: sim.payload || customPayload,
            url: sim.url || customUrl,
            ts: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 20),
      );
    } catch (_) {
      setResults((prev) =>
        [
          {
            id: Date.now(),
            attack: "Custom",
            severity: "unknown",
            blocked: false,
            status: "ERR",
            payload: customPayload,
            url: customUrl,
            ts: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 20),
      );
    }
    setFiring(null);
  }

  const blockedCount = results.filter((r) => r.blocked).length;

  return (
    <div className="p-6 animate-fade-in space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-display font-semibold text-white text-lg">
            Attack Simulator
          </div>
          <div className="text-xs font-mono text-gray-500 mt-0.5">
            Fire test attacks against the WAF — watch them get caught in the
            live feed
          </div>
        </div>
        <button
          onClick={fireAllAttacks}
          disabled={!!firing}
          className="px-4 py-2 bg-accent-red/20 hover:bg-accent-red/30 border border-accent-red/30 text-accent-red text-xs font-mono rounded-lg transition-colors disabled:opacity-40"
        >
          {firing ? "⟳ Firing…" : "⚡ Fire All Attacks"}
        </button>
      </div>

      {/* Results summary */}
      {results.length > 0 && (
        <div className="flex items-center gap-6 bg-surface-1 border border-border rounded-xl px-5 py-3">
          <div className="text-center">
            <div className="text-2xl font-display font-bold text-accent-red">
              {blockedCount}
            </div>
            <div className="text-[10px] font-mono text-gray-600">Blocked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-display font-bold text-accent-green">
              {results.length - blockedCount}
            </div>
            <div className="text-[10px] font-mono text-gray-600">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-display font-bold text-accent-yellow">
              {results.length > 0
                ? Math.round((blockedCount / results.length) * 100)
                : 0}
              %
            </div>
            <div className="text-[10px] font-mono text-gray-600">
              Detection Rate
            </div>
          </div>
        </div>
      )}

      {/* Attack cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ATTACKS.map((attack) => {
          const lastResult = results.find((r) => r.attack === attack.label);
          return (
            <button
              key={attack.id}
              onClick={() => fireAttack(attack)}
              disabled={!!firing}
              className={cn(
                "border rounded-xl p-4 text-left transition-all disabled:opacity-50 cursor-pointer",
                COLOR_MAP[attack.color] || COLOR_MAP.gray,
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{attack.icon}</span>
                {lastResult && (
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded border",
                      lastResult.blocked
                        ? "text-accent-green border-accent-green/30 bg-accent-green/10"
                        : "text-accent-red border-accent-red/30 bg-accent-red/10",
                    )}
                  >
                    {lastResult.blocked ? "✓ BLOCKED" : "✗ PASSED"}
                  </span>
                )}
                {firing === attack.id && (
                  <span className="text-[10px] font-mono text-gray-400 animate-pulse">
                    firing…
                  </span>
                )}
              </div>
              <div className="font-display font-semibold text-sm mb-1">
                {attack.label}
              </div>
              <div className="text-[11px] font-sans opacity-70">
                {attack.description}
              </div>
              <div className="mt-2 text-[10px] font-mono opacity-50 truncate">
                {attack.payload}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom payload */}
      <div className="bg-surface-1 border border-border rounded-xl p-5">
        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">
          Custom Payload
        </div>
        <div className="flex gap-3 flex-wrap">
          <input
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="/api/endpoint"
            className="w-32 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none focus:border-border-strong"
          />
          <input
            value={customPayload}
            onChange={(e) => setCustomPayload(e.target.value)}
            placeholder="Enter any payload..."
            className="flex-1 min-w-[200px] bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none focus:border-border-strong"
          />
          <button
            onClick={fireCustom}
            disabled={!!firing || !customPayload}
            className="px-4 py-2 bg-accent-purple/20 hover:bg-accent-purple/30 border border-accent-purple/30 text-accent-purple text-xs font-mono rounded-lg transition-colors disabled:opacity-40"
          >
            Fire
          </button>
        </div>
      </div>

      {/* Result log */}
      {results.length > 0 && (
        <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border text-[10px] font-mono text-gray-600 uppercase tracking-widest">
            Simulation Log
          </div>
          <div className="divide-y divide-border">
            {results.map((r, i) => (
              <div
                key={r.id}
                className="px-5 py-2.5 flex items-center gap-4 text-xs animate-slide-in"
              >
                <span
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.5 rounded border",
                    r.blocked
                      ? "text-accent-green border-accent-green/30 bg-accent-green/10"
                      : "text-accent-red border-accent-red/30 bg-accent-red/10",
                  )}
                >
                  {r.blocked ? "BLOCKED" : "PASSED"}
                </span>
                <span className="font-mono text-gray-400 w-28 flex-shrink-0">
                  {r.attack}
                </span>
                <span className="font-mono text-gray-600 flex-1 truncate">
                  {r.payload}
                </span>
                <span className="font-mono text-gray-700 flex-shrink-0">
                  HTTP {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
