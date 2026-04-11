// pages/Dashboard.jsx
import { useSelector } from 'react-redux'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import StatCard from '../components/StatCard'
import ThreatGauge from '../components/ThreatGauge'
import { CATEGORY_LABEL, formatTime } from '../lib/utils'
import { CategoryBadge, SeverityDot } from '../components/EventBadge'
import { useTheme } from '../components/ThemeProvider'
import { cn } from '../lib/utils'

const COLORS = ['#ff3b3b','#ff7b29','#f5c518','#a855f7','#06b6d4','#3b82f6','#00d68f']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <div className="text-gray-400 mb-1">{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
    </div>
  )
}

export default function Dashboard() {
  const { stats, events, rules, demoMode } = useSelector(s => s.waf)
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const hourlyData = (stats?.attacksByHour || Array(24).fill(0)).map((v, i) => ({
    hour: `${String(i).padStart(2,'00')}:00`, attacks: v
  }))

  const catData = Object.entries(stats?.attacksByCategory || {})
    .map(([name, value]) => ({ name: CATEGORY_LABEL[name] || name, value }))
    .sort((a, b) => b.value - a.value).slice(0, 7)

  const recentBlocked = events.filter(e => e.blocked).slice(0, 8)

  const trafficSample = events.slice(0, 30).reverse().map((e, i) => ({
    i, blocked: e.blocked ? 1 : 0, allowed: e.blocked ? 0 : 1
  }))

  const topCountries = Object.entries(stats?.attacksByCountry || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 5)

  const blockRate = parseFloat(stats?.blockRate || 0)
  const axisColor = isLight ? '#9ca3af' : '#4b5563'

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Demo mode banner */}
      {demoMode && (
        <div className="flex items-center gap-3 bg-accent-purple/10 border border-accent-purple/25 rounded-xl px-5 py-3">
          <div className="w-2 h-2 rounded-full bg-accent-purple animate-pulse" />
          <span className="text-xs font-mono text-accent-purple">
            Demo Mode active — showing simulated attack data. Go to Sidebar → Exit Demo to return to live data.
          </span>
        </div>
      )}

      {/* Top row: stat cards + threat gauge */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 items-start">
        <div className="col-span-2 lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Requests" value={stats?.totalRequests?.toLocaleString() || 0} color="blue" sub="since startup" />
          <StatCard label="Blocked"        value={stats?.totalBlocked?.toLocaleString() || 0}  color="red"  sub="attacks stopped" />
          <StatCard label="Allowed"        value={stats?.totalAllowed?.toLocaleString() || 0}   color="green" sub="clean requests" />
          <StatCard label="Rules Loaded"   value={rules.length || '—'}                          color="purple" sub="active patterns" />
        </div>

        {/* Threat Gauge */}
        <div className={cn('flex items-center justify-center rounded-xl p-4 border', isLight ? 'bg-white border-gray-100' : 'bg-surface-1 border-border')}>
          <ThreatGauge value={blockRate} label="Block Rate" size={130} />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={cn('lg:col-span-2 rounded-xl p-5 border', isLight ? 'bg-white border-gray-100' : 'bg-surface-1 border-border')}>
          <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Attacks by Hour (Today)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyData} barSize={6}>
              <XAxis dataKey="hour" tick={{ fill: axisColor, fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fill: axisColor, fontSize: 9 }} tickLine={false} axisLine={false} width={24} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="attacks" fill="#ff3b3b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={cn('rounded-xl p-5 border', isLight ? 'bg-white border-gray-100' : 'bg-surface-1 border-border')}>
          <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Attack Categories</div>
          {catData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={catData} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3}>
                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {catData.slice(0, 4).map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-400 truncate max-w-[110px]">{d.name}</span>
                    </div>
                    <span className={isLight ? 'text-gray-700' : 'text-gray-300'}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-xs font-mono">No attacks yet — try Simulator</div>
          )}
        </div>
      </div>

      {/* Traffic + countries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={cn('lg:col-span-2 rounded-xl p-5 border', isLight ? 'bg-white border-gray-100' : 'bg-surface-1 border-border')}>
          <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Recent Traffic (last 30 requests)</div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={trafficSample}>
              <defs>
                <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ff3b3b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff3b3b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00d68f" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00d68f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="blocked" stroke="#ff3b3b" strokeWidth={1.5} fill="url(#gB)" />
              <Area type="monotone" dataKey="allowed" stroke="#00d68f" strokeWidth={1.5} fill="url(#gA)" />
              <Tooltip content={<CustomTooltip />} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={cn('rounded-xl p-5 border', isLight ? 'bg-white border-gray-100' : 'bg-surface-1 border-border')}>
          <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Top Attacking Countries</div>
          {topCountries.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-gray-400 text-xs font-mono">No data yet</div>
          ) : (
            <div className="space-y-2.5">
              {topCountries.map(([cc, count], i) => {
                const max = topCountries[0][1]
                return (
                  <div key={cc} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-500 w-4">{i+1}</span>
                    <span className="font-mono text-xs w-8" style={{ color: isLight ? '#374151' : '#d1d5db' }}>{cc}</span>
                    <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: isLight ? '#f3f4f6' : '#222736' }}>
                      <div className="h-full bg-accent-red rounded-full transition-all duration-700" style={{ width: `${(count/max)*100}%` }} />
                    </div>
                    <span className="font-mono text-gray-400 text-xs w-6 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent blocked table */}
      <div className={cn('rounded-xl overflow-hidden border', isLight ? 'bg-white border-gray-100' : 'bg-surface-1 border-border')}>
        <div className={cn('px-5 py-3 flex items-center justify-between border-b', isLight ? 'border-gray-100' : 'border-border')}>
          <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">Recent Blocked Requests</div>
          <div className="text-[10px] font-mono text-gray-400">{recentBlocked.length} shown</div>
        </div>
        <div className="divide-y" style={{ borderColor: isLight ? '#f3f4f6' : 'rgba(255,255,255,0.06)' }}>
          {recentBlocked.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-xs font-mono">
              No attacks yet — try the Simulator or enable Demo Mode
            </div>
          ) : recentBlocked.map((ev, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-black/5 transition-colors text-xs">
              <SeverityDot severity={ev.severity} />
              <span className="font-mono text-gray-400 w-20 flex-shrink-0">{formatTime(ev.timestamp)}</span>
              <CategoryBadge category={ev.category} />
              <span className="font-mono text-gray-400 truncate flex-1">{ev.url}</span>
              <span className="font-mono text-gray-500 flex-shrink-0">{ev.country}</span>
              <span className="font-mono text-gray-500 hidden lg:block truncate max-w-[90px]">{ev.ip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
