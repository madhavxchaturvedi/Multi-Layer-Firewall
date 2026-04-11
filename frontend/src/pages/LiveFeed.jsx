// pages/LiveFeed.jsx
import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { CategoryBadge, BlockedBadge, SeverityDot } from '../components/EventBadge'
import { formatTime, cn } from '../lib/utils'
import { allowIP } from '../store/wafSlice'
import axios from 'axios'

export default function LiveFeed() {
  const { events, connected } = useSelector(s => s.waf)
  const dispatch = useDispatch()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [replayResult, setReplayResult] = useState(null)
  const [replayLoading, setReplayLoading] = useState(false)
  const [fpMsg, setFpMsg] = useState(null)

  const filtered = events.filter(e => {
    if (filter === 'blocked' && !e.blocked) return false
    if (filter === 'allowed' && e.blocked) return false
    if (search && !e.url?.includes(search) && !e.ip?.includes(search) && !e.category?.includes(search)) return false
    return true
  })

  async function handleReplay(ev) {
    setReplayLoading(true); setReplayResult(null)
    try {
      const res = await axios.get(`http://localhost:4000${ev.url || '/'}`, {
        headers: { 'X-Replay': 'true', 'User-Agent': ev.userAgent || 'WAF-Replay/1.0' },
        validateStatus: () => true
      })
      setReplayResult({ status: res.status, blocked: res.status === 403, ts: new Date().toISOString() })
    } catch (err) {
      setReplayResult({ status: 'ERR', blocked: true, ts: new Date().toISOString() })
    }
    setReplayLoading(false)
  }

  async function handleFalsePositive(ev) {
    await dispatch(allowIP(ev.ip))
    setFpMsg(`${ev.ip} added to allowlist — marked as false positive`)
    setTimeout(() => setFpMsg(null), 4000)
  }

  return (
    <div className="flex h-screen overflow-hidden animate-fade-in">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-border flex items-center gap-3 flex-shrink-0 bg-surface-1">
          <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-1">
            {['all','blocked','allowed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-3 py-1 rounded text-xs font-mono uppercase tracking-wide transition-colors',
                  filter === f ? 'bg-accent-red/20 text-accent-red' : 'text-gray-500 hover:text-gray-300')}>
                {f}
              </button>
            ))}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search IP, URL, category..."
            className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-gray-300 placeholder-gray-600 outline-none focus:border-border-strong" />
          <div className="flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-full', connected ? 'bg-accent-green animate-pulse' : 'bg-gray-600')} />
            <span className="text-[10px] font-mono text-gray-500">{filtered.length} events</span>
          </div>
        </div>

        {fpMsg && (
          <div className="mx-6 mt-3 px-4 py-2 bg-accent-green/10 text-accent-green border border-accent-green/20 rounded-lg text-xs font-mono">{fpMsg}</div>
        )}

        {/* Column headers */}
        <div className="px-6 py-2 flex items-center gap-4 text-[10px] font-mono text-gray-600 uppercase tracking-widest border-b border-border flex-shrink-0">
          <span className="w-4" /><span className="w-20">Time</span><span className="w-16">Status</span>
          <span className="w-28">Category</span><span className="flex-1">URL</span>
          <span className="w-28 hidden lg:block">IP</span><span className="w-10">CC</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <div className="text-4xl mb-3">◎</div>
              <div className="text-sm font-mono">No events match your filter</div>
            </div>
          ) : filtered.map((ev, i) => (
            <div key={ev.id || i} onClick={() => { setSelected(selected?.id === ev.id ? null : ev); setReplayResult(null) }}
              className={cn('px-6 py-2.5 flex items-center gap-4 cursor-pointer transition-colors text-xs hover:bg-surface-2',
                selected?.id === ev.id && 'bg-surface-2 border-l-2 border-accent-red',
                ev.blocked && i < 3 && 'animate-slide-in')}>
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

      {/* Detail panel */}
      {selected && (
        <div className="w-80 border-l border-border bg-surface-1 overflow-y-auto flex-shrink-0 animate-slide-in">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="text-xs font-mono text-gray-400 uppercase tracking-widest">Event Detail</div>
            <button onClick={() => { setSelected(null); setReplayResult(null) }} className="text-gray-600 hover:text-gray-400 text-lg leading-none">×</button>
          </div>
          <div className="p-5 space-y-4">
            <div><BlockedBadge blocked={selected.blocked} /></div>
            {[['Request ID', selected.requestId?.slice(0,16)+'…'],['Timestamp', new Date(selected.timestamp).toLocaleString()],
              ['IP Address', selected.ip],['Country', `${selected.country}${selected.city ? ' / '+selected.city : ''}`],
              ['Method', selected.method],['URL', selected.url],
              ['User Agent', selected.userAgent?.slice(0,60)+(selected.userAgent?.length>60?'…':'')],
            ].map(([k,v]) => (
              <div key={k}>
                <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-0.5">{k}</div>
                <div className="text-xs font-mono text-gray-300 break-all">{v||'—'}</div>
              </div>
            ))}

            {selected.blocked && (
              <div className="border-t border-border pt-4 space-y-2">
                <div className="text-[10px] font-mono text-accent-red uppercase tracking-widest mb-2">Attack Info</div>
                {[['Rule ID',selected.ruleId],['Rule Name',selected.ruleName],['Category',selected.category],
                  ['Severity',selected.severity],['Matched In',selected.matchedIn],['Reason',selected.reason],
                ].map(([k,v]) => (
                  <div key={k}>
                    <div className="text-[10px] font-mono text-gray-600">{k}</div>
                    <div className="text-xs font-mono text-gray-300 break-all">{v||'—'}</div>
                  </div>
                ))}
                {selected.payload && (
                  <div>
                    <div className="text-[10px] font-mono text-gray-600 mb-1">Payload Sample</div>
                    <pre className="text-[10px] font-mono text-accent-orange bg-accent-orange/5 border border-accent-orange/20 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">{selected.payload.slice(0,300)}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="border-t border-border pt-4 space-y-2">
              <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-2">Actions</div>

              {/* Request Replay */}
              <button onClick={() => handleReplay(selected)} disabled={replayLoading}
                className="w-full px-3 py-2 bg-surface-2 hover:bg-surface-3 border border-border text-gray-400 hover:text-gray-200 text-xs font-mono rounded-lg transition-colors text-left disabled:opacity-40">
                {replayLoading ? '⟳ Replaying…' : '↺ Replay Request'}
              </button>
              {replayResult && (
                <div className={cn('px-3 py-2 rounded border text-xs font-mono',
                  replayResult.blocked ? 'bg-accent-red/10 text-accent-red border-accent-red/20' : 'bg-accent-green/10 text-accent-green border-accent-green/20'
                )}>
                  Replay: HTTP {replayResult.status} — {replayResult.blocked ? 'Blocked ✓' : 'Passed (rule may be disabled)'}
                </div>
              )}

              {/* False Positive */}
              {selected.blocked && (
                <button onClick={() => handleFalsePositive(selected)}
                  className="w-full px-3 py-2 bg-accent-yellow/10 hover:bg-accent-yellow/20 border border-accent-yellow/20 text-accent-yellow text-xs font-mono rounded-lg transition-colors text-left">
                  ⚑ Mark as False Positive
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
