// lib/pdfReport.js
// Generates a professional WAF security report PDF using browser print API
// No external library needed — uses styled HTML → window.print()

import { CATEGORY_LABEL } from './utils'

export function generatePDFReport(stats, events, rules) {
  const now     = new Date()
  const blocked = events.filter(e => e.blocked)
  const allowed = events.filter(e => !e.blocked)

  // Top categories
  const topCats = Object.entries(stats?.attacksByCategory || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Top countries
  const topCountries = Object.entries(stats?.attacksByCountry || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Top attacker IPs
  const ipMap = {}
  blocked.forEach(e => { if (e.ip) ipMap[e.ip] = (ipMap[e.ip] || 0) + 1 })
  const topIPs = Object.entries(ipMap).sort((a,b)=>b[1]-a[1]).slice(0,8)

  // Recent blocked events
  const recentBlocked = blocked.slice(0, 15)

  // Severity breakdown
  const sevCount = { critical: 0, high: 0, medium: 0, low: 0 }
  blocked.forEach(e => { if (e.severity) sevCount[e.severity] = (sevCount[e.severity] || 0) + 1 })

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>WAF Guard Security Report — ${now.toLocaleDateString()}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #fff; color: #111; font-size: 13px; line-height: 1.6; }

  .page { max-width: 800px; margin: 0 auto; padding: 48px 40px; }

  /* Header */
  .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; border-bottom: 2px solid #ff3b3b; margin-bottom: 32px; }
  .logo { display: flex; align-items: center; gap: 12px; }
  .logo-badge { width: 36px; height: 36px; background: #ff3b3b22; border: 1.5px solid #ff3b3b55; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 16px; color: #ff3b3b; }
  .logo-text { font-family: 'Space Grotesk'; font-size: 20px; font-weight: 700; color: #111; }
  .logo-sub  { font-family: 'JetBrains Mono'; font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.1em; }
  .meta { text-align: right; font-family: 'JetBrains Mono'; font-size: 10px; color: #888; }
  .meta strong { color: #111; font-size: 12px; display: block; margin-bottom: 2px; }

  /* Section */
  .section { margin-bottom: 32px; }
  .section-title { font-family: 'Space Grotesk'; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 16px; }

  /* Stat grid */
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .stat-card { background: #f8f8f8; border-radius: 10px; padding: 16px; text-align: center; border: 1px solid #eee; }
  .stat-val  { font-family: 'Space Grotesk'; font-size: 28px; font-weight: 700; }
  .stat-lab  { font-family: 'JetBrains Mono'; font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
  .red    { color: #ff3b3b; }
  .orange { color: #ff7b29; }
  .green  { color: #00a86b; }
  .blue   { color: #2563eb; }

  /* Severity pills */
  .sev-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
  .sev-pill { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 8px; }
  .sev-pill.critical { background: #fff0f0; border: 1px solid #ffc0c0; }
  .sev-pill.high     { background: #fff5f0; border: 1px solid #ffd0b0; }
  .sev-pill.medium   { background: #fffbf0; border: 1px solid #ffe8a0; }
  .sev-pill.low      { background: #f0fff8; border: 1px solid #a0e8c8; }
  .sev-label { font-family: 'JetBrains Mono'; font-size: 10px; font-weight: 600; text-transform: uppercase; }
  .sev-count { font-family: 'Space Grotesk'; font-size: 20px; font-weight: 700; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { font-family: 'JetBrains Mono'; font-size: 9px; text-transform: uppercase; letter-spacing: 0.07em; color: #888; text-align: left; padding: 6px 10px; background: #f5f5f5; border-bottom: 1px solid #e5e5e5; }
  td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; font-family: 'JetBrains Mono'; font-size: 11px; color: #333; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  .bar-wrap { background: #eee; border-radius: 99px; height: 6px; overflow: hidden; width: 120px; display: inline-block; vertical-align: middle; margin-left: 8px; }
  .bar-fill { background: #ff3b3b; height: 100%; border-radius: 99px; }

  /* Two cols */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  /* Badge */
  .badge { display: inline-block; font-family: 'JetBrains Mono'; font-size: 9px; font-weight: 600; text-transform: uppercase; padding: 2px 7px; border-radius: 4px; }
  .badge.critical { background: #ff3b3b22; color: #cc1111; }
  .badge.high     { background: #ff7b2922; color: #cc5500; }
  .badge.medium   { background: #f5c51822; color: #998800; }
  .badge.low      { background: #00d68f22; color: #006644; }

  /* Footer */
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-family: 'JetBrains Mono'; font-size: 9px; color: #aaa; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 32px 28px; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="logo">
      <div class="logo-badge">W</div>
      <div>
        <div class="logo-text">WAF Guard</div>
        <div class="logo-sub">Security Report</div>
      </div>
    </div>
    <div class="meta">
      <strong>${now.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</strong>
      Generated: ${now.toLocaleTimeString()}<br/>
      Period: Session data
    </div>
  </div>

  <!-- Executive summary -->
  <div class="section">
    <div class="section-title">Executive Summary</div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-val blue">${(stats?.totalRequests||0).toLocaleString()}</div><div class="stat-lab">Total Requests</div></div>
      <div class="stat-card"><div class="stat-val red">${(stats?.totalBlocked||0).toLocaleString()}</div><div class="stat-lab">Attacks Blocked</div></div>
      <div class="stat-card"><div class="stat-val green">${(stats?.totalAllowed||0).toLocaleString()}</div><div class="stat-lab">Requests Allowed</div></div>
      <div class="stat-card"><div class="stat-val orange">${stats?.blockRate||0}%</div><div class="stat-lab">Block Rate</div></div>
    </div>
  </div>

  <!-- Severity breakdown -->
  <div class="section">
    <div class="section-title">Attack Severity Breakdown</div>
    <div class="sev-grid">
      <div class="sev-pill critical"><span class="sev-label" style="color:#cc1111">Critical</span><span class="sev-count" style="color:#ff3b3b">${sevCount.critical}</span></div>
      <div class="sev-pill high"><span class="sev-label" style="color:#cc5500">High</span><span class="sev-count" style="color:#ff7b29">${sevCount.high}</span></div>
      <div class="sev-pill medium"><span class="sev-label" style="color:#998800">Medium</span><span class="sev-count" style="color:#d4a800">${sevCount.medium}</span></div>
      <div class="sev-pill low"><span class="sev-label" style="color:#006644">Low</span><span class="sev-count" style="color:#00a86b">${sevCount.low}</span></div>
    </div>
  </div>

  <!-- Two cols: categories + countries -->
  <div class="section two-col">
    <div>
      <div class="section-title">Top Attack Categories</div>
      <table>
        <thead><tr><th>Category</th><th>Hits</th><th>Chart</th></tr></thead>
        <tbody>
          ${topCats.map(([cat,n])=>`
          <tr>
            <td>${CATEGORY_LABEL[cat]||cat}</td>
            <td><strong>${n}</strong></td>
            <td><span class="bar-wrap"><span class="bar-fill" style="width:${Math.round((n/topCats[0][1])*100)}%"></span></span></td>
          </tr>`).join('') || '<tr><td colspan="3" style="color:#aaa">No data</td></tr>'}
        </tbody>
      </table>
    </div>
    <div>
      <div class="section-title">Top Attacking Countries</div>
      <table>
        <thead><tr><th>Country</th><th>Hits</th><th>Chart</th></tr></thead>
        <tbody>
          ${topCountries.map(([cc,n])=>`
          <tr>
            <td>${cc}</td>
            <td><strong>${n}</strong></td>
            <td><span class="bar-wrap"><span class="bar-fill" style="width:${Math.round((n/topCountries[0][1])*100)}%"></span></span></td>
          </tr>`).join('') || '<tr><td colspan="3" style="color:#aaa">No data</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Top attacker IPs -->
  <div class="section">
    <div class="section-title">Top Attacker IPs</div>
    <table>
      <thead><tr><th>#</th><th>IP Address</th><th>Attacks</th><th>Chart</th></tr></thead>
      <tbody>
        ${topIPs.map(([ip,n],i)=>`
        <tr>
          <td style="color:#aaa">${i+1}</td>
          <td>${ip}</td>
          <td><strong>${n}</strong></td>
          <td><span class="bar-wrap"><span class="bar-fill" style="width:${Math.round((n/topIPs[0][1])*100)}%"></span></span></td>
        </tr>`).join('') || '<tr><td colspan="4" style="color:#aaa">No data</td></tr>'}
      </tbody>
    </table>
  </div>

  <!-- Recent blocked events -->
  <div class="section">
    <div class="section-title">Recent Blocked Requests (last ${recentBlocked.length})</div>
    <table>
      <thead><tr><th>Timestamp</th><th>Severity</th><th>Category</th><th>IP</th><th>URL</th></tr></thead>
      <tbody>
        ${recentBlocked.map(e=>`
        <tr>
          <td>${new Date(e.timestamp).toLocaleTimeString()}</td>
          <td><span class="badge ${e.severity||'low'}">${(e.severity||'low').toUpperCase()}</span></td>
          <td>${CATEGORY_LABEL[e.category]||e.category||'—'}</td>
          <td>${e.ip||'—'}</td>
          <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.url||'—'}</td>
        </tr>`).join('') || '<tr><td colspan="5" style="color:#aaa">No blocked events</td></tr>'}
      </tbody>
    </table>
  </div>

  <!-- Active rules -->
  <div class="section">
    <div class="section-title">Active Detection Rules (${rules.length})</div>
    <table>
      <thead><tr><th>Rule ID</th><th>Name</th><th>Severity</th><th>Targets</th></tr></thead>
      <tbody>
        ${rules.slice(0,12).map(r=>`
        <tr>
          <td style="color:#888">${r.id}</td>
          <td>${r.name}</td>
          <td><span class="badge ${r.severity}">${r.severity?.toUpperCase()}</span></td>
          <td style="color:#888">${r.targets?.join(', ')||'—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>WAF Guard v2 — Advanced Web Application Firewall</span>
    <span>Generated ${now.toISOString()}</span>
  </div>

</div>
</body>
</html>`

  // Open in new window and trigger print
  const win = window.open('', '_blank', 'width=900,height=700')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 800)
}
