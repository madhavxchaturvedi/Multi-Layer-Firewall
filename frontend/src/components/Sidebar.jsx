// components/Sidebar.jsx
import { useDispatch, useSelector } from 'react-redux'
import { setActiveTab, activateDemo, deactivateDemo } from '../store/wafSlice'
import { useTheme } from './ThemeProvider'
import { useToast } from './Toast'
import { generatePDFReport } from '../lib/pdfReport'
import { cn } from '../lib/utils'

const NAV = [
  { id: 'dashboard', icon: '⬡', label: 'Dashboard' },
  { id: 'livefeed',  icon: '◉', label: 'Live Feed' },
  { id: 'worldmap',  icon: '◈', label: 'World Map' },
  { id: 'timeline',  icon: '⊛', label: 'Threat Timeline' },
  { id: 'rules',     icon: '⊞', label: 'Rule Engine' },
  { id: 'ips',       icon: '⊘', label: 'IP Manager' },
  { id: 'webhooks',  icon: '⚇', label: 'Webhooks' },
  { id: 'simulator', icon: '⚡', label: 'Simulator' },
  { id: 'logs',      icon: '≡', label: 'Audit Logs' },
]

export default function Sidebar() {
  const dispatch   = useDispatch()
  const toast      = useToast()
  const { theme, toggle } = useTheme()
  const { activeTab, connected, stats, rules, events, demoMode } = useSelector(s => s.waf)

  const isLight = theme === 'light'

  function handleDemo() {
    if (demoMode) {
      dispatch(deactivateDemo())
      toast.push({ type: 'info', title: 'Demo Off', message: 'Showing live data from backend.' })
    } else {
      dispatch(activateDemo())
      toast.push({ type: 'success', title: 'Demo Mode', message: '80 realistic fake attacks loaded. Perfect for presentations!', duration: 6000 })
    }
  }

  function handlePDF() {
    if (!stats && events.length === 0) {
      toast.push({ type: 'error', title: 'No Data', message: 'Enable Demo Mode or wait for some traffic first.' })
      return
    }
    toast.push({ type: 'info', title: 'Generating Report', message: 'Opening PDF in new window…' })
    setTimeout(() => generatePDFReport(stats, events, rules), 200)
  }

  return (
    <aside className={cn(
      'w-56 flex-shrink-0 flex flex-col h-screen sticky top-0 border-r',
      isLight
        ? 'bg-white border-gray-200'
        : 'bg-surface-1 border-border'
    )}>

      {/* Logo */}
      <div className={cn('px-5 py-5 border-b', isLight ? 'border-gray-100' : 'border-border')}>
        <div className="flex items-center gap-2.5">
          <div className={cn('w-7 h-7 rounded flex items-center justify-center',
            isLight ? 'bg-red-50 border border-red-200' : 'bg-accent-red/20 border border-accent-red/40'
          )}>
            <span className="text-accent-red text-sm font-bold font-mono">W</span>
          </div>
          <div>
            <div className={cn('font-display font-semibold text-sm tracking-wide', isLight ? 'text-gray-900' : 'text-white')}>
              WAF Guard
            </div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Security Layer</div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className={cn('px-5 py-3 border-b', isLight ? 'border-gray-100' : 'border-border')}>
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', connected ? 'bg-accent-green animate-pulse' : 'bg-gray-400')} />
          <span className={cn('text-xs font-mono', isLight ? 'text-gray-600' : 'text-gray-400')}>
            {demoMode ? '⚡ Demo' : connected ? 'Live' : 'Offline'}
          </span>
          {stats && (
            <span className="ml-auto text-[10px] font-mono text-gray-400">{stats.totalRequests} req</span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {NAV.map(item => (
          <button key={item.id} onClick={() => dispatch(setActiveTab(item.id))}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-sans transition-all mb-0.5',
              activeTab === item.id
                ? isLight
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-accent-red/15 text-white border border-accent-red/25'
                : isLight
                  ? 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-surface-2'
            )}>
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

      {/* Mini stats */}
      {stats && (
        <div className={cn('px-5 py-3 grid grid-cols-2 gap-2 border-t', isLight ? 'border-gray-100' : 'border-border')}>
          <div>
            <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Blocked</div>
            <div className="text-xs font-mono text-accent-red font-bold">{stats.totalBlocked || 0}</div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Rate</div>
            <div className="text-xs font-mono text-accent-yellow font-bold">{stats.blockRate || 0}%</div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className={cn('px-3 py-3 space-y-1.5 border-t', isLight ? 'border-gray-100' : 'border-border')}>

        {/* Demo mode */}
        <button onClick={handleDemo}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all',
            demoMode
              ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
              : isLight
                ? 'bg-gray-50 text-gray-500 border border-gray-200 hover:text-gray-800'
                : 'bg-surface-2 text-gray-500 border border-border hover:text-gray-300'
          )}>
          <span>{demoMode ? '◉' : '◎'}</span>
          <span>{demoMode ? 'Exit Demo' : 'Demo Mode'}</span>
          {demoMode && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" />}
        </button>

        {/* PDF Report */}
        <button onClick={handlePDF}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all',
            isLight
              ? 'bg-gray-50 text-gray-500 border border-gray-200 hover:text-gray-800'
              : 'bg-surface-2 text-gray-500 border border-border hover:text-gray-300'
          )}>
          <span>↓</span>
          <span>Export Report</span>
        </button>

        {/* Theme toggle */}
        <button onClick={toggle}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all',
            isLight
              ? 'bg-gray-50 text-gray-500 border border-gray-200 hover:text-gray-800'
              : 'bg-surface-2 text-gray-500 border border-border hover:text-gray-300'
          )}>
          <span>{isLight ? '☾' : '☀'}</span>
          <span>{isLight ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>

      {/* Mode badge */}
      <div className={cn('px-5 py-4 border-t', isLight ? 'border-gray-100' : 'border-border')}>
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">WAF Mode</div>
        <div className="inline-flex items-center gap-1.5 bg-accent-red/10 border border-accent-red/20 rounded px-2 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse-red" />
          <span className="text-accent-red text-[11px] font-mono font-semibold uppercase">BLOCK</span>
        </div>
      </div>
    </aside>
  )
}
