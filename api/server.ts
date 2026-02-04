/**
 * local server entry file, for local development 
 */
import { createServer } from 'http'
import { Server } from 'socket.io'
import app from './app.js'
import { initDb } from './db.js'
import { setupSocket } from './socket.js'

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Setup socket logic
setupSocket(io)

// Initialize Database then start server
initDb().then(() => {
  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server ready on port ${PORT}`)
  })
}).catch(err => {
  console.error('Failed to initialize database:', err)
  process.exit(1)
})

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received')
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export default app
