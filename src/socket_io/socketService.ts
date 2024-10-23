import onlinePlayersData from "../data/onlinePlayersData";
import Game from "../game/game";
import I_Challenge from "../interfaces/I_Challenge";
import I_GameStartedPayload from "../interfaces/I_GameStartedPayload";
import I_HeartbeatPayload from "../interfaces/I_HeartbeatPayload";
import { v4 as uuidv4 } from "uuid"
import I_JoinOnlinePayload from "../interfaces/I_JoinOnlinePayload";
import randomName from "../utils/randomName";
import convertSnakeToPascal from "../utils/convertSnakeToPascal";

// Declare maps as part of the socketService for global access
const userSocketMap: { [key: string]: string } = {}; // Store userId to socketId mapping
const gamesMap = new Map<string, Game>(); // Stores active games
const userToGameMap = new Map<string, string>(); // Maps userId to gameKey for quick lookup

const socketService = {
  init: (io: any) => {
    io.on("connection", (socket: any) => {
      //console.log("Client connected:", socket.id);
      // Store the userId in the socket object when the player joins
      socket.on("join_online", async (payload: I_JoinOnlinePayload) => {
        const { userId, userName } = payload
        try {
          socket.userId = userId;
          let uName = userName

          if (!uName) {
            uName = convertSnakeToPascal(randomName())
          }

          await onlinePlayersData.removeOldestByUserId(userId);
          await onlinePlayersData.addOrUpdateOnlinePlayer(userId, uName);
          //@ts-ignore
          userSocketMap[userId] = socket.id;

          if (!userName) {
            await io.to(socket.id).emit("receive_random_user_name", uName)
          }

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
        const { challengerUserId, challengeRecipientUserId, width, height, ballSize, paddleHeight, paddleWidth, pointsToWin, maxVelocity, velocityIncreaseFactor } = payload;
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
            pointsToWin,
            maxVelocity,
            velocityIncreaseFactor
          );

          gamesMap.set(gameKey, newGame);
          userToGameMap.set(challengerUserId, gameKey);
          userToGameMap.set(challengeRecipientUserId, gameKey);

          const players = [
            { socketId: challengerSocketId, player: 1 },
            { socketId: challengeRecipientSocketId, player: 2 }
          ];

          players.forEach(({ socketId, player }) => {

            const payload: I_GameStartedPayload = {
              challengerUserId: challengerUserId,
              challengeRecipientUserId: challengeRecipientUserId,
              gameKey: gameKey,
              player: player,
              width: width,
              height: height,
              ballSize: ballSize,
              paddleHeight: paddleHeight,
              paddleWidth: paddleWidth,
              pointsToWin: pointsToWin,
              maxVelocity: maxVelocity,
              velocityIncreaseFactor: velocityIncreaseFactor
            }

            io.to(socketId).emit("game_started", payload);
          });
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

      // Update last_active via heartbeat
      socket.on('heartbeat', async ({ userId }: I_HeartbeatPayload) => {
        try {
          await onlinePlayersData.updateLastActiveStatus(userId);
          // console.log("Received heartbeat from device:", userId);
        } catch (error) {
          console.error('Error updating lastActive for player:', error);
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
            // If the disconnected user is in a game, remove the game
            const gameKey = userToGameMap.get(userId);
            if (gameKey) {
              const game = gamesMap.get(gameKey);
              if (game) {
                socketService.cleanupGameInstance(game.player1Id, game.player2Id);
              }
            }
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
  // Function to clean up game instances and mappings
  cleanupGameInstance: (player1Id: string, player2Id: string) => {
    const gameKey1 = userToGameMap.get(player1Id);
    if (gameKey1 && gamesMap.has(gameKey1)) {
      gamesMap.delete(gameKey1);
      console.log(`Game for player1 ${player1Id} has been removed.`);
    }

    userToGameMap.delete(player1Id);

    const gameKey2 = userToGameMap.get(player2Id);
    if (gameKey2 && gamesMap.has(gameKey2)) {
      gamesMap.delete(gameKey2);
      console.log(`Game for player2 ${player2Id} has been removed.`);
    }

    userToGameMap.delete(player2Id);

  },
};

export default socketService;
