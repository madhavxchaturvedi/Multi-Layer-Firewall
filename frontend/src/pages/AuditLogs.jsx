// pages/AuditLogs.jsx
import { useSelector } from 'react-redux'
import { useState } from 'react'
import { CategoryBadge, BlockedBadge } from '../components/EventBadge'
import { formatTime, cn } from '../lib/utils'

export default function AuditLogs() {
  const { events } = useSelector(s => s.waf)
  const [page, setPage] = useState(0)
  const PER_PAGE = 50

  const pages = Math.ceil(events.length / PER_PAGE)
  const slice = events.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  function downloadLogs() {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `waf-logs-${Date.now()}.json`; a.click()
  }

  return (
    <div className="p-6 animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display font-semibold text-white text-lg">Audit Logs</div>
          <div className="text-xs font-mono text-gray-500 mt-0.5">{events.length} events in memory</div>
        </div>
        <button onClick={downloadLogs}
          className="px-4 py-2 bg-surface-1 hover:bg-surface-2 border border-border text-gray-400 hover:text-gray-300 text-xs font-mono rounded-lg transition-colors">
          ↓ Export JSON
        </button>
      </div>

      <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-2 border-b border-border grid grid-cols-12 gap-2 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
          <span className="col-span-2">Time</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-2">Category</span>
          <span className="col-span-1">Method</span>
          <span className="col-span-3">URL</span>
          <span className="col-span-2">IP</span>
          <span className="col-span-1">CC</span>
        </div>
        <div className="divide-y divide-border font-mono text-xs">
          {slice.map((ev, i) => (
            <div key={ev.id || i} className="px-5 py-2 grid grid-cols-12 gap-2 hover:bg-surface-2 transition-colors">
              <span className="col-span-2 text-gray-600">{formatTime(ev.timestamp)}</span>
              <span className="col-span-1"><BlockedBadge blocked={ev.blocked} /></span>
              <span className="col-span-2"><CategoryBadge category={ev.category} /></span>
              <span className="col-span-1 text-gray-500">{ev.method}</span>
              <span className="col-span-3 text-gray-400 truncate">{ev.url}</span>
              <span className="col-span-2 text-gray-600 truncate">{ev.ip}</span>
              <span className="col-span-1 text-gray-600">{ev.country || '—'}</span>
            </div>
          ))}
          {events.length === 0 && (
            <div className="px-5 py-12 text-center text-gray-600 col-span-12">No log entries yet</div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between">
            <span className="text-[11px] font-mono text-gray-600">
              Page {page + 1} of {pages}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1 text-xs font-mono bg-surface-2 border border-border rounded disabled:opacity-40 text-gray-400 hover:text-gray-300">
                ← Prev
              </button>
              <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}
                className="px-3 py-1 text-xs font-mono bg-surface-2 border border-border rounded disabled:opacity-40 text-gray-400 hover:text-gray-300">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
