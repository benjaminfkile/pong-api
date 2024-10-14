import onlinePlayersData from "../data/onlinePlayersData";
import I_JoinOnlinePayload from "../interfaces/I_JoinOnlinePayload";

const socketService = {
  init: (io: any) => {
    io.on('connection', (socket: any) => {
      console.log('Client connected:', socket.id);

      socket.on('join_online', async ({ deviceId, username }: I_JoinOnlinePayload) => {
        try {
          const uName = username || socket.id;

          // Check if the player already exists by deviceId, and just update socketId
          await onlinePlayersData.addOrUpdateOnlinePlayer(deviceId, uName, socket.id);

          // Emit the updated list of online players to all clients
          await io.emit("get_online_players", await onlinePlayersData.getOnlinePlayers());
        } catch (error) {
          console.error('Error handling join_online:', error);
        }
      });

      socket.on('heartbeat', async () => {
        try {
          await onlinePlayersData.updateLastActiveStatus(socket.id);
          console.log("Received heartbeat from:", socket.id);
        } catch (error) {
          console.error('Error updating lastActive for player:', error);
        }
      });

      socket.on('disconnect', async () => {
        try {
          // Optionally, you can handle disconnections, but avoid removing the player entirely.
          console.log(`Client ${socket.id} disconnected`);
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });
    });

    console.log('Socket.IO server initialized');
  },
};

export default socketService;
