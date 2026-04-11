// middleware/wafEngine.js
// Core WAF middleware — runs every request through all 5 layers

const { RateLimiterMemory } = require('rate-limiter-flexible')
const { v4: uuidv4 } = require('uuid')
const { inspect } = require('../rules/attackPatterns')
const ipRep = require('../utils/ipReputation')
const { recordEvent } = require('../utils/eventStore')
const logger = require('../utils/logger')
const { dispatchAlerts } = require('../utils/webhooks')

// Rate limiter: 60 requests/min per IP (configurable via env)
const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_POINTS) || 60,
  duration: parseInt(process.env.RATE_LIMIT_DURATION) || 60
})

// Honeypot paths — any request here = instant ban
const HONEYPOT_PATHS = (process.env.HONEYPOT_PATHS || '/admin-secret,/wp-admin,/.env,/config.php,/backup.sql')
  .split(',')
  .map(p => p.trim())

// Blocked countries list
const GEO_BLOCK = (process.env.GEO_BLOCK_COUNTRIES || '')
  .split(',')
  .map(c => c.trim().toUpperCase())
  .filter(Boolean)

// WAF mode: 'block' (default) or 'detect' (log only, don't block)
const WAF_MODE = process.env.WAF_MODE || 'block'

// Emit socket event helper (injected by server)
let _emitFn = null
function setEmitter(fn) { _emitFn = fn }
function emit(event, data) { if (_emitFn) _emitFn(event, data) }

/**
 * Build a standardised WAF event object
 */
function buildEvent({ req, blocked, reason, category, severity, ruleId, ruleName, matchedIn, payload }) {
  const ip = req.ip || req.socket?.remoteAddress || '0.0.0.0'
  const geo = ipRep.getGeoInfo(ip)
  return {
    requestId: req.wafId,
    timestamp: new Date().toISOString(),
    ip,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.headers['user-agent'] || '',
    blocked,
    reason,
    category: category || null,
    severity: severity || null,
    ruleId: ruleId || null,
    ruleName: ruleName || null,
    matchedIn: matchedIn || null,
    payload: payload || null,
    country: geo.country,
    city: geo.city,
    ll: geo.ll
  }
}

/**
 * Block a request and record the event
 */
function block(res, event) {
  const stored = recordEvent(event)
  emit('waf:event', stored)
  logger.warn('BLOCKED', { ...event })
  dispatchAlerts(stored).catch(() => {})

  if (WAF_MODE === 'detect') {
    return false // Don't actually block in detect mode
  }

  res.status(403).json({
    error: 'Forbidden',
    requestId: event.requestId,
    reason: event.reason,
    message: 'This request was blocked by the WAF.'
  })
  return true
}

/**
 * Main WAF middleware factory
 */
function wafMiddleware(req, res, next) {
  req.wafId = uuidv4()
  const ip = req.ip || req.socket?.remoteAddress || '0.0.0.0'

  // ── LAYER 1: IP Ban check ──────────────────────────────────────────────
  if (ipRep.isBanned(ip)) {
    const banInfo = ipRep.getAllBanned().find(b => b.ip === ip)
    const blocked = block(res, buildEvent({
      req, blocked: true,
      reason: `IP banned: ${banInfo?.reason || 'policy'}`,
      category: 'ip_ban', severity: 'critical'
    }))
    if (blocked) return
  }

  // ── LAYER 2: Geo-block ──────────────────────────────────────────────────
  if (GEO_BLOCK.length && ipRep.isGeoBlocked(ip, GEO_BLOCK)) {
    const geo = ipRep.getGeoInfo(ip)
    const blocked = block(res, buildEvent({
      req, blocked: true,
      reason: `Geo-blocked country: ${geo.country}`,
      category: 'geo_block', severity: 'medium'
    }))
    if (blocked) return
  }

  // ── LAYER 3: Rate limiting ───────────────────────────────────────────────
  rateLimiter.consume(ip)
    .then(() => runLayer4(req, res, next, ip))
    .catch(() => {
      ipRep.addThreatScore(ip, 10, 'Rate limit exceeded')
      const blocked = block(res, buildEvent({
        req, blocked: true,
        reason: 'Rate limit exceeded',
        category: 'rate_limit', severity: 'medium'
      }))
      if (!blocked) runLayer4(req, res, next, ip)
    })
}

function runLayer4(req, res, next, ip) {
  // ── LAYER 4: Honeypot ────────────────────────────────────────────────────
  const urlPath = req.path.toLowerCase()
  if (HONEYPOT_PATHS.some(hp => urlPath === hp || urlPath.startsWith(hp))) {
    ipRep.banIP(ip, 'Honeypot triggered', true)
    ipRep.addThreatScore(ip, 100, 'Honeypot triggered')
    const blocked = block(res, buildEvent({
      req, blocked: true,
      reason: `Honeypot path accessed: ${req.path}`,
      category: 'honeypot', severity: 'critical'
    }))
    if (blocked) return
  }

  // ── LAYER 5: Rule engine (attack pattern matching) ──────────────────────
  const matches = inspect(req)
  if (matches.length > 0) {
    const top = matches[0] // Use highest-severity match
    const scoreMap = { critical: 40, high: 25, medium: 15, low: 5 }
    ipRep.addThreatScore(ip, scoreMap[top.rule.severity] || 10, top.rule.name)

    const blocked = block(res, buildEvent({
      req, blocked: true,
      reason: `${top.rule.name}: ${top.rule.description}`,
      category: top.rule.category,
      severity: top.rule.severity,
      ruleId: top.rule.id,
      ruleName: top.rule.name,
      matchedIn: top.matchedIn,
      payload: top.payload
    }))
    if (blocked) return
  }

  // ── PASS: Record allowed request ─────────────────────────────────────────
  const event = buildEvent({ req, blocked: false, reason: 'Allowed' })
  const stored = recordEvent(event)
  emit('waf:event', stored)

  next()
}

module.exports = { wafMiddleware, setEmitter }
