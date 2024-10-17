import onlinePlayersData from "../data/onlinePlayersData";
import I_AcceptOrDeclinePayload from "../interfaces/I_AcceptOrDeclinePayload";
import I_HeartbeatPayload from "../interfaces/I_HeartbeatPayload";

const socketService = {
  init: (io: any) => {
    const userSocketMap = {};  // Store userId to socketId mapping

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

      //@ts-ignore
      socket.on("send_challenge", async (payload: I_SendChallengePayload) => {
        const { challengeRecipientUserId, message } = payload
        try {
          const challengersSocketId = socket.id
          //@ts-ignore
          const challengedUsersSockeId = userSocketMap[challengeRecipientUserId];
          if (challengedUsersSockeId) {
            socket.to(challengedUsersSockeId).emit("receive_challenge", { userId: challengersSocketId, message });
          } else {
            console.log(`Target userId ${challengeRecipientUserId} is not online`);
          }
        } catch (error) {
          console.error("Error sending challenge:", error);
        }
      });

      socket.on("accept_challenge", async (payload: I_AcceptOrDeclinePayload) => {
        console.log(payload)
        const { challengerUserId, challengeRecipientUserId } = payload
        try {
          //@ts-ignore
          const challengerSocketId = userSocketMap[challengerUserId]
          socket.to(challengerSocketId).emit("challenge_accepted", challengeRecipientUserId);
          //!!! create new game here
        } catch (error) {
          console.error("Error handling challenge acceptance:", error);
        }
      });

      socket.on("decline_challenge", async (payload: I_AcceptOrDeclinePayload) => {
        const { challengerUserId, challengeRecipientUserId } = payload
        try {
          //@ts-ignore
          const challengerSocketId = userSocketMap[challengerUserId]
          socket.to(challengerSocketId).emit("challenge_declined", challengeRecipientUserId);
        } catch (error) {
          console.error("Error handling challenge decline:", error);
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
