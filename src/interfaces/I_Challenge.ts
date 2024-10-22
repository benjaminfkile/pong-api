interface I_Challenge {
    challengerUserId: string
    challengeRecipientUserId: string
    width: number
    height: number
    ballSize: number
    paddleHeight: number
    paddleWidth: number
    maxVelocity: number
    velocityIncreaseFactor: number
}
export default I_Challenge