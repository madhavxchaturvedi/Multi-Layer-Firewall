// components/Sidebar.jsx
import { useDispatch, useSelector } from 'react-redux'
import { setActiveTab } from '../store/wafSlice'
import { cn } from '../lib/utils'

const NAV = [
  { id: 'dashboard', icon: '⬡', label: 'Dashboard' },
  { id: 'livefeed', icon: '◉', label: 'Live Feed' },
  { id: 'worldmap', icon: '◈', label: 'World Map' },
  { id: 'timeline', icon: '⊛', label: 'Threat Timeline' },
  { id: 'rules', icon: '⊞', label: 'Rule Engine' },
  { id: 'ips', icon: '⊘', label: 'IP Manager' },
  { id: 'webhooks', icon: '⚇', label: 'Webhooks' },
  { id: 'simulator', icon: '⚡', label: 'Simulator' },
  { id: 'logs', icon: '≡', label: 'Audit Logs' }
]

export default function Sidebar() {
  const dispatch = useDispatch()
  const { activeTab, connected, stats } = useSelector(s => s.waf)

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-surface-1 border-r border-border h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-accent-red/20 border border-accent-red/40 flex items-center justify-center">
            <span className="text-accent-red text-sm font-bold font-mono">W</span>
          </div>
          <div>
            <div className="font-display font-semibold text-white text-sm tracking-wide">WAF Guard</div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Security Layer</div>
          </div>
        </div>
      </div>

      {/* Connection status */}
      <div className="px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', connected ? 'bg-accent-green animate-pulse' : 'bg-gray-600')} />
          <span className="text-xs font-mono text-gray-400">{connected ? 'Live' : 'Offline'}</span>
          {stats && (
            <span className="ml-auto text-[10px] font-mono text-gray-600">{stats.totalRequests} req</span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => dispatch(setActiveTab(item.id))}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-sans transition-all mb-0.5',
              activeTab === item.id
                ? 'bg-accent-red/15 text-white border border-accent-red/25'
                : 'text-gray-500 hover:text-gray-300 hover:bg-surface-2'
            )}
          >
            <span className="text-base leading-none flex-shrink-0">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
            {item.id === 'livefeed' && stats?.totalBlocked > 0 && (
              <span className="ml-auto text-[10px] bg-accent-red text-white font-mono px-1.5 py-0.5 rounded-full">
                {stats.totalBlocked}
              </span>
            )}
            {item.id === 'worldmap' && stats?.totalBlocked > 0 && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse" />
            )}
          </button>
        ))}
      </nav>

      {/* Stats mini */}
      {stats && (
        <div className="px-5 py-3 border-t border-border grid grid-cols-2 gap-2">
          <div>
            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Blocked</div>
            <div className="text-xs font-mono text-accent-red font-bold">{stats.totalBlocked || 0}</div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Rate</div>
            <div className="text-xs font-mono text-accent-yellow font-bold">{stats.blockRate || 0}%</div>
          </div>
        </div>
      )}

      {/* Mode badge */}
      <div className="px-5 py-4 border-t border-border">
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1">Mode</div>
        <div className="inline-flex items-center gap-1.5 bg-accent-red/10 border border-accent-red/20 rounded px-2 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse-red" />
          <span className="text-accent-red text-[11px] font-mono font-semibold uppercase">BLOCK</span>
        </div>
      </div>
    </aside>
  )
}
