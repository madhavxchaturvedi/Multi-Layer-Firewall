// routes/api.js
// REST API endpoints consumed by the React dashboard

const router = require("express").Router();
const axios = require("axios");
const { getEvents, getStats, clearStats } = require("../utils/eventStore");
const ipRep = require("../utils/ipReputation");
const { RULES } = require("../rules/attackPatterns");
const fs = require("fs");
const path = require("path");

const ATTACK_SCENARIOS = {
  sqli: {
    url: "/",
    params: { id: "' OR 1=1 -- " },
    payload: "' OR 1=1 -- ",
  },
  xss: {
    url: "/search",
    params: { q: "<script>alert('xss')</script>" },
    payload: "<script>alert('xss')</script>",
  },
  path: {
    url: "/file",
    params: { name: "../../etc/passwd" },
    payload: "../../etc/passwd",
  },
  cmdi: {
    url: "/exec",
    params: { cmd: "; cat /etc/passwd" },
    payload: "; cat /etc/passwd",
  },
  ssrf: {
    url: "/fetch",
    params: { url: "http://169.254.169.254/latest/meta-data" },
    payload: "http://169.254.169.254/latest/meta-data",
  },
  scanner: {
    url: "/login",
    headers: { "User-Agent": "sqlmap/1.7.8" },
    payload: "sqlmap/1.7.8",
  },
  honeypot: {
    url: "/wp-admin",
    payload: "/wp-admin",
  },
  blind_sqli: {
    url: "/api/user",
    params: { id: "1; SELECT SLEEP(5)--" },
    payload: "1; SELECT SLEEP(5)--",
  },
};

// GET /api/stats - dashboard statistics
router.get("/stats", (req, res) => {
  res.json(getStats());
});

// GET /api/events - recent WAF events
router.get("/events", (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const category = req.query.category;
  let evts = getEvents(limit);
  if (category) evts = evts.filter((e) => e.category === category);
  res.json(evts);
});

// GET /api/rules - all loaded detection rules
router.get("/rules", (req, res) => {
  res.json(
    RULES.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      severity: r.severity,
      description: r.description,
      targets: r.targets,
    })),
  );
});

// GET /api/banned - list of banned IPs
router.get("/banned", (req, res) => {
  res.json(ipRep.getAllBanned());
});

// GET /api/suspicious - list of suspicious IPs
router.get("/suspicious", (req, res) => {
  res.json(ipRep.getAllSuspicious());
});

// POST /api/ban - manually ban an IP
router.post("/ban", (req, res) => {
  const { ip, reason, permanent } = req.body;
  if (!ip) return res.status(400).json({ error: "ip required" });
  ipRep.banIP(ip, reason || "Manual ban", permanent === true);
  res.json({ ok: true, message: `${ip} banned` });
});

// DELETE /api/ban/:ip - unban an IP
router.delete("/ban/:ip", (req, res) => {
  ipRep.unbanIP(req.params.ip);
  res.json({ ok: true, message: `${req.params.ip} unbanned` });
});

// POST /api/allowlist - add IP to allowlist
router.post("/allowlist", (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: "ip required" });
  ipRep.allowIP(ip);
  res.json({ ok: true, message: `${ip} added to allowlist` });
});

// GET /api/ip/:ip - IP reputation lookup
router.get("/ip/:ip", (req, res) => {
  res.json(ipRep.getReputation(req.params.ip));
});

// POST /api/clear - reset all stats (for testing)
router.post("/clear", (req, res) => {
  clearStats();
  res.json({ ok: true, message: "Stats cleared" });
});

// GET /api/logs - tail the audit log file
router.get("/logs", (req, res) => {
  const logFile = path.join(__dirname, "../../logs/waf-audit.log");
  try {
    if (!fs.existsSync(logFile)) return res.json([]);
    const content = fs.readFileSync(logFile, "utf8");
    const lines = content.trim().split("\n").filter(Boolean);
    const parsed = lines
      .slice(-200)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    res.json(parsed.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/simulate - fire a test attack (for demo)
router.post("/simulate", async (req, res) => {
  const { type = "sqli", url, payload } = req.body || {};
  const base =
    process.env.WAF_SIM_TARGET ||
    `http://127.0.0.1:${process.env.PORT || 4000}`;
  const customPayload = typeof payload === "string" ? payload : "";

  const scenario =
    type === "custom"
      ? {
          url:
            typeof url === "string" && url.trim()
              ? url.startsWith("/")
                ? url
                : `/${url}`
              : "/test",
          params: customPayload ? { payload: customPayload } : undefined,
          payload: customPayload,
        }
      : ATTACK_SCENARIOS[type] || ATTACK_SCENARIOS.sqli;

  try {
    const simRes = await axios({
      method: "get",
      url: `${base}${scenario.url}`,
      params: scenario.params,
      headers: scenario.headers,
      timeout: 8000,
      validateStatus: () => true,
    });

    res.json({
      ok: true,
      type,
      status: simRes.status,
      blocked: simRes.status === 403,
      url: scenario.url,
      payload: scenario.payload,
      message: `Simulated ${type} via backend runner`,
    });
  } catch (err) {
    res.status(502).json({
      ok: false,
      type,
      blocked: false,
      status: "ERR",
      url: scenario.url,
      payload: scenario.payload,
      error: err.message || "Simulation failed",
    });
  }
});

// GET /api/health - health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mode: process.env.WAF_MODE || "block",
    target: process.env.TARGET_URL || "none",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

// ── Webhook routes ────────────────────────────────────────────────────────────
const webhooks = require("../utils/webhooks");

router.get("/webhooks", (req, res) => res.json(webhooks.listWebhooks()));

router.post("/webhooks", (req, res) => {
  const { name, url, type, minSeverity } = req.body;
  if (!name || !url)
    return res.status(400).json({ error: "name and url required" });
  const wh = webhooks.addWebhook({
    name,
    url,
    type: type || "custom",
    minSeverity: minSeverity || "high",
  });
  res.json(wh);
});

router.patch("/webhooks/:id/toggle", (req, res) => {
  const wh = webhooks.toggleWebhook(req.params.id);
  if (!wh) return res.status(404).json({ error: "not found" });
  res.json(wh);
});

router.delete("/webhooks/:id", (req, res) => {
  webhooks.removeWebhook(req.params.id);
  res.json({ ok: true });
});

router.post("/webhooks/test/:id", async (req, res) => {
  const list = webhooks.listWebhooks();
  const wh = list.find((w) => w.id === req.params.id);
  if (!wh) return res.status(404).json({ error: "not found" });
  const testEvent = {
    blocked: true,
    severity: "high",
    ruleName: "Test Alert",
    category: "test",
    ip: "1.2.3.4",
    country: "XX",
    url: "/test",
    reason: "WAF test alert",
    timestamp: new Date().toISOString(),
  };
  try {
    await webhooks.dispatchAlerts(testEvent);
    res.json({ ok: true, message: "Test alert sent" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Suspicious IPs ────────────────────────────────────────────────────────────
const ipRep2 = require("../utils/ipReputation");
router.get("/suspicious", (req, res) => res.json(ipRep2.getAllSuspicious()));

// ── Allowlist ─────────────────────────────────────────────────────────────────
router.post("/allowlist", (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: "ip required" });
  ipRep2.allowIP(ip);
  res.json({ ok: true });
});
