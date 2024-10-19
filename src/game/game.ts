class Game {
  private ball: { x: number; y: number; velocityX: number; velocityY: number };
  private paddles: { [key: string]: { x: number; y: number } };
  private io: any;
  private player1SocketId: string;
  private player2SocketId: string;
  private player1Id: string;
  private player2Id: string
  //@ts-ignore
  private intervalId: NodeJS.Timeout;

  constructor(player1SocketId: string, player2SocketId: string, player1Id: string, player2Id: string, io: any) {
    this.io = io;
    this.player1SocketId = player1SocketId;
    this.player2SocketId = player2SocketId;
    this.player1Id = player1Id
    this.player2Id = player2Id
    this.ball = { x: 300, y: 200, velocityX: 2, velocityY: 2 };
    this.paddles = {
      [player1Id]: { x: 10, y: 150 },
      [player2Id]: { x: 580, y: 0 }
    };
    this.startGameLoop();
  }

  private startGameLoop() {
    this.intervalId = setInterval(() => {
      this.updateBall();
      this.sendGameState();
    }, 1000 / 60); // 60 FPS
  }

  private updateBall() {
    this.ball.x += this.ball.velocityX;
    this.ball.y += this.ball.velocityY;

    // Ball collision with top and bottom
    if (this.ball.y <= 0 || this.ball.y >= 400) {
      this.ball.velocityY *= -1;
    }

    // Ball out of bounds or paddle collision detection logic
    // Handle scoring and reset game state if necessary
  }

  public updatePaddlePosition(userId: string, y: number) {
    console.log("Updating paddle for userId:", userId); // Log to confirm which userId is being updated
    if (this.paddles[userId]) {
        this.paddles[userId].y = y;
        console.log(`Paddle position for ${userId}:`, y);
    } else {
        console.log(`No paddle found for userId: ${userId}`);
    }
}
  private sendGameState() {
    // Emit to specific socket IDs
    const payload = {
      ball: this.ball,
      player1: this.paddles[this.player1Id],
      player2: this.paddles[this.player2Id]
    }

    this.io.to(this.player1SocketId).emit("game_update", payload);
    this.io.to(this.player2SocketId).emit("game_update", payload);
  }

  public stopGame() {
    clearInterval(this.intervalId);
  }
}

export default Game;
