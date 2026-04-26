// App.jsx — Vantix
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStats,
  fetchEvents,
  fetchRules,
  fetchBanned,
  fetchSuspicious,
  fetchWebhooks,
} from "./store/wafSlice";
import { useSocket } from "./hooks/useSocket";
import Landing from "./pages/Landing";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import LiveFeed from "./pages/LiveFeed";
import WorldMap from "./pages/WorldMap";
import ThreatTimeline from "./pages/ThreatTimeline";
import Rules from "./pages/Rules";
import IPManager from "./pages/IPManager";
import Webhooks from "./pages/Webhooks";
import Simulator from "./pages/Simulator";
import AuditLogs from "./pages/AuditLogs";

const PAGES = {
  dashboard: Dashboard,
  livefeed: LiveFeed,
  worldmap: WorldMap,
  timeline: ThreatTimeline,
  rules: Rules,
  ips: IPManager,
  webhooks: Webhooks,
  simulator: Simulator,
  logs: AuditLogs,
};

function DashboardApp() {
  const dispatch = useDispatch();
  const { activeTab } = useSelector((s) => s.waf);
  useSocket();

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchEvents());
    dispatch(fetchRules());
    dispatch(fetchBanned());
    dispatch(fetchSuspicious());
    dispatch(fetchWebhooks());
    const iv = setInterval(() => {
      dispatch(fetchStats());
      dispatch(fetchSuspicious());
    }, 10000);
    return () => clearInterval(iv);
  }, [dispatch]);

  const Page = PAGES[activeTab] || Dashboard;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--surface)",
        color: "var(--text-pri)",
      }}
    >
      <Sidebar />
      <main style={{ flex: 1, overflow: "auto" }}>
        <Page />
      </main>
    </div>
  );
}

export default function App() {
  const [showDash, setShowDash] = useState(false);
  if (!showDash) return <Landing onEnter={() => setShowDash(true)} />;
  return <DashboardApp />;
}
