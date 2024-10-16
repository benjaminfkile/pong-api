import onlinePlayersData from "../data/onlinePlayersData";
import I_HeartbeatPayload from "../interfaces/I_HeartbeatPayload";

const socketService = {
  init: (io: any) => {
    const userSocketMap = {}; // Store userId to socketId mapping

    io.on('connection', (socket: any) => {
      console.log('Client connected:', socket.id);

      // Store the userId in the socket object when the player joins
      socket.on('join_online', async ({ userId }: I_HeartbeatPayload) => {
        try {
          socket.userId = userId; // Store the userId in the socket instance

          // Remove the oldest entry if the userId already exists
          await onlinePlayersData.removeOldestByuserId(userId);

          // Add or update the player in the database using userId
          await onlinePlayersData.addOrUpdateOnlinePlayer(userId, socket.id);

          // Store the mapping of userId to socketId in memory
          //@ts-ignore
          userSocketMap[userId] = socket.id;

          // Emit the updated list of online players to all clients
          await io.emit("get_online_players", await onlinePlayersData.getOnlinePlayers());
        } catch (error) {
          console.error('Error handling join_online:', error);
        }
      });

      // Update last_active via heartbeat
      socket.on('heartbeat', async ({ userId }: I_HeartbeatPayload) => {
        try {
          await onlinePlayersData.updateLastActiveStatus(userId);
          console.log("Received heartbeat from device:", userId);
        } catch (error) {
          console.error('Error updating lastActive for player:', error);
        }
      });

      // Handle sending private messages using userId
      //@ts-ignore
      socket.on('send_private_message', async ({ targetUserId, message }) => {
        try {
          // Look up the socketId for the target userId
          //@ts-ignore
          const targetSocketId = userSocketMap[targetUserId];

          if (targetSocketId) {
            // Send the message to the target user's socket
            socket.to(targetSocketId).emit('receive_private_message', { message });
            console.log(`Message sent to userId: ${targetUserId}, socketId: ${targetSocketId}`);
          } else {
            console.log(`Target userId ${targetUserId} is not online`);
          }
        } catch (error) {
          console.error('Error sending private message:', error);
        }
      });

      // Remove the player by userId when the socket disconnects
      socket.on('disconnect', async () => {
        try {
          const { userId } = socket; // Retrieve the userId from the socket instance
          if (userId) {
            await onlinePlayersData.removeAllByuserId(userId);

            // Remove the user from the userSocketMap
            //@ts-ignore
            delete userSocketMap[userId];

            console.log(`Removed all devices for userId: ${userId} after disconnect`);
          } else {
            console.log(`No userId found for socket: ${socket.id}`);
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
