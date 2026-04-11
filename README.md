# WAF Guard v2 — Advanced Web Application Firewall

A production-grade, real-time Web Application Firewall built with **Node.js + Express** and a **React + Redux** dashboard.

## What's New in v2

| Feature | v1 | v2 |
|---|---|---|
| World Map | ✗ | ✓ Live pulsing attack dots |
| Threat Timeline | ✗ | ✓ Per-IP full history + score |
| Suspicious IPs UI | ✗ | ✓ Score bars, promote to ban |
| Allowlist UI | ✗ | ✓ Add IPs from dashboard |
| Rule toggles | ✗ | ✓ Enable/disable per rule |
| Custom rule builder | ✗ | ✓ Regex + targets from UI |
| False positive reporter | ✗ | ✓ 1-click → allowlist |
| Request replay | ✗ | ✓ Re-fire any blocked request |
| CSV export | ✗ | ✓ Alongside JSON |
| Webhook alerts | ✗ | ✓ Slack, Discord, custom |
| Rules Loaded count | Wrong | ✓ Fixed (uses rules.length) |

## Quick Start

```bash
cd backend && npm install
cd ../frontend && npm install

# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev

# Open
http://localhost:5173
```

## 9 Dashboard Pages

| Page | What it does |
|---|---|
| Dashboard | Stats, charts, hourly attacks, top countries |
| Live Feed | Real-time stream — click to inspect, replay, or flag FP |
| World Map | SVG globe with live pulsing attack dots |
| Threat Timeline | Per-IP full attack history and threat score |
| Rule Engine | Toggle rules on/off, build custom regex rules |
| IP Manager | Banned / Suspicious / Allowlist / Honeypot tabs |
| Webhooks | Slack/Discord/custom alerts with severity filter |
| Simulator | Fire 8 attack types + custom payload |
| Audit Logs | Full paginated log — export CSV or JSON |

## Architecture

```
Browser → WAF Proxy (4000) → Your App
              │
              ├── IP Ban / Geo / Rate limit / Honeypot / Rule engine
              │
         Socket.io → React Dashboard (5173)
              │
         Webhooks → Slack / Discord / Custom
```

## Config (backend/.env)

```env
PORT=4000
TARGET_URL=http://localhost:3001
WAF_MODE=block
RATE_LIMIT_POINTS=60
GEO_BLOCK_COUNTRIES=
HONEYPOT_PATHS=/admin-secret,/wp-admin,/.env,/config.php
```

## License
MIT
