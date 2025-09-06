import { Server as SocketIOServer, Socket } from "socket.io"
import fs from "fs"
import path from "path"

const handlersDir = path.join(__dirname, "../handlers")

const socketService = {
  init: (io: SocketIOServer) => {
    io.on("connection", (socket: Socket) => {
      console.log("🟢 Client connected:", socket.id)

      // Dynamically import all handlers
      fs.readdirSync(handlersDir).forEach((file) => {
        if (file.endsWith(".ts") || file.endsWith(".js")) {
          const handler = require(path.join(handlersDir, file)).default
          if (typeof handler === "function") {
            handler(socket)
          }
        }
      })

      socket.on("disconnect", (reason: string) => {
        console.log("🔴 Client disconnected:", socket.id, reason)
      })
    })
  },
}

export default socketService
