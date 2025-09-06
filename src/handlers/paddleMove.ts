import { Socket } from "socket.io"

export default function handlePaddleMove(socket: Socket) {
  socket.on("paddleMove", (data) => {
    console.log("📤 paddleMove:", data)
    socket.broadcast.emit("paddleMove", data)
  })
}
