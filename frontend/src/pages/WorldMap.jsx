// pages/WorldMap.jsx
// Real-time attack world map — D3 Natural Earth projection + TopoJSON land shapes
import { useEffect, useRef, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { CATEGORY_LABEL, cn } from '../lib/utils'

const SEV_COLOR = {
  critical: '#ff3b3b',
  high:     '#ff7b29',
  medium:   '#f5c518',
  low:      '#00d68f',
}

// Stable pseudo-coords for IPs with no geo data (local/simulated traffic)
function fallbackCoords(seed = 'x') {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) }
  const u = h >>> 0
  return { lat: (u % 14000) / 100 - 70, lon: (Math.floor(u / 14000) % 36000) / 100 - 180 }
}

function hasRealCoords(ll) {
  return Array.isArray(ll) && ll.length === 2 &&
    Number.isFinite(ll[0]) && Number.isFinite(ll[1]) &&
    !(ll[0] === 0 && ll[1] === 0)
}

export default function WorldMap() {
  const { events, stats } = useSelector(s => s.waf)
  const containerRef = useRef(null)
  const canvasRef    = useRef(null)
  const svgRef       = useRef(null)

  const [size, setSize]         = useState({ w: 800, h: 400 })
  const [geo, setGeo]           = useState(null)          // loaded GeoJSON
  const [projection, setProj]   = useState(null)          // d3 projection fn
  const [hovered, setHovered]   = useState(null)
  const [dots, setDots]         = useState([])
  const [libsReady, setLibs]    = useState(false)

  // ── 1. Load D3 + TopoJSON from CDN ────────────────────────────────────────
  useEffect(() => {
    const loadScript = src => new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) { res(); return }
      const s = document.createElement('script')
      s.src = src; s.onload = res; s.onerror = rej
      document.head.appendChild(s)
    })
    Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js'),
    ]).then(() => setLibs(true)).catch(console.error)
  }, [])

  // ── 2. Fetch world TopoJSON once libs are ready ────────────────────────────
  useEffect(() => {
    if (!libsReady) return
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(world => {
        const land      = window.topojson.feature(world, world.objects.land)
        const countries = window.topojson.feature(world, world.objects.countries)
        setGeo({ land, countries })
      })
      .catch(console.error)
  }, [libsReady])

  // ── 3. Track container width ───────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const w = Math.round(entries[0].contentRect.width)
      if (w > 0) setSize({ w, h: Math.round(w * 0.48) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── 4. Build D3 projection whenever size or geo changes ───────────────────
  useEffect(() => {
    if (!libsReady || !window.d3) return
    const proj = window.d3.geoNaturalEarth1()
      .scale(size.w / 6.1)
      .translate([size.w / 2, size.h / 2])
    setProj(() => proj)
  }, [size, libsReady])

  // ── 5. Draw land + country borders on canvas ──────────────────────────────
  useEffect(() => {
    if (!projection || !geo || !canvasRef.current || !window.d3) return
    const canvas  = canvasRef.current
    const ctx     = canvas.getContext('2d')
    const dpr     = window.devicePixelRatio || 1
    canvas.width  = size.w * dpr
    canvas.height = size.h * dpr
    canvas.style.width  = size.w + 'px'
    canvas.style.height = size.h + 'px'
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size.w, size.h)

    const path = window.d3.geoPath(projection, ctx)

    // Ocean
    ctx.fillStyle = '#0b1829'
    ctx.fillRect(0, 0, size.w, size.h)

    // Graticule (grid)
    const graticule = window.d3.geoGraticule()()
    ctx.beginPath(); path(graticule)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 0.5; ctx.stroke()

    // Land fill
    ctx.beginPath(); path(geo.land)
    ctx.fillStyle = '#1e2d42'
    ctx.fill()
    ctx.strokeStyle = '#2a3d54'
    ctx.lineWidth = 0.5; ctx.stroke()

    // Country borders
    ctx.beginPath(); path(geo.countries)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 0.4; ctx.stroke()

  }, [projection, geo, size])

  // ── 6. Convert blocked events → screen dots ───────────────────────────────
  useEffect(() => {
    if (!projection) return
    const overlapCount = new Map()

    const newDots = events.filter(e => e.blocked).slice(0, 120).map((e, i) => {
      let lat, lon
      if (hasRealCoords(e.ll)) {
        ;[lat, lon] = e.ll
      } else {
        const fb = fallbackCoords(String(e.ip || e.requestId || i))
        lat = fb.lat; lon = fb.lon
      }

      const raw = projection([lon, lat])
      if (!raw) return null
      let [x, y] = raw

      // Spread overlapping dots in a spiral
      const key = `${Math.round(x)}:${Math.round(y)}`
      const idx = overlapCount.get(key) || 0
      overlapCount.set(key, idx + 1)
      if (idx > 0) {
        const angle  = idx * 2.399963
        const radius = 3 + Math.floor(idx / 5) * 4
        x += Math.cos(angle) * radius
        y += Math.sin(angle) * radius
      }

      return {
        id:       e.requestId || (e.ip + e.timestamp),
        x:        Math.max(4, Math.min(size.w - 4, x)),
        y:        Math.max(4, Math.min(size.h - 4, y)),
        severity: e.severity || 'medium',
        category: e.category,
        country:  e.country && e.country !== 'XX' ? e.country : '?',
        ip:       e.ip,
        url:      e.url,
        ts:       e.timestamp,
      }
    }).filter(Boolean)

    setDots(newDots)
  }, [events, projection, size])

  // ── 7. SVG hover hit-test ─────────────────────────────────────────────────
  const handleMouseMove = useCallback(e => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const hit = dots.find(d => Math.hypot(d.x - mx, d.y - my) < 10)
    setHovered(hit || null)
  }, [dots])

  // Top countries
  const topCountries = Object.entries(stats?.attacksByCountry || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Tooltip position — keep inside map
  const tooltip = hovered ? (() => {
    const PAD = 8, TW = 160, TH = 76
    const tx = hovered.x + 14 + TW > size.w ? hovered.x - TW - PAD : hovered.x + PAD
    const ty = hovered.y - TH / 2 < 0 ? PAD : hovered.y + TH > size.h ? size.h - TH - PAD : hovered.y - TH / 2
    return { tx, ty }
  })() : null

  return (
    <div className="p-6 animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-display font-semibold text-white text-lg">Attack World Map</div>
          <div className="text-xs font-mono text-gray-500 mt-0.5">
            Real-time geo-location of blocked attacks — {dots.length} plotted
          </div>
        </div>
        <div className="flex items-center gap-5 text-[11px] font-mono">
          {Object.entries(SEV_COLOR).map(([s, c]) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: c }} />
              <span className="text-gray-500 capitalize">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div ref={containerRef} className="bg-surface-1 border border-border rounded-xl overflow-hidden relative select-none">
        {/* Canvas: land shapes */}
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: size.w, height: size.h }}
        />

        {/* SVG overlay: attack dots + tooltip */}
        <svg
          ref={svgRef}
          width={size.w}
          height={size.h}
          style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Attack dots */}
          {dots.map(dot => (
            <g key={dot.id}>
              {/* Outer pulse ring */}
              <circle cx={dot.x} cy={dot.y} r={6}
                fill="none"
                stroke={SEV_COLOR[dot.severity] || '#ff3b3b'}
                strokeWidth={1}
                opacity={0}>
                <animate attributeName="r"       values="5;16;5"   dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" />
              </circle>
              {/* Core dot */}
              <circle cx={dot.x} cy={dot.y} r={4.5}
                fill={SEV_COLOR[dot.severity] || '#ff3b3b'}
                stroke="rgba(0,0,0,0.4)"
                strokeWidth={1}
                opacity={0.92}
              />
              {/* Inner highlight */}
              <circle cx={dot.x - 1} cy={dot.y - 1} r={1.5}
                fill="rgba(255,255,255,0.35)"
              />
            </g>
          ))}

          {/* Tooltip */}
          {hovered && tooltip && (
            <g>
              <rect x={tooltip.tx} y={tooltip.ty} width={160} height={76}
                rx={7} fill="#0d1520" stroke="rgba(255,255,255,0.12)" strokeWidth={0.8} />
              {/* Severity accent bar */}
              <rect x={tooltip.tx} y={tooltip.ty} width={3} height={76}
                rx={1.5} fill={SEV_COLOR[hovered.severity] || '#ff3b3b'} />
              <text x={tooltip.tx + 12} y={tooltip.ty + 16} fill="#9ca3af" fontSize={9} fontFamily="monospace">
                {hovered.country}  ·  {hovered.ip}
              </text>
              <text x={tooltip.tx + 12} y={tooltip.ty + 31} fill="#e5e7eb" fontSize={11} fontFamily="monospace" fontWeight={600}>
                {CATEGORY_LABEL[hovered.category] || hovered.category || '—'}
              </text>
              <text x={tooltip.tx + 12} y={tooltip.ty + 46} fill="#6b7280" fontSize={9} fontFamily="monospace">
                {hovered.url?.slice(0, 23)}{hovered.url?.length > 23 ? '…' : ''}
              </text>
              <text x={tooltip.tx + 12} y={tooltip.ty + 61} fill={SEV_COLOR[hovered.severity]} fontSize={9} fontFamily="monospace" fontWeight={700}>
                {hovered.severity?.toUpperCase()}
              </text>
            </g>
          )}
        </svg>

        {/* Loading state */}
        {!geo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b1829]">
            <div className="text-gray-500 text-xs font-mono animate-pulse">Loading world map…</div>
          </div>
        )}

        {/* Empty state (map loaded, no attacks) */}
        {geo && dots.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-gray-600 text-xs font-mono">No blocked attacks plotted yet</div>
            <div className="text-gray-700 text-[10px] font-mono mt-1">Go to Simulator → Fire All Attacks to see dots appear</div>
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top attacking countries */}
        <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border text-[10px] font-mono text-gray-600 uppercase tracking-widest">
            Top Attacking Countries
          </div>
          <div className="divide-y divide-border">
            {topCountries.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs font-mono text-gray-600">No data yet</div>
            ) : topCountries.map(([cc, count], i) => {
              const max = topCountries[0][1]
              return (
                <div key={cc} className="px-5 py-2.5 flex items-center gap-3">
                  <span className="text-[10px] font-mono text-gray-600 w-4">{i + 1}</span>
                  <span className="font-mono text-gray-300 w-8 text-xs">{cc}</span>
                  <div className="flex-1 bg-surface-3 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-accent-red rounded-full transition-all duration-500"
                      style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="font-mono text-gray-400 text-xs w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent located attacks */}
        <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border text-[10px] font-mono text-gray-600 uppercase tracking-widest">
            Recent Plotted Attacks
          </div>
          <div className="divide-y divide-border">
            {dots.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs font-mono text-gray-600">No data yet</div>
            ) : dots.slice(0, 7).map((d, i) => (
              <div key={i} className="px-5 py-2.5 flex items-center gap-3 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SEV_COLOR[d.severity] }} />
                <span className="font-mono text-gray-400 w-8 flex-shrink-0">{d.country}</span>
                <span className="font-mono text-gray-500 flex-1 truncate">
                  {CATEGORY_LABEL[d.category] || d.category || '—'}
                </span>
                <span className="font-mono text-gray-600 flex-shrink-0 truncate max-w-[90px]">{d.ip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
