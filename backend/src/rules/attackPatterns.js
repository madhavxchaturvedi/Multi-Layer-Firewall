// rules/attackPatterns.js
// OWASP-based detection patterns for the WAF rule engine

const RULES = [
  // ─── SQL Injection ───────────────────────────────────────────────────────
  {
    id: 'SQLi-001',
    name: 'SQL Injection - Classic',
    category: 'sqli',
    severity: 'critical',
    pattern: /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(from|into|where|table)\b)|('?\s*(or|and)\s*'?\d+'?\s*=\s*'?\d+'?)/gi,
    targets: ['body', 'query', 'headers'],
    description: 'Classic SQL injection patterns including UNION, SELECT, OR 1=1'
  },
  {
    id: 'SQLi-002',
    name: 'SQL Injection - Blind',
    category: 'sqli',
    severity: 'critical',
    pattern: /(sleep\s*\(\s*\d+\s*\)|benchmark\s*\(|waitfor\s+delay|pg_sleep)/gi,
    targets: ['body', 'query'],
    description: 'Blind SQL injection via time-based delays'
  },
  {
    id: 'SQLi-003',
    name: 'SQL Injection - Comment Evasion',
    category: 'sqli',
    severity: 'high',
    pattern: /(\/\*.*?\*\/|--\s*$|#\s*$|;\s*--)/gm,
    targets: ['body', 'query'],
    description: 'SQL comment sequences used to truncate queries'
  },

  // ─── Cross-Site Scripting (XSS) ──────────────────────────────────────────
  {
    id: 'XSS-001',
    name: 'XSS - Script Tag',
    category: 'xss',
    severity: 'high',
    pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    targets: ['body', 'query'],
    description: 'Script tag injection'
  },
  {
    id: 'XSS-002',
    name: 'XSS - Event Handler',
    category: 'xss',
    severity: 'high',
    pattern: /\bon\w+\s*=\s*["']?[^"'>]*(alert|eval|document|window|fetch|XMLHttpRequest)/gi,
    targets: ['body', 'query'],
    description: 'Inline event handler with dangerous functions'
  },
  {
    id: 'XSS-003',
    name: 'XSS - JavaScript URI',
    category: 'xss',
    severity: 'high',
    pattern: /javascript\s*:/gi,
    targets: ['body', 'query', 'headers'],
    description: 'javascript: URI scheme injection'
  },
  {
    id: 'XSS-004',
    name: 'XSS - DOM Manipulation',
    category: 'xss',
    severity: 'medium',
    pattern: /(eval\s*\(|document\.write\s*\(|innerHTML\s*=|outerHTML\s*=)/gi,
    targets: ['body', 'query'],
    description: 'Dangerous DOM manipulation functions'
  },

  // ─── Path Traversal ───────────────────────────────────────────────────────
  {
    id: 'PT-001',
    name: 'Path Traversal - Directory',
    category: 'path_traversal',
    severity: 'high',
    pattern: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f)/gi,
    targets: ['url', 'query', 'body'],
    description: 'Directory traversal sequences'
  },
  {
    id: 'PT-002',
    name: 'Path Traversal - Sensitive Files',
    category: 'path_traversal',
    severity: 'critical',
    pattern: /(\/etc\/passwd|\/etc\/shadow|\/proc\/self|win\.ini|boot\.ini|system32)/gi,
    targets: ['url', 'query', 'body'],
    description: 'Attempts to access sensitive system files'
  },

  // ─── Command Injection ───────────────────────────────────────────────────
  {
    id: 'CMDi-001',
    name: 'Command Injection',
    category: 'cmdi',
    severity: 'critical',
    pattern: /([;&|`$]|\|\||\&\&)\s*(ls|cat|pwd|whoami|id|curl|wget|bash|sh|python|perl|ruby|nc|ncat|netcat)/gi,
    targets: ['body', 'query'],
    description: 'OS command injection via shell metacharacters'
  },
  {
    id: 'CMDi-002',
    name: 'Command Injection - Encoded',
    category: 'cmdi',
    severity: 'high',
    pattern: /(%3B|%7C|%26|%60)\s*(%6C%73|%63%61%74|%77%68%6F%61%6D%69)/gi,
    targets: ['body', 'query', 'url'],
    description: 'URL-encoded command injection'
  },

  // ─── SSRF ────────────────────────────────────────────────────────────────
  {
    id: 'SSRF-001',
    name: 'SSRF - Internal Network',
    category: 'ssrf',
    severity: 'critical',
    pattern: /(https?:\/\/(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|localhost|169\.254\.))/gi,
    targets: ['body', 'query'],
    description: 'Server-side request forgery targeting internal network'
  },
  {
    id: 'SSRF-002',
    name: 'SSRF - Cloud Metadata',
    category: 'ssrf',
    severity: 'critical',
    pattern: /(169\.254\.169\.254|metadata\.google\.internal|instance-data)/gi,
    targets: ['body', 'query'],
    description: 'Attempt to reach cloud provider metadata endpoints'
  },

  // ─── XXE ─────────────────────────────────────────────────────────────────
  {
    id: 'XXE-001',
    name: 'XXE Injection',
    category: 'xxe',
    severity: 'critical',
    pattern: /<!ENTITY\s+\w+\s+(SYSTEM|PUBLIC)\s+["'][^"']*["']/gi,
    targets: ['body'],
    description: 'XML External Entity injection'
  },

  // ─── Scanner Detection ───────────────────────────────────────────────────
  {
    id: 'SCAN-001',
    name: 'Scanner - User Agent',
    category: 'scanner',
    severity: 'medium',
    pattern: /(sqlmap|nikto|nmap|masscan|zgrab|nuclei|dirbuster|gobuster|burpsuite|acunetix|nessus|openvas)/gi,
    targets: ['headers'],
    description: 'Known security scanner user-agent detected'
  },

  // ─── Suspicious Headers ──────────────────────────────────────────────────
  {
    id: 'HDR-001',
    name: 'Host Header Injection',
    category: 'header_injection',
    severity: 'medium',
    pattern: /[\r\n]/,
    targets: ['headers'],
    headerKey: 'host',
    description: 'CRLF injection in Host header'
  }
]

/**
 * Inspect a request object and return all matched rules
 * @param {object} req - Express request
 * @returns {Array} matched rules with details
 */
function inspect(req) {
  const matches = []

  const targets = {
    url: req.originalUrl || req.url || '',
    query: JSON.stringify(req.query || {}),
    body: typeof req.body === 'object' ? JSON.stringify(req.body) : (req.body || ''),
    headers: JSON.stringify(req.headers || {})
  }

  for (const rule of RULES) {
    for (const target of rule.targets) {
      const payload = targets[target] || ''

      // Special header key matching
      if (target === 'headers' && rule.headerKey) {
        const val = req.headers[rule.headerKey] || ''
        if (rule.pattern.test(val)) {
          matches.push({ rule, matchedIn: `header:${rule.headerKey}`, payload: val.slice(0, 200) })
        }
        rule.pattern.lastIndex = 0
        continue
      }

      if (rule.pattern.test(payload)) {
        matches.push({ rule, matchedIn: target, payload: payload.slice(0, 200) })
        rule.pattern.lastIndex = 0
        break
      }
      rule.pattern.lastIndex = 0
    }
  }

  return matches
}

module.exports = { RULES, inspect }
