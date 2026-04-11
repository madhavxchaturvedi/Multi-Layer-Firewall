// lib/demoData.js
// Realistic fake WAF events for demo/portfolio presentations
// Activated via the "Demo Mode" button in Sidebar — no backend needed

const COUNTRIES = [
  { cc: 'RU', ll: [55.75, 37.62] },
  { cc: 'CN', ll: [39.91, 116.39] },
  { cc: 'KP', ll: [39.03, 125.75] },
  { cc: 'IR', ll: [35.69, 51.39] },
  { cc: 'BR', ll: [-23.55, -46.64] },
  { cc: 'IN', ll: [28.61, 77.21] },
  { cc: 'US', ll: [37.77, -122.42] },
  { cc: 'DE', ll: [52.52, 13.40] },
  { cc: 'NG', ll: [6.45, 3.39] },
  { cc: 'PK', ll: [33.69, 73.05] },
]

const ATTACKS = [
  { category: 'sqli',           severity: 'critical', ruleId: 'SQLi-001', ruleName: 'SQL Injection - Classic',    url: '/api/login',       payload: "' OR 1=1 --",                        reason: "Classic SQL injection in query param" },
  { category: 'sqli',           severity: 'critical', ruleId: 'SQLi-002', ruleName: 'SQL Injection - Blind',      url: '/api/user?id=1',   payload: "1; SELECT SLEEP(5)--",               reason: "Time-based blind SQL injection" },
  { category: 'xss',            severity: 'high',     ruleId: 'XSS-001',  ruleName: 'XSS - Script Tag',           url: '/search',          payload: "<script>alert('xss')</script>",       reason: "Script tag injection in search param" },
  { category: 'xss',            severity: 'high',     ruleId: 'XSS-002',  ruleName: 'XSS - Event Handler',        url: '/comment',         payload: '<img onerror="alert(1)" src=x>',     reason: "Event handler XSS in comment field" },
  { category: 'path_traversal', severity: 'high',     ruleId: 'PT-001',   ruleName: 'Path Traversal',             url: '/file',            payload: "../../etc/passwd",                    reason: "Directory traversal in file param" },
  { category: 'path_traversal', severity: 'critical', ruleId: 'PT-002',   ruleName: 'Path Traversal - Sensitive', url: '/download',        payload: "/etc/shadow",                        reason: "Sensitive file access attempt" },
  { category: 'cmdi',           severity: 'critical', ruleId: 'CMDi-001', ruleName: 'Command Injection',          url: '/exec',            payload: "; cat /etc/passwd",                  reason: "Shell command injection via semicolon" },
  { category: 'ssrf',           severity: 'critical', ruleId: 'SSRF-001', ruleName: 'SSRF - Cloud Metadata',      url: '/fetch',           payload: "http://169.254.169.254/latest",       reason: "SSRF targeting cloud metadata endpoint" },
  { category: 'honeypot',       severity: 'critical', ruleId: 'HON-001',  ruleName: 'Honeypot Triggered',         url: '/wp-admin',        payload: "/wp-admin",                          reason: "Honeypot path accessed — IP permanently banned" },
  { category: 'honeypot',       severity: 'critical', ruleId: 'HON-002',  ruleName: 'Honeypot Triggered',         url: '/.env',            payload: "/.env",                              reason: "Environment file probe — IP permanently banned" },
  { category: 'scanner',        severity: 'medium',   ruleId: 'SCAN-001', ruleName: 'Scanner Detected',           url: '/robots.txt',      payload: "sqlmap/1.7.8",                       reason: "Known scanner user-agent detected" },
  { category: 'xxe',            severity: 'critical', ruleId: 'XXE-001',  ruleName: 'XXE Injection',              url: '/xml',             payload: '<!ENTITY x SYSTEM "file:///etc">',   reason: "XML external entity injection" },
  { category: 'rate_limit',     severity: 'medium',   ruleId: 'RL-001',   ruleName: 'Rate Limit',                 url: '/api/auth',        payload: null,                                 reason: "Rate limit exceeded: 60+ req/min" },
  { category: 'geo_block',      severity: 'medium',   ruleId: 'GEO-001',  ruleName: 'Geo Block',                  url: '/',                payload: null,                                 reason: "Request from blocked country: KP" },
]

let _id = 9000

function makeEvent(overrides = {}) {
  const attack  = ATTACKS[Math.floor(Math.random() * ATTACKS.length)]
  const geo     = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)]
  const ipSuffix = `${Math.floor(Math.random()*200)+1}`
  const prefixes = ['91.108', '114.114', '5.160', '45.33', '177.54', '103.21', '88.255', '197.211']
  const prefix  = prefixes[Math.floor(Math.random() * prefixes.length)]

  return {
    id:          `demo-${++_id}`,
    requestId:   `demo-${_id}`,
    timestamp:   new Date(Date.now() - Math.random() * 3600000).toISOString(),
    ip:          `${prefix}.${ipSuffix}`,
    method:      ['GET','POST','PUT'][Math.floor(Math.random()*3)],
    blocked:     true,
    country:     geo.cc,
    ll:          geo.ll,
    city:        '',
    userAgent:   'Mozilla/5.0 (compatible; attacker/1.0)',
    ...attack,
    ...overrides,
  }
}

export function generateDemoEvents(count = 60) {
  const events = []
  // Mix of blocked and allowed
  for (let i = 0; i < count; i++) {
    if (i % 5 === 0) {
      // Allowed request
      events.push({
        id: `demo-${++_id}`,
        requestId: `demo-${_id}`,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        ip: `10.0.0.${Math.floor(Math.random()*200)+1}`,
        method: 'GET',
        url: ['/api/products', '/dashboard', '/profile', '/home'][Math.floor(Math.random()*4)],
        blocked: false,
        country: 'US',
        ll: [37.77, -122.42],
        city: 'San Francisco',
        category: null,
        severity: null,
        ruleId: null,
        ruleName: null,
        reason: 'Allowed',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      })
    } else {
      events.push(makeEvent())
    }
  }
  return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

export function generateDemoStats(events) {
  const blocked  = events.filter(e => e.blocked)
  const catMap   = {}
  const countryMap = {}
  const hourMap  = Array(24).fill(0)

  blocked.forEach(e => {
    if (e.category) catMap[e.category] = (catMap[e.category] || 0) + 1
    if (e.country && e.country !== 'XX') countryMap[e.country] = (countryMap[e.country] || 0) + 1
    const h = new Date(e.timestamp).getHours()
    hourMap[h]++
  })

  return {
    totalRequests:     events.length,
    totalBlocked:      blocked.length,
    totalAllowed:      events.length - blocked.length,
    blockRate:         ((blocked.length / events.length) * 100).toFixed(1),
    attacksByCategory: catMap,
    attacksByCountry:  countryMap,
    attacksByHour:     hourMap,
    topAttackerIPs:    [],
    topAttackingCountries: Object.entries(countryMap).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([country,count])=>({country,count})),
  }
}
