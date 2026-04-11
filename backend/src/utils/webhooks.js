// utils/webhooks.js
// Sends critical WAF alerts to Slack, Discord, or custom webhook URLs

const axios = require('axios')
const logger = require('./logger')

let webhooks = [] // { id, url, name, type, minSeverity, enabled }
const SEVERITY_RANK = { low: 0, medium: 1, high: 2, critical: 3 }

function addWebhook(config) {
  const webhook = { id: Date.now().toString(), enabled: true, minSeverity: 'high', ...config }
  webhooks.push(webhook)
  return webhook
}

function removeWebhook(id) { webhooks = webhooks.filter(w => w.id !== id) }
function toggleWebhook(id) {
  const w = webhooks.find(w => w.id === id)
  if (w) w.enabled = !w.enabled
  return w
}
function listWebhooks() { return webhooks }
function updateWebhook(id, updates) {
  const w = webhooks.find(w => w.id === id)
  if (w) Object.assign(w, updates)
  return w
}

function buildSlackPayload(event) {
  const sevEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }
  return {
    text: `${sevEmoji[event.severity] || '⚠️'} *WAF Alert* — ${event.ruleName || event.reason}`,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*${sevEmoji[event.severity] || '⚠️'} ${(event.severity || 'unknown').toUpperCase()} — WAF Attack Blocked*` }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Rule:*\n${event.ruleName || event.category || '—'}` },
          { type: 'mrkdwn', text: `*IP:*\n\`${event.ip}\` (${event.country || '?'})` },
          { type: 'mrkdwn', text: `*URL:*\n\`${event.url}\`` },
          { type: 'mrkdwn', text: `*Time:*\n${new Date(event.timestamp).toLocaleString()}` }
        ]
      }
    ]
  }
}

function buildDiscordPayload(event) {
  const sevColor = { critical: 0xff3b3b, high: 0xff7b29, medium: 0xf5c518, low: 0x00d68f }
  return {
    embeds: [{
      title: `🛡️ WAF Attack Blocked — ${(event.severity || 'unknown').toUpperCase()}`,
      color: sevColor[event.severity] || 0xff3b3b,
      fields: [
        { name: 'Rule', value: event.ruleName || event.category || '—', inline: true },
        { name: 'IP', value: `\`${event.ip}\` (${event.country || '?'})`, inline: true },
        { name: 'URL', value: `\`${event.url}\``, inline: false },
        { name: 'Reason', value: event.reason || '—', inline: false }
      ],
      timestamp: event.timestamp,
      footer: { text: 'WAF Guard' }
    }]
  }
}

async function dispatchAlerts(event) {
  if (!event.blocked) return
  const eventRank = SEVERITY_RANK[event.severity] || 0

  for (const wh of webhooks) {
    if (!wh.enabled) continue
    if (eventRank < (SEVERITY_RANK[wh.minSeverity] || 0)) continue

    try {
      let payload
      if (wh.type === 'slack') payload = buildSlackPayload(event)
      else if (wh.type === 'discord') payload = buildDiscordPayload(event)
      else payload = { event, source: 'waf-guard' }

      await axios.post(wh.url, payload, { timeout: 5000 })
      logger.info('Webhook dispatched', { webhook: wh.name, severity: event.severity })
    } catch (err) {
      logger.warn('Webhook failed', { webhook: wh.name, error: err.message })
    }
  }
}

module.exports = { addWebhook, removeWebhook, toggleWebhook, listWebhooks, updateWebhook, dispatchAlerts }
