"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function handlePaddleMove(socket) {
    socket.on("paddleMove", (data) => {
        console.log("📤 paddleMove:", data);
        socket.broadcast.emit("paddleMove", data);
    });
}
exports.default = handlePaddleMove;
