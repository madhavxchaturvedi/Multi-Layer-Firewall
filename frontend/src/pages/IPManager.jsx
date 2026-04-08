// pages/IPManager.jsx
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBanned, banIP, unbanIP } from '../store/wafSlice'
import { cn } from '../lib/utils'

export default function IPManager() {
  const dispatch = useDispatch()
  const { banned } = useSelector(s => s.waf)
  const [tab, setTab] = useState('banned')
  const [form, setForm] = useState({ ip: '', reason: '', permanent: false })
  const [msg, setMsg] = useState(null)

  useEffect(() => { dispatch(fetchBanned()) }, [dispatch])

  async function handleBan(e) {
    e.preventDefault()
    if (!form.ip) return
    await dispatch(banIP(form))
    dispatch(fetchBanned())
    setMsg({ type: 'success', text: `${form.ip} banned successfully` })
    setForm({ ip: '', reason: '', permanent: false })
    setTimeout(() => setMsg(null), 3000)
  }

  async function handleUnban(ip) {
    await dispatch(unbanIP(ip))
    setMsg({ type: 'info', text: `${ip} unbanned` })
    setTimeout(() => setMsg(null), 3000)
  }

  return (
    <div className="p-6 animate-fade-in space-y-5">
      <div>
        <div className="font-display font-semibold text-white text-lg">IP Manager</div>
        <div className="text-xs font-mono text-gray-500 mt-0.5">Manage bans, suspicious IPs, and allowlist</div>
      </div>

      {msg && (
        <div className={cn('px-4 py-2.5 rounded-lg text-xs font-mono border',
          msg.type === 'success' ? 'bg-accent-green/10 text-accent-green border-accent-green/20' : 'bg-accent-blue/10 text-accent-blue border-accent-blue/20'
        )}>
          {msg.text}
        </div>
      )}

      {/* Add ban form */}
      <div className="bg-surface-1 border border-border rounded-xl p-5">
        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Manual IP Ban</div>
        <form onSubmit={handleBan} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] font-mono text-gray-600 block mb-1">IP Address</label>
            <input
              value={form.ip} onChange={e => setForm(f => ({ ...f, ip: e.target.value }))}
              placeholder="192.168.1.100"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none focus:border-border-strong"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-mono text-gray-600 block mb-1">Reason</label>
            <input
              value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="Manual block — suspicious activity"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none focus:border-border-strong"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="perm" checked={form.permanent} onChange={e => setForm(f => ({ ...f, permanent: e.target.checked }))}
              className="accent-accent-red" />
            <label htmlFor="perm" className="text-[11px] font-mono text-gray-500">Permanent</label>
          </div>
          <button type="submit" className="px-4 py-2 bg-accent-red/20 hover:bg-accent-red/30 border border-accent-red/30 text-accent-red text-xs font-mono rounded-lg transition-colors">
            Ban IP
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-1 border border-border rounded-lg p-1 w-fit">
        {['banned'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-1.5 rounded text-xs font-mono uppercase tracking-wide transition-colors',
              tab === t ? 'bg-accent-red/20 text-accent-red' : 'text-gray-500 hover:text-gray-300'
            )}>
            {t} ({banned.length})
          </button>
        ))}
      </div>

      {/* Banned list */}
      <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Banned IPs</div>
          <div className="text-[10px] font-mono text-gray-600">{banned.length} entries</div>
        </div>
        <div className="divide-y divide-border">
          {banned.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-600 text-xs font-mono">No IPs are currently banned</div>
          ) : banned.map((b, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-surface-2 transition-colors text-xs">
              <div className="w-32 flex-shrink-0">
                <div className="font-mono text-gray-300">{b.ip}</div>
                <div className="font-mono text-gray-600 text-[10px]">{b.geo?.country || '—'} {b.geo?.city || ''}</div>
              </div>
              <div className="flex-1 font-mono text-gray-500 truncate">{b.reason || 'No reason'}</div>
              <div className="text-[10px] font-mono text-gray-600 flex-shrink-0 hidden lg:block">
                {b.bannedAt ? new Date(b.bannedAt).toLocaleDateString() : '—'}
              </div>
              {b.permanent && (
                <span className="text-[10px] font-mono text-accent-red border border-accent-red/30 px-1.5 py-0.5 rounded flex-shrink-0">PERM</span>
              )}
              <button
                onClick={() => handleUnban(b.ip)}
                className="text-[10px] font-mono text-gray-600 hover:text-accent-green border border-border hover:border-accent-green/30 px-2 py-1 rounded transition-colors flex-shrink-0"
              >
                Unban
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Honeypot info */}
      <div className="bg-surface-1 border border-border rounded-xl p-5">
        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">Honeypot Traps</div>
        <div className="text-xs text-gray-500 font-sans mb-3">
          Any request to these paths auto-bans the IP permanently. Change in <code className="font-mono text-gray-400">.env → HONEYPOT_PATHS</code>.
        </div>
        <div className="flex flex-wrap gap-2">
          {(import.meta.env.VITE_HONEYPOT_PATHS || '/admin-secret,/wp-admin,/.env,/config.php,/backup.sql')
            .split(',').map((p, i) => (
              <span key={i} className="text-[11px] font-mono text-accent-red bg-accent-red/10 border border-accent-red/20 px-2 py-1 rounded">
                {p.trim()}
              </span>
            ))}
        </div>
      </div>
    </div>
  )
}
