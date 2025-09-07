// src/routes/users.ts
import { Router, Request, Response } from "express"
import { knex } from "../db/knex"        // your knex instance
import { User } from "../interfaces"


const usersRouter = Router()

// GET /users?limit=50&after=123
usersRouter.get("/", async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50
    const after = req.query.after ? Number(req.query.after) : undefined

    let q = knex<User>("users")
      .select("user_id", "email", "created_at")
      .orderBy("user_id", "asc")
      .limit(limit)

    if (after) q = q.where("user_id", ">", after)

    const rows = await q
    const nextCursor = rows.length ? rows[rows.length - 1].user_id : null

    res.json({ data: rows, nextCursor })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "internal error" })
  }
})

// GET /users/:id
usersRouter.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return void res.status(400).json({ error: "invalid id" })

  try {
    const user = await knex<User>("users").where({ user_id: id }).first()
    if (!user) return void res.status(404).json({ error: "not found" })
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "internal error" })
  }
})

// POST /users
usersRouter.post("/", async (req: Request, res: Response) => {
  const { email } = req.body || {}
  console.log(email)
  if (typeof email !== "string") {
    return void res.status(400).json({ error: "invalid input" })
  }

  try {
    const [user] = await knex<User>("users")
      .insert({ email})
      .returning(["user_id", "email", "created_at"])

    res.status(201).json(user)
  } catch (err: any) {
    if (err?.code === "23505") return void res.status(409).json({ error: "email orexists" })
    console.error(err)
    res.status(500).json({ error: "internal error" })
  }
})

// PUT /users/:id
usersRouter.put("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return void res.status(400).json({ error: "invalid id" })

  const updates: Partial<Pick<User, "email">> = {}
  if (typeof req.body?.email === "string") updates.email = req.body.email
  if (!Object.keys(updates).length) return void res.status(400).json({ error: "no updates provided" })

  try {
    const [user] = await knex<User>("users")
      .where({ user_id: id })
      .update(updates)
      .returning(["user_id", "email", "created_at"])

    if (!user) return void res.status(404).json({ error: "not found" })
    res.json(user)
  } catch (err: any) {
    if (err?.code === "23505") return void res.status(409).json({ error: "email already exists" })
    console.error(err)
    res.status(500).json({ error: "internal error" })
  }
})

// DELETE /users/:id
usersRouter.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return void res.status(400).json({ error: "invalid id" })

  try {
    const [user] = await knex<User>("users")
      .where({ user_id: id })
      .delete()
      .returning(["user_id", "email", "created_at"])

    if (!user) return void res.status(404).json({ error: "not found" })
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "internal error" })
  }
})

export default usersRouter
