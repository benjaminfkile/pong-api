import onlinePlayersData from "../data/onlinePlayersData";
import Game from "../game/game";
import I_Challenge from "../interfaces/I_Challenge";
import I_HeartbeatPayload from "../interfaces/I_HeartbeatPayload";
import { v4 as uuidv4 } from "uuid"

const socketService = {
  init: (io: any) => {
    const userSocketMap = {};  // Store userId to socketId mapping
    const gamesMap = new Map<string, Game>(); // Stores active games
    const userToGameMap = new Map<string, string>(); // Maps userId to gameKey for quick lookup

    io.on("connection", (socket: any) => {
      //console.log("Client connected:", socket.id);

      // Store the userId in the socket object when the player joins
      socket.on("join_online", async ({ userId }: I_HeartbeatPayload) => {
        try {
          socket.userId = userId;
          await onlinePlayersData.removeOldestByuserId(userId);
          await onlinePlayersData.addOrUpdateOnlinePlayer(userId, socket.id);
          //@ts-ignore
          userSocketMap[userId] = socket.id;
          await io.emit("get_online_players", await onlinePlayersData.getOnlinePlayers());
        } catch (error) {
          console.error("Error handling join_online:", error);
        }
      });

      socket.on("send_challenge", async (payload: I_Challenge) => {
        const { challengerUserId, challengeRecipientUserId } = payload
        try {
          const challengersSocketId = socket.id
          //@ts-ignore
          const challengedUsersSockeId = userSocketMap[challengeRecipientUserId];
          if (challengedUsersSockeId) {
            socket.to(challengedUsersSockeId).emit("receive_challenge", payload);
          } else {
            console.log(`Target userId ${challengeRecipientUserId} is not online`);
          }
        } catch (error) {
          console.error("Error sending challenge:", error);
        }
      });

      socket.on("accept_challenge", async (payload: I_Challenge) => {
        const { challengerUserId, challengeRecipientUserId } = payload
        try {
          //@ts-ignore
          const challengerSocketId = userSocketMap[challengerUserId]
          socket.to(challengerSocketId).emit("challenge_accepted", payload);
        } catch (error) {
          console.error("Error handling challenge acceptance:", error);
        }
      });

      socket.on("decline_challenge", async (payload: I_Challenge) => {
        const { challengerUserId, challengeRecipientUserId } = payload
        try {
          //@ts-ignore
          const challengerSocketId = userSocketMap[challengerUserId]
          socket.to(challengerSocketId).emit("challenge_declined", payload);
        } catch (error) {
          console.error("Error handling challenge decline:", error);
        }
      });

      socket.on("start_game", async (payload: I_Challenge) => {
        const { challengerUserId, challengeRecipientUserId, width, height, ballSize, paddleHeight, paddleWidth, maxVelocity, velocityIncreaseFactor } = payload;
        //@ts-ignore
        const challengerSocketId = userSocketMap[challengerUserId];
        //@ts-ignore
        const challengeRecipientSocketId = userSocketMap[challengeRecipientUserId]
        // Generate a unique game key (e.g., `challengerUserId:challengeRecipientUserId`)
        const gameKey = uuidv4()

        // Create a new game instance if it doesn't exist
        if (!gamesMap.has(gameKey)) {
          const newGame = new Game(
            challengerSocketId,
            challengeRecipientSocketId,
            challengerUserId,
            challengeRecipientUserId,
            io,
            width,
            height,
            ballSize,
            paddleHeight,
            paddleWidth,
            maxVelocity,
            velocityIncreaseFactor
          );
          gamesMap.set(gameKey, newGame);
          userToGameMap.set(challengerUserId, gameKey);
          userToGameMap.set(challengeRecipientUserId, gameKey);
          // Notify players that the game has started
          io.to(challengerSocketId).emit("game_started", { gameKey: gameKey, player: 1, width: width, height: height, ballSize: ballSize, paddleHeight: paddleHeight, paddleWidth: paddleWidth, maxVelocity: maxVelocity, velocityIncreaseFactor: velocityIncreaseFactor });
          io.to(challengeRecipientSocketId).emit("game_started", { gameKey: gameKey, player: 2, width: width, height: height, ballSize: ballSize, paddleHeight: paddleHeight, paddleWidth: paddleWidth, maxVelocity: maxVelocity, velocityIncreaseFactor: velocityIncreaseFactor });
        }
      });

      socket.on("update_paddle", (payload: { y: number, id: string }) => {//!!!! check if i actually need id
        const { y, id } = payload; // Extract y and id from data object
        if (socket.userId === id) { // Optionally verify that the correct user is sending the update
          const gameKey = userToGameMap.get(id);
          if (gameKey) {
            const game = gamesMap.get(gameKey);
            if (game) {
              game.updatePaddlePosition(id, y);
            }
          }
        } else {
          console.log("wrong socket")
        }
      });

      socket.on("disconnect", async () => {
        try {
          const { userId } = socket;
          if (userId) {
            await onlinePlayersData.removeAllByuserId(userId);
            //@ts-ignore
            delete userSocketMap[userId];
            //console.log(`Removed all devices and challenges for userId: ${userId} after disconnect`);
          } else {
            //console.log(`No userId found for socket: ${socket.id}`);
          }
          await io.emit("get_online_players", await onlinePlayersData.getOnlinePlayers());
        } catch (error) {
          console.error("Error handling disconnect:", error);
        }
      });
    });
    console.log("Socket.IO server initialized");
  },
};

export default socketService;
