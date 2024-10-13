import onlinePlayersData from "../data/onlinePlayersData"

const initOnlinePlayerCleanup = (io: any) => {
    onlinePlayersData.cleanUpInactivePlayers(io)

    setInterval(() => {
        onlinePlayersData.cleanUpInactivePlayers(io)
    }, process.env.ONLINE_PLAYER_CLEANUP_INTERVAL ? parseInt(process.env.ONLINE_PLAYER_CLEANUP_INTERVAL) : 60000)
}

export default initOnlinePlayerCleanup