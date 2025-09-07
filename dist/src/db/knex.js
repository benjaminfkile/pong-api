"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.knex = void 0;
const knex_1 = __importDefault(require("knex"));
const pg_1 = __importDefault(require("pg"));
pg_1.default.defaults.ssl = { rejectUnauthorized: false }; // <- make pg accept Heroku/RDS SSL
exports.knex = (0, knex_1.default)({
    client: "pg",
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 20 },
});
