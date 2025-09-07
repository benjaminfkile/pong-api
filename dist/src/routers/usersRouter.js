"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/users.ts
const express_1 = require("express");
const knex_1 = require("../db/knex"); // your knex instance
const usersRouter = (0, express_1.Router)();
// GET /users?limit=50&after=123
usersRouter.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = Number(req.query.limit) || 50;
        const after = req.query.after ? Number(req.query.after) : undefined;
        let q = (0, knex_1.knex)("users")
            .select("user_id", "email", "created_at")
            .orderBy("user_id", "asc")
            .limit(limit);
        if (after)
            q = q.where("user_id", ">", after);
        const rows = yield q;
        const nextCursor = rows.length ? rows[rows.length - 1].user_id : null;
        res.json({ data: rows, nextCursor });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "internal error" });
    }
}));
// GET /users/:id
usersRouter.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
        return void res.status(400).json({ error: "invalid id" });
    try {
        const user = yield (0, knex_1.knex)("users").where({ user_id: id }).first();
        if (!user)
            return void res.status(404).json({ error: "not found" });
        res.json(user);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "internal error" });
    }
}));
// POST /users
usersRouter.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body || {};
    console.log(email);
    if (typeof email !== "string") {
        return void res.status(400).json({ error: "invalid input" });
    }
    try {
        const [user] = yield (0, knex_1.knex)("users")
            .insert({ email })
            .returning(["user_id", "email", "created_at"]);
        res.status(201).json(user);
    }
    catch (err) {
        if ((err === null || err === void 0 ? void 0 : err.code) === "23505")
            return void res.status(409).json({ error: "email orexists" });
        console.error(err);
        res.status(500).json({ error: "internal error" });
    }
}));
// PUT /users/:id
usersRouter.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
        return void res.status(400).json({ error: "invalid id" });
    const updates = {};
    if (typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.email) === "string")
        updates.email = req.body.email;
    if (!Object.keys(updates).length)
        return void res.status(400).json({ error: "no updates provided" });
    try {
        const [user] = yield (0, knex_1.knex)("users")
            .where({ user_id: id })
            .update(updates)
            .returning(["user_id", "email", "created_at"]);
        if (!user)
            return void res.status(404).json({ error: "not found" });
        res.json(user);
    }
    catch (err) {
        if ((err === null || err === void 0 ? void 0 : err.code) === "23505")
            return void res.status(409).json({ error: "email already exists" });
        console.error(err);
        res.status(500).json({ error: "internal error" });
    }
}));
// DELETE /users/:id
usersRouter.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
        return void res.status(400).json({ error: "invalid id" });
    try {
        const [user] = yield (0, knex_1.knex)("users")
            .where({ user_id: id })
            .delete()
            .returning(["user_id", "email", "created_at"]);
        if (!user)
            return void res.status(404).json({ error: "not found" });
        res.json(user);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "internal error" });
    }
}));
exports.default = usersRouter;
