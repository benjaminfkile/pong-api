import db from "./db";

const challengesData = {
  // Add a new challenge
  addChallenge: async (challengerUserId: string, targetUserId: string, message: string) => {
    try {
      await db("challenges").insert({
        challenger_user_id: challengerUserId,
        target_user_id: targetUserId,
        message,
        created_at: db.fn.now(),
      });
      //console.log(`Challenge created from ${challengerUserId} to ${targetUserId}`);
    } catch (error) {
      console.error("Error creating challenge:", error);
      throw error;
    }
  },

  // Get a challenge by target userId
  getChallengeByChallengerAndTarget: async (challengerUserId: string, targetUserId: string) => {
    try {
      const challenge = await db("challenges")
        .where({challenger_user_id: challengerUserId, target_user_id: targetUserId })
        .first();
      return challenge;
    } catch (error) {
      console.error("Error retrieving challenge:", error);
      throw error;
    }
  },

  // Remove a challenge by challenger and target userId
  removeChallenge: async (challengerUserId: string, targetUserId: string) => {
    try {
      const deletedRows = await db("challenges")
        .where({
          challenger_user_id: challengerUserId,
          target_user_id: targetUserId,
        })
        .del();
      //console.log(`Removed challenge between ${challengerUserId} and ${targetUserId}`);
      return deletedRows;
    } catch (error) {
      console.error("Error removing challenge:", error);
      throw error;
    }
  },

  // Clean up all challenges for a userId when they disconnect
  removeAllChallengesByUserId: async (userId: string) => {
    try {
      const deletedRows = await db("challenges")
        .where({ challenger_user_id: userId })
        .orWhere({ target_user_id: userId })
        .del();
      //console.log(`Removed all challenges related to userId: ${userId}`);
      return deletedRows;
    } catch (error) {
      console.error("Error removing challenges for userId:", error);
      throw error;
    }
  },
};

export default challengesData;
