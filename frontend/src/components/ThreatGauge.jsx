// ThreatGauge.jsx — Vantix Design System
import { useEffect, useRef } from "react";
import { C, F } from "../lib/ds";

export default function ThreatGauge({
  value = 0,
  label = "Block Rate",
  size = 140,
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const currentRef = useRef(0);

  function getStyle(v) {
    if (v >= 70) return { color: C.crim, level: "HIGH THREAT" };
    if (v >= 40) return { color: "#d97706", level: "ELEVATED" };
    if (v >= 15) return { color: "#ca8a04", level: "MODERATE" };
    return { color: C.greenL, level: "LOW THREAT" };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.scale(dpr, dpr);

    const cx = size / 2,
      cy = size / 2,
      r = size * 0.38;
    const startAngle = Math.PI * 0.75,
      endAngle = Math.PI * 2.25;
    const target = Math.min(100, Math.max(0, value));
    const style = getStyle(target);

    function draw(pct) {
      ctx.clearRect(0, 0, size, size);

      // Track
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = size * 0.09;
      ctx.lineCap = "round";
      ctx.stroke();

      // Tick marks
      for (let i = 0; i <= 10; i++) {
        const ang = startAngle + (endAngle - startAngle) * (i / 10);
        const innerR = r - size * 0.07,
          outerR = r + size * 0.04;
        const x1 = cx + Math.cos(ang) * innerR,
          y1 = cy + Math.sin(ang) * innerR;
        const x2 =
            cx + Math.cos(ang) * (i % 5 === 0 ? outerR : r - size * 0.035),
          y2 = cy + Math.sin(ang) * (i % 5 === 0 ? outerR : r - size * 0.035);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle =
          i % 5 === 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)";
        ctx.lineWidth = i % 5 === 0 ? 1.5 : 0.8;
        ctx.stroke();
      }

      if (pct > 0) {
        // Glow
        ctx.beginPath();
        ctx.arc(
          cx,
          cy,
          r,
          startAngle,
          startAngle + (endAngle - startAngle) * (pct / 100),
        );
        ctx.strokeStyle = style.color + "35";
        ctx.lineWidth = size * 0.14;
        ctx.lineCap = "round";
        ctx.stroke();
        // Arc
        ctx.beginPath();
        ctx.arc(
          cx,
          cy,
          r,
          startAngle,
          startAngle + (endAngle - startAngle) * (pct / 100),
        );
        ctx.strokeStyle = style.color;
        ctx.lineWidth = size * 0.09;
        ctx.lineCap = "round";
        ctx.stroke();
        // Tip
        const tipAngle = startAngle + (endAngle - startAngle) * (pct / 100);
        const tx = cx + Math.cos(tipAngle) * r,
          ty = cy + Math.sin(tipAngle) * r;
        ctx.beginPath();
        ctx.arc(tx, ty, size * 0.055, 0, Math.PI * 2);
        ctx.fillStyle = style.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
          tx - size * 0.012,
          ty - size * 0.012,
          size * 0.02,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fill();
      }

      // Value text
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `bold ${size * 0.22}px ${F.display}`;
      ctx.fillStyle = style.color;
      ctx.fillText(Math.round(pct) + "%", cx, cy - size * 0.04);
      // Label
      ctx.font = `${size * 0.08}px ${F.mono}`;
      ctx.fillStyle = "rgba(138,138,148,0.8)";
      ctx.fillText(label, cx, cy + size * 0.16);
    }

    const from = currentRef.current;
    const duration = 900,
      start = performance.now();
    function animate(now) {
      const elapsed = now - start,
        progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (target - from) * eased;
      currentRef.current = current;
      draw(current);
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    }
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [value, size, label]);

  const style = getStyle(value);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <canvas ref={canvasRef} />
      <div
        style={{
          fontFamily: F.mono,
          fontSize: "9px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          padding: "3px 10px",
          borderRadius: "100px",
          color: style.color,
          background: `${style.color}15`,
          border: `1px solid ${style.color}40`,
        }}
      >
        {style.level}
      </div>
    </div>
  );
}
