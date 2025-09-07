import type { Socket } from "socket.io"
import type { IHeartbeat } from "pong-shared-deps"
import socketService from "../../services/socketService"

export default function receiveHeartbeat(socket: Socket) {
  console.log("➡️ registering heartbeat receiver for", socket.id)
  socketService.on(socket, "heartbeat", (payload: IHeartbeat) => {
    console.log("💓 heartbeat received:", payload)
    // TODO: persist/update last_seen
  })
}
