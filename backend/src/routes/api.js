// routes/api.js
// REST API endpoints consumed by the React dashboard

const router = require('express').Router()
const { getEvents, getStats, clearStats } = require('../utils/eventStore')
const ipRep = require('../utils/ipReputation')
const { RULES } = require('../rules/attackPatterns')
const fs = require('fs')
const path = require('path')

// GET /api/stats - dashboard statistics
router.get('/stats', (req, res) => {
  res.json(getStats())
})

// GET /api/events - recent WAF events
router.get('/events', (req, res) => {
  const limit = parseInt(req.query.limit) || 100
  const category = req.query.category
  let evts = getEvents(limit)
  if (category) evts = evts.filter(e => e.category === category)
  res.json(evts)
})

// GET /api/rules - all loaded detection rules
router.get('/rules', (req, res) => {
  res.json(RULES.map(r => ({
    id: r.id,
    name: r.name,
    category: r.category,
    severity: r.severity,
    description: r.description,
    targets: r.targets
  })))
})

// GET /api/banned - list of banned IPs
router.get('/banned', (req, res) => {
  res.json(ipRep.getAllBanned())
})

// GET /api/suspicious - list of suspicious IPs
router.get('/suspicious', (req, res) => {
  res.json(ipRep.getAllSuspicious())
})

// POST /api/ban - manually ban an IP
router.post('/ban', (req, res) => {
  const { ip, reason, permanent } = req.body
  if (!ip) return res.status(400).json({ error: 'ip required' })
  ipRep.banIP(ip, reason || 'Manual ban', permanent === true)
  res.json({ ok: true, message: `${ip} banned` })
})

// DELETE /api/ban/:ip - unban an IP
router.delete('/ban/:ip', (req, res) => {
  ipRep.unbanIP(req.params.ip)
  res.json({ ok: true, message: `${req.params.ip} unbanned` })
})

// POST /api/allowlist - add IP to allowlist
router.post('/allowlist', (req, res) => {
  const { ip } = req.body
  if (!ip) return res.status(400).json({ error: 'ip required' })
  ipRep.allowIP(ip)
  res.json({ ok: true, message: `${ip} added to allowlist` })
})

// GET /api/ip/:ip - IP reputation lookup
router.get('/ip/:ip', (req, res) => {
  res.json(ipRep.getReputation(req.params.ip))
})

// POST /api/clear - reset all stats (for testing)
router.post('/clear', (req, res) => {
  clearStats()
  res.json({ ok: true, message: 'Stats cleared' })
})

// GET /api/logs - tail the audit log file
router.get('/logs', (req, res) => {
  const logFile = path.join(__dirname, '../../logs/waf-audit.log')
  try {
    if (!fs.existsSync(logFile)) return res.json([])
    const content = fs.readFileSync(logFile, 'utf8')
    const lines = content.trim().split('\n').filter(Boolean)
    const parsed = lines.slice(-200).map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
    res.json(parsed.reverse())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/simulate - fire a test attack (for demo)
router.post('/simulate', async (req, res) => {
  const { type } = req.body
  const payloads = {
    sqli: "' OR 1=1 -- ",
    xss: "<script>alert('xss')</script>",
    path: "../../etc/passwd",
    cmdi: "; cat /etc/passwd",
    ssrf: "http://169.254.169.254/latest/meta-data",
    scanner: "sqlmap/1.7"
  }
  const chosen = payloads[type] || payloads.sqli
  res.json({ ok: true, payload: chosen, message: `Simulated ${type || 'sqli'} attack — check the live feed` })
})

// GET /api/health - health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: process.env.WAF_MODE || 'block',
    target: process.env.TARGET_URL || 'none',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

module.exports = router
