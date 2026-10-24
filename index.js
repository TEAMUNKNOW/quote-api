require('dotenv').config({ path: './.env' })

const { start } = require('./app')

start().catch((error) => {
  console.error('Failed to start quote API:', error)
  process.exitCode = 1
})
