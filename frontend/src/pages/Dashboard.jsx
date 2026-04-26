// pages/Dashboard.jsx — Vantix Design System
import { useSelector } from "react-redux";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import StatCard from "../components/StatCard";
import ThreatGauge from "../components/ThreatGauge";
import { CategoryBadge, SeverityDot } from "../components/EventBadge";
import { useTheme } from "../components/ThemeProvider";
import {
  C,
  F,
  card,
  sectionHeading,
  CATEGORY_LABEL,
  CHART_COLORS,
  axisStyle,
  chartTooltip,
} from "../lib/ds";
import { formatTime } from "../lib/utils";

const VTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const { theme } = { theme: "dark" };
  const s = chartTooltip(false);
  return (
    <div style={s}>
      <div
        style={{
          fontFamily: F.mono,
          fontSize: "9px",
          color: C.textMut,
          marginBottom: "4px",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </div>
      {payload.map((p, i) => (
        <div
          key={i}
          style={{
            fontFamily: F.mono,
            fontSize: "11px",
            color: p.color || C.textPri,
          }}
        >
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

function Card({ children, style = {} }) {
  const { theme } = useTheme();
  const light = theme === "light";
  return (
    <div style={{ ...card(light), padding: "20px", ...style }}>{children}</div>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: F.mono,
        fontSize: "9px",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: C.textMut,
        marginBottom: "14px",
      }}
    >
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { stats, events, rules, demoMode } = useSelector((s) => s.waf);
  const { theme } = useTheme();
  const light = theme === "light";
  const ax = axisStyle(light);
  const tp = light ? C.lTextPri : C.textPri;
  const ts = light ? C.lTextSec : C.textSec;
  const tm = light ? C.lTextMut : C.textMut;

  const hourlyData = (stats?.attacksByHour || Array(24).fill(0)).map(
    (v, i) => ({
      hour: `${String(i).padStart(2, "0")}:00`,
      attacks: v,
    }),
  );

  const catData = Object.entries(stats?.attacksByCategory || {})
    .map(([name, value]) => ({ name: CATEGORY_LABEL[name] || name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  const recentBlocked = events.filter((e) => e.blocked).slice(0, 8);

  const trafficSample = events
    .slice(0, 30)
    .reverse()
    .map((e, i) => ({
      i,
      blocked: e.blocked ? 1 : 0,
      allowed: e.blocked ? 0 : 1,
    }));

  const topCountries = Object.entries(stats?.attacksByCountry || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const blockRate = parseFloat(stats?.blockRate || 0);

  return (
    <div
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* Demo banner */}
      {demoMode && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(124,58,237,0.1)",
            border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: "8px",
            padding: "10px 16px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: C.purpleL,
              flexShrink: 0,
              animation: "pulseCrim 1.5s ease-in-out infinite",
            }}
          />
          <span
            style={{ fontFamily: F.mono, fontSize: "11px", color: C.purpleL }}
          >
            Demo Mode — showing simulated data. Sidebar → Exit Demo to return to
            live.
          </span>
        </div>
      )}

      {/* Stat cards + gauge */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
          gap: "14px",
          alignItems: "start",
        }}
      >
        <StatCard
          label="Total Requests"
          value={stats?.totalRequests?.toLocaleString() || 0}
          color="blue"
          sub="since startup"
        />
        <StatCard
          label="Blocked"
          value={stats?.totalBlocked?.toLocaleString() || 0}
          color="red"
          sub="attacks stopped"
        />
        <StatCard
          label="Allowed"
          value={stats?.totalAllowed?.toLocaleString() || 0}
          color="green"
          sub="clean requests"
        />
        <StatCard
          label="Rules Loaded"
          value={rules.length || "—"}
          color="purple"
          sub="active patterns"
        />
        <div
          style={{
            ...card(light),
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "150px",
          }}
        >
          <ThreatGauge value={blockRate} label="Block Rate" size={122} />
        </div>
      </div>

      {/* Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "14px",
        }}
      >
        {/* Hourly bar chart */}
        <div style={{ ...card(light), padding: "20px", gridColumn: "span 2" }}>
          <SectionLabel>// Attacks by hour (today)</SectionLabel>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={hourlyData} barSize={5}>
              <XAxis
                dataKey="hour"
                tick={ax}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <YAxis tick={ax} tickLine={false} axisLine={false} width={22} />
              <Tooltip content={<VTooltip />} />
              <Bar dataKey="attacks" fill={C.crim} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div style={{ ...card(light), padding: "20px" }}>
          <SectionLabel>// Attack categories</SectionLabel>
          {catData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie
                    data={catData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={55}
                    paddingAngle={3}
                  >
                    {catData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<VTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  marginTop: "8px",
                }}
              >
                {catData.slice(0, 4).map((d, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontFamily: F.mono,
                      fontSize: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "1px",
                          background: CHART_COLORS[i % CHART_COLORS.length],
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          color: ts,
                          maxWidth: "90px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {d.name}
                      </span>
                    </div>
                    <span style={{ color: tp, fontWeight: 500 }}>
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "140px",
                fontFamily: F.mono,
                fontSize: "11px",
                color: tm,
              }}
            >
              No attacks yet
            </div>
          )}
        </div>
      </div>

      {/* Traffic area + countries */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "14px",
        }}
      >
        <div style={{ ...card(light), padding: "20px", gridColumn: "span 2" }}>
          <SectionLabel>// Recent traffic (last 30 requests)</SectionLabel>
          <ResponsiveContainer width="100%" height={90}>
            <AreaChart data={trafficSample}>
              <defs>
                <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.crim} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={C.crim} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.greenL} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.greenL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="blocked"
                stroke={C.crim}
                strokeWidth={1.5}
                fill="url(#gB)"
                name="Blocked"
              />
              <Area
                type="monotone"
                dataKey="allowed"
                stroke={C.greenL}
                strokeWidth={1.5}
                fill="url(#gA)"
                name="Allowed"
              />
              <Tooltip content={<VTooltip />} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top countries */}
        <div style={{ ...card(light), padding: "20px" }}>
          <SectionLabel>// Top attacking countries</SectionLabel>
          {topCountries.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "80px",
                fontFamily: F.mono,
                fontSize: "11px",
                color: tm,
              }}
            >
              No data yet
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {topCountries.map(([cc, count], i) => {
                const max = topCountries[0][1];
                return (
                  <div
                    key={cc}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: F.mono,
                        fontSize: "9px",
                        color: tm,
                        width: "14px",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        fontFamily: F.mono,
                        fontSize: "11px",
                        color: tp,
                        width: "26px",
                        fontWeight: 500,
                      }}
                    >
                      {cc}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "4px",
                        background: light ? "rgba(10,10,10,0.08)" : C.s3,
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background: C.crim,
                          borderRadius: "2px",
                          width: `${(count / max) * 100}%`,
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: F.mono,
                        fontSize: "10px",
                        color: ts,
                        width: "20px",
                        textAlign: "right",
                      }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent blocked table */}
      <div style={{ ...card(light), overflow: "hidden", padding: 0 }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: `1px solid ${light ? C.lBdr : C.bdr}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: F.mono,
              fontSize: "9px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: tm,
            }}
          >
            // Recent blocked requests
          </div>
          <div style={{ fontFamily: F.mono, fontSize: "9px", color: tm }}>
            {recentBlocked.length} shown
          </div>
        </div>
        {recentBlocked.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              fontFamily: F.mono,
              fontSize: "11px",
              color: tm,
            }}
          >
            No attacks yet — try the Simulator or enable Demo Mode
          </div>
        ) : (
          recentBlocked.map((ev, i) => (
            <div
              key={i}
              style={{
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                borderBottom: `1px solid ${light ? C.lBdr : C.bdr}`,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = light
                  ? "rgba(10,10,10,0.03)"
                  : C.s2)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <SeverityDot severity={ev.severity} />
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: "10px",
                  color: tm,
                  width: "72px",
                  flexShrink: 0,
                }}
              >
                {formatTime(ev.timestamp)}
              </span>
              <CategoryBadge category={ev.category} />
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: "11px",
                  color: ts,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {ev.url}
              </span>
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: "10px",
                  color: tm,
                  flexShrink: 0,
                }}
              >
                {ev.country || "—"}
              </span>
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: "10px",
                  color: tm,
                  flexShrink: 0,
                  width: "96px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {ev.ip}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
