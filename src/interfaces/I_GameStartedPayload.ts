interface I_GameStartedPayload{
    gameKey: string,
    player: number,
    width: number
    height: number
    ballSize: number
    paddleHeight: number
    paddleWidth: number
    pointsToWin: number
    maxVelocity: number
    velocityIncreaseFactor: number
}

export default I_GameStartedPayload