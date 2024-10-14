import dotenv from 'dotenv'
import http from 'http'
import app from './src/app'
import socketService from './src/socket_io/socketService'
import initOnlinePlayerCleanup from './src/utils/initOnlinePlayerCleanup'

// Configuring dotenv
dotenv.config()

// Getting the PORT from environment variables
const PORT = process.env.PORT || 8000

// Create an HTTP server with the Express app
const server = http.createServer(app)

const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

socketService.init(io)

initOnlinePlayerCleanup(io)

// Starting the server
server.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`)
})
