import dotenv from "dotenv"
dotenv.config()
import app from "./src/app"
import http from "http"
import socketIO from "socket.io"
import socketService from "./src/services/socketService"

const port = process.env.PORT || 8000 

const server = http.createServer(app)

const io = socketIO(server, {
  transports: ["websocket"] 
})

socketService.init(io)

server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})