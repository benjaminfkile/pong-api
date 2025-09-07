
import knexFactory, { Knex } from "knex"
import pg from "pg"

pg.defaults.ssl = { rejectUnauthorized: false } // <- make pg accept Heroku/RDS SSL

export const knex: Knex = knexFactory({
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 20 },
})
