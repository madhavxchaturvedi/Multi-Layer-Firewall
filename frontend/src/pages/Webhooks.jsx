// pages/Webhooks.jsx
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchWebhooks, addWebhook, deleteWebhook, toggleWebhook, testWebhook } from '../store/wafSlice'
import { cn } from '../lib/utils'

const TYPE_INFO = {
  slack: { label: 'Slack', hint: 'https://hooks.slack.com/services/…', color: 'text-purple-400' },
  discord: { label: 'Discord', hint: 'https://discord.com/api/webhooks/…', color: 'text-indigo-400' },
  custom: { label: 'Custom JSON', hint: 'https://your-server.com/webhook', color: 'text-gray-400' }
}

const SEV = ['low', 'medium', 'high', 'critical']

export default function Webhooks() {
  const dispatch = useDispatch()
  const { webhooks } = useSelector(s => s.waf)
  const [form, setForm] = useState({ name: '', url: '', type: 'slack', minSeverity: 'high' })
  const [msg, setMsg] = useState(null)
  const [testing, setTesting] = useState(null)

  useEffect(() => { dispatch(fetchWebhooks()) }, [dispatch])

  function showMsg(type, text) { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000) }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name || !form.url) { showMsg('error', 'Name and URL are required'); return }
    await dispatch(addWebhook(form))
    dispatch(fetchWebhooks())
    showMsg('success', `Webhook "${form.name}" added`)
    setForm({ name: '', url: '', type: 'slack', minSeverity: 'high' })
  }

  async function handleTest(id) {
    setTesting(id)
    const res = await dispatch(testWebhook(id))
    setTesting(null)
    if (res.payload?.ok) showMsg('success', 'Test alert sent successfully!')
    else showMsg('error', 'Test failed — check your webhook URL')
  }

  return (
    <div className="p-6 animate-fade-in space-y-5">
      <div>
        <div className="font-display font-semibold text-white text-lg">Webhook Alerts</div>
        <div className="text-xs font-mono text-gray-500 mt-0.5">Send real-time attack alerts to Slack, Discord, or any HTTP endpoint</div>
      </div>

      {msg && (
        <div className={cn('px-4 py-2.5 rounded-lg text-xs font-mono border',
          msg.type === 'success' ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
          : 'bg-accent-red/10 text-accent-red border-accent-red/20'
        )}>{msg.text}</div>
      )}

      {/* Add form */}
      <div className="bg-surface-1 border border-border rounded-xl p-5">
        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Add Webhook</div>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-gray-600 block mb-1">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Security Slack"
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none focus:border-border-strong" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-gray-600 block mb-1">Type</label>
              <div className="flex gap-1">
                {Object.entries(TYPE_INFO).map(([t, info]) => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={cn('flex-1 px-2 py-1.5 rounded text-[10px] font-mono border transition-colors',
                      form.type === t ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/30' : 'text-gray-600 border-border hover:text-gray-400'
                    )}>{info.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono text-gray-600 block mb-1">Webhook URL</label>
            <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder={TYPE_INFO[form.type]?.hint}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none focus:border-border-strong" />
          </div>
          <div>
            <label className="text-[10px] font-mono text-gray-600 block mb-2">Minimum Severity to Alert</label>
            <div className="flex gap-1">
              {SEV.map(s => {
                const colors = { low: 'accent-green', medium: 'accent-yellow', high: 'accent-orange', critical: 'accent-red' }
                const c = colors[s]
                return (
                  <button key={s} type="button" onClick={() => setForm(f => ({ ...f, minSeverity: s }))}
                    className={cn('flex-1 px-2 py-1.5 rounded text-[10px] font-mono uppercase border transition-colors',
                      form.minSeverity === s
                        ? `bg-${c}/20 text-${c} border-${c}/30`
                        : 'text-gray-600 border-border hover:text-gray-400'
                    )}>{s}</button>
                )
              })}
            </div>
            <div className="text-[10px] font-mono text-gray-600 mt-1">
              Alerts will fire for <span className="text-gray-400">{form.minSeverity}</span> severity and above
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/30 text-accent-blue text-xs font-mono rounded-lg transition-colors">
              Add Webhook
            </button>
          </div>
        </form>
      </div>

      {/* Webhook list */}
      <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Active Webhooks</div>
          <div className="text-[10px] font-mono text-gray-600">{webhooks?.length || 0} configured</div>
        </div>
        <div className="divide-y divide-border">
          {(!webhooks || webhooks.length === 0) ? (
            <div className="px-5 py-10 text-center">
              <div className="text-gray-600 text-sm font-mono mb-1">No webhooks configured</div>
              <div className="text-gray-700 text-xs font-mono">Add a Slack or Discord webhook to get real-time attack alerts</div>
            </div>
          ) : webhooks.map((wh, i) => (
            <div key={wh.id || i} className="px-5 py-4 flex items-center gap-4 hover:bg-surface-2 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-gray-300 text-sm">{wh.name}</span>
                  <span className={cn('text-[10px] font-mono uppercase', TYPE_INFO[wh.type]?.color || 'text-gray-500')}>{wh.type}</span>
                  <span className="text-[10px] font-mono text-gray-600">≥ {wh.minSeverity}</span>
                </div>
                <div className="font-mono text-gray-600 text-[11px] truncate">{wh.url}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleTest(wh.id)} disabled={testing === wh.id}
                  className="px-2.5 py-1 text-[10px] font-mono bg-surface-2 hover:bg-surface-3 border border-border text-gray-500 hover:text-gray-300 rounded transition-colors disabled:opacity-40">
                  {testing === wh.id ? '…' : 'Test'}
                </button>
                <button onClick={() => dispatch(toggleWebhook(wh.id)).then(() => dispatch(fetchWebhooks()))}
                  className={cn('relative w-9 h-5 rounded-full border transition-colors',
                    wh.enabled ? 'bg-accent-green/30 border-accent-green/40' : 'bg-surface-3 border-border'
                  )}>
                  <span className={cn('absolute top-0.5 w-4 h-4 rounded-full transition-all',
                    wh.enabled ? 'left-4 bg-accent-green' : 'left-0.5 bg-gray-600'
                  )} />
                </button>
                <button onClick={() => dispatch(deleteWebhook(wh.id)).then(() => dispatch(fetchWebhooks()))}
                  className="text-gray-600 hover:text-accent-red transition-colors text-sm px-1">×</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to get webhook URLs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface-1 border border-border rounded-xl p-5">
          <div className="text-xs font-mono text-purple-400 uppercase tracking-widest mb-2">Slack Setup</div>
          <ol className="text-xs text-gray-500 font-sans space-y-1 list-decimal list-inside">
            <li>Go to api.slack.com/apps → Create New App</li>
            <li>Add "Incoming Webhooks" feature</li>
            <li>Activate and click "Add New Webhook to Workspace"</li>
            <li>Copy the webhook URL and paste it above</li>
          </ol>
        </div>
        <div className="bg-surface-1 border border-border rounded-xl p-5">
          <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">Discord Setup</div>
          <ol className="text-xs text-gray-500 font-sans space-y-1 list-decimal list-inside">
            <li>Open Discord channel settings</li>
            <li>Go to Integrations → Webhooks</li>
            <li>Click "New Webhook", name it, copy URL</li>
            <li>Paste it above and select Discord type</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
