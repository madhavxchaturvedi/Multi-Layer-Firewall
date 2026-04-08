// utils/ipReputation.js
// IP reputation tracking, geo-lookup, and ban management

const geoip = require('geoip-lite')

// In-memory stores (use Redis in production)
const bannedIPs = new Map()       // ip -> { reason, bannedAt, permanent }
const suspiciousIPs = new Map()   // ip -> { score, hits, lastSeen }
const allowlist = new Set()       // trusted IPs always pass

// Threat score thresholds
const SCORE_WARN = 30
const SCORE_BAN = 80

// Known malicious IP ranges (sample - in prod use a threat feed)
const KNOWN_BAD_RANGES = [
  /^0\./,            // Invalid
  /^169\.254\./,     // Link-local
]

/**
 * Look up geo info for an IP
 */
function getGeoInfo(ip) {
  const geo = geoip.lookup(ip)
  return {
    country: geo?.country || 'XX',
    city: geo?.city || 'Unknown',
    region: geo?.region || '',
    ll: geo?.ll || [0, 0],
    timezone: geo?.timezone || 'UTC'
  }
}

/**
 * Check if IP is in a blocked country
 */
function isGeoBlocked(ip, blockedCountries = []) {
  if (!blockedCountries.length) return false
  const geo = getGeoInfo(ip)
  return blockedCountries.includes(geo.country)
}

/**
 * Check if IP is banned
 */
function isBanned(ip) {
  if (allowlist.has(ip)) return false
  const ban = bannedIPs.get(ip)
  if (!ban) return false
  if (ban.permanent) return true
  // Auto-expire bans after 24h
  if (Date.now() - ban.bannedAt > 24 * 60 * 60 * 1000) {
    bannedIPs.delete(ip)
    return false
  }
  return true
}

/**
 * Ban an IP address
 */
function banIP(ip, reason = 'Policy violation', permanent = false) {
  bannedIPs.set(ip, { reason, bannedAt: Date.now(), permanent })
}

/**
 * Unban an IP
 */
function unbanIP(ip) {
  bannedIPs.delete(ip)
  suspiciousIPs.delete(ip)
}

/**
 * Add threat score to IP (accumulates from detections)
 */
function addThreatScore(ip, points, reason) {
  const existing = suspiciousIPs.get(ip) || { score: 0, hits: [], lastSeen: null }
  existing.score += points
  existing.hits.push({ reason, ts: Date.now(), points })
  existing.lastSeen = Date.now()

  // Keep only last 20 hits
  if (existing.hits.length > 20) existing.hits = existing.hits.slice(-20)

  suspiciousIPs.set(ip, existing)

  // Auto-ban if score exceeds threshold
  if (existing.score >= SCORE_BAN) {
    banIP(ip, `Auto-banned: score ${existing.score} (${reason})`)
    return 'banned'
  }

  return existing.score >= SCORE_WARN ? 'suspicious' : 'ok'
}

/**
 * Get reputation summary for an IP
 */
function getReputation(ip) {
  return {
    banned: isBanned(ip),
    banInfo: bannedIPs.get(ip) || null,
    suspicious: suspiciousIPs.get(ip) || null,
    geo: getGeoInfo(ip),
    inAllowlist: allowlist.has(ip)
  }
}

/**
 * Get all banned IPs (for dashboard)
 */
function getAllBanned() {
  const result = []
  for (const [ip, info] of bannedIPs.entries()) {
    result.push({ ip, ...info, geo: getGeoInfo(ip) })
  }
  return result
}

/**
 * Get all suspicious IPs (for dashboard)
 */
function getAllSuspicious() {
  const result = []
  for (const [ip, info] of suspiciousIPs.entries()) {
    if (!bannedIPs.has(ip)) {
      result.push({ ip, ...info, geo: getGeoInfo(ip) })
    }
  }
  return result
}

/**
 * Add IP to allowlist
 */
function allowIP(ip) {
  allowlist.add(ip)
  bannedIPs.delete(ip)
}

module.exports = {
  getGeoInfo,
  isGeoBlocked,
  isBanned,
  banIP,
  unbanIP,
  addThreatScore,
  getReputation,
  getAllBanned,
  getAllSuspicious,
  allowIP
}
