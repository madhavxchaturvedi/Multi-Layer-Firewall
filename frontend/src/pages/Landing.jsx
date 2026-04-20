// VANTIX — Landing Page v3
// Fixes: counter overflow, real world map SVG with land shapes, responsive, removed built-with
// Added: scroll progress bar, count-up stats on scroll, scroll reveal, radar sweep on map
import { useEffect, useRef, useState } from "react";

const T = {
  cream: "#fafaf8",
  ink: "#0a0a0a",
  crim: "#c41230",
  crimH: "#e8112d",
  steel: "#5c6b7a",
  muted: "#9aa5af",
  bdr: "rgba(10,10,10,0.08)",
  bdrM: "rgba(10,10,10,0.15)",
};

const ATTACKS = [
  {
    type: "SQL_INJECTION",
    sev: "CRIT",
    ip: "91.108.4.236",
    cc: "RU",
    path: "/api/login?id=1'+OR+'1'='1",
  },
  {
    type: "XSS_REFLECTED",
    sev: "HIGH",
    ip: "114.114.115.8",
    cc: "CN",
    path: "/search?q=<script>fetch(c2)",
  },
  {
    type: "PATH_TRAVERSAL",
    sev: "HIGH",
    ip: "5.160.23.141",
    cc: "IR",
    path: "/file?name=../../etc/passwd",
  },
  {
    type: "CMD_INJECTION",
    sev: "CRIT",
    ip: "45.33.32.156",
    cc: "US",
    path: "/exec?cmd=;cat /etc/shadow",
  },
  {
    type: "SSRF_METADATA",
    sev: "CRIT",
    ip: "175.45.176.1",
    cc: "KP",
    path: "/fetch?url=169.254.169.254",
  },
  {
    type: "HONEYPOT_TRIP",
    sev: "CRIT",
    ip: "103.21.58.99",
    cc: "IN",
    path: "/.env [honeypot]",
  },
  {
    type: "SCANNER_BOT",
    sev: "MED",
    ip: "197.211.53.22",
    cc: "NG",
    path: "/robots.txt sqlmap/1.7.8",
  },
  {
    type: "XXE_INJECTION",
    sev: "CRIT",
    ip: "88.255.4.17",
    cc: "TR",
    path: "/xml ENTITY SYSTEM file:///",
  },
  {
    type: "BLIND_SQLI",
    sev: "CRIT",
    ip: "177.54.2.100",
    cc: "BR",
    path: "/user?id=1;SELECT SLEEP(5)",
  },
  {
    type: "RATE_FLOOD",
    sev: "MED",
    ip: "111.68.101.44",
    cc: "PK",
    path: "/api/auth [72 req/min]",
  },
  {
    type: "GEO_BLOCK",
    sev: "LOW",
    ip: "194.165.16.55",
    cc: "UA",
    path: "/ [country blocked]",
  },
  {
    type: "HDRINJECTION",
    sev: "HIGH",
    ip: "46.101.55.210",
    cc: "DE",
    path: "/api Host: 169.254.169.254",
  },
];
const FEATURES = [
  {
    tag: "01",
    title: "Security Dashboard",
    body: "Live stats, hourly attack charts, category breakdown pie, top attacking countries — all via Socket.io.",
    stat: "9 pages total",
  },
  {
    tag: "02",
    title: "World Attack Map",
    body: "D3 Natural Earth projection. Blocked IPs appear as pulsing dots. Hover for attack detail. Country leaderboard.",
    stat: "Real-time geo",
  },
  {
    tag: "03",
    title: "OWASP Rule Engine",
    body: "14+ patterns: SQLi (classic, blind, comment), XSS (DOM, reflected), path traversal, CMDi, SSRF, XXE. Toggle and build custom rules.",
    stat: "14+ rules",
  },
  {
    tag: "04",
    title: "IP Manager",
    body: "Banned, suspicious (threat score bars), allowlist, and honeypot tabs. Auto-ban at score 80.",
    stat: "4 tabs",
  },
  {
    tag: "05",
    title: "Threat Timeline",
    body: "Per-IP full event history. Score graph, category breakdown. Ban or allowlist directly from the timeline.",
    stat: "Per-IP history",
  },
  {
    tag: "06",
    title: "Attack Simulator",
    body: "8 built-in vectors — SQLi, XSS, path traversal, CMDi, SSRF, honeypot, scanner, blind SQLi. Custom payload too.",
    stat: "8 attack types",
  },
  {
    tag: "07",
    title: "Webhook Alerts",
    body: "Slack, Discord, or any HTTP endpoint. Set severity threshold. One-click test. Fires in under 100ms.",
    stat: "<100ms",
  },
  {
    tag: "08",
    title: "Audit Logs",
    body: "Complete paginated log. Filter by status or category. One-click CSV or JSON export with a quick stats bar.",
    stat: "CSV + JSON",
  },
];
const LAYERS = [
  {
    n: "L1",
    title: "IP ban check",
    desc: "In-memory ban list check. Geo-block by country. Auto-populated by downstream layers.",
    ms: "+0ms",
  },
  {
    n: "L2",
    title: "Rate limiter",
    desc: "60 req/min per IP. Exceeding it returns HTTP 429 and adds +10 to the IP threat score.",
    ms: "+0.1ms",
  },
  {
    n: "L3",
    title: "Honeypot trap",
    desc: "Fake paths like /.env, /wp-admin. Any probe = permanent IP ban. Zero false positives.",
    ms: "+0.1ms",
  },
  {
    n: "L4",
    title: "Rule engine",
    desc: "14+ OWASP regex patterns across URL, query params, request body, and headers.",
    ms: "+0.8ms",
  },
  {
    n: "L5",
    title: "Threat scoring",
    desc: "Cumulative score per IP. Critical=+40, High=+25. Score ≥ 80 triggers auto-ban.",
    ms: "+0.1ms",
  },
];

// Attack dots with real lon/lat — projected by D3 at runtime
const MAP_DOTS = [
  { sev: "CRIT", cc: "RU" },
  { sev: "CRIT", cc: "CN" },
  { sev: "HIGH", cc: "IR" },
  { sev: "MED", cc: "IN" },
  { sev: "MED", cc: "US" },
  { sev: "HIGH", cc: "BR" },
  { sev: "MED", cc: "NG" },
  { sev: "LOW", cc: "JP" },
  { sev: "HIGH", cc: "DE" },
  { sev: "HIGH", cc: "PK" },
  { sev: "MED", cc: "ID" },
  { sev: "HIGH", cc: "TR" },
  { sev: "LOW", cc: "AU" },
  { sev: "CRIT", cc: "CO" },
  { sev: "CRIT", cc: "KZ" },
];
const DCOL = {
  CRIT: "#c41230",
  HIGH: "rgba(196,18,48,0.65)",
  MED: "rgba(92,107,122,0.8)",
  LOW: "rgba(92,107,122,0.4)",
};

function rnd(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
function hms() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function ScrollBar() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const fn = () => {
      const e = document.documentElement;
      setP((e.scrollTop / (e.scrollHeight - e.clientHeight)) * 100 || 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        zIndex: 9999,
        background: "rgba(10,10,10,0.06)",
      }}
    >
      <div
        style={{
          height: "100%",
          background: T.crim,
          width: `${p}%`,
          transition: "width 0.1s linear",
        }}
      />
    </div>
  );
}

function HeroBg() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    let W,
      H,
      af,
      t = 0;
    const pts = Array.from({ length: 48 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.015,
      vy: (Math.random() - 0.5) * 0.015,
    }));
    function resize() {
      W = c.width = c.offsetWidth;
      H = c.height = c.offsetHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    function draw() {
      t += 0.004;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#fafaf8";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(10,10,10,0.01)";
      for (let i = 0; i < 1400; i++)
        ctx.fillRect(rnd(0, W), rnd(0, H), rnd(1, 2), 1);
      ctx.fillStyle = "rgba(10,10,10,0.05)";
      for (let x = W * 0.46; x < W + 28; x += 25)
        for (let y = 0; y < H + 28; y += 25) {
          ctx.beginPath();
          ctx.arc(x, y, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 100) p.vx *= -1;
        if (p.y < 0 || p.y > 100) p.vy *= -1;
      });
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const dx = ((pts[i].x - pts[j].x) * W) / 100,
            dy = ((pts[i].y - pts[j].y) * H) / 100,
            d = Math.sqrt(dx * dx + dy * dy);
          if (d < 125) {
            ctx.beginPath();
            ctx.moveTo((pts[i].x * W) / 100, (pts[i].y * H) / 100);
            ctx.lineTo((pts[j].x * W) / 100, (pts[j].y * H) / 100);
            ctx.strokeStyle = `rgba(10,10,10,${0.032 * (1 - d / 125)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      const g = ctx.createRadialGradient(W * 0.85, 0, 0, W * 0.85, 0, W * 0.42);
      g.addColorStop(0, `rgba(196,18,48,${0.07 + Math.sin(t) * 0.018})`);
      g.addColorStop(0.55, `rgba(196,18,48,${0.022 + Math.sin(t) * 0.007})`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const g2 = ctx.createRadialGradient(0, H, 0, 0, H, W * 0.28);
      g2.addColorStop(0, `rgba(196,18,48,${0.03 + Math.sin(t + 1) * 0.01})`);
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#c41230";
      ctx.fillRect(0, 60, W, 1.5);
      af = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(af);
      ro.disconnect();
    };
  }, []);
  return (
    <canvas
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  );
}

function LiveCounter() {
  const [n, setN] = useState(rnd(1240000, 1260000));
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    const iv = setInterval(
      () => {
        setFlash(true);
        setN((v) => v + rnd(1, 5));
        setTimeout(() => setFlash(false), 100);
      },
      rnd(600, 1300),
    );
    return () => clearInterval(iv);
  }, []);
  return (
    <div>
      <div
        style={{
          fontFamily: '"Clash Display",sans-serif',
          fontWeight: 700,
          fontSize: "clamp(32px,4.2vw,68px)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: flash ? T.crim : T.ink,
          transition: "color 0.1s ease",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {n.toLocaleString()}
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono",monospace',
          fontSize: "10px",
          letterSpacing: "0.16em",
          color: T.muted,
          marginTop: "10px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: T.crim,
            display: "inline-block",
            animation: "blink 1.4s ease-in-out infinite",
            flexShrink: 0,
          }}
        />
        Attacks intercepted · session total
      </div>
    </div>
  );
}

function CountUp({ target, suffix = "", prefix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let start = null;
          const dur = 1100;
          const num = parseFloat(String(target).replace(/[^0-9.]/g, "")) || 0;
          const step = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / dur, 1);
            const e = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(num * e));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          obs.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

function WorldMapSVG() {
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState({ w: 800, h: 400 });
  const [sweepX, setSweepX] = useState(0);
  const [hov, setHov] = useState(null);
  const [tick, setTick] = useState(0);
  const projRef = useRef(null);

  // Responsive size
  useEffect(() => {
    const cont = canvasRef.current?.parentElement;
    if (!cont) return;
    const ro = new ResizeObserver((e) => {
      const w = Math.round(e[0].contentRect.width);
      if (w > 0) setSize({ w, h: Math.round(w * 0.48) });
    });
    ro.observe(cont);
    return () => ro.disconnect();
  }, []);

  // Load D3 + topojson + draw canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const loadScript = (src) =>
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
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"),
      loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js",
      ),
    ])
      .then(() =>
        fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
      )
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
        ctx.fillStyle = "#e4e2de";
        ctx.fill();
        // Graticule
        ctx.beginPath();
        path(graticule);
        ctx.strokeStyle = "rgba(10,10,10,0.06)";
        ctx.lineWidth = 0.4;
        ctx.stroke();
        // Land
        ctx.beginPath();
        path(land);
        ctx.fillStyle = "#c8c5bf";
        ctx.fill();
        // Borders
        ctx.beginPath();
        path(borders);
        ctx.strokeStyle = "#b5b2ab";
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // Outline
        ctx.beginPath();
        path(sphere);
        ctx.strokeStyle = "rgba(10,10,10,0.1)";
        ctx.lineWidth = 0.5;
        ctx.stroke();

        setReady(true);
      })
      .catch(() => setReady(true));
  }, [size]);

  // Redraw when size changes
  useEffect(() => {
    if (!ready) return;
  }, [size, ready]);

  // Sweep animation
  useEffect(() => {
    let x = 0;
    const iv = setInterval(() => {
      x = (x + 2) % size.w;
      setSweepX(x);
    }, 16);
    return () => clearInterval(iv);
  }, [size.w]);
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1200);
    return () => clearInterval(iv);
  }, []);

  // Project dots using d3 projection
  const projectedDots = projRef.current
    ? MAP_DOTS.map((d) => {
        const lonlat = [
          [37, 55],
          [116, 39],
          [51, 33],
          [77, 28],
          [-97, 38],
          [-51, -14],
          [8, 9],
          [138, 36],
          [10, 51],
          [73, 33],
          [112, -1],
          [36, 38],
          [134, -26],
          [-75, 4],
          [66, 48],
        ];
        const ll = lonlat[MAP_DOTS.indexOf(d)] || [0, 0];
        const pt = projRef.current(ll);
        return pt ? { ...d, px: pt[0], py: pt[1] } : null;
      }).filter(Boolean)
    : [];

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "6px",
        overflow: "hidden",
        border: `1px solid ${T.bdr}`,
        boxShadow: "0 4px 40px rgba(10,10,10,0.07)",
      }}
    >
      {/* Canvas: land */}
      <div style={{ position: "relative" }}>
        <canvas ref={canvasRef} style={{ display: "block", width: "100%" }} />
        {/* SVG overlay: sweep + dots */}
        <svg
          ref={svgRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            overflow: "visible",
          }}
          viewBox={`0 0 ${size.w} ${size.h}`}
          onMouseLeave={() => setHov(null)}
        >
          {/* Radar sweep */}
          <defs>
            <linearGradient id="swp" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(196,18,48,0)" />
              <stop offset="70%" stopColor="rgba(196,18,48,0)" />
              <stop offset="90%" stopColor="rgba(196,18,48,0.04)" />
              <stop offset="100%" stopColor="rgba(196,18,48,0.14)" />
            </linearGradient>
            <radialGradient id="cg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c41230" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#c41230" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect
            x={Math.max(0, sweepX - 60)}
            y="0"
            width="60"
            height={size.h}
            fill="url(#swp)"
          />
          <line
            x1={sweepX}
            y1="0"
            x2={sweepX}
            y2={size.h}
            stroke="rgba(196,18,48,0.18)"
            strokeWidth="1"
          />

          {/* Attack dots */}
          {projectedDots.map((d, i) => {
            const active = (i + tick) % 4 === 0 || (i + tick) % 3 === 0;
            const isH = hov === i;
            return (
              <g
                key={i}
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
                style={{ cursor: "pointer" }}
              >
                {(active || isH) && d.sev === "CRIT" && (
                  <circle cx={d.px} cy={d.py} r="20" fill="url(#cg)" />
                )}
                {(active || isH) && (
                  <circle
                    cx={d.px}
                    cy={d.py}
                    r="8"
                    fill="none"
                    stroke={DCOL[d.sev]}
                    strokeWidth="1"
                    opacity="0"
                  >
                    <animate
                      attributeName="r"
                      values="4;18;4"
                      dur={`${1.8 + i * 0.12}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.5;0;0.5"
                      dur={`${1.8 + i * 0.12}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                <circle
                  cx={d.px}
                  cy={d.py}
                  r={isH ? 6 : 4}
                  fill={DCOL[d.sev]}
                  stroke="rgba(250,250,248,0.9)"
                  strokeWidth={isH ? 1.5 : 0.8}
                />
                {isH && (
                  <g>
                    <rect
                      x={d.px + 8}
                      y={d.py - 22}
                      width={d.sev === "CRIT" ? 58 : 50}
                      height={38}
                      rx="3"
                      fill="rgba(10,10,10,0.92)"
                    />
                    <text
                      x={d.px + 14}
                      y={d.py - 8}
                      fontFamily="JetBrains Mono,monospace"
                      fontSize="9"
                      fill="#fafaf8"
                      fontWeight="600"
                    >
                      {d.cc}
                    </text>
                    <text
                      x={d.px + 14}
                      y={d.py + 4}
                      fontFamily="JetBrains Mono,monospace"
                      fontSize="8"
                      fill={DCOL[d.sev]}
                    >
                      {d.sev}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Live badge */}
          <rect
            x="12"
            y="12"
            width="84"
            height="22"
            rx="3"
            fill="rgba(250,250,248,0.95)"
            stroke="rgba(10,10,10,0.1)"
            strokeWidth="0.5"
          />
          <circle cx="24" cy="23" r="4" fill="#c41230">
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
            fill="#5c6b7a"
            letterSpacing="0.5"
          >
            LIVE FEED
          </text>

          {/* Active count */}
          <rect
            x={size.w - 96}
            y="12"
            width="84"
            height="22"
            rx="3"
            fill="rgba(196,18,48,0.9)"
          />
          <text
            x={size.w - 54}
            y="27"
            textAnchor="middle"
            fontFamily="JetBrains Mono,monospace"
            fontSize="8.5"
            fill="#fff"
            letterSpacing="0.5"
          >
            {MAP_DOTS.length} ACTIVE
          </text>
        </svg>

        {/* Loading state */}
        {!ready && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#e4e2de",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: '"JetBrains Mono",monospace',
                fontSize: "11px",
                color: T.muted,
                letterSpacing: "0.12em",
                animation: "blink 1.4s ease-in-out infinite",
              }}
            >
              Loading map…
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
          padding: "11px 16px",
          borderTop: `1px solid ${T.bdr}`,
          background: "rgba(250,250,248,0.95)",
          fontFamily: '"JetBrains Mono",monospace',
          fontSize: "9px",
          color: T.muted,
          letterSpacing: "0.1em",
          flexWrap: "wrap",
        }}
      >
        {[
          ["CRITICAL", "#c41230"],
          ["HIGH", "rgba(196,18,48,0.62)"],
          ["MEDIUM", "rgba(92,107,122,0.8)"],
          ["LOW", "rgba(92,107,122,0.42)"],
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
                flexShrink: 0,
              }}
            />
            {l}
          </div>
        ))}
        <div style={{ marginLeft: "auto" }}>
          D3 Natural Earth · IP Geo-location
        </div>
      </div>
    </div>
  );
}

const SEVP = {
  CRIT: { bg: "#c41230", t: "#fff" },
  HIGH: { bg: "rgba(196,18,48,0.1)", t: "#c41230" },
  MED: { bg: "rgba(92,107,122,0.1)", t: "#5c6b7a" },
  LOW: { bg: "rgba(92,107,122,0.07)", t: "#9aa5af" },
};
function FeedRow({ item, i }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 25);
    return () => clearTimeout(t);
  }, []);
  const s = SEVP[item.sev] || SEVP.LOW;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "54px 40px minmax(90px,1fr) minmax(90px,1fr) minmax(110px,2fr)",
        gap: "0 14px",
        alignItems: "center",
        padding: "9px 0",
        borderBottom: `1px solid ${T.bdr}`,
        fontFamily: '"JetBrains Mono",monospace',
        fontSize: "11px",
        opacity: on ? Math.max(0.2, 1 - i * 0.08) : 0,
        transform: on ? "none" : "translateY(-5px)",
        transition: "opacity 0.28s ease,transform 0.28s ease",
      }}
    >
      <span style={{ color: T.muted, fontSize: "10px" }}>{item.ts}</span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "8px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          padding: "2px 5px",
          borderRadius: "2px",
          background: s.bg,
          color: s.t,
        }}
      >
        {item.sev}
      </span>
      <span
        style={{
          color: T.steel,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {item.type}
      </span>
      <span
        style={{
          color: T.crim,
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {item.ip}
      </span>
      <span
        style={{
          color: T.muted,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {item.path}
      </span>
    </div>
  );
}

function FeatureCard({ tag, title, body, stat, i }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "28px 24px 24px",
        border: `1px solid ${hov ? "rgba(196,18,48,0.28)" : T.bdr}`,
        background: hov ? "rgba(196,18,48,0.02)" : T.cream,
        transition: "all 0.22s ease",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: T.crim,
          transformOrigin: "left",
          transform: hov ? "scaleX(1)" : "scaleX(0)",
          transition: "transform 0.24s ease",
        }}
      />
      <div
        style={{
          fontFamily: '"JetBrains Mono",monospace',
          fontSize: "9px",
          color: T.muted,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          marginBottom: "11px",
        }}
      >
        {tag}
      </div>
      <div
        style={{
          fontFamily: '"Clash Display",sans-serif',
          fontSize: "16px",
          fontWeight: 600,
          color: hov ? T.crim : T.ink,
          letterSpacing: "-0.01em",
          marginBottom: "9px",
          lineHeight: 1.25,
          transition: "color 0.2s",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: '"Instrument Serif",serif',
          fontSize: "13px",
          color: T.steel,
          lineHeight: 1.8,
          marginBottom: "16px",
        }}
      >
        {body}
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono",monospace',
          fontSize: "9px",
          color: hov ? T.crim : T.muted,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "color 0.2s",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "1px",
            background: hov ? T.crim : T.muted,
            transition: "background 0.2s",
          }}
        />
        {stat}
      </div>
    </div>
  );
}

function PipeStep({ n, title, desc, ms, i, last }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ display: "flex", gap: "0" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          width: "50px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: `2px solid ${hov ? T.crim : T.bdrM}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: hov ? T.crim : T.cream,
            fontFamily: '"Clash Display",sans-serif',
            fontSize: "12px",
            fontWeight: 700,
            color: hov ? "#fff" : T.steel,
            transition: "all 0.22s",
            flexShrink: 0,
          }}
        >
          {n}
        </div>
        {!last && (
          <div
            style={{
              width: "1.5px",
              flex: 1,
              background: T.bdr,
              minHeight: "26px",
              margin: "4px 0",
            }}
          />
        )}
      </div>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ padding: "5px 0 26px 18px", cursor: "default", flex: 1 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "5px",
          }}
        >
          <div
            style={{
              fontFamily: '"Clash Display",sans-serif',
              fontSize: "15px",
              fontWeight: 600,
              color: hov ? T.crim : T.ink,
              transition: "color 0.2s",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono",monospace',
              fontSize: "9px",
              color: T.muted,
              letterSpacing: "0.1em",
              border: `1px solid ${T.bdr}`,
              padding: "2px 7px",
              borderRadius: "100px",
              flexShrink: 0,
            }}
          >
            {ms}
          </div>
        </div>
        <div
          style={{
            fontFamily: '"Instrument Serif",serif',
            fontSize: "13px",
            color: T.steel,
            lineHeight: 1.75,
          }}
        >
          {desc}
        </div>
      </div>
    </div>
  );
}

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) {
          setVis(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : "translateY(26px)",
        transition: `opacity 0.58s ease ${delay}s,transform 0.58s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function Landing({ onEnter }) {
  const [feed, setFeed] = useState([]);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    setTimeout(() => setReady(true), 80);
  }, []);
  useEffect(() => {
    const add = () =>
      setFeed((f) =>
        [
          {
            ...ATTACKS[rnd(0, ATTACKS.length - 1)],
            ts: hms(),
            id: Date.now() + Math.random(),
          },
          ...f,
        ].slice(0, 10),
      );
    add();
    const iv = setInterval(add, rnd(900, 2100));
    return () => clearInterval(iv);
  }, []);
  function enter() {
    setLeaving(true);
    setTimeout(onEnter, 700);
  }
  const btn = {
    fontFamily: '"Clash Display",sans-serif',
    fontSize: "14px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    border: "none",
    cursor: "pointer",
    transition: "all 0.25s ease",
  };
  const pad = "clamp(20px,5vw,56px)";

  return (
    <div
      style={{
        background: T.cream,
        color: T.ink,
        minHeight: "100vh",
        overflowX: "hidden",
        position: "relative",
        opacity: ready && !leaving ? 1 : 0,
        transform: leaving ? "scale(0.97)" : "scale(1)",
        filter: leaving ? "brightness(0.1)" : "brightness(1)",
        transition: "opacity 0.5s ease,transform 0.65s ease,filter 0.65s ease",
      }}
    >
      <ScrollBar />

      {/* NAV */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(250,250,248,0.9)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: `1px solid ${T.bdr}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `0 ${pad}`,
          height: "62px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              background: T.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "14px",
                height: "14px",
                border: "2px solid #c41230",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: "4px",
                  height: "4px",
                  background: "#c41230",
                }}
              />
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: '"Clash Display",sans-serif',
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: T.ink,
                lineHeight: 1,
              }}
            >
              VANTIX
            </div>
            <div
              style={{
                fontFamily: '"JetBrains Mono",monospace',
                fontSize: "8px",
                color: T.muted,
                letterSpacing: "0.18em",
                lineHeight: 1,
                marginTop: "2px",
              }}
            >
              WEB APPLICATION FIREWALL
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(14px,3vw,28px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: T.crim,
                animation: "blink 1.6s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontFamily: '"JetBrains Mono",monospace',
                fontSize: "10px",
                color: T.muted,
                letterSpacing: "0.1em",
                whiteSpace: "nowrap",
              }}
            >
              LIVE
            </span>
          </div>
          <button
            onClick={enter}
            style={{
              ...btn,
              background: T.ink,
              color: T.cream,
              padding: "10px clamp(14px,2.5vw,26px)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = T.crim)}
            onMouseLeave={(e) => (e.currentTarget.style.background = T.ink)}
          >
            Dashboard →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          minHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <HeroBg />
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "1320px",
            margin: "0 auto",
            padding: `clamp(48px,8vh,90px) ${pad} clamp(40px,6vh,72px)`,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              fontFamily: '"JetBrains Mono",monospace',
              fontSize: "10px",
              color: T.muted,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "36px",
              animation: "fadeUp 0.55s ease 0.1s both",
            }}
          >
            <div
              style={{
                width: "22px",
                height: "1px",
                background: T.crim,
                flexShrink: 0,
              }}
            />
            5-layer threat interception · Real-time dashboard · Open source
          </div>

          {/* Hero grid — explicit columns, stacks on mobile */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) minmax(0,400px)",
              gap: "clamp(28px,5vw,72px)",
              alignItems: "end",
            }}
            className="hero-grid"
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  padding: 0,
                  animation: "fadeUp 0.55s ease 0.18s both",
                }}
              >
                <div
                  style={{
                    fontFamily: '"Clash Display",sans-serif',
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    lineHeight: 0.92,
                    fontSize: "clamp(56px,9vw,120px)",
                    color: T.ink,
                  }}
                >
                  DEFEND
                  <br />
                  <span style={{ color: T.crim }}>YOUR</span>
                  <br />
                  APP.
                </div>
              </h1>
              <p
                style={{
                  fontFamily: '"Instrument Serif",serif',
                  fontSize: "clamp(15px,1.6vw,19px)",
                  color: T.steel,
                  lineHeight: 1.78,
                  maxWidth: "460px",
                  margin: `clamp(20px,3vh,36px) 0 clamp(22px,3.5vh,42px)`,
                  animation: "fadeUp 0.55s ease 0.3s both",
                }}
              >
                Vantix sits between the internet and your application —
                inspecting every request through 5 security layers in under 2ms.
                SQL injection, XSS, SSRF — blocked before they land.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  animation: "fadeUp 0.55s ease 0.42s both",
                }}
              >
                <button
                  onClick={enter}
                  style={{
                    ...btn,
                    background: T.crim,
                    color: "#fff",
                    padding: "clamp(12px,1.5vh,15px) clamp(22px,3vw,38px)",
                    boxShadow: "0 4px 20px rgba(196,18,48,0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = T.crimH;
                    e.currentTarget.style.boxShadow =
                      "0 8px 36px rgba(196,18,48,0.45)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = T.crim;
                    e.currentTarget.style.boxShadow =
                      "0 4px 20px rgba(196,18,48,0.3)";
                  }}
                >
                  Launch Dashboard →
                </button>
                <button
                  style={{
                    ...btn,
                    background: "transparent",
                    color: T.ink,
                    padding: "clamp(12px,1.5vh,15px) clamp(18px,2.5vw,30px)",
                    border: `1.5px solid ${T.bdrM}`,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = T.ink)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = T.bdrM)
                  }
                >
                  View Source
                </button>
              </div>
            </div>

            {/* Counter card — fixed overflow */}
            <div style={{ animation: "fadeUp 0.55s ease 0.26s both" }}>
              <div
                style={{
                  background: "rgba(250,250,248,0.8)",
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${T.bdr}`,
                  padding: "clamp(22px,3vw,34px)",
                  boxShadow: "0 2px 24px rgba(10,10,10,0.06)",
                }}
              >
                <div
                  style={{
                    fontFamily: '"JetBrains Mono",monospace',
                    fontSize: "9px",
                    color: T.muted,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    marginBottom: "14px",
                  }}
                >
                  ↯ Session counter
                </div>
                <LiveCounter />
                <div
                  style={{
                    height: "1px",
                    background: T.bdr,
                    margin: "clamp(14px,2.2vh,26px) 0",
                  }}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1px",
                    background: T.bdr,
                  }}
                >
                  {[
                    { v: "14+", l: "OWASP rules", c: T.crim },
                    { v: "5", l: "Defense layers", c: T.ink },
                    { v: "<2ms", l: "Latency", c: T.ink },
                    { v: "100%", l: "Open source", c: T.ink },
                  ].map((s, i) => (
                    <div
                      key={i}
                      style={{
                        background: T.cream,
                        padding:
                          "clamp(10px,1.8vh,16px) clamp(10px,1.5vw,14px)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: '"Clash Display",sans-serif',
                          fontSize: "clamp(20px,2.8vw,30px)",
                          fontWeight: 700,
                          color: s.c,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {s.v}
                      </div>
                      <div
                        style={{
                          fontFamily: '"JetBrains Mono",monospace',
                          fontSize: "8px",
                          color: T.muted,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          marginTop: "3px",
                        }}
                      >
                        {s.l}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div
        style={{
          background: T.ink,
          overflow: "hidden",
          borderTop: `2px solid ${T.crim}`,
          borderBottom: "2px solid rgba(196,18,48,0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            animation: "marquee 30s linear infinite",
            whiteSpace: "nowrap",
            padding: "12px 0",
          }}
        >
          {Array(6)
            .fill(
              "SQL INJECTION  ·  XSS ATTACK  ·  PATH TRAVERSAL  ·  CMD INJECTION  ·  SSRF  ·  XXE  ·  HONEYPOT TRAP  ·  RATE LIMITING  ·  GEO-BLOCKING  ·  SCANNER DETECT  ·  BLIND SQLI  ·  THREAT SCORING  ·  ",
            )
            .map((t, i) => (
              <span
                key={i}
                style={{
                  fontFamily: '"Clash Display",sans-serif',
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "rgba(250,250,248,0.68)",
                  letterSpacing: "0.14em",
                }}
              >
                {t}
              </span>
            ))}
        </div>
      </div>

      {/* PIPELINE */}
      <section
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: `clamp(52px,7vh,88px) ${pad}`,
        }}
      >
        <Reveal>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(100%,300px),1fr))",
              gap: "clamp(36px,5vw,88px)",
              alignItems: "start",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono",monospace',
                  fontSize: "9px",
                  color: T.crim,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginBottom: "14px",
                }}
              >
                // How it works
              </div>
              <h2
                style={{
                  fontFamily: '"Clash Display",sans-serif',
                  fontSize: "clamp(28px,4.5vw,50px)",
                  fontWeight: 700,
                  color: T.ink,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.05,
                  marginBottom: "20px",
                }}
              >
                Every request.
                <br />5 checkpoints.
              </h2>
              <p
                style={{
                  fontFamily: '"Instrument Serif",serif',
                  fontSize: "15px",
                  color: T.steel,
                  lineHeight: 1.82,
                  marginBottom: "26px",
                }}
              >
                Vantix proxies every inbound HTTP request through all five
                layers in order. One match = instant 403. Passing all five =
                forwarded to your app unchanged.
              </p>
              <div
                style={{
                  background: "#0a0a0a",
                  borderRadius: "4px",
                  padding: "18px 20px",
                  fontFamily: '"JetBrains Mono",monospace',
                  fontSize: "11px",
                  lineHeight: 1.95,
                  overflowX: "auto",
                }}
              >
                <div
                  style={{
                    color: "rgba(250,250,248,0.3)",
                    marginBottom: "3px",
                  }}
                >
                  $ curl http://app.com/api/login?id=1\'
                </div>
                <div style={{ color: "rgba(250,250,248,0.48)" }}>
                  → Vantix proxy · port 4000
                </div>
                <div style={{ color: "rgba(250,250,248,0.48)" }}>
                  → L1 IP check <span style={{ color: "#22c55e" }}>✓</span>
                </div>
                <div style={{ color: "rgba(250,250,248,0.48)" }}>
                  → L2 rate limit <span style={{ color: "#22c55e" }}>✓</span>
                </div>
                <div style={{ color: "rgba(250,250,248,0.48)" }}>
                  → L3 honeypot <span style={{ color: "#22c55e" }}>✓</span>
                </div>
                <div style={{ color: "rgba(250,250,248,0.48)" }}>
                  → L4 rules{" "}
                  <span style={{ color: T.crim, fontWeight: 600 }}>
                    ✕ BLOCKED
                  </span>
                </div>
                <div
                  style={{
                    color: "rgba(250,250,248,0.28)",
                    marginTop: "5px",
                    fontSize: "10px",
                  }}
                >
                  HTTP 403 · SQLi-001 · IP score +40
                </div>
              </div>
            </div>
            <div style={{ paddingTop: "6px" }}>
              {LAYERS.map((l, i) => (
                <PipeStep key={i} {...l} i={i} last={i === LAYERS.length - 1} />
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* WORLD MAP */}
      <section
        style={{ background: T.ink, padding: `clamp(52px,7vh,88px) ${pad}` }}
      >
        <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
          <Reveal>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(min(100%,260px),1fr))",
                gap: "clamp(28px,4vw,72px)",
                alignItems: "center",
                marginBottom: "32px",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono",monospace',
                    fontSize: "9px",
                    color: T.crim,
                    letterSpacing: "0.2em",
                    marginBottom: "14px",
                  }}
                >
                  // World Map
                </div>
                <h2
                  style={{
                    fontFamily: '"Clash Display",sans-serif',
                    fontSize: "clamp(26px,4.5vw,48px)",
                    fontWeight: 700,
                    color: T.cream,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                  }}
                >
                  See attacks
                  <br />
                  coming. Live.
                </h2>
              </div>
              <p
                style={{
                  fontFamily: '"Instrument Serif",serif',
                  fontSize: "15px",
                  color: "rgba(250,250,248,0.45)",
                  lineHeight: 1.82,
                  margin: 0,
                }}
              >
                Every blocked IP is geo-located and plotted as a pulsing dot —
                colored by severity. Hover any dot for country detail. The
                animated radar sweep shows real-time scan activity.
              </p>
            </div>
            <WorldMapSVG />
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill,minmax(min(100%,190px),1fr))",
                gap: "1px",
                background: "rgba(250,250,248,0.04)",
                marginTop: "1px",
              }}
            >
              {[
                ["Geo-location", "IP → lat/long via geoip-lite"],
                ["Severity color", "Critical, high, medium, low"],
                ["Radar sweep", "Animated scan across the map"],
                ["Country leaderboard", "Real-time top attackers"],
              ].map(([t, d]) => (
                <div
                  key={t}
                  style={{ padding: "20px 22px", background: T.ink }}
                >
                  <div
                    style={{
                      fontFamily: '"Clash Display",sans-serif',
                      fontSize: "13px",
                      fontWeight: 600,
                      color: T.cream,
                      marginBottom: "5px",
                    }}
                  >
                    {t}
                  </div>
                  <div
                    style={{
                      fontFamily: '"Instrument Serif",serif',
                      fontSize: "12px",
                      color: "rgba(250,250,248,0.36)",
                      lineHeight: 1.68,
                    }}
                  >
                    {d}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* LIVE FEED */}
      <section
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: `clamp(52px,7vh,88px) ${pad}`,
        }}
      >
        <Reveal>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(100%,280px),1fr))",
              gap: "clamp(28px,4vw,72px)",
              alignItems: "start",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono",monospace',
                  fontSize: "9px",
                  color: T.crim,
                  letterSpacing: "0.2em",
                  marginBottom: "14px",
                }}
              >
                // Live Feed
              </div>
              <h2
                style={{
                  fontFamily: '"Clash Display",sans-serif',
                  fontSize: "clamp(26px,4vw,42px)",
                  fontWeight: 700,
                  color: T.ink,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  marginBottom: "16px",
                }}
              >
                Threat intelligence in real time
              </h2>
              <p
                style={{
                  fontFamily: '"Instrument Serif",serif',
                  fontSize: "15px",
                  color: T.steel,
                  lineHeight: 1.82,
                  marginBottom: "22px",
                }}
              >
                Socket.io pushes every event the instant it's blocked. Click any
                row to inspect the full payload and matched rule. Mark as false
                positive with one click.
              </p>
              {[
                "Click event → full payload + matched rule",
                "Request replay — re-fire any blocked request",
                "False positive → 1-click allowlist the IP",
                "Filter by blocked, allowed, or category",
              ].map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    fontFamily: '"JetBrains Mono",monospace',
                    fontSize: "11px",
                    color: T.steel,
                    marginBottom: "9px",
                  }}
                >
                  <div
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: T.crim,
                      flexShrink: 0,
                      marginTop: "5px",
                    }}
                  />
                  {f}
                </div>
              ))}
            </div>
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "54px 40px minmax(80px,1fr) minmax(80px,1fr) minmax(100px,2fr)",
                  gap: "0 14px",
                  padding: "7px 0",
                  fontFamily: '"JetBrains Mono",monospace',
                  fontSize: "9px",
                  color: T.muted,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  borderBottom: `1px solid ${T.bdrM}`,
                  marginBottom: "2px",
                }}
              >
                <span>Time</span>
                <span>Sev</span>
                <span>Type</span>
                <span>Source</span>
                <span>Path</span>
              </div>
              {feed.map((item, i) => (
                <FeedRow key={item.id} item={item} i={i} />
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* FEATURES */}
      <section
        style={{
          background: "rgba(10,10,10,0.025)",
          borderTop: `1px solid ${T.bdr}`,
          borderBottom: `1px solid ${T.bdr}`,
          padding: `clamp(52px,7vh,88px) ${pad}`,
        }}
      >
        <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
          <Reveal>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: "28px",
                flexWrap: "wrap",
                marginBottom: "44px",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono",monospace',
                    fontSize: "9px",
                    color: T.crim,
                    letterSpacing: "0.2em",
                    marginBottom: "12px",
                  }}
                >
                  // Dashboard pages
                </div>
                <h2
                  style={{
                    fontFamily: '"Clash Display",sans-serif',
                    fontSize: "clamp(26px,4.5vw,48px)",
                    fontWeight: 700,
                    color: T.ink,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    margin: 0,
                  }}
                >
                  Everything you need.
                  <br />
                  Nothing you don't.
                </h2>
              </div>
              <p
                style={{
                  fontFamily: '"Instrument Serif",serif',
                  fontSize: "15px",
                  color: T.steel,
                  lineHeight: 1.78,
                  maxWidth: "320px",
                  margin: 0,
                }}
              >
                Nine dashboard pages covering detection, visualization, history,
                and testing.
              </p>
            </div>
          </Reveal>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill,minmax(min(100%,270px),1fr))",
              gap: "1px",
              background: T.bdr,
            }}
          >
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <FeatureCard {...f} i={0} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: `clamp(52px,7vh,88px) ${pad}`,
        }}
      >
        <Reveal>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill,minmax(min(100%,180px),1fr))",
              gap: "1px",
              background: T.bdr,
            }}
          >
            {[
              {
                target: 1200000,
                suf: "+",
                pre: "",
                l: "Attacks blocked",
                s: "in simulated sessions",
              },
              {
                target: 2,
                suf: "ms",
                pre: "<",
                l: "Avg inspect time",
                s: "per request end-to-end",
              },
              {
                target: 14,
                suf: "+",
                pre: "",
                l: "Detection rules",
                s: "OWASP Top 10 coverage",
              },
              {
                target: 5,
                suf: "",
                pre: "",
                l: "Defense layers",
                s: "every request, always",
              },
              {
                target: 100,
                suf: "%",
                pre: "",
                l: "Open source",
                s: "MIT licensed, no lock-in",
              },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "clamp(24px,3.5vh,38px) clamp(18px,2.5vw,30px)",
                  background: T.cream,
                  transition: "background 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(196,18,48,0.025)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = T.cream)
                }
              >
                <div
                  style={{
                    fontFamily: '"Clash Display",sans-serif',
                    fontSize: "clamp(34px,4.5vw,54px)",
                    fontWeight: 700,
                    color: i === 0 ? T.crim : T.ink,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {s.pre}
                  <CountUp target={s.target} />
                  {s.suf}
                </div>
                <div
                  style={{
                    fontFamily: '"Clash Display",sans-serif',
                    fontSize: "13px",
                    fontWeight: 600,
                    color: T.ink,
                    marginTop: "9px",
                    marginBottom: "3px",
                  }}
                >
                  {s.l}
                </div>
                <div
                  style={{
                    fontFamily: '"Instrument Serif",serif',
                    fontSize: "12px",
                    color: T.muted,
                  }}
                >
                  {s.s}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: `clamp(64px,9vh,112px) ${pad}`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 100%,rgba(196,18,48,0.05) 0%,transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div
            style={{
              fontFamily: '"Clash Display",sans-serif',
              fontSize: "clamp(80px,20vw,220px)",
              fontWeight: 700,
              color: "rgba(10,10,10,0.028)",
              letterSpacing: "-0.03em",
              whiteSpace: "nowrap",
            }}
          >
            VANTIX
          </div>
        </div>
        <Reveal>
          <div
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: "660px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                fontFamily: '"JetBrains Mono",monospace',
                fontSize: "9px",
                color: T.crim,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              // Ready to deploy?
            </div>
            <h2
              style={{
                fontFamily: '"Clash Display",sans-serif',
                fontSize: "clamp(42px,8vw,84px)",
                fontWeight: 700,
                color: T.ink,
                letterSpacing: "-0.03em",
                lineHeight: 0.92,
                marginBottom: "22px",
              }}
            >
              DEPLOY
              <br />
              <span style={{ color: T.crim }}>VANTIX</span>
              <br />
              NOW.
            </h2>
            <p
              style={{
                fontFamily: '"Instrument Serif",serif',
                fontSize: "clamp(14px,1.7vw,17px)",
                color: T.steel,
                lineHeight: 1.78,
                marginBottom: "36px",
              }}
            >
              No backend needed for demo. Open dashboard → enable Demo Mode →
              hit Simulator. Fire all 8 attacks and watch Vantix catch every
              single one.
            </p>
            <div
              style={{
                display: "flex",
                gap: "13px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={enter}
                style={{
                  ...btn,
                  background: T.crim,
                  color: "#fff",
                  padding: "clamp(13px,1.8vh,17px) clamp(28px,4vw,48px)",
                  fontSize: "clamp(13px,1.4vw,15px)",
                  boxShadow: "0 4px 26px rgba(196,18,48,0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.crimH;
                  e.currentTarget.style.boxShadow =
                    "0 8px 42px rgba(196,18,48,0.46)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = T.crim;
                  e.currentTarget.style.boxShadow =
                    "0 4px 26px rgba(196,18,48,0.3)";
                }}
              >
                Launch Dashboard →
              </button>
              <button
                style={{
                  ...btn,
                  background: "transparent",
                  color: T.ink,
                  padding: "clamp(13px,1.8vh,17px) clamp(22px,3vw,36px)",
                  fontSize: "clamp(13px,1.4vw,15px)",
                  border: `1.5px solid ${T.bdrM}`,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = T.ink)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = T.bdrM)
                }
              >
                GitHub →
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: `1px solid ${T.bdr}`,
          padding: `22px ${pad}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "22px",
              height: "22px",
              background: T.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "9px",
                height: "9px",
                border: "1.5px solid #c41230",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: '"JetBrains Mono",monospace',
              fontSize: "10px",
              color: T.muted,
              letterSpacing: "0.1em",
            }}
          >
            VANTIX · WEB APPLICATION FIREWALL · v2.0 · MIT
          </span>
        </div>
        <span
          style={{
            fontFamily: '"JetBrains Mono",monospace',
            fontSize: "10px",
            color: "rgba(10,10,10,0.22)",
            letterSpacing: "0.08em",
          }}
        >
          Node.js · React · Socket.io · D3
        </span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        button{outline:none}
        ::selection{background:rgba(196,18,48,0.14)}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(196,18,48,0.22);border-radius:2px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(196,18,48,0.44)}

        /* Hero grid: 2-col at ≥820px, single col below */
        .hero-grid{grid-template-columns:minmax(0,1fr) minmax(0,400px)!important}
        @media(max-width:820px){
          .hero-grid{grid-template-columns:1fr!important}
        }

        /* Feature cards — subtle lift on hover */
        .feat-card:hover{transform:translateY(-2px)}
        .feat-card{transition:all 0.22s ease}

        /* Smooth section entries */
        section{contain:layout style}

        /* Marquee double speed on hover */
        .marquee-track:hover{animation-play-state:paused}
      `}</style>
    </div>
  );
}
