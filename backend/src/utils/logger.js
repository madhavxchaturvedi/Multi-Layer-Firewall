// utils/logger.js
const winston = require('winston')
const path = require('path')
const fs = require('fs')

const logsDir = path.join(__dirname, '../../logs')
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'waf-audit.log'), maxsize: 10485760, maxFiles: 5 }),
    new winston.transports.File({ filename: path.join(logsDir, 'waf-error.log'), level: 'error' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''
          return `${timestamp} [${level}] ${message}${metaStr}`
        })
      )
    })
  ]
})

module.exports = logger
