// pages/Rules.jsx
import { useSelector } from 'react-redux'
import { useState } from 'react'
import { SEVERITY_COLOR, cn } from '../lib/utils'

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

export default function Rules() {
  const { rules, stats } = useSelector(s => s.waf)
  const [filterCat, setFilterCat] = useState('all')
  const [filterSev, setFilterSev] = useState('all')

  const categories = [...new Set(rules.map(r => r.category))]
  const filtered = rules
    .filter(r => filterCat === 'all' || r.category === filterCat)
    .filter(r => filterSev === 'all' || r.severity === filterSev)
    .sort((a, b) => (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9))

  const hitMap = stats?.attacksByCategory || {}

  return (
    <div className="p-6 animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display font-semibold text-white text-lg">Rule Engine</div>
          <div className="text-xs font-mono text-gray-500 mt-0.5">{rules.length} active detection rules — OWASP Top 10 coverage</div>
        </div>
        <div className="text-xs font-mono text-gray-600 bg-surface-1 border border-border px-3 py-1.5 rounded-lg">
          {Object.values(hitMap).reduce((a, b) => a + b, 0)} total hits
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-surface-1 border border-border rounded-lg p-1">
          {['all', ...categories].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={cn('px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wide transition-colors',
                filterCat === c ? 'bg-accent-red/20 text-accent-red' : 'text-gray-500 hover:text-gray-300'
              )}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-surface-1 border border-border rounded-lg p-1">
          {['all', 'critical', 'high', 'medium', 'low'].map(s => (
            <button key={s} onClick={() => setFilterSev(s)}
              className={cn('px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wide transition-colors',
                filterSev === s ? 'bg-accent-red/20 text-accent-red' : 'text-gray-500 hover:text-gray-300'
              )}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Rules grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map(rule => {
          const hits = hitMap[rule.category] || 0
          return (
            <div key={rule.id} className="bg-surface-1 border border-border rounded-xl p-4 hover:border-border-strong transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-gray-600 bg-surface-3 px-1.5 py-0.5 rounded">{rule.id}</span>
                  <span className={cn('text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border', SEVERITY_COLOR[rule.severity])}>
                    {rule.severity}
                  </span>
                </div>
                {hits > 0 && (
                  <span className="text-[10px] font-mono text-accent-red bg-accent-red/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    {hits} hits
                  </span>
                )}
              </div>
              <div className="font-sans font-medium text-white text-sm mb-1">{rule.name}</div>
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
