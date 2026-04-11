// pages/WorldMap.jsx
// Real-time attack world map using D3 geo projection + SVG
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { CATEGORY_LABEL, CATEGORY_COLOR, cn } from "../lib/utils";

// Country ISO-2 to approximate [lon, lat] centroids
const COUNTRY_COORDS = {
  AF: [67.7, 33.9],
  AL: [20.2, 41.2],
  DZ: [2.6, 28.0],
  AO: [17.9, -11.2],
  AR: [-63.6, -38.4],
  AU: [133.8, -25.3],
  AT: [14.6, 47.7],
  AZ: [47.6, 40.1],
  BD: [90.4, 23.7],
  BE: [4.5, 50.5],
  BR: [-51.9, -14.2],
  BG: [25.5, 42.7],
  CA: [-96.8, 56.1],
  CL: [-71.5, -35.7],
  CN: [104.2, 35.9],
  CO: [-74.3, 4.6],
  CD: [23.7, -2.9],
  HR: [16.4, 45.1],
  CZ: [15.5, 49.8],
  DK: [10.0, 56.3],
  EG: [30.8, 26.8],
  ET: [40.5, 9.1],
  FI: [26.3, 64.6],
  FR: [2.2, 46.2],
  DE: [10.5, 51.2],
  GH: [-1.0, 7.9],
  GR: [21.8, 39.1],
  HU: [19.5, 47.2],
  IN: [78.9, 20.6],
  ID: [113.9, -0.8],
  IR: [53.7, 32.4],
  IQ: [43.7, 33.2],
  IE: [-8.2, 53.4],
  IL: [34.9, 31.5],
  IT: [12.6, 42.8],
  JP: [138.3, 36.2],
  JO: [36.2, 30.6],
  KZ: [66.9, 48.0],
  KE: [37.9, 0.0],
  KP: [127.5, 40.3],
  KR: [127.8, 35.9],
  KW: [47.6, 29.3],
  LB: [35.9, 33.9],
  LY: [17.2, 26.3],
  MY: [109.7, 4.2],
  MX: [-102.5, 23.6],
  MA: [-7.1, 31.8],
  MZ: [35.5, -18.7],
  MM: [96.7, 17.1],
  NP: [84.1, 28.4],
  NL: [5.3, 52.1],
  NG: [8.7, 9.1],
  NO: [8.5, 60.5],
  PK: [69.3, 30.4],
  PE: [-75.0, -9.2],
  PH: [121.8, 12.9],
  PL: [19.1, 51.9],
  PT: [-8.2, 39.4],
  QA: [51.2, 25.4],
  RO: [25.0, 45.9],
  RU: [105.3, 61.5],
  SA: [44.6, 23.9],
  RS: [21.0, 44.0],
  ZA: [25.1, -29.0],
  ES: [-3.7, 40.4],
  SD: [30.2, 15.6],
  SE: [18.6, 60.1],
  CH: [8.2, 46.8],
  SY: [38.3, 35.0],
  TW: [120.9, 23.7],
  TZ: [34.9, -6.4],
  TH: [100.9, 15.9],
  TN: [9.0, 34.0],
  TR: [35.2, 38.9],
  UA: [32.0, 49.0],
  AE: [53.8, 23.4],
  GB: [-3.4, 55.4],
  US: [-95.7, 37.1],
  UZ: [63.9, 41.4],
  VE: [-66.6, 6.4],
  VN: [108.3, 14.1],
  YE: [47.6, 15.6],
  ZM: [27.8, -13.1],
  ZW: [30.0, -20.0],
  XX: [0, 0],
};

// Equirectangular projection: lon/lat → SVG x/y
function project(lon, lat, W, H) {
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [x, y];
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function spreadOverlappingPoint(x, y, overlapIndex, W, H) {
  if (overlapIndex === 0) return [x, y];
  const angle = overlapIndex * 2.399963229728653;
  const radius = Math.min(18, 2 + Math.floor(overlapIndex / 4) * 2);
  const ox = x + Math.cos(angle) * radius;
  const oy = y + Math.sin(angle) * radius;
  return [clamp(ox, 4, W - 4), clamp(oy, 4, H - 4)];
}

function hasValidCoords(ll) {
  return (
    Array.isArray(ll) &&
    ll.length === 2 &&
    Number.isFinite(ll[0]) &&
    Number.isFinite(ll[1]) &&
    !(ll[0] === 0 && ll[1] === 0)
  );
}

// Local/simulated traffic often has no geo data; hash IP/request ID into stable pseudo-coordinates.
function fallbackCoords(seed = "unknown") {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const unsigned = hash >>> 0;
  const lon = (unsigned % 36000) / 100 - 180;
  const lat = (Math.floor(unsigned / 36000) % 14000) / 100 - 70;
  return [lat, lon];
}

const SEV_COLOR = {
  critical: "#ff3b3b",
  high: "#ff7b29",
  medium: "#f5c518",
  low: "#00d68f",
};

export default function WorldMap() {
  const { events, stats } = useSelector((s) => s.waf);
  const svgRef = useRef(null);
  const [dots, setDots] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [W, setW] = useState(800);
  const H = Math.round(W * 0.5);

  // Track SVG width for responsive sizing
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setW(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Convert new blocked events to map dots
  useEffect(() => {
    const blocked = events.filter((e) => e.blocked);
    const overlapCounts = new Map();
    const newDots = blocked.slice(0, 80).map((e, i) => {
      const hasCoords = hasValidCoords(e.ll);
      const [lat, lon] = hasCoords
        ? e.ll
        : fallbackCoords(String(e.ip || e.requestId || i));
      const [baseX, baseY] = project(lon, lat, W, H);
      const key = `${Math.round(baseX)}:${Math.round(baseY)}`;
      const overlapIndex = overlapCounts.get(key) || 0;
      overlapCounts.set(key, overlapIndex + 1);
      const [x, y] = spreadOverlappingPoint(baseX, baseY, overlapIndex, W, H);
      return {
        id: e.requestId || e.ip + e.timestamp,
        x,
        y,
        severity: e.severity || "medium",
        category: e.category,
        country: e.country && e.country !== "XX" ? e.country : "Unknown",
        ip: e.ip,
        url: e.url,
        ts: e.timestamp,
        born: Date.now(),
      };
    });
    setDots(newDots);
  }, [events, W, H]);

  // Top attacking countries
  const topCountries = Object.entries(stats?.attacksByCountry || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="p-6 animate-fade-in space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-display font-semibold text-white text-lg">
            Attack World Map
          </div>
          <div className="text-xs font-mono text-gray-500 mt-0.5">
            Real-time geo-location of blocked attacks — {dots.length} plotted
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          {Object.entries(SEV_COLOR).map(([s, c]) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: c }} />
              <span className="text-gray-500 capitalize">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="bg-surface-1 border border-border rounded-xl overflow-hidden relative">
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          className="block"
          style={{ background: "transparent" }}
        >
          {/* Ocean background */}
          <rect width={W} height={H} fill="#0d1520" rx="12" />

          {/* Latitude grid lines */}
          {[-60, -30, 0, 30, 60].map((lat) => {
            const [, y] = project(0, lat, W, H);
            return (
              <line
                key={lat}
                x1={0}
                y1={y}
                x2={W}
                y2={y}
                stroke="#ffffff08"
                strokeWidth={0.5}
                strokeDasharray={lat === 0 ? "4 4" : "2 4"}
              />
            );
          })}
          {/* Longitude grid lines */}
          {[-120, -60, 0, 60, 120].map((lon) => {
            const [x] = project(lon, 0, W, H);
            return (
              <line
                key={lon}
                x1={x}
                y1={0}
                x2={x}
                y2={H}
                stroke="#ffffff08"
                strokeWidth={0.5}
              />
            );
          })}

          {/* Country dots — static reference points */}
          {Object.entries(COUNTRY_COORDS)
            .filter(([cc]) => cc !== "XX")
            .map(([cc, [lon, lat]]) => {
              const [x, y] = project(lon, lat, W, H);
              const hitCount = stats?.attacksByCountry?.[cc] || 0;
              return (
                <circle
                  key={cc}
                  cx={x}
                  cy={y}
                  r={hitCount > 0 ? 3 : 1.5}
                  fill={hitCount > 0 ? "#ff3b3b40" : "#ffffff12"}
                  stroke={hitCount > 0 ? "#ff3b3b60" : "none"}
                  strokeWidth={0.5}
                />
              );
            })}

          {/* Attack dots with pulse rings */}
          {dots.map((dot) => (
            <g
              key={dot.id}
              onMouseEnter={() => setHovered(dot)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Pulse ring */}
              <circle
                cx={dot.x}
                cy={dot.y}
                r={8}
                fill="none"
                stroke={SEV_COLOR[dot.severity] || "#ff3b3b"}
                strokeWidth={0.8}
                opacity={0.3}
              >
                <animate
                  attributeName="r"
                  values="4;14;4"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.4;0;0.4"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* Core dot */}
              <circle
                cx={dot.x}
                cy={dot.y}
                r={4}
                fill={SEV_COLOR[dot.severity] || "#ff3b3b"}
                opacity={0.9}
              />
            </g>
          ))}

          {/* Tooltip */}
          {hovered &&
            (() => {
              const tx = Math.min(hovered.x + 10, W - 160);
              const ty = Math.max(hovered.y - 70, 8);
              return (
                <g>
                  <rect
                    x={tx}
                    y={ty}
                    width={155}
                    height={68}
                    rx={6}
                    fill="#13161e"
                    stroke="#ffffff15"
                    strokeWidth={0.5}
                  />
                  <text
                    x={tx + 8}
                    y={ty + 16}
                    fill="#9ca3af"
                    fontSize={9}
                    fontFamily="monospace"
                  >
                    {hovered.country} · {hovered.ip}
                  </text>
                  <text
                    x={tx + 8}
                    y={ty + 30}
                    fill="#e5e7eb"
                    fontSize={10}
                    fontFamily="monospace"
                    fontWeight={500}
                  >
                    {CATEGORY_LABEL[hovered.category] || hovered.category}
                  </text>
                  <text
                    x={tx + 8}
                    y={ty + 44}
                    fill="#6b7280"
                    fontSize={9}
                    fontFamily="monospace"
                  >
                    {hovered.url?.slice(0, 22)}
                    {hovered.url?.length > 22 ? "…" : ""}
                  </text>
                  <text
                    x={tx + 8}
                    y={ty + 58}
                    fill={SEV_COLOR[hovered.severity]}
                    fontSize={9}
                    fontFamily="monospace"
                    fontWeight={600}
                  >
                    {hovered.severity?.toUpperCase()}
                  </text>
                </g>
              );
            })()}
        </svg>

        {/* Empty state */}
        {dots.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-gray-600 text-xs font-mono">
              No geo-located attacks yet
            </div>
            <div className="text-gray-700 text-[10px] font-mono mt-1">
              Run the Simulator to see attack dots appear
            </div>
          </div>
        )}
      </div>

      {/* Two-column bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top attacking countries */}
        <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border text-[10px] font-mono text-gray-600 uppercase tracking-widest">
            Top Attacking Countries
          </div>
          <div className="divide-y divide-border">
            {topCountries.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs font-mono text-gray-600">
                No data yet
              </div>
            ) : (
              topCountries.map(([cc, count], i) => {
                const max = topCountries[0][1];
                return (
                  <div key={cc} className="px-5 py-2.5 flex items-center gap-3">
                    <span className="text-[10px] font-mono text-gray-600 w-4">
                      {i + 1}
                    </span>
                    <span className="font-mono text-gray-300 w-8 text-xs">
                      {cc}
                    </span>
                    <div className="flex-1 bg-surface-3 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-accent-red rounded-full transition-all duration-500"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-gray-400 text-xs w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent geo-located attacks */}
        <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border text-[10px] font-mono text-gray-600 uppercase tracking-widest">
            Recent Located Attacks
          </div>
          <div className="divide-y divide-border">
            {dots.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs font-mono text-gray-600">
                No data yet
              </div>
            ) : (
              dots.slice(0, 7).map((d, i) => (
                <div
                  key={i}
                  className="px-5 py-2.5 flex items-center gap-3 text-xs"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: SEV_COLOR[d.severity] }}
                  />
                  <span className="font-mono text-gray-500 w-8 flex-shrink-0">
                    {d.country}
                  </span>
                  <span className="font-mono text-gray-400 flex-1 truncate">
                    {CATEGORY_LABEL[d.category] || d.category}
                  </span>
                  <span className="font-mono text-gray-600 flex-shrink-0 truncate max-w-[80px]">
                    {d.ip}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
