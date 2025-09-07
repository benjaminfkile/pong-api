import { Server as SocketIOServer, Socket } from "socket.io"
import { TSocketEventMap } from "pong-shared-deps"
import fs from "fs"
import path from "path"

const handlersRoot = path.join(__dirname, "../handlers") // at runtime this is dist/handlers

function loadHandlersRecursively(dir: string, socket: Socket) {
  if (!fs.existsSync(dir)) {
    console.warn("handlers dir not found:", dir)
    return
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      loadHandlersRecursively(full, socket)
    } else if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".ts"))) {
      // Require module and support default or direct export
      const mod = require(full)
      const handler = mod.default || mod
      if (typeof handler === "function") {
        try {
          handler(socket)
          console.log("✅ handler loaded:", full)
        } catch (e) {
          console.error("❌ handler failed:", full, e)
        }
      } else {
        console.warn("⚠️ handler is not a function:", full)
      }
    }
  }
}

const socketService = {
  init: (io: SocketIOServer) => {
    io.on("connection", (socket: Socket) => {
      console.log("🟢 Client connected:", socket.id)

      loadHandlersRecursively(handlersRoot, socket)

      socket.on("disconnect", (reason: string) => {
        console.log("🔴 Client disconnected:", socket.id, reason)
      })
    })
  },

  on: <E extends keyof TSocketEventMap>(
    socket: Socket,
    event: E,
    handler: (data: TSocketEventMap[E]) => void
  ) => {
    socket.on(event as string, handler)
  }
}

export default socketService
