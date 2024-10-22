import I_ScorePayload from "./I_ScorePayload";

interface I_GameOverPayload {
    score: I_ScorePayload
    winner: string | null
}

export default I_GameOverPayload