class Game {
  private ball: { x: number; y: number; velocityX: number; velocityY: number; size: number };
  private paddles: { [key: string]: { x: number; y: number } };
  private io: any;
  private player1SocketId: string;
  private player2SocketId: string;
  private player1Id: string;
  private player2Id: string;
  //@ts-ignore
  private intervalId: NodeJS.Timeout;
  private width: number;
  private height: number;
  private paddleHeight: number;
  private paddleWidth: number;
  private velocityIncreaseFactor: number;
  private maxVelocity: number;

  constructor(
    player1SocketId: string,
    player2SocketId: string,
    player1Id: string,
    player2Id: string,
    io: any,
    width: number,
    height: number,
    ballSize: number,
    paddleHeight: number,
    paddleWidth: number,
    maxVelocity: number = 0,
    velocityIncreaseFactor: number = 0 
  ) {
    this.io = io;
    this.player1SocketId = player1SocketId;
    this.player2SocketId = player2SocketId;
    this.player1Id = player1Id;
    this.player2Id = player2Id;
    this.width = width;
    this.height = height;
    this.paddleHeight = paddleHeight;
    this.paddleWidth = paddleWidth;
    this.maxVelocity = maxVelocity;
    this.velocityIncreaseFactor = velocityIncreaseFactor; // Set the velocity increase factor

    this.ball = { x: width / 2, y: height / 2, velocityX: 2, velocityY: 2, size: ballSize };
    this.paddles = {
      [player1Id]: { x: 0, y: height / 2 - paddleHeight / 2 },
      [player2Id]: { x: width - paddleWidth, y: height / 2 - paddleHeight / 2 }
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

    const maxSafeVelocity = 50;
    this.ball.velocityX = Math.min(Math.abs(this.ball.velocityX), maxSafeVelocity) * Math.sign(this.ball.velocityX);
    this.ball.velocityY = Math.min(Math.abs(this.ball.velocityY), maxSafeVelocity) * Math.sign(this.ball.velocityY);

    if (this.ball.y - this.ball.size / 2 <= 0) {
      this.ball.y = this.ball.size / 2;
      this.ball.velocityY *= -1;
    }

    if (this.ball.y + this.ball.size / 2 >= this.height) {
      this.ball.y = this.height - this.ball.size / 2;
      this.ball.velocityY *= -1;
    }

    if (this.ball.x - (this.ball.size / 2) <= this.paddleWidth) {
      const paddle1 = this.paddles[this.player1Id];
      const ballBottomEdge = this.ball.y + this.ball.size / 2;
      const ballTopEdge = this.ball.y - this.ball.size / 2;

      if (ballBottomEdge >= paddle1.y && ballTopEdge <= paddle1.y + this.paddleHeight) {
        this.ball.velocityX *= -1;
        this.ball.x = this.paddleWidth + (this.ball.size / 2);
        this.increaseBallSpeed();
      } else if (this.ball.x <= 0) {
        this.handleOutOfBounds("left");
      }
    }

    if (this.ball.x + (this.ball.size / 2) >= this.width - this.paddleWidth) {
      const paddle2 = this.paddles[this.player2Id];
      const ballBottomEdge = this.ball.y + this.ball.size / 2;
      const ballTopEdge = this.ball.y - this.ball.size / 2;

      if (ballBottomEdge >= paddle2.y && ballTopEdge <= paddle2.y + this.paddleHeight) {
        this.ball.velocityX *= -1;
        this.ball.x = this.width - this.paddleWidth - (this.ball.size / 2);
        this.increaseBallSpeed();
      } else if (this.ball.x + this.ball.size >= this.width) {
        this.handleOutOfBounds("right");
      }
    }
  }

  private increaseBallSpeed() {
    this.ball.velocityX *= this.velocityIncreaseFactor;
    this.ball.velocityY *= this.velocityIncreaseFactor;

    if (Math.abs(this.ball.velocityX) > this.maxVelocity) {
      this.ball.velocityX = this.maxVelocity * Math.sign(this.ball.velocityX);
    }

    if (Math.abs(this.ball.velocityY) > this.maxVelocity) {
      this.ball.velocityY = this.maxVelocity * Math.sign(this.ball.velocityY);
    }
  }

  private handleOutOfBounds(side: "left" | "right") {
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;
    this.ball.velocityX = side === "left" ? 2 : -2;
    this.ball.velocityY = 2;

    this.io.emit("score", { side, message: "Ball out of bounds, reset!" });
  }

  public updatePaddlePosition(userId: string, y: number) {
    if (y < 0) y = 0;
    if (y > this.height - this.paddleHeight) y = this.height - this.paddleHeight;

    if (this.paddles[userId]) {
      this.paddles[userId].y = y;
    } else {
      console.log(`No paddle found for userId: ${userId}`);
    }
  }

  private sendGameState() {
    const payload = {
      ball: this.ball,
      player1: this.paddles[this.player1Id],
      player2: this.paddles[this.player2Id],
    };

    this.io.to(this.player1SocketId).emit("game_update", payload);
    this.io.to(this.player2SocketId).emit("game_update", payload);
  }

  public stopGame() {
    clearInterval(this.intervalId);
  }
}

export default Game;
