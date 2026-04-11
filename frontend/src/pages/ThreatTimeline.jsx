// pages/ThreatTimeline.jsx
// Per-IP detailed threat history — click any IP to see full attack timeline
import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { banIP, unbanIP } from '../store/wafSlice'
import { CategoryBadge, SeverityDot } from '../components/EventBadge'
import { CATEGORY_LABEL, cn, formatTime, timeAgo } from '../lib/utils'

const SEV_COLOR = { critical: 'border-accent-red bg-accent-red/10 text-accent-red', high: 'border-accent-orange bg-accent-orange/10 text-accent-orange', medium: 'border-accent-yellow bg-accent-yellow/10 text-accent-yellow', low: 'border-accent-green bg-accent-green/10 text-accent-green' }

export default function ThreatTimeline() {
  const dispatch = useDispatch()
  const { events, banned } = useSelector(s => s.waf)
  const [selectedIP, setSelectedIP] = useState(null)
  const [search, setSearch] = useState('')

  // Build per-IP summary from events
  const ipMap = {}
  for (const ev of events) {
    if (!ev.ip) continue
    if (!ipMap[ev.ip]) {
      ipMap[ev.ip] = { ip: ev.ip, country: ev.geo?.country || ev.country || 'XX', city: ev.city || '', total: 0, blocked: 0, score: 0, firstSeen: ev.timestamp, lastSeen: ev.timestamp, events: [], categories: {} }
    }
    const entry = ipMap[ev.ip]
    entry.total++
    entry.lastSeen = ev.timestamp
    entry.events.push(ev)
    if (ev.blocked) {
      entry.blocked++
      const pts = { critical: 40, high: 25, medium: 15, low: 5 }
      entry.score += pts[ev.severity] || 0
      if (ev.category) entry.categories[ev.category] = (entry.categories[ev.category] || 0) + 1
    }
  }

  const ipList = Object.values(ipMap)
    .filter(e => e.blocked > 0 || e.total > 5)
    .filter(e => !search || e.ip.includes(search) || e.country?.includes(search))
    .sort((a, b) => b.score - a.score)

  const selected = selectedIP ? ipMap[selectedIP] : null
  const isBanned = selected ? banned.some(b => b.ip === selected.ip) : false

  function threatLevel(score) {
    if (score >= 80) return { label: 'CRITICAL', color: 'text-accent-red border-accent-red/40 bg-accent-red/10' }
    if (score >= 40) return { label: 'HIGH', color: 'text-accent-orange border-accent-orange/40 bg-accent-orange/10' }
    if (score >= 15) return { label: 'MEDIUM', color: 'text-accent-yellow border-accent-yellow/40 bg-accent-yellow/10' }
    return { label: 'LOW', color: 'text-accent-green border-accent-green/40 bg-accent-green/10' }
  }

  return (
    <div className="flex h-screen overflow-hidden animate-fade-in">
      {/* Left: IP list */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-border bg-surface-1">
        <div className="px-4 py-4 border-b border-border">
          <div className="font-display font-semibold text-white text-sm mb-3">Threat Timeline</div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search IP or country..."
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-600 outline-none focus:border-border-strong"
          />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {ipList.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs font-mono text-gray-600">No threat data yet — fire some attacks</div>
          ) : ipList.map(entry => {
            const tl = threatLevel(entry.score)
            const isSelected = selectedIP === entry.ip
            return (
              <div key={entry.ip} onClick={() => setSelectedIP(entry.ip)}
                className={cn('px-4 py-3 cursor-pointer transition-colors hover:bg-surface-2',
                  isSelected && 'bg-surface-2 border-l-2 border-accent-red'
                )}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-gray-300">{entry.ip}</span>
                  <span className={cn('text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border', tl.color)}>{tl.label}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600">
                  <span>{entry.country}</span>
                  <span>·</span>
                  <span className="text-accent-red">{entry.blocked} blocked</span>
                  <span>·</span>
                  <span>score {entry.score}</span>
                </div>
                <div className="text-[10px] font-mono text-gray-700 mt-0.5">{timeAgo(entry.lastSeen)}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right: Timeline detail */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <div className="text-4xl mb-3">◎</div>
            <div className="text-sm font-mono">Select an IP to view its threat timeline</div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* IP header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono font-bold text-white text-xl">{selected.ip}</span>
                  <span className={cn('text-[10px] font-mono font-bold px-2 py-1 rounded border', threatLevel(selected.score).color)}>
                    {threatLevel(selected.score).label} THREAT
                  </span>
                  {isBanned && <span className="text-[10px] font-mono text-accent-red bg-accent-red/10 border border-accent-red/30 px-2 py-1 rounded">BANNED</span>}
                </div>
                <div className="text-xs font-mono text-gray-500 mt-1">{selected.country} {selected.city && `/ ${selected.city}`}</div>
              </div>
              <div className="flex gap-2">
                {isBanned ? (
                  <button onClick={() => dispatch(unbanIP(selected.ip))}
                    className="px-3 py-1.5 text-xs font-mono bg-accent-green/10 hover:bg-accent-green/20 border border-accent-green/30 text-accent-green rounded-lg transition-colors">
                    Unban
                  </button>
                ) : (
                  <button onClick={() => dispatch(banIP({ ip: selected.ip, reason: 'Manual ban from timeline', permanent: false }))}
                    className="px-3 py-1.5 text-xs font-mono bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/30 text-accent-red rounded-lg transition-colors">
                    Ban IP
                  </button>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Threat Score', selected.score, selected.score >= 80 ? 'text-accent-red' : selected.score >= 40 ? 'text-accent-orange' : 'text-accent-yellow'],
                ['Total Requests', selected.total, 'text-accent-blue'],
                ['Blocked', selected.blocked, 'text-accent-red'],
                ['Block Rate', `${selected.total > 0 ? Math.round((selected.blocked / selected.total) * 100) : 0}%`, 'text-accent-yellow'],
              ].map(([label, val, color]) => (
                <div key={label} className="bg-surface-1 border border-border rounded-xl p-4">
                  <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">{label}</div>
                  <div className={cn('text-2xl font-display font-bold mt-1', color)}>{val}</div>
                </div>
              ))}
            </div>

            {/* Categories hit */}
            {Object.keys(selected.categories).length > 0 && (
              <div className="bg-surface-1 border border-border rounded-xl p-4">
                <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-3">Attack Categories Used</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selected.categories).sort((a,b) => b[1]-a[1]).map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2.5 py-1.5">
                      <CategoryBadge category={cat} />
                      <span className="text-[10px] font-mono text-gray-400">{count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                Full Event Timeline ({selected.events.length} events)
              </div>
              <div className="divide-y divide-border">
                {selected.events.slice(0, 50).map((ev, i) => (
                  <div key={i} className="px-5 py-2.5 flex items-start gap-4 text-xs hover:bg-surface-2 transition-colors">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center flex-shrink-0 mt-1">
                      <SeverityDot severity={ev.severity} />
                      {i < selected.events.length - 1 && <div className="w-px h-4 bg-border mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-mono text-gray-500">{formatTime(ev.timestamp)}</span>
                        {ev.blocked
                          ? <span className="text-[10px] font-mono text-accent-red">BLOCKED</span>
                          : <span className="text-[10px] font-mono text-accent-green">PASSED</span>
                        }
                        {ev.category && <CategoryBadge category={ev.category} />}
                      </div>
                      <div className="font-mono text-gray-400 truncate">{ev.method} {ev.url}</div>
                      {ev.reason && <div className="font-mono text-gray-600 text-[10px] mt-0.5 truncate">{ev.reason}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
