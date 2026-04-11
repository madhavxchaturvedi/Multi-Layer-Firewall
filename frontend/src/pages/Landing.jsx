// pages/Landing.jsx
// Dramatic WAF Guard landing page — animated, real-time, unforgettable
import { useEffect, useRef, useState } from 'react'

// Simulated live attack feed for the landing (no backend needed)
const ATTACK_TEMPLATES = [
  { type: 'SQL Injection',    sev: 'critical', flag: '🇷🇺', country: 'Russia',       ip: '91.108.4.',   path: '/api/login'       },
  { type: 'XSS Attack',       sev: 'high',     flag: '🇨🇳', country: 'China',        ip: '114.114.1.',  path: '/search?q='       },
  { type: 'Path Traversal',   sev: 'high',     flag: '🇧🇷', country: 'Brazil',       ip: '177.54.2.',   path: '/file?name='      },
  { type: 'Command Inject',   sev: 'critical', flag: '🇮🇷', country: 'Iran',         ip: '5.160.23.',   path: '/exec'            },
  { type: 'SSRF',             sev: 'critical', flag: '🇰🇵', country: 'N. Korea',     ip: '175.45.17.',  path: '/fetch?url='      },
  { type: 'Scanner Bot',      sev: 'medium',   flag: '🇩🇪', country: 'Germany',      ip: '46.101.55.',  path: '/wp-admin'        },
  { type: 'Rate Limit',       sev: 'medium',   flag: '🇺🇸', country: 'USA',          ip: '104.21.32.',  path: '/api/auth'        },
  { type: 'Honeypot Trip',    sev: 'critical', flag: '🇮🇳', country: 'India',        ip: '103.21.58.',  path: '/.env'            },
  { type: 'XSS Attack',       sev: 'high',     flag: '🇵🇰', country: 'Pakistan',     ip: '111.68.101.', path: '/comment'         },
  { type: 'SQL Injection',    sev: 'critical', flag: '🇺🇦', country: 'Ukraine',      ip: '194.165.16.', path: '/products?id='    },
  { type: 'XXE Injection',    sev: 'critical', flag: '🇹🇷', country: 'Turkey',       ip: '88.255.4.',   path: '/xml-parser'      },
  { type: 'Blind SQLi',       sev: 'critical', flag: '🇳🇬', country: 'Nigeria',      ip: '197.211.53.', path: '/api/user?id='    },
]

const SEV = {
  critical: { dot: '#ff3b3b', badge: 'bg-red-500/15 text-red-400 border-red-500/25',    label: 'CRITICAL' },
  high:     { dot: '#ff7b29', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/25', label: 'HIGH' },
  medium:   { dot: '#f5c518', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25', label: 'MEDIUM' },
}

const FEATURES = [
  { icon: '⬡', title: '5-Layer Defense',    desc: 'IP ban → Geo-block → Rate limit → Honeypot → OWASP rule engine. Every request passes all 5.' },
  { icon: '◉', title: 'Real-Time Feed',     desc: 'Socket.io pushes every blocked event to the dashboard instantly. Watch attacks stop live.' },
  { icon: '◈', title: 'World Attack Map',   desc: 'D3 Natural Earth projection with pulsing dots for every blocked request, located by IP.' },
  { icon: '⊛', title: 'Threat Timeline',    desc: 'Per-IP full attack history, accumulating threat score, and one-click ban from the dashboard.' },
  { icon: '⊞', title: 'Rule Engine',        desc: '14+ OWASP rules. Toggle each on/off. Write custom regex rules from the UI with live validation.' },
  { icon: '⚡', title: 'Attack Simulator',  desc: '8 attack types — SQL injection, XSS, SSRF, honeypot trips — fire them and watch blocks happen.' },
  { icon: '⚇', title: 'Webhook Alerts',    desc: 'Slack, Discord, or any HTTP endpoint. Set minimum severity. Test with one click.' },
  { icon: '≡', title: 'Audit Logs',         desc: 'Full paginated event log. Export as CSV or JSON. Filter by blocked, allowed, or category.' },
]

const STATS_DISPLAY = [
  { value: '14+',   label: 'OWASP Rules'       },
  { value: '5',     label: 'Defense Layers'    },
  { value: '<2ms',  label: 'Avg Inspect Time'  },
  { value: '100%',  label: 'Open Source'       },
]

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

export default function Landing({ onEnter }) {
  const canvasRef    = useRef(null)
  const animRef      = useRef(null)
  const [feed, setFeed]       = useState([])
  const [counter, setCounter] = useState(0)
  const [entered, setEntered] = useState(false)

  // ── Particle canvas background ─────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w = canvas.width  = window.innerWidth
    let h = canvas.height = window.innerHeight

    const onResize = () => {
      w = canvas.width  = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    // Create particles
    const particles = Array.from({ length: 90 }, () => ({
      x:  Math.random() * w,
      y:  Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.4 + 0.1,
    }))

    // Horizontal scan line
    let scanY = 0

    function draw() {
      ctx.clearRect(0, 0, w, h)

      // Deep background gradient
      const bg = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.8)
      bg.addColorStop(0, '#0f1824')
      bg.addColorStop(1, '#080b10')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // Red glow bloom top-center
      const glow = ctx.createRadialGradient(w / 2, -80, 0, w / 2, -80, w * 0.55)
      glow.addColorStop(0, 'rgba(255,59,59,0.13)')
      glow.addColorStop(1, 'rgba(255,59,59,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)

      // Subtle grid
      ctx.strokeStyle = 'rgba(255,255,255,0.025)'
      ctx.lineWidth = 0.5
      const gs = 52
      for (let x = 0; x < w; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke() }
      for (let y = 0; y < h; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke() }

      // Scan line
      scanY = (scanY + 0.6) % h
      const sl = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40)
      sl.addColorStop(0,   'rgba(255,59,59,0)')
      sl.addColorStop(0.5, 'rgba(255,59,59,0.06)')
      sl.addColorStop(1,   'rgba(255,59,59,0)')
      ctx.fillStyle = sl
      ctx.fillRect(0, scanY - 40, w, 80)

      // Connection lines between near particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(255,59,59,${0.06 * (1 - dist/120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      // Particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,80,80,${p.alpha})`
        ctx.fill()
      })

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // ── Simulated live attack counter ─────────────────────────────────────────
  useEffect(() => {
    setCounter(rand(284000, 291000))
    const iv = setInterval(() => setCounter(c => c + rand(1, 4)), rand(600, 1400))
    return () => clearInterval(iv)
  }, [])

  // ── Simulated live attack feed ────────────────────────────────────────────
  useEffect(() => {
    function addEntry() {
      const t = ATTACK_TEMPLATES[rand(0, ATTACK_TEMPLATES.length - 1)]
      const entry = {
        id:      Date.now() + Math.random(),
        type:    t.type,
        sev:     t.sev,
        flag:    t.flag,
        country: t.country,
        ip:      t.ip + rand(1, 254),
        path:    t.path,
        ts:      new Date().toLocaleTimeString('en-US', { hour12: false }),
      }
      setFeed(f => [entry, ...f].slice(0, 8))
    }
    addEntry()
    const iv = setInterval(addEntry, rand(900, 2200))
    return () => clearInterval(iv)
  }, [])

  // ── Enter animation ────────────────────────────────────────────────────────
  function handleEnter() {
    setEntered(true)
    setTimeout(onEnter, 600)
  }

  return (
    <div className={`landing-root relative min-h-screen overflow-x-hidden transition-all duration-500 ${entered ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>

      {/* Canvas background */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />

      {/* Content */}
      <div className="relative z-10">

        {/* ── Nav bar ─────────────────────────────────────────────────────── */}
        <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <span className="text-red-400 font-bold font-mono text-sm">W</span>
            </div>
            <span style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              className="text-white font-semibold tracking-wide">WAF Guard</span>
            <span className="text-[10px] font-mono text-red-400 border border-red-500/30 bg-red-500/10 px-2 py-0.5 rounded-full">v2.0</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-mono text-gray-400">System active</span>
            </div>
            <button onClick={handleEnter}
              className="px-4 py-2 text-xs font-mono bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded-lg transition-all duration-200 hover:border-red-500/50">
              Open Dashboard →
            </button>
          </div>
        </nav>

        {/* ── Hero section ────────────────────────────────────────────────── */}
        <section className="flex flex-col items-center text-center px-6 pt-20 pb-16">

          {/* Live badge */}
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 mb-8 animate-pulse-slow">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-xs font-mono text-red-400 uppercase tracking-widest">Live Protection Active</span>
          </div>

          {/* Main headline */}
          <h1 style={{ fontFamily: '"Space Grotesk", sans-serif' }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-6 max-w-4xl">
            Stop Attacks
            <br />
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #ff3b3b 0%, #ff7b29 50%, #f5c518 100%)' }}>
                Before They Land
              </span>
            </span>
          </h1>

          <p className="text-gray-400 text-lg max-w-xl leading-relaxed mb-10">
            A real-time Web Application Firewall with a full security operations dashboard.
            Blocks SQL injection, XSS, SSRF and more — before they reach your app.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <button onClick={handleEnter}
              className="group relative px-8 py-3.5 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #ff3b3b, #cc2222)' }}>
              <span className="relative z-10 flex items-center gap-2">
                Enter Dashboard
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </span>
              {/* Shimmer */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)', backgroundSize: '200% 100%' }} />
            </button>
            <a href="https://github.com" target="_blank" rel="noreferrer"
              className="px-8 py-3.5 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/25 hover:text-white transition-all duration-300 hover:scale-105 bg-white/5">
              View on GitHub
            </a>
          </div>

          {/* Live counter */}
          <div className="flex flex-col items-center gap-2 mb-16">
            <div className="text-5xl font-mono font-bold tabular-nums"
              style={{ color: '#ff3b3b', textShadow: '0 0 40px rgba(255,59,59,0.4)' }}>
              {counter.toLocaleString()}
            </div>
            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">attacks blocked this session</div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl w-full mb-20">
            {STATS_DISPLAY.map((s, i) => (
              <div key={i} className="bg-white/3 border border-white/8 rounded-xl px-4 py-4 text-center hover:border-red-500/20 transition-colors duration-300">
                <div className="text-2xl font-bold font-mono text-white mb-1"
                  style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{s.value}</div>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Live attack feed ────────────────────────────────────────────── */}
        <section className="px-6 pb-20 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Live global attack feed</span>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[10px] font-mono text-gray-700">simulated</span>
          </div>

          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            {/* Feed header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b border-white/5 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
              <span className="col-span-1" />
              <span className="col-span-3">Type</span>
              <span className="col-span-2">Severity</span>
              <span className="col-span-3">Origin</span>
              <span className="col-span-2 hidden sm:block">IP</span>
              <span className="col-span-1">Time</span>
            </div>

            <div className="divide-y divide-white/5 max-h-72 overflow-hidden">
              {feed.map((entry, i) => (
                <div key={entry.id}
                  className="grid grid-cols-12 gap-2 px-5 py-2.5 items-center text-xs hover:bg-white/3 transition-colors"
                  style={{
                    animation: i === 0 ? 'feedSlideIn 0.35s ease-out' : 'none',
                    opacity: 1 - i * 0.1
                  }}>
                  <div className="col-span-1 flex items-center">
                    <div className="w-2 h-2 rounded-full" style={{ background: SEV[entry.sev]?.dot }} />
                  </div>
                  <div className="col-span-3 font-mono text-gray-300 truncate">{entry.type}</div>
                  <div className="col-span-2">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${SEV[entry.sev]?.badge}`}>
                      {SEV[entry.sev]?.label}
                    </span>
                  </div>
                  <div className="col-span-3 font-mono text-gray-500 truncate">
                    <span className="mr-1">{entry.flag}</span>{entry.country}
                  </div>
                  <div className="col-span-2 font-mono text-gray-700 truncate hidden sm:block">{entry.ip}</div>
                  <div className="col-span-1 font-mono text-gray-700 text-[10px]">{entry.ts}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features grid ───────────────────────────────────────────────── */}
        <section className="px-6 pb-24 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[10px] font-mono text-red-400 uppercase tracking-widest mb-3">What's inside</div>
            <h2 style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              className="text-3xl font-bold text-white">Everything a WAF needs</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i}
                className="group bg-white/3 border border-white/8 rounded-2xl p-5 hover:border-red-500/25 hover:bg-red-500/5 transition-all duration-300 cursor-default">
                <div className="text-2xl mb-3 group-hover:scale-110 transition-transform duration-300 inline-block"
                  style={{ color: '#ff3b3b' }}>{f.icon}</div>
                <div className="font-semibold text-white text-sm mb-2"
                  style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{f.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────────── */}
        <section className="px-6 pb-20 text-center">
          <div className="max-w-2xl mx-auto bg-white/3 border border-red-500/15 rounded-3xl p-12"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,59,59,0.08) 0%, transparent 70%), rgba(255,255,255,0.02)' }}>
            <h2 style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              className="text-3xl font-bold text-white mb-4">Ready to see it in action?</h2>
            <p className="text-gray-400 text-sm mb-8">Fire real attacks and watch them get caught live. No setup required.</p>
            <button onClick={handleEnter}
              className="group px-10 py-4 rounded-xl font-bold text-white text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #ff3b3b, #cc2222)',
                boxShadow: '0 0 0 rgba(255,59,59,0)',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 40px rgba(255,59,59,0.35)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 0 rgba(255,59,59,0)'}>
              Open Dashboard
              <span className="ml-2 group-hover:translate-x-1 inline-block transition-transform duration-200">→</span>
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 px-8 py-5 flex items-center justify-between text-[11px] font-mono text-gray-700">
          <span>WAF Guard v2 — Advanced Web Application Firewall</span>
          <span>Node.js · React · Socket.io · D3</span>
        </footer>
      </div>

      <style>{`
        @keyframes feedSlideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-pulse-slow {
          animation: pulse 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
