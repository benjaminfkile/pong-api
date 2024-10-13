import express, { Request, Response } from "express"
import onlinePlayersData from "../data/onlinePlayersData"

const onlineRoute = express.Router()

onlineRoute.route("/getOnlinePlayers").get(async (req: Request, res: Response) => {
    try {
        const onlinePlayers = await onlinePlayersData.getOnlinePlayers()
        res.send(onlinePlayers)
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).send({ content: null, error: true, errorMsg: error.message })
        } else {
            res.status(500).send({ content: null, error: true, errorMsg: "An unknown error occurred" })
        }
    }
})


export default onlineRoute
