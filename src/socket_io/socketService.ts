import onlinePlayersData from "../data/onlinePlayersData";
import I_JoinOnlinePayload from "../interfaces/I_JoinOnlinePayload";

const socketService = {
  init: (io: any) => {
    io.on('connection', (socket: any) => {
      console.log('Client connected:', socket.id);

      // On join_online, track by deviceId
      socket.on('join_online', async ({ deviceId, username }: I_JoinOnlinePayload) => {
        try {
          const uName = username || socket.id;

          // Add or update the player with the new socketId for the same deviceId
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
          // Handle disconnect by removing player if no other sockets are open for the deviceId
          await onlinePlayersData.removePlayerBySocketId(socket.id);

          // Emit the updated list of online players to all clients
          await io.emit("get_online_players", await onlinePlayersData.getOnlinePlayers());
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
