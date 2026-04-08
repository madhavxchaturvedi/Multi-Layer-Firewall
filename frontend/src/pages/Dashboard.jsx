// pages/Dashboard.jsx
import { useSelector } from 'react-redux'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import StatCard from '../components/StatCard'
import { CATEGORY_LABEL, CATEGORY_COLOR, formatTime } from '../lib/utils'
import { CategoryBadge, BlockedBadge, SeverityDot } from '../components/EventBadge'

const COLORS = ['#ff3b3b', '#ff7b29', '#f5c518', '#a855f7', '#06b6d4', '#3b82f6', '#00d68f']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono">
      <div className="text-gray-400 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { stats, events, rules } = useSelector(s => s.waf)

  // Build hourly chart data
  const hourlyData = (stats?.attacksByHour || Array(24).fill(0)).map((v, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`, attacks: v
  }))

  // Category pie data
  const catData = Object.entries(stats?.attacksByCategory || {})
    .map(([name, value]) => ({ name: CATEGORY_LABEL[name] || name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7)

  // Recent blocked events
  const recentBlocked = events.filter(e => e.blocked).slice(0, 8)

  // Recent traffic for area chart
  const trafficSample = events.slice(0, 30).reverse().map((e, i) => ({
    i,
    blocked: e.blocked ? 1 : 0,
    allowed: e.blocked ? 0 : 1
  }))

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={stats?.totalRequests?.toLocaleString() || 0} color="blue" sub="since startup" />
        <StatCard label="Blocked" value={stats?.totalBlocked?.toLocaleString() || 0} color="red" sub="attacks stopped" />
        <StatCard label="Block Rate" value={`${stats?.blockRate || 0}%`} color="yellow" sub="of all traffic" />
        <StatCard label="Rules Loaded" value={rules.length || '—'} color="green" sub="active patterns" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hourly attacks bar chart */}
        <div className="lg:col-span-2 bg-surface-1 border border-border rounded-xl p-5">
          <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Attacks by Hour (Today)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyData} barSize={6}>
              <XAxis dataKey="hour" tick={{ fill: '#4b5563', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 9 }} tickLine={false} axisLine={false} width={24} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="attacks" fill="#ff3b3b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="bg-surface-1 border border-border rounded-xl p-5">
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
                      <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-400 truncate max-w-[100px]">{d.name}</span>
                    </div>
                    <span className="text-gray-300">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-600 text-xs font-mono">No attacks yet</div>
          )}
        </div>
      </div>

      {/* Traffic area chart */}
      <div className="bg-surface-1 border border-border rounded-xl p-5">
        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Recent Traffic (last 30 requests)</div>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={trafficSample}>
            <defs>
              <linearGradient id="gBlocked" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff3b3b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ff3b3b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gAllowed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d68f" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00d68f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="blocked" stroke="#ff3b3b" strokeWidth={1.5} fill="url(#gBlocked)" />
            <Area type="monotone" dataKey="allowed" stroke="#00d68f" strokeWidth={1.5} fill="url(#gAllowed)" />
            <Tooltip content={<CustomTooltip />} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent blocked table */}
      <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">Recent Blocked Requests</div>
          <div className="text-[10px] font-mono text-gray-600">{recentBlocked.length} shown</div>
        </div>
        <div className="divide-y divide-border">
          {recentBlocked.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-600 text-xs font-mono">No attacks detected yet — try the Simulator</div>
          ) : recentBlocked.map((ev, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-surface-2 transition-colors text-xs">
              <SeverityDot severity={ev.severity} />
              <span className="font-mono text-gray-500 w-20 flex-shrink-0">{formatTime(ev.timestamp)}</span>
              <CategoryBadge category={ev.category} />
              <span className="font-mono text-gray-400 truncate flex-1">{ev.url}</span>
              <span className="font-mono text-gray-600 flex-shrink-0">{ev.country}</span>
              <span className="font-mono text-gray-500 flex-shrink-0 hidden lg:block truncate max-w-[90px]">{ev.ip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
