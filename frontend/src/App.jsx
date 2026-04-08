// App.jsx
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchStats, fetchEvents, fetchRules, fetchBanned } from './store/wafSlice'
import { useSocket } from './hooks/useSocket'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import LiveFeed from './pages/LiveFeed'
import Rules from './pages/Rules'
import IPManager from './pages/IPManager'
import Simulator from './pages/Simulator'
import AuditLogs from './pages/AuditLogs'

export default function App() {
  const dispatch = useDispatch()
  const { activeTab } = useSelector(s => s.waf)

  // Connect to real-time socket
  useSocket()

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchStats())
    dispatch(fetchEvents())
    dispatch(fetchRules())
    dispatch(fetchBanned())

    // Refresh stats every 10s
    const interval = setInterval(() => dispatch(fetchStats()), 10000)
    return () => clearInterval(interval)
  }, [dispatch])

  const pages = {
    dashboard: <Dashboard />,
    livefeed: <LiveFeed />,
    rules: <Rules />,
    ips: <IPManager />,
    simulator: <Simulator />,
    logs: <AuditLogs />
  }

  return (
    <div className="flex min-h-screen bg-surface text-white">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {pages[activeTab] || <Dashboard />}
      </main>
    </div>
  )
}
