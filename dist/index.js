"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./src/app"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = __importDefault(require("socket.io"));
const socketService_1 = __importDefault(require("./src/services/socketService"));
const port = process.env.PORT || 8000;
const server = http_1.default.createServer(app_1.default);
const io = (0, socket_io_1.default)(server, {
    transports: ["websocket"]
});
socketService_1.default.init(io);
server.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
