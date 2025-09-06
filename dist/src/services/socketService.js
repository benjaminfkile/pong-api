"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const handlersDir = path_1.default.join(__dirname, "../handlers");
const socketService = {
    init: (io) => {
        io.on("connection", (socket) => {
            console.log("🟢 Client connected:", socket.id);
            // Dynamically import all handlers
            fs_1.default.readdirSync(handlersDir).forEach((file) => {
                if (file.endsWith(".ts") || file.endsWith(".js")) {
                    const handler = require(path_1.default.join(handlersDir, file)).default;
                    if (typeof handler === "function") {
                        handler(socket);
                    }
                }
            });
            socket.on("disconnect", (reason) => {
                console.log("🔴 Client disconnected:", socket.id, reason);
            });
        });
    },
};
exports.default = socketService;
