// components/EventBadge.jsx
import { cn } from '../lib/utils'
import { CATEGORY_COLOR, CATEGORY_LABEL } from '../lib/utils'

export function CategoryBadge({ category }) {
  return (
    <span className={cn('text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded', CATEGORY_COLOR[category] || 'text-gray-400 bg-gray-400/10')}>
      {CATEGORY_LABEL[category] || category}
    </span>
  )
}

export function SeverityDot({ severity }) {
  const map = { critical: 'bg-accent-red', high: 'bg-accent-orange', medium: 'bg-accent-yellow', low: 'bg-accent-green' }
  return <span className={cn('inline-block w-2 h-2 rounded-full flex-shrink-0', map[severity] || 'bg-gray-600')} />
}

export function BlockedBadge({ blocked }) {
  return blocked
    ? <span className="text-[10px] font-mono bg-accent-red/15 text-accent-red border border-accent-red/25 px-1.5 py-0.5 rounded">BLOCKED</span>
    : <span className="text-[10px] font-mono bg-accent-green/10 text-accent-green border border-accent-green/20 px-1.5 py-0.5 rounded">PASSED</span>
}
