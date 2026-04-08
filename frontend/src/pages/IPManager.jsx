// pages/IPManager.jsx
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBanned, fetchSuspicious, banIP, unbanIP, allowlistIP } from '../store/wafSlice'
import axios from 'axios'
import { cn } from '../lib/utils'

const authAxios = axios.create({
  headers: { 'x-api-key': import.meta.env.VITE_API_KEY || 'waf-dev-key' }
})

export default function IPManager() {
  const dispatch = useDispatch()
  const { banned, suspicious } = useSelector(s => s.waf)
  const [tab, setTab] = useState('banned')
  const [form, setForm] = useState({ ip: '', reason: '', permanent: false })
  const [allowlistForm, setAllowlistForm] = useState('')
  const [allowlist, setAllowlist] = useState([])
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    dispatch(fetchBanned())
    dispatch(fetchSuspicious())
  }, [dispatch])

  function flash(type, text) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  async function handleBan(e) {
    e.preventDefault()
    if (!form.ip) return
    await dispatch(banIP(form))
    dispatch(fetchBanned())
    dispatch(fetchSuspicious())
    flash('success', `${form.ip} banned successfully`)
    setForm({ ip: '', reason: '', permanent: false })
  }

  async function handleUnban(ip) {
    await dispatch(unbanIP(ip))
    flash('info', `${ip} unbanned`)
  }

  async function handleBanFromSuspicious(ip, score) {
    await dispatch(banIP({ ip, reason: `Manual ban — threat score ${score}`, permanent: false }))
    dispatch(fetchBanned())
    dispatch(fetchSuspicious())
    flash('success', `${ip} banned`)
  }

  async function handleAllowlist(e) {
    e.preventDefault()
    if (!allowlistForm) return
    await dispatch(allowlistIP(allowlistForm))
    setAllowlist(prev => [...prev.filter(x => x !== allowlistForm), allowlistForm])
    flash('success', `${allowlistForm} added to allowlist`)
    setAllowlistForm('')
  }

  async function handleRemoveAllowlist(ip) {
    // Backend doesn't expose a DELETE /allowlist yet — call ban then unban to clear
    // For now just remove from local view
    setAllowlist(prev => prev.filter(x => x !== ip))
    flash('info', `${ip} removed from allowlist view`)
  }

  const TABS = [
    { id: 'banned', label: 'Banned', count: banned.length, color: 'red' },
    { id: 'suspicious', label: 'Suspicious', count: suspicious.length, color: 'yellow' },
    { id: 'allowlist', label: 'Allowlist', count: allowlist.length, color: 'green' },
  ]

  return (
    <div className="p-6 animate-fade-in space-y-5">
      <div>
        <div className="font-display font-semibold text-white text-lg">IP Manager</div>
        <div className="text-xs font-mono text-gray-500 mt-0.5">Manage bans, suspicious IPs, and allowlist</div>
      </div>

      {msg && (
        <div className={cn('px-4 py-2.5 rounded-lg text-xs font-mono border',
          msg.type === 'success' ? 'bg-accent-green/10 text-accent-green border-accent-green/20' :
          msg.type === 'info'    ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20' :
                                   'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20'
        )}>
          {msg.text}
        </div>
      )}

      {/* Add ban / add allowlist form */}
      {tab !== 'suspicious' && (
        <div className="bg-surface-1 border border-border rounded-xl p-5">
          {tab === 'banned' ? (
            <>
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
            </>
          ) : (
            <>
              <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Add to Allowlist</div>
              <form onSubmit={handleAllowlist} className="flex gap-3 items-end flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] font-mono text-gray-600 block mb-1">IP Address</label>
                  <input
                    value={allowlistForm} onChange={e => setAllowlistForm(e.target.value)}
                    placeholder="192.168.1.1"
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none focus:border-border-strong"
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-accent-green/20 hover:bg-accent-green/30 border border-accent-green/30 text-accent-green text-xs font-mono rounded-lg transition-colors">
                  Allow IP
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-1 border border-border rounded-lg p-1 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-4 py-1.5 rounded text-xs font-mono uppercase tracking-wide transition-colors',
              tab === t.id
                ? t.color === 'red'    ? 'bg-accent-red/20 text-accent-red'
                : t.color === 'yellow' ? 'bg-accent-yellow/20 text-accent-yellow'
                :                        'bg-accent-green/20 text-accent-green'
                : 'text-gray-500 hover:text-gray-300'
            )}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'banned' && (
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
      )}

      {tab === 'suspicious' && (
        <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Suspicious IPs</div>
            <div className="text-[10px] font-mono text-gray-600">{suspicious.length} tracked · auto-ban at score 80</div>
          </div>
          <div className="divide-y divide-border">
            {suspicious.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-600 text-xs font-mono">No suspicious IPs — threat scores accumulate from detections</div>
            ) : suspicious.map((s, i) => {
              const pct = Math.min((s.score / 80) * 100, 100)
              const danger = pct >= 75 ? 'accent-red' : pct >= 40 ? 'accent-yellow' : 'accent-blue'
              return (
                <div key={i} className="px-5 py-3 hover:bg-surface-2 transition-colors text-xs">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-32 flex-shrink-0">
                      <div className="font-mono text-gray-300">{s.ip}</div>
                      <div className="font-mono text-gray-600 text-[10px]">{s.geo?.country || '—'} {s.geo?.city || ''}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-mono text-${danger} text-[11px]`}>Score: {s.score}</span>
                        <span className="font-mono text-gray-600 text-[10px]">{s.hits?.length || 0} hits</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-${danger} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleBanFromSuspicious(s.ip, s.score)}
                      className="text-[10px] font-mono text-gray-600 hover:text-accent-red border border-border hover:border-accent-red/30 px-2 py-1 rounded transition-colors flex-shrink-0"
                    >
                      Ban
                    </button>
                    <button
                      onClick={() => { dispatch(allowlistIP(s.ip)); flash('success', `${s.ip} allowlisted`) }}
                      className="text-[10px] font-mono text-gray-600 hover:text-accent-green border border-border hover:border-accent-green/30 px-2 py-1 rounded transition-colors flex-shrink-0"
                    >
                      Allow
                    </button>
                  </div>
                  {s.hits?.slice(-3).map((h, j) => (
                    <div key={j} className="ml-32 pl-4 text-[10px] font-mono text-gray-600 truncate">
                      +{h.points} — {h.reason}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'allowlist' && (
        <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Allowlisted IPs</div>
            <div className="text-[10px] font-mono text-gray-600">{allowlist.length} trusted IPs</div>
          </div>
          <div className="divide-y divide-border">
            {allowlist.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-600 text-xs font-mono">No IPs allowlisted — allowed IPs bypass all WAF checks</div>
            ) : allowlist.map((ip, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-surface-2 transition-colors text-xs">
                <span className="font-mono text-accent-green flex-1">{ip}</span>
                <span className="text-[10px] font-mono text-accent-green border border-accent-green/30 bg-accent-green/10 px-1.5 py-0.5 rounded flex-shrink-0">TRUSTED</span>
                <button
                  onClick={() => handleRemoveAllowlist(ip)}
                  className="text-[10px] font-mono text-gray-600 hover:text-accent-red border border-border hover:border-accent-red/30 px-2 py-1 rounded transition-colors flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
