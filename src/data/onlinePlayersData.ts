import db from "./db";

const onlinePlayersData = {

  // Get all online players
  getOnlinePlayers: async () => {
    try {
      const players = await db("online_players").select("user_id", "user_name", "last_active");
      return players;
    } catch (error) {
      console.error("Error retrieving online players:", error);
      throw error;
    }
  },

  // Add or update an online player by userId
  addOrUpdateOnlinePlayer: async (userId: string, userName: string) => {
    try {
      // Check if the userId already exists
      const playerExists = await db("online_players").where({ user_id: userId }).first();

      if (playerExists) {
        // If the player exists, update their last_active timestamp
        await db("online_players")
          .where({ user_id: userId })
          .update({ user_name: userName, last_active: db.fn.now() });
      } else {
        // If the player doesn't exist, create a new record
        await db("online_players").insert({
          user_id: userId,
          user_name: userName,
          last_active: db.fn.now(),
        });
      }
    } catch (error) {
      console.error("Error adding or updating player in the online players list:", error);
      throw error;
    }
  },

  // Remove all players by userId
  removeAllByuserId: async (userId: string) => {
    try {
      // Delete all players associated with the userId
      const deletedRows = await db("online_players")
        .where({ user_id: userId })
        .del();

      //console.log(`Removed ${deletedRows} player(s) with userId: ${userId}`);
    } catch (error) {
      console.error(`Error removing all players by userId: ${userId}`, error);
      throw error;
    }
  },

  // Remove the oldest entry by userId (if multiple)
  removeOldestByUserId: async (userId: string) => {
    try {
      const players = await db("online_players").where({ user_id: userId }).orderBy("last_active", "asc");

      // If more than one entry exists, delete the oldest
      if (players.length > 1) {
        const oldestPlayer = players[0];
        await db("online_players").where({ id: oldestPlayer.id }).del();
        //console.log(`Removed oldest player with userId: ${userId}`);
      }
    } catch (error) {
      console.error("Error removing oldest player by userId:", error);
      throw error;
    }
  },

  // Update player's last active time by userId
  updateLastActiveStatus: async (userId: string) => {
    try {
      await db("online_players")
        .where({ user_id: userId })
        .update({ last_active: db.fn.now() });
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

      //console.log(`Inactive players older than ${thresholdSeconds} seconds cleaned up.`);

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
