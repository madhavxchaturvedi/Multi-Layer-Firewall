// pages/IPManager.jsx
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBanned, banIP, unbanIP, fetchSuspicious, allowIP } from '../store/wafSlice'
import { cn } from '../lib/utils'

export default function IPManager() {
  const dispatch = useDispatch()
  const { banned, suspicious } = useSelector(s => s.waf)
  const [tab, setTab] = useState('banned')
  const [form, setForm] = useState({ ip: '', reason: '', permanent: false })
  const [allowForm, setAllowForm] = useState('')
  const [msg, setMsg] = useState(null)

  useEffect(() => { dispatch(fetchBanned()); dispatch(fetchSuspicious()) }, [dispatch])

  function showMsg(type, text) { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000) }

  async function handleBan(e) {
    e.preventDefault()
    if (!form.ip) return
    await dispatch(banIP(form)); dispatch(fetchBanned())
    showMsg('success', `${form.ip} banned`); setForm({ ip: '', reason: '', permanent: false })
  }
  async function handleUnban(ip) { await dispatch(unbanIP(ip)); showMsg('info', `${ip} unbanned`) }
  async function handleAllow(e) {
    e.preventDefault()
    if (!allowForm) return
    await dispatch(allowIP(allowForm)); showMsg('success', `${allowForm} added to allowlist`); setAllowForm('')
  }
  async function handleBanSuspicious(ip) {
    await dispatch(banIP({ ip, reason: 'Promoted from suspicious list', permanent: false }))
    dispatch(fetchBanned()); dispatch(fetchSuspicious()); showMsg('success', `${ip} banned`)
  }

  function scoreBar(score) {
    const pct = Math.min((score / 80) * 100, 100)
    const color = score >= 80 ? 'bg-accent-red' : score >= 40 ? 'bg-accent-orange' : 'bg-accent-yellow'
    const textColor = score >= 80 ? 'text-accent-red' : score >= 40 ? 'text-accent-orange' : 'text-accent-yellow'
    return (
      <div className="flex items-center gap-2 flex-1">
        <div className="flex-1 bg-surface-3 rounded-full h-1.5 overflow-hidden max-w-[80px]">
          <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
        </div>
        <span className={cn('text-[10px] font-mono', textColor)}>{score}</span>
      </div>
    )
  }

  const tabs = [
    { id: 'banned', label: `Banned (${banned.length})` },
    { id: 'suspicious', label: `Suspicious (${suspicious?.length || 0})` },
    { id: 'allowlist', label: 'Allowlist' },
    { id: 'honeypot', label: 'Honeypot' },
  ]

  return (
    <div className="p-6 animate-fade-in space-y-5">
      <div>
        <div className="font-display font-semibold text-white text-lg">IP Manager</div>
        <div className="text-xs font-mono text-gray-500 mt-0.5">Manage bans, suspicious IPs, allowlist and honeypot traps</div>
      </div>

      {msg && (
        <div className={cn('px-4 py-2.5 rounded-lg text-xs font-mono border',
          msg.type === 'success' ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
          : msg.type === 'error' ? 'bg-accent-red/10 text-accent-red border-accent-red/20'
          : 'bg-accent-blue/10 text-accent-blue border-accent-blue/20'
        )}>{msg.text}</div>
      )}

      <div className="bg-surface-1 border border-border rounded-xl p-5">
        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Manual IP Ban</div>
        <form onSubmit={handleBan} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] font-mono text-gray-600 block mb-1">IP Address</label>
            <input value={form.ip} onChange={e => setForm(f => ({ ...f, ip: e.target.value }))} placeholder="192.168.1.100"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none focus:border-border-strong" />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-mono text-gray-600 block mb-1">Reason</label>
            <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Suspicious activity"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none focus:border-border-strong" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="perm" checked={form.permanent} onChange={e => setForm(f => ({ ...f, permanent: e.target.checked }))} className="accent-accent-red" />
            <label htmlFor="perm" className="text-[11px] font-mono text-gray-500">Permanent</label>
          </div>
          <button type="submit" className="px-4 py-2 bg-accent-red/20 hover:bg-accent-red/30 border border-accent-red/30 text-accent-red text-xs font-mono rounded-lg transition-colors">Ban IP</button>
        </form>
      </div>

      <div className="flex items-center gap-1 bg-surface-1 border border-border rounded-lg p-1 w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-3 py-1.5 rounded text-xs font-mono transition-colors',
              tab === t.id ? 'bg-accent-red/20 text-accent-red' : 'text-gray-500 hover:text-gray-300')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'banned' && (
        <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex justify-between"><div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Banned IPs</div><div className="text-[10px] font-mono text-gray-600">{banned.length} entries</div></div>
          <div className="divide-y divide-border">
            {banned.length === 0 ? <div className="px-5 py-8 text-center text-gray-600 text-xs font-mono">No IPs currently banned</div>
            : banned.map((b, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-surface-2 transition-colors text-xs">
                <div className="w-36 flex-shrink-0"><div className="font-mono text-gray-300">{b.ip}</div><div className="font-mono text-gray-600 text-[10px]">{b.geo?.country || '—'}</div></div>
                <div className="flex-1 font-mono text-gray-500 truncate">{b.reason || 'No reason'}</div>
                {b.permanent && <span className="text-[10px] font-mono text-accent-red border border-accent-red/30 px-1.5 py-0.5 rounded flex-shrink-0">PERM</span>}
                <button onClick={() => handleUnban(b.ip)} className="text-[10px] font-mono text-gray-600 hover:text-accent-green border border-border hover:border-accent-green/30 px-2 py-1 rounded transition-colors flex-shrink-0">Unban</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'suspicious' && (
        <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex justify-between"><div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Suspicious IPs</div><div className="text-[10px] font-mono text-gray-500">Score ≥ 80 = auto-banned</div></div>
          <div className="divide-y divide-border">
            {(!suspicious || suspicious.length === 0) ? <div className="px-5 py-8 text-center text-gray-600 text-xs font-mono">No suspicious IPs tracked yet</div>
            : suspicious.map((s, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-surface-2 transition-colors text-xs">
                <div className="w-36 flex-shrink-0"><div className="font-mono text-gray-300">{s.ip}</div><div className="font-mono text-gray-600 text-[10px]">{s.geo?.country || '—'}</div></div>
                <div className="flex-1">{scoreBar(s.score || 0)}</div>
                <div className="text-[10px] font-mono text-gray-600 hidden lg:block flex-shrink-0">{s.hits?.length || 0} hits</div>
                <button onClick={() => handleBanSuspicious(s.ip)} className="text-[10px] font-mono text-gray-600 hover:text-accent-red border border-border hover:border-accent-red/30 px-2 py-1 rounded transition-colors flex-shrink-0">Ban</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'allowlist' && (
        <div className="space-y-4">
          <div className="bg-surface-1 border border-border rounded-xl p-5">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Add to Allowlist</div>
            <div className="text-xs text-gray-500 font-sans mb-4">Allowlisted IPs skip all WAF checks and are never blocked.</div>
            <form onSubmit={handleAllow} className="flex gap-3">
              <input value={allowForm} onChange={e => setAllowForm(e.target.value)} placeholder="IP address to allowlist..."
                className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none focus:border-border-strong" />
              <button type="submit" className="px-4 py-2 bg-accent-green/20 hover:bg-accent-green/30 border border-accent-green/30 text-accent-green text-xs font-mono rounded-lg transition-colors">Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'honeypot' && (
        <div className="space-y-4">
          <div className="bg-surface-1 border border-border rounded-xl p-5">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Active Honeypot Paths</div>
            <div className="text-xs text-gray-500 font-sans mb-4">Requests to these paths permanently ban the attacker instantly.</div>
            <div className="flex flex-wrap gap-2">
              {'/admin-secret,/wp-admin,/.env,/config.php,/backup.sql'.split(',').map((p, i) => (
                <span key={i} className="text-[11px] font-mono text-accent-red bg-accent-red/10 border border-accent-red/20 px-2.5 py-1.5 rounded-lg">{p.trim()}</span>
              ))}
            </div>
          </div>
          <div className="bg-surface-1 border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">How to Change</div>
            <pre className="text-xs font-mono text-gray-400 bg-surface-2 rounded-lg p-3">HONEYPOT_PATHS=/admin-secret,/wp-admin,/.env</pre>
          </div>
        </div>
      )}
    </div>
  )
}
