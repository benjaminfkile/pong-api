import db from "./db";

const onlinePlayersData = {

  // Get all online players
  getOnlinePlayers: async () => {
    try {
      const players = await db("online_players").select("device_id");
      return players;
    } catch (error) {
      console.error("Error retrieving online players:", error);
      throw error;
    }
  },

  // Add or update an online player by deviceId
  addOrUpdateOnlinePlayer: async (deviceId: string, username: string, socketId: string) => {
    try {
      // Check if the deviceId already exists
      const playerExists = await db("online_players").where({ device_id: deviceId }).first();

      if (playerExists) {
        // If the player exists, update their socketId and last_active
        await db("online_players")
          .where({ device_id: deviceId })
          .update({ socket_id: socketId, last_active: db.fn.now() });
      } else {
        // If the player doesn't exist, create a new record
        await db("online_players").insert({
          device_id: deviceId,
          socket_id: socketId,
          last_active: db.fn.now(),
        });
      }
    } catch (error) {
      console.error("Error adding or updating player in the online players list:", error);
      throw error;
    }
  },

  // Remove player by socketId
  removePlayerBySocketId: async (socketId: string) => {
    try {
      // Check if the player exists by socketId
      const player = await db("online_players").where({ socket_id: socketId }).first();

      if (player) {
        // If the player exists, remove them by their deviceId
        await db("online_players").where({ device_id: player.device_id }).del();
      }
    } catch (error) {
      console.error("Error removing player by socketId:", error);
      throw error;
    }
  },

  // Update player's last active time
  updateLastActiveStatus: async (socketId: string) => {
    try {
      const player = await db("online_players").where({ socket_id: socketId }).first();
      if (player) {
        await db("online_players")
          .where({ device_id: player.device_id })
          .update({ last_active: db.fn.now() });
      }
    } catch (error) {
      console.error("Error updating player's last active status:", error);
      throw error;
    }
  },

  // Clean up inactive players based on threshold
  cleanUpInactivePlayers: async (io: any) => {
    const thresholdSeconds = process.env.CARDIAC_ARREST_THRESHOLD_SECONDS || 30;

    try {
      await db("online_players")
        .where("last_active", "<", db.raw(`NOW() - INTERVAL '${thresholdSeconds} seconds'`))
        .del();

      console.log(`Inactive players older than ${thresholdSeconds} seconds cleaned up.`);

      // Emit updated list of online players
      const updatedPlayers = await onlinePlayersData.getOnlinePlayers();
      io.emit("get_online_players", updatedPlayers);

    } catch (error) {
      console.error("Error cleaning up inactive players:", error);
      throw error;
    }
  },
};

export default onlinePlayersData;
