// server.js
require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const { createProxyMiddleware } = require('http-proxy-middleware')

const { wafMiddleware, setEmitter } = require('./middleware/wafEngine')
const apiRouter = require('./routes/api')
const logger = require('./utils/logger')

const PORT = process.env.PORT || 4000
const TARGET_URL = process.env.TARGET_URL || null

// ── App Setup ────────────────────────────────────────────────────────────────
const app = express()
const server = http.createServer(app)

// ── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

// Wire the WAF emitter to Socket.io
setEmitter((event, data) => io.emit(event, data))

io.on('connection', (socket) => {
  logger.info(`Dashboard connected: ${socket.id}`)
  socket.on('disconnect', () => logger.info(`Dashboard disconnected: ${socket.id}`))
})

// ── Global Middleware ─────────────────────────────────────────────────────────
app.set('trust proxy', true)
app.use(cors({ origin: '*' }))
app.use(helmet({ contentSecurityPolicy: false }))
app.use(morgan('combined', { stream: { write: msg => logger.http(msg.trim()) } }))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// ── WAF Dashboard API (bypass WAF for these routes) ──────────────────────────
app.use('/api', apiRouter)

// ── WAF Middleware (applied to all proxied traffic) ───────────────────────────
app.use(wafMiddleware)

// ── Reverse Proxy to Target App ───────────────────────────────────────────────
if (TARGET_URL) {
  app.use('/', createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        logger.error('Proxy error', { err: err.message })
        res.status(502).json({ error: 'Bad Gateway', message: 'Target app unreachable.' })
      }
    }
  }))
  logger.info(`Proxying traffic to: ${TARGET_URL}`)
} else {
  // No target configured — echo mode for testing
  app.use('*', (req, res) => {
    res.json({
      message: 'WAF is running in standalone mode (no TARGET_URL set)',
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      wafId: req.wafId
    })
  })
  logger.info('WAF running in standalone/echo mode')
}

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  logger.info(`WAF listening on http://localhost:${PORT}`)
  logger.info(`Mode: ${process.env.WAF_MODE || 'block'} | Target: ${TARGET_URL || 'echo'}`)
})

module.exports = { app, server, io }
