// utils/eventStore.js
// Keeps recent WAF events in memory for the real-time dashboard

const MAX_EVENTS = 500

let events = []
let stats = {
  totalRequests: 0,
  totalBlocked: 0,
  totalAllowed: 0,
  attacksByCategory: {},
  attacksByCountry: {},
  attacksByHour: Array(24).fill(0),
  topAttackerIPs: {},
  recentAttacks: []
}

function recordEvent(event) {
  const enriched = { ...event, id: Date.now() + Math.random().toString(36).slice(2) }
  events.unshift(enriched)
  if (events.length > MAX_EVENTS) events = events.slice(0, MAX_EVENTS)

  // Update stats
  stats.totalRequests++
  if (event.blocked) {
    stats.totalBlocked++
    const hour = new Date().getHours()
    stats.attacksByHour[hour]++

    if (event.category) {
      stats.attacksByCategory[event.category] = (stats.attacksByCategory[event.category] || 0) + 1
    }

    if (event.country && event.country !== 'XX') {
      stats.attacksByCountry[event.country] = (stats.attacksByCountry[event.country] || 0) + 1
    }

    if (event.ip) {
      stats.topAttackerIPs[event.ip] = (stats.topAttackerIPs[event.ip] || 0) + 1
    }

    stats.recentAttacks.unshift(enriched)
    if (stats.recentAttacks.length > 50) stats.recentAttacks = stats.recentAttacks.slice(0, 50)
  } else {
    stats.totalAllowed++
  }

  return enriched
}

function getEvents(limit = 100) {
  return events.slice(0, limit)
}

function getStats() {
  const topIPs = Object.entries(stats.topAttackerIPs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }))

  const topCountries = Object.entries(stats.attacksByCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, count]) => ({ country, count }))

  return {
    ...stats,
    topAttackerIPs: topIPs,
    topAttackingCountries: topCountries,
    blockRate: stats.totalRequests > 0
      ? ((stats.totalBlocked / stats.totalRequests) * 100).toFixed(1)
      : '0.0'
  }
}

function clearStats() {
  events = []
  stats = {
    totalRequests: 0,
    totalBlocked: 0,
    totalAllowed: 0,
    attacksByCategory: {},
    attacksByCountry: {},
    attacksByHour: Array(24).fill(0),
    topAttackerIPs: {},
    recentAttacks: []
  }
}

module.exports = { recordEvent, getEvents, getStats, clearStats }
