// lib/utils.js
import { clsx } from 'clsx'

export function cn(...args) { return clsx(...args) }

export const SEVERITY_COLOR = {
  critical: 'text-accent-red border-accent-red/30 bg-accent-red/10',
  high: 'text-accent-orange border-accent-orange/30 bg-accent-orange/10',
  medium: 'text-accent-yellow border-accent-yellow/30 bg-accent-yellow/10',
  low: 'text-accent-green border-accent-green/30 bg-accent-green/10'
}

export const CATEGORY_LABEL = {
  sqli: 'SQL Injection',
  xss: 'XSS',
  path_traversal: 'Path Traversal',
  cmdi: 'Cmd Injection',
  ssrf: 'SSRF',
  xxe: 'XXE',
  scanner: 'Scanner',
  header_injection: 'Header Injection',
  rate_limit: 'Rate Limit',
  honeypot: 'Honeypot',
  geo_block: 'Geo Block',
  ip_ban: 'IP Ban'
}

export const CATEGORY_COLOR = {
  sqli: 'text-accent-red bg-accent-red/10',
  xss: 'text-accent-orange bg-accent-orange/10',
  path_traversal: 'text-accent-yellow bg-accent-yellow/10',
  cmdi: 'text-accent-purple bg-accent-purple/10',
  ssrf: 'text-accent-cyan bg-accent-cyan/10',
  xxe: 'text-pink-400 bg-pink-400/10',
  scanner: 'text-gray-400 bg-gray-400/10',
  header_injection: 'text-blue-400 bg-blue-400/10',
  rate_limit: 'text-accent-yellow bg-accent-yellow/10',
  honeypot: 'text-accent-red bg-accent-red/10',
  geo_block: 'text-sky-400 bg-sky-400/10',
  ip_ban: 'text-accent-red bg-accent-red/10'
}

export function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 5000) return 'just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
