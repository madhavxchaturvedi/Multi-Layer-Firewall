// pages/WorldMap.jsx — Vantix Design System
import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useTheme } from "../components/ThemeProvider";
import { C, F, card, CATEGORY_LABEL } from "../lib/ds";

const SEV_COLOR = {
  critical: C.crim,
  high: "#d97706",
  medium: "#ca8a04",
  low: C.greenL,
};

function fallbackCoords(seed = "x") {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = h >>> 0;
  return {
    lat: (u % 14000) / 100 - 70,
    lon: (Math.floor(u / 14000) % 36000) / 100 - 180,
  };
}

function hasRealCoords(ll) {
  return (
    Array.isArray(ll) &&
    ll.length === 2 &&
    Number.isFinite(ll[0]) &&
    Number.isFinite(ll[1]) &&
    !(ll[0] === 0 && ll[1] === 0)
  );
}

export default function WorldMap() {
  const { events, stats } = useSelector((s) => s.waf);
  const { theme } = useTheme();
  const light = theme === "light";

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const projRef = useRef(null);

  const [size, setSize] = useState({ w: 800, h: 400 });
  const [dots, setDots] = useState([]);
  const [hov, setHov] = useState(null);
  const [sweep, setSweep] = useState(0);
  const [libsReady, setLibs] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const tp = light ? C.lTextPri : C.textPri;
  const ts = light ? C.lTextSec : C.textSec;
  const tm = light ? C.lTextMut : C.textMut;
  const bdr = light ? C.lBdr : C.bdr;

  // Responsive sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => {
      const w = Math.round(e[0].contentRect.width);
      if (w > 0) setSize({ w, h: Math.round(w * 0.48) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load D3 + topojson
  useEffect(() => {
    const load = (src) =>
      new Promise((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          res();
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.onload = res;
        s.onerror = rej;
        document.head.appendChild(s);
      });
    Promise.all([
      load("https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"),
      load(
        "https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js",
      ),
    ])
      .then(() => setLibs(true))
      .catch(console.error);
  }, []);

  // Draw canvas map
  useEffect(() => {
    if (!libsReady || !canvasRef.current) return;
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((world) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { w, h } = size;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        const ctx = canvas.getContext("2d");
        ctx.scale(dpr, dpr);

        const proj = window.d3
          .geoNaturalEarth1()
          .scale(w / 6.2)
          .translate([w / 2, h / 2]);
        projRef.current = proj;
        const path = window.d3.geoPath(proj, ctx);
        const land = window.topojson.feature(world, world.objects.land);
        const borders = window.topojson.mesh(
          world,
          world.objects.countries,
          (a, b) => a !== b,
        );
        const graticule = window.d3.geoGraticule()();
        const sphere = { type: "Sphere" };

        // Ocean
        ctx.beginPath();
        path(sphere);
        ctx.fillStyle = light ? "#e8e6e2" : "#0f1115";
        ctx.fill();

        // Graticule
        ctx.beginPath();
        path(graticule);
        ctx.strokeStyle = light
          ? "rgba(10,10,10,0.06)"
          : "rgba(255,255,255,0.04)";
        ctx.lineWidth = 0.4;
        ctx.stroke();

        // Land
        ctx.beginPath();
        path(land);
        ctx.fillStyle = light ? "#c8c5bf" : "#1a1a1f";
        ctx.fill();

        // Borders
        ctx.beginPath();
        path(borders);
        ctx.strokeStyle = light ? "#b5b2ab" : "#222228";
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Outline
        ctx.beginPath();
        path(sphere);
        ctx.strokeStyle = light
          ? "rgba(10,10,10,0.1)"
          : "rgba(255,255,255,0.06)";
        ctx.lineWidth = 0.5;
        ctx.stroke();

        setMapReady(true);
      })
      .catch(() => setMapReady(true));
  }, [libsReady, size, light]);

  // Redraw when theme changes
  useEffect(() => {
    if (mapReady && libsReady) setMapReady(false);
  }, [light]);

  // Sweep animation
  useEffect(() => {
    let x = 0;
    const iv = setInterval(() => {
      x = (x + 1.8) % size.w;
      setSweep(x);
    }, 16);
    return () => clearInterval(iv);
  }, [size.w]);

  // Project dots
  useEffect(() => {
    if (!projRef.current) return;
    const LON_LAT = {
      RU: [37, 55],
      CN: [116, 39],
      IR: [51, 33],
      IN: [77, 28],
      US: [-97, 38],
      BR: [-51, -14],
      NG: [8, 9],
      JP: [138, 36],
      DE: [10, 51],
      PK: [73, 33],
      ID: [112, -1],
      TR: [36, 38],
      AU: [134, -26],
      CO: [-75, 4],
      KZ: [66, 48],
      KP: [128, 40],
      UA: [32, 49],
      SA: [45, 24],
      EG: [30, 26],
      GB: [-1, 52],
    };
    const overlapCount = new Map();
    const newDots = events
      .filter((e) => e.blocked)
      .slice(0, 120)
      .map((ev, i) => {
        let lat, lon;
        if (hasRealCoords(ev.ll)) {
          [lat, lon] = ev.ll;
        } else if (ev.country && LON_LAT[ev.country]) {
          [lon, lat] = LON_LAT[ev.country];
        } else {
          const fb = fallbackCoords(String(ev.ip || ev.requestId || i));
          lat = fb.lat;
          lon = fb.lon;
        }

        const raw = projRef.current([lon, lat]);
        if (!raw) return null;
        let [x, y] = raw;

        const key = `${Math.round(x)}:${Math.round(y)}`;
        const idx = overlapCount.get(key) || 0;
        overlapCount.set(key, idx + 1);
        if (idx > 0) {
          const angle = idx * 2.399963;
          const radius = 3 + Math.floor(idx / 5) * 4;
          x += Math.cos(angle) * radius;
          y += Math.sin(angle) * radius;
        }
        return {
          id: ev.requestId || ev.ip + ev.timestamp,
          x: Math.max(4, Math.min(size.w - 4, x)),
          y: Math.max(4, Math.min(size.h - 4, y)),
          severity: ev.severity || "medium",
          category: ev.category,
          country: ev.country && ev.country !== "XX" ? ev.country : "?",
          ip: ev.ip,
          url: ev.url,
          ts: ev.timestamp,
        };
      })
      .filter(Boolean);
    setDots(newDots);
  }, [events, size, mapReady]);

  const handleMouseMove = useCallback(
    (e) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left,
        my = e.clientY - rect.top;
      setHov(dots.find((d) => Math.hypot(d.x - mx, d.y - my) < 10) || null);
    },
    [dots],
  );

  // Top countries
  const topCountries = Object.entries(stats?.attacksByCountry || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Tooltip positioning
  const tooltip = hov
    ? (() => {
        const PAD = 8,
          TW = 150,
          TH = 72;
        const tx = hov.x + 14 + TW > size.w ? hov.x - TW - PAD : hov.x + PAD;
        const ty =
          hov.y - TH / 2 < 0
            ? PAD
            : hov.y + TH > size.h
              ? size.h - TH - PAD
              : hov.y - TH / 2;
        return { tx, ty };
      })()
    : null;

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
            // World Map
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
            Global Attack Map
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: "11px",
              color: tm,
              marginTop: "4px",
            }}
          >
            {dots.length} attacks plotted · Real-time geo-location
          </div>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {Object.entries(SEV_COLOR).map(([s, c]) => (
            <div
              key={s}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: c,
                  boxShadow: `0 0 6px ${c}80`,
                }}
              />
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: "9px",
                  color: tm,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div
        ref={containerRef}
        style={{
          ...card(light),
          overflow: "hidden",
          padding: 0,
          position: "relative",
        }}
      >
        {/* Canvas land */}
        <canvas ref={canvasRef} style={{ display: "block", width: "100%" }} />

        {/* SVG overlay */}
        <svg
          ref={svgRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            overflow: "visible",
            cursor: "crosshair",
          }}
          viewBox={`0 0 ${size.w} ${size.h}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHov(null)}
        >
          <defs>
            <linearGradient id="sweepG" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(196,18,48,0)" />
              <stop offset="70%" stopColor="rgba(196,18,48,0)" />
              <stop offset="90%" stopColor="rgba(196,18,48,0.04)" />
              <stop offset="100%" stopColor="rgba(196,18,48,0.14)" />
            </linearGradient>
            <radialGradient id="cg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={C.crim} stopOpacity="0.25" />
              <stop offset="100%" stopColor={C.crim} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sweep */}
          <rect
            x={Math.max(0, sweep - 60)}
            y="0"
            width="60"
            height={size.h}
            fill="url(#sweepG)"
          />
          <line
            x1={sweep}
            y1="0"
            x2={sweep}
            y2={size.h}
            stroke="rgba(196,18,48,0.15)"
            strokeWidth="1"
          />

          {/* Dots */}
          {dots.map((d, i) => {
            const isH = hov?.id === d.id;
            return (
              <g
                key={d.id}
                onMouseEnter={() => setHov(d)}
                onMouseLeave={() => setHov(null)}
                style={{ cursor: "pointer" }}
              >
                {isH && d.severity === "critical" && (
                  <circle cx={d.x} cy={d.y} r="20" fill="url(#cg)" />
                )}
                {isH && (
                  <circle
                    cx={d.x}
                    cy={d.y}
                    r="8"
                    fill="none"
                    stroke={SEV_COLOR[d.severity]}
                    strokeWidth="1"
                    opacity="0"
                  >
                    <animate
                      attributeName="r"
                      values="4;18;4"
                      dur={`${1.8 + i * 0.1}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.5;0;0.5"
                      dur={`${1.8 + i * 0.1}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                {/* Pulse for recent dots */}
                {i < 10 && (
                  <circle
                    cx={d.x}
                    cy={d.y}
                    r="6"
                    fill="none"
                    stroke={SEV_COLOR[d.severity]}
                    strokeWidth="0.8"
                    opacity="0"
                  >
                    <animate
                      attributeName="r"
                      values="3;14;3"
                      dur={`${2.2 + i * 0.15}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.4;0;0.4"
                      dur={`${2.2 + i * 0.15}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={isH ? 5.5 : 3.8}
                  fill={SEV_COLOR[d.severity]}
                  stroke={
                    light ? "rgba(250,250,248,0.9)" : "rgba(10,10,10,0.8)"
                  }
                  strokeWidth={isH ? 1.5 : 0.8}
                  style={{ transition: "r 0.15s" }}
                />
              </g>
            );
          })}

          {/* Tooltip */}
          {hov && tooltip && (
            <g>
              <rect
                x={tooltip.tx}
                y={tooltip.ty}
                width={150}
                height={72}
                rx={6}
                fill={light ? "rgba(255,255,255,0.96)" : "rgba(10,10,10,0.92)"}
                stroke={light ? "rgba(10,10,10,0.12)" : "rgba(255,255,255,0.1)"}
                strokeWidth="0.8"
              />
              <rect
                x={tooltip.tx}
                y={tooltip.ty}
                width="3"
                height="72"
                rx="1.5"
                fill={SEV_COLOR[hov.severity]}
              />
              <text
                x={tooltip.tx + 12}
                y={tooltip.ty + 16}
                fontFamily="JetBrains Mono,monospace"
                fontSize="9"
                fill={light ? "#9aa5af" : "#8a8a94"}
              >
                {hov.country} · {hov.ip}
              </text>
              <text
                x={tooltip.tx + 12}
                y={tooltip.ty + 31}
                fontFamily="JetBrains Mono,monospace"
                fontSize="11"
                fontWeight="600"
                fill={light ? "#0a0a0a" : "#f0ede8"}
              >
                {CATEGORY_LABEL[hov.category] || hov.category || "—"}
              </text>
              <text
                x={tooltip.tx + 12}
                y={tooltip.ty + 46}
                fontFamily="JetBrains Mono,monospace"
                fontSize="9"
                fill={light ? "#9aa5af" : "#8a8a94"}
              >
                {hov.url?.slice(0, 22)}
                {hov.url?.length > 22 ? "…" : ""}
              </text>
              <text
                x={tooltip.tx + 12}
                y={tooltip.ty + 61}
                fontFamily="JetBrains Mono,monospace"
                fontSize="9"
                fontWeight="700"
                fill={SEV_COLOR[hov.severity]}
              >
                {hov.severity?.toUpperCase()}
              </text>
            </g>
          )}

          {/* Live badge */}
          <rect
            x="12"
            y="12"
            width="80"
            height="22"
            rx="3"
            fill={light ? "rgba(255,255,255,0.95)" : "rgba(20,20,24,0.92)"}
            stroke={light ? "rgba(10,10,10,0.1)" : "rgba(255,255,255,0.08)"}
            strokeWidth="0.5"
          />
          <circle cx="24" cy="23" r="4" fill={C.crim}>
            <animate
              attributeName="opacity"
              values="1;0.3;1"
              dur="1.4s"
              repeatCount="indefinite"
            />
          </circle>
          <text
            x="33"
            y="27"
            fontFamily="JetBrains Mono,monospace"
            fontSize="8.5"
            fill={light ? "#5c6b7a" : "#8a8a94"}
            letterSpacing="0.5"
          >
            LIVE FEED
          </text>

          {/* Count */}
          <rect
            x={size.w - 94}
            y="12"
            width="82"
            height="22"
            rx="3"
            fill="rgba(196,18,48,0.85)"
          />
          <text
            x={size.w - 53}
            y="27"
            textAnchor="middle"
            fontFamily="JetBrains Mono,monospace"
            fontSize="8.5"
            fill="#fff"
            letterSpacing="0.5"
          >
            {dots.length} ACTIVE
          </text>
        </svg>

        {/* Loading */}
        {!mapReady && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: light ? "#e8e6e2" : "#0f1115",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "11px",
                color: tm,
                letterSpacing: "0.14em",
                animation: "pulseCrim 1.4s ease-in-out infinite",
              }}
            >
              Loading map…
            </div>
          </div>
        )}

        {/* Empty */}
        {mapReady && dots.length === 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              gap: "6px",
            }}
          >
            <div style={{ fontFamily: F.mono, fontSize: "11px", color: tm }}>
              No attacks plotted yet
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: "10px",
                color: light ? C.lTextMut : C.textMut,
              }}
            >
              Go to Simulator → Fire All Attacks
            </div>
          </div>
        )}

        {/* Legend bar */}
        <div
          style={{
            padding: "10px 16px",
            borderTop: `1px solid ${bdr}`,
            display: "flex",
            alignItems: "center",
            gap: "18px",
            flexWrap: "wrap",
            background: light ? "rgba(255,255,255,0.9)" : "rgba(20,20,24,0.8)",
          }}
        >
          {[
            ["CRITICAL", C.crim],
            ["HIGH", "#d97706"],
            ["MEDIUM", "#ca8a04"],
            ["LOW", C.greenL],
          ].map(([l, c]) => (
            <div
              key={l}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: c,
                }}
              />
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: "9px",
                  color: tm,
                  letterSpacing: "0.1em",
                }}
              >
                {l}
              </span>
            </div>
          ))}
          <div
            style={{
              marginLeft: "auto",
              fontFamily: F.mono,
              fontSize: "9px",
              color: tm,
            }}
          >
            D3 Natural Earth · IP Geo-location
          </div>
        </div>
      </div>

      {/* Bottom: countries + recent */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}
      >
        {/* Top countries */}
        <div style={{ ...card(light), padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "12px 18px",
              borderBottom: `1px solid ${bdr}`,
              fontFamily: F.mono,
              fontSize: "9px",
              color: tm,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
            }}
          >
            // Top Attacking Countries
          </div>
          {topCountries.length === 0 ? (
            <div
              style={{
                padding: "28px",
                textAlign: "center",
                fontFamily: F.mono,
                fontSize: "11px",
                color: tm,
              }}
            >
              No data yet
            </div>
          ) : (
            topCountries.map(([cc, count], i) => {
              const max = topCountries[0][1];
              return (
                <div
                  key={cc}
                  style={{
                    padding: "10px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    borderBottom: `1px solid ${light ? C.lBdr : C.bdrS}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontSize: "9px",
                      color: tm,
                      width: "14px",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontSize: "11px",
                      color: tp,
                      fontWeight: 500,
                      width: "28px",
                    }}
                  >
                    {cc}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "4px",
                      background: light ? C.lS2 : C.s3,
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background: C.crim,
                        borderRadius: "2px",
                        width: `${(count / max) * 100}%`,
                        transition: "width 0.8s ease",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontSize: "10px",
                      color: ts,
                      width: "24px",
                      textAlign: "right",
                    }}
                  >
                    {count}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Recent plotted */}
        <div style={{ ...card(light), padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "12px 18px",
              borderBottom: `1px solid ${bdr}`,
              fontFamily: F.mono,
              fontSize: "9px",
              color: tm,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
            }}
          >
            // Recent Plotted Attacks
          </div>
          {dots.length === 0 ? (
            <div
              style={{
                padding: "28px",
                textAlign: "center",
                fontFamily: F.mono,
                fontSize: "11px",
                color: tm,
              }}
            >
              No data yet
            </div>
          ) : (
            dots.slice(0, 8).map((d, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  borderBottom: `1px solid ${light ? C.lBdr : C.bdrS}`,
                }}
              >
                <div
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: SEV_COLOR[d.severity],
                    flexShrink: 0,
                    boxShadow: `0 0 5px ${SEV_COLOR[d.severity]}70`,
                  }}
                />
                <span
                  style={{
                    fontFamily: F.mono,
                    fontSize: "11px",
                    color: tp,
                    width: "28px",
                    flexShrink: 0,
                  }}
                >
                  {d.country}
                </span>
                <span
                  style={{
                    fontFamily: F.mono,
                    fontSize: "10px",
                    color: ts,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {CATEGORY_LABEL[d.category] || d.category || "—"}
                </span>
                <span
                  style={{
                    fontFamily: F.mono,
                    fontSize: "10px",
                    color: tm,
                    flexShrink: 0,
                    maxWidth: "90px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {d.ip}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
