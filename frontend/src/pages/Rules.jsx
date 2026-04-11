// pages/Rules.jsx
import { useSelector, useDispatch } from 'react-redux'
import { useState } from 'react'
import { SEVERITY_COLOR, cn } from '../lib/utils'
import { toggleRule, addCustomRule } from '../store/wafSlice'

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }
const TARGETS = ['url', 'query', 'body', 'headers']

export default function Rules() {
  const dispatch = useDispatch()
  const { rules, disabledRules, stats } = useSelector(s => s.waf)
  const [filterCat, setFilterCat] = useState('all')
  const [filterSev, setFilterSev] = useState('all')
  const [showBuilder, setShowBuilder] = useState(false)
  const [newRule, setNewRule] = useState({ name: '', category: 'custom', severity: 'medium', pattern: '', description: '', targets: ['query', 'body'] })
  const [builderMsg, setBuilderMsg] = useState(null)

  const categories = [...new Set(rules.map(r => r.category))]
  const filtered = rules
    .filter(r => filterCat === 'all' || r.category === filterCat)
    .filter(r => filterSev === 'all' || r.severity === filterSev)
    .sort((a, b) => (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9))

  const hitMap = stats?.attacksByCategory || {}
  const enabledCount = rules.filter(r => !disabledRules?.includes(r.id)).length

  function handleToggle(ruleId) { dispatch(toggleRule(ruleId)) }

  function handleAddRule(e) {
    e.preventDefault()
    if (!newRule.name || !newRule.pattern) { setBuilderMsg({ type: 'error', text: 'Name and pattern are required' }); return }
    try { new RegExp(newRule.pattern) } catch { setBuilderMsg({ type: 'error', text: 'Invalid regex pattern' }); return }
    dispatch(addCustomRule({ ...newRule, id: 'CUSTOM-' + Date.now(), isCustom: true }))
    setBuilderMsg({ type: 'success', text: `Rule "${newRule.name}" added` })
    setNewRule({ name: '', category: 'custom', severity: 'medium', pattern: '', description: '', targets: ['query', 'body'] })
    setTimeout(() => setBuilderMsg(null), 3000)
  }

  function toggleTarget(t) {
    setNewRule(r => ({
      ...r, targets: r.targets.includes(t) ? r.targets.filter(x => x !== t) : [...r.targets, t]
    }))
  }

  return (
    <div className="p-6 animate-fade-in space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-display font-semibold text-white text-lg">Rule Engine</div>
          <div className="text-xs font-mono text-gray-500 mt-0.5">{enabledCount} of {rules.length} rules active — OWASP Top 10 coverage</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-mono text-gray-600 bg-surface-1 border border-border px-3 py-1.5 rounded-lg">
            {Object.values(hitMap).reduce((a, b) => a + b, 0)} total hits
          </div>
          <button onClick={() => setShowBuilder(b => !b)}
            className={cn('px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors',
              showBuilder ? 'bg-accent-purple/20 text-accent-purple border-accent-purple/30' : 'bg-surface-1 text-gray-400 border-border hover:text-gray-200'
            )}>
            {showBuilder ? '× Close Builder' : '+ Custom Rule'}
          </button>
        </div>
      </div>

      {/* Custom rule builder */}
      {showBuilder && (
        <div className="bg-surface-1 border border-accent-purple/20 rounded-xl p-5 animate-slide-in space-y-4">
          <div className="text-xs font-mono text-accent-purple uppercase tracking-widest">Custom Rule Builder</div>
          {builderMsg && (
            <div className={cn('px-3 py-2 rounded text-xs font-mono border',
              builderMsg.type === 'success' ? 'bg-accent-green/10 text-accent-green border-accent-green/20' : 'bg-accent-red/10 text-accent-red border-accent-red/20'
            )}>{builderMsg.text}</div>
          )}
          <form onSubmit={handleAddRule} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-gray-600 block mb-1">Rule Name *</label>
                <input value={newRule.name} onChange={e => setNewRule(r => ({ ...r, name: e.target.value }))} placeholder="My custom rule"
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none focus:border-accent-purple/40" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-gray-600 block mb-1">Category</label>
                <input value={newRule.category} onChange={e => setNewRule(r => ({ ...r, category: e.target.value }))} placeholder="custom"
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none focus:border-accent-purple/40" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono text-gray-600 block mb-1">Regex Pattern *</label>
              <input value={newRule.pattern} onChange={e => setNewRule(r => ({ ...r, pattern: e.target.value }))} placeholder="e.g. (eval\s*\(|base64_decode)"
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none focus:border-accent-purple/40 font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-gray-600 block mb-1">Description</label>
              <input value={newRule.description} onChange={e => setNewRule(r => ({ ...r, description: e.target.value }))} placeholder="What does this rule detect?"
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none focus:border-accent-purple/40" />
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-[10px] font-mono text-gray-600 block mb-1">Severity</label>
                <div className="flex gap-1">
                  {['low','medium','high','critical'].map(s => (
                    <button key={s} type="button" onClick={() => setNewRule(r => ({ ...r, severity: s }))}
                      className={cn('px-2 py-1 rounded text-[10px] font-mono uppercase border transition-colors',
                        newRule.severity === s ? SEVERITY_COLOR[s] : 'text-gray-600 border-border hover:text-gray-400'
                      )}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-gray-600 block mb-1">Inspect Targets</label>
                <div className="flex gap-1">
                  {TARGETS.map(t => (
                    <button key={t} type="button" onClick={() => toggleTarget(t)}
                      className={cn('px-2 py-1 rounded text-[10px] font-mono border transition-colors',
                        newRule.targets.includes(t) ? 'bg-accent-purple/20 text-accent-purple border-accent-purple/30' : 'text-gray-600 border-border hover:text-gray-400'
                      )}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 bg-accent-purple/20 hover:bg-accent-purple/30 border border-accent-purple/30 text-accent-purple text-xs font-mono rounded-lg transition-colors">
                Add Rule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-surface-1 border border-border rounded-lg p-1 flex-wrap">
          {['all', ...categories].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={cn('px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wide transition-colors',
                filterCat === c ? 'bg-accent-red/20 text-accent-red' : 'text-gray-500 hover:text-gray-300')}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-surface-1 border border-border rounded-lg p-1">
          {['all','critical','high','medium','low'].map(s => (
            <button key={s} onClick={() => setFilterSev(s)}
              className={cn('px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wide transition-colors',
                filterSev === s ? 'bg-accent-red/20 text-accent-red' : 'text-gray-500 hover:text-gray-300')}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Rules grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map(rule => {
          const hits = hitMap[rule.category] || 0
          const isDisabled = disabledRules?.includes(rule.id)
          return (
            <div key={rule.id} className={cn('bg-surface-1 border rounded-xl p-4 transition-colors', isDisabled ? 'border-border opacity-50' : 'border-border hover:border-border-strong')}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-gray-600 bg-surface-3 px-1.5 py-0.5 rounded">{rule.id}</span>
                  <span className={cn('text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border', SEVERITY_COLOR[rule.severity])}>{rule.severity}</span>
                  {rule.isCustom && <span className="text-[10px] font-mono text-accent-purple bg-accent-purple/10 border border-accent-purple/20 px-1.5 py-0.5 rounded">CUSTOM</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {hits > 0 && <span className="text-[10px] font-mono text-accent-red bg-accent-red/10 px-2 py-0.5 rounded-full">{hits} hits</span>}
                  {/* Toggle switch */}
                  <button onClick={() => handleToggle(rule.id)}
                    className={cn('relative w-9 h-5 rounded-full border transition-colors flex-shrink-0',
                      isDisabled ? 'bg-surface-3 border-border' : 'bg-accent-green/30 border-accent-green/40'
                    )}>
                    <span className={cn('absolute top-0.5 w-4 h-4 rounded-full transition-all',
                      isDisabled ? 'left-0.5 bg-gray-600' : 'left-4 bg-accent-green'
                    )} />
                  </button>
                </div>
              </div>
              <div className={cn('font-sans font-medium text-sm mb-1', isDisabled ? 'text-gray-600' : 'text-white')}>{rule.name}</div>
              <div className="text-xs text-gray-500 font-sans mb-3">{rule.description}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-gray-600 uppercase">{rule.category}</span>
                <span className="text-gray-700">·</span>
                <span className="text-[10px] font-mono text-gray-600">targets: {rule.targets?.join(', ')}</span>
              </div>
            </div>
          )
        })}
      </div>
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <div className="text-3xl mb-2">⊞</div>
          <div className="text-sm font-mono">No rules match current filter</div>
        </div>
      )}
    </div>
  )
}
