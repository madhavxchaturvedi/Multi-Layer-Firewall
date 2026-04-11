// components/ThreatGauge.jsx
// Animated circular arc gauge for block rate / threat level
import { useEffect, useRef } from 'react'
import { cn } from '../lib/utils'

export default function ThreatGauge({ value = 0, label = 'Block Rate', size = 140 }) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const currentRef = useRef(0)

  // Determine color + label from value
  const getStyle = v => {
    if (v >= 70) return { color: '#ff3b3b', level: 'HIGH THREAT', textColor: '#ff3b3b' }
    if (v >= 40) return { color: '#ff7b29', level: 'ELEVATED',    textColor: '#ff7b29' }
    if (v >= 15) return { color: '#f5c518', level: 'MODERATE',    textColor: '#f5c518' }
    return           { color: '#00d68f', level: 'LOW THREAT',   textColor: '#00d68f' }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width  = size * dpr
    canvas.height = size * dpr
    canvas.style.width  = size + 'px'
    canvas.style.height = size + 'px'
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const r  = size * 0.38
    const startAngle = Math.PI * 0.75      // 135°
    const endAngle   = Math.PI * 2.25      // 405° (270° sweep)
    const target = Math.min(100, Math.max(0, value))

    const style = getStyle(target)

    function draw(pct) {
      ctx.clearRect(0, 0, size, size)

      // Background track
      ctx.beginPath()
      ctx.arc(cx, cy, r, startAngle, endAngle)
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'
      ctx.lineWidth = size * 0.09
      ctx.lineCap = 'round'
      ctx.stroke()

      // Tick marks
      for (let i = 0; i <= 10; i++) {
        const ang = startAngle + (endAngle - startAngle) * (i / 10)
        const innerR = r - size * 0.07
        const outerR = r + size * 0.04
        const x1 = cx + Math.cos(ang) * innerR
        const y1 = cy + Math.sin(ang) * innerR
        const x2 = cx + Math.cos(ang) * (i % 5 === 0 ? outerR : r - size * 0.035)
        const y2 = cy + Math.sin(ang) * (i % 5 === 0 ? outerR : r - size * 0.035)
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = i % 5 === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'
        ctx.lineWidth = i % 5 === 0 ? 1.5 : 0.8
        ctx.stroke()
      }

      if (pct > 0) {
        // Glow layer (wider, transparent)
        ctx.beginPath()
        ctx.arc(cx, cy, r, startAngle, startAngle + (endAngle - startAngle) * (pct / 100))
        ctx.strokeStyle = style.color + '40'
        ctx.lineWidth = size * 0.14
        ctx.lineCap = 'round'
        ctx.stroke()

        // Main arc
        ctx.beginPath()
        ctx.arc(cx, cy, r, startAngle, startAngle + (endAngle - startAngle) * (pct / 100))
        ctx.strokeStyle = style.color
        ctx.lineWidth = size * 0.09
        ctx.lineCap = 'round'
        ctx.stroke()

        // Tip dot
        const tipAngle = startAngle + (endAngle - startAngle) * (pct / 100)
        const tx = cx + Math.cos(tipAngle) * r
        const ty = cy + Math.sin(tipAngle) * r
        ctx.beginPath()
        ctx.arc(tx, ty, size * 0.055, 0, Math.PI * 2)
        ctx.fillStyle = style.color
        ctx.fill()
        // Tip inner highlight
        ctx.beginPath()
        ctx.arc(tx - size*0.012, ty - size*0.012, size * 0.02, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.fill()
      }

      // Center value text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `bold ${size * 0.22}px "Space Grotesk", sans-serif`
      ctx.fillStyle = style.color
      ctx.fillText(Math.round(pct) + '%', cx, cy - size * 0.04)

      // Label below value
      ctx.font = `${size * 0.085}px "JetBrains Mono", monospace`
      ctx.fillStyle = 'rgba(156,163,175,0.8)'
      ctx.fillText(label, cx, cy + size * 0.16)
    }

    // Animate from current to target
    const from = currentRef.current
    const duration = 900
    const start = performance.now()

    function animate(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = from + (target - from) * eased
      currentRef.current = current
      draw(current)
      if (progress < 1) animRef.current = requestAnimationFrame(animate)
    }

    cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animRef.current)
  }, [value, size, label])

  const style = getStyle(value)

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} />
      <div className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border"
        style={{ color: style.textColor, borderColor: style.color + '40', background: style.color + '15' }}>
        {style.level}
      </div>
    </div>
  )
}
