# WAF Guard — Advanced Web Application Firewall

A production-grade, real-time Web Application Firewall built with **Node.js + Express** and a **React + Redux** dashboard. Goes far beyond basic IP blocking — it inspects actual HTTP content and blocks OWASP Top 10 attacks.

---

## What Makes This Stand Out

| Feature | Basic Firewall (theirs) | WAF Guard (yours) |
|---|---|---|
| Works at | IP / Port (Layer 3-4) | HTTP content (Layer 7) |
| Detects | IP ranges, ports | SQLi, XSS, Cmdi, SSRF, XXE |
| Honeypot trap | ✗ | ✓ (auto-bans attacker) |
| AI anomaly score | ✗ | ✓ (threat scoring) |
| Real-time dashboard | Basic | Full — live feed, charts, map |
| Attack simulator | ✗ | ✓ (demo in 1 click) |
| Rule engine | Static iptables | Dynamic, categorised OWASP rules |
| Socket.io live stream | ✗ | ✓ |

---

## Architecture

```
Browser ──► WAF Proxy (port 4000) ──► Your App (any port)
                │
                ├── Layer 1: IP Ban check
                ├── Layer 2: Geo-block (by country)
                ├── Layer 3: Rate limiter (60 req/min)
                ├── Layer 4: Honeypot path trap
                └── Layer 5: Rule engine (SQLi, XSS, CMDi, SSRF, XXE, Scanner)
                                │
                         Socket.io ──► React Dashboard (port 5173)
```

---

## Quick Start

### 1. Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure the WAF
Edit `backend/.env`:
```env
PORT=4000                          # WAF proxy port
TARGET_URL=http://localhost:3001   # Your app to protect (leave empty for echo mode)
WAF_MODE=block                     # 'block' or 'detect' (log-only)
RATE_LIMIT_POINTS=60               # Max requests per minute per IP
GEO_BLOCK_COUNTRIES=               # e.g. CN,RU,KP (comma-separated ISO codes)
HONEYPOT_PATHS=/admin-secret,/wp-admin,/.env,/config.php
```

### 3. Start the backend
```bash
cd backend
npm run dev        # with nodemon (auto-reload)
# or
npm start          # production
```

### 4. Start the dashboard
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** for the dashboard.

---

## How It Works

### 5-Layer Defense Pipeline

Every HTTP request is run through these layers in order:

**Layer 1 — IP Ban**  
Checks an in-memory ban list. Auto-populated by other layers; can also be set manually from the dashboard.

**Layer 2 — Geo-Block**  
Uses `geoip-lite` to look up the request IP's country. If the country is in your `GEO_BLOCK_COUNTRIES` list, the request is rejected.

**Layer 3 — Rate Limiter**  
Each IP is allowed N requests per minute (configurable). Exceeding it returns HTTP 429 and adds threat score.

**Layer 4 — Honeypot**  
A list of fake "bait" URLs (like `/wp-admin`, `/.env`, `/backup.sql`). Any attacker probing these paths gets **permanently banned** instantly.

**Layer 5 — Rule Engine**  
The core WAF layer. Each request's URL, query params, body, and headers are checked against 14+ OWASP patterns:
- SQL Injection (classic, blind, comment evasion)
- XSS (script tags, event handlers, JS URIs)
- Path Traversal (directory sequences, sensitive file paths)
- Command Injection (shell metacharacters)
- SSRF (internal IPs, cloud metadata)
- XXE (external entity injection)
- Scanner detection (sqlmap, nikto, etc.)

### Threat Scoring
Every block adds a threat score to the IP:
- `critical` rule hit → +40 points
- `high` → +25, `medium` → +15
- Score ≥ 80 → auto-banned

### Real-Time Dashboard
Socket.io pushes every WAF event to the React dashboard instantly. The Redux store accumulates stats that power the live charts, feed, and reports.

---

## Project Structure

```
waf-project/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express + Socket.io entrypoint
│   │   ├── middleware/
│   │   │   └── wafEngine.js       # 5-layer WAF pipeline
│   │   ├── rules/
│   │   │   └── attackPatterns.js  # OWASP detection rules
│   │   ├── utils/
│   │   │   ├── ipReputation.js    # IP banning, geo-lookup, threat score
│   │   │   ├── eventStore.js      # In-memory event/stats store
│   │   │   └── logger.js          # Winston logger
│   │   └── routes/
│   │       └── api.js             # REST API for dashboard
│   ├── logs/                      # waf-audit.log written here
│   └── .env                       # Configuration
│
└── frontend/
    └── src/
        ├── App.jsx                # Root — tab routing
        ├── store/
        │   ├── index.js           # Redux store
        │   └── wafSlice.js        # All WAF state + async thunks
        ├── hooks/
        │   └── useSocket.js       # Socket.io → Redux bridge
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── StatCard.jsx
        │   └── EventBadge.jsx
        └── pages/
            ├── Dashboard.jsx      # Stats, charts, recent blocks
            ├── LiveFeed.jsx       # Real-time event stream
            ├── Rules.jsx          # All loaded detection rules
            ├── IPManager.jsx      # Ban/unban, allowlist, honeypot
            ├── Simulator.jsx      # Fire test attacks
            └── AuditLogs.jsx      # Paginated full log
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/events` | Recent WAF events |
| GET | `/api/rules` | All loaded rules |
| GET | `/api/banned` | Banned IPs |
| POST | `/api/ban` | Manually ban an IP |
| DELETE | `/api/ban/:ip` | Unban an IP |
| POST | `/api/allowlist` | Add to allowlist |
| GET | `/api/ip/:ip` | IP reputation lookup |
| POST | `/api/simulate` | Trigger test attack |
| GET | `/api/health` | Health check |
| GET | `/api/logs` | Tail audit log file |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Proxy & WAF engine | Node.js, Express |
| Real-time events | Socket.io |
| Geo lookup | geoip-lite |
| Rate limiting | rate-limiter-flexible |
| Logging | Winston |
| Reverse proxy | http-proxy-middleware |
| Frontend framework | React 18 |
| State management | Redux Toolkit |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Build tool | Vite |

---

## Extending the Project

**Add a new rule:** Open `backend/src/rules/attackPatterns.js` and add an entry to the `RULES` array with an `id`, `name`, `category`, `severity`, `pattern`, and `targets`.

**Add Redis:** Replace the in-memory `Map` stores in `ipReputation.js` and `eventStore.js` with `ioredis` calls for persistence across restarts.

**Add a database:** Wire `eventStore.recordEvent()` to write to SQLite or PostgreSQL for long-term log storage.

**Add ML anomaly detection:** In `wafEngine.js`, after Layer 5, add a call to an anomaly scoring model (e.g. `isolation-forest` npm package) trained on your baseline traffic.

---

## License
MIT
