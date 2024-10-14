import onlinePlayersData from "../data/onlinePlayersData";
import I_HeartbeatPayload from "../interfaces/I_HeartbeatPayload";

const socketService = {
  init: (io: any) => {
    io.on('connection', (socket: any) => {
      console.log('Client connected:', socket.id);

      // Store the deviceId in the socket object when the player joins
      socket.on('join_online', async ({ deviceId }: I_HeartbeatPayload) => {
        try {
          socket.deviceId = deviceId; // Store the deviceId in the socket instance

          // Remove the oldest entry if the deviceId already exists
          await onlinePlayersData.removeOldestByDeviceId(deviceId);

          // Add or update the player in the database using deviceId
          await onlinePlayersData.addOrUpdateOnlinePlayer(deviceId, socket.id);

          // Emit the updated list of online players to all clients
          await io.emit("get_online_players", await onlinePlayersData.getOnlinePlayers());
        } catch (error) {
          console.error('Error handling join_online:', error);
        }
      });

      // Update last_active via heartbeat
      socket.on('heartbeat', async ({ deviceId }: I_HeartbeatPayload) => {
        try {
          await onlinePlayersData.updateLastActiveStatus(deviceId);
          console.log("Received heartbeat from device:", deviceId);
        } catch (error) {
          console.error('Error updating lastActive for player:', error);
        }
      });

      // Remove the player by deviceId when the socket disconnects
      socket.on('disconnect', async () => {
        try {
          const { deviceId } = socket; // Retrieve the deviceId from the socket instance
          if (deviceId) {
            await onlinePlayersData.removeAllByDeviceId(deviceId);
            console.log(`Removed all devices for deviceId: ${deviceId} after disconnect`);
          } else {
            console.log(`No deviceId found for socket: ${socket.id}`);
          }

          // Emit the updated list of online players to all clients
          await io.emit("get_online_players", await onlinePlayersData.getOnlinePlayers());
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });
    });

    console.log('Socket.IO server initialized');
  },
};

export default socketService;
