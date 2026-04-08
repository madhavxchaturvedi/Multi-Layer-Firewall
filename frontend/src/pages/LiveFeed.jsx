// pages/LiveFeed.jsx
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { CategoryBadge, BlockedBadge, SeverityDot } from '../components/EventBadge'
import { formatTime, cn } from '../lib/utils'

export default function LiveFeed() {
  const { events, connected } = useSelector(s => s.waf)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = events.filter(e => {
    if (filter === 'blocked' && !e.blocked) return false
    if (filter === 'allowed' && e.blocked) return false
    if (search && !e.url?.includes(search) && !e.ip?.includes(search) && !e.category?.includes(search)) return false
    return true
  })

  return (
    <div className="flex h-screen overflow-hidden animate-fade-in">
      {/* Left: event list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-border flex items-center gap-3 flex-shrink-0 bg-surface-1">
          <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-1">
            {['all', 'blocked', 'allowed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-3 py-1 rounded text-xs font-mono uppercase tracking-wide transition-colors',
                  filter === f ? 'bg-accent-red/20 text-accent-red' : 'text-gray-500 hover:text-gray-300'
                )}>
                {f}
              </button>
            ))}
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search IP, URL, category..."
            className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-gray-300 placeholder-gray-600 outline-none focus:border-border-strong"
          />
          <div className="flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-full', connected ? 'bg-accent-green animate-pulse' : 'bg-gray-600')} />
            <span className="text-[10px] font-mono text-gray-500">{filtered.length} events</span>
          </div>
        </div>

        {/* Column headers */}
        <div className="px-6 py-2 flex items-center gap-4 text-[10px] font-mono text-gray-600 uppercase tracking-widest border-b border-border flex-shrink-0">
          <span className="w-4" />
          <span className="w-20">Time</span>
          <span className="w-16">Status</span>
          <span className="w-28">Category</span>
          <span className="flex-1">URL</span>
          <span className="w-28 hidden lg:block">IP</span>
          <span className="w-10">CC</span>
        </div>

        {/* Event rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <div className="text-4xl mb-3">◎</div>
              <div className="text-sm font-mono">No events match your filter</div>
            </div>
          ) : filtered.map((ev, i) => (
            <div key={ev.id || i}
              onClick={() => setSelected(selected?.id === ev.id ? null : ev)}
              className={cn(
                'px-6 py-2.5 flex items-center gap-4 cursor-pointer transition-colors text-xs',
                'hover:bg-surface-2',
                selected?.id === ev.id && 'bg-surface-2 border-l-2 border-accent-red',
                ev.blocked && i < 3 && 'animate-slide-in'
              )}
            >
              <SeverityDot severity={ev.severity} />
              <span className="font-mono text-gray-600 w-20 flex-shrink-0">{formatTime(ev.timestamp)}</span>
              <div className="w-16 flex-shrink-0"><BlockedBadge blocked={ev.blocked} /></div>
              <div className="w-28 flex-shrink-0"><CategoryBadge category={ev.category} /></div>
              <span className="font-mono text-gray-400 truncate flex-1">{ev.method} {ev.url}</span>
              <span className="font-mono text-gray-600 w-28 truncate hidden lg:block flex-shrink-0">{ev.ip}</span>
              <span className="font-mono text-gray-600 w-10 flex-shrink-0">{ev.country || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: detail panel */}
      {selected && (
        <div className="w-80 border-l border-border bg-surface-1 overflow-y-auto flex-shrink-0 animate-slide-in">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="text-xs font-mono text-gray-400 uppercase tracking-widest">Event Detail</div>
            <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-gray-400 text-lg leading-none">×</button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <BlockedBadge blocked={selected.blocked} />
            </div>
            {[
              ['Request ID', selected.requestId?.slice(0, 16) + '…'],
              ['Timestamp', new Date(selected.timestamp).toLocaleString()],
              ['IP Address', selected.ip],
              ['Country', `${selected.country} ${selected.city ? '/ ' + selected.city : ''}`],
              ['Method', selected.method],
              ['URL', selected.url],
              ['User Agent', selected.userAgent?.slice(0, 60) + (selected.userAgent?.length > 60 ? '…' : '')],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-0.5">{k}</div>
                <div className="text-xs font-mono text-gray-300 break-all">{v || '—'}</div>
              </div>
            ))}

            {selected.blocked && (
              <>
                <div className="border-t border-border pt-4">
                  <div className="text-[10px] font-mono text-accent-red uppercase tracking-widest mb-2">Attack Info</div>
                  {[
                    ['Rule ID', selected.ruleId],
                    ['Rule Name', selected.ruleName],
                    ['Category', selected.category],
                    ['Severity', selected.severity],
                    ['Matched In', selected.matchedIn],
                    ['Reason', selected.reason],
                  ].map(([k, v]) => (
                    <div key={k} className="mb-2">
                      <div className="text-[10px] font-mono text-gray-600">{k}</div>
                      <div className="text-xs font-mono text-gray-300 break-all">{v || '—'}</div>
                    </div>
                  ))}
                </div>
                {selected.payload && (
                  <div>
                    <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1">Payload Sample</div>
                    <pre className="text-[10px] font-mono text-accent-orange bg-accent-orange/5 border border-accent-orange/20 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                      {selected.payload.slice(0, 300)}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
