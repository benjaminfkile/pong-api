import knex from "knex";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const db = knex({
  client: "pg",
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
  },
  pool: { min: 2, max: 10 }, 
});

export default db;
