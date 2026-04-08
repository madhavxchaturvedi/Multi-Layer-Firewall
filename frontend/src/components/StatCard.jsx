// components/StatCard.jsx
import { cn } from '../lib/utils'

export default function StatCard({ label, value, sub, color = 'red', trend }) {
  const colors = {
    red: 'border-accent-red/20 text-accent-red',
    green: 'border-accent-green/20 text-accent-green',
    blue: 'border-accent-blue/20 text-accent-blue',
    yellow: 'border-accent-yellow/20 text-accent-yellow',
    purple: 'border-accent-purple/20 text-accent-purple',
    cyan: 'border-accent-cyan/20 text-accent-cyan',
  }

  return (
    <div className={cn('bg-surface-1 border rounded-xl p-5 flex flex-col gap-1', colors[color] || colors.red)}>
      <div className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">{label}</div>
      <div className={cn('text-3xl font-display font-bold', colors[color])}>{value ?? '—'}</div>
      {sub && <div className="text-xs text-gray-600 font-mono">{sub}</div>}
    </div>
  )
}
