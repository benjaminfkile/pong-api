import I_GameOverPayload from "../interfaces/I_GameOverPayload";
import I_ScorePayload from "../interfaces/I_ScorePayload";

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
  private scores: { [key: string]: number };
  private pointsToWin: number; // Points required to win the game

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
    pointsToWin: number, // Points required to win the game
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
    this.velocityIncreaseFactor = velocityIncreaseFactor;
    this.pointsToWin = pointsToWin; // Store points needed to win the game
    this.scores = { [player1Id]: 0, [player2Id]: 0 }; // Initialize player scores

    // Initialize ball in the center of the game area
    this.ball = { x: width / 2, y: height / 2, velocityX: 2, velocityY: 2, size: ballSize };

    // Set initial paddle positions for both players
    this.paddles = {
      [player1Id]: { x: 0, y: height / 2 - paddleHeight / 2 },
      [player2Id]: { x: width - paddleWidth, y: height / 2 - paddleHeight / 2 }
    };

    // Start the game loop (updates the ball's position and game state 60 times per second)
    this.startGameLoop();
  }

  // Starts the game loop, which updates the ball's position and game state at 60 FPS
  private startGameLoop() {
    this.intervalId = setInterval(() => {
      this.updateBall();
      this.sendGameState();
    }, 1000 / 60); // 60 FPS
  }

  // Updates the ball's position and handles collisions with walls and paddles
  private updateBall() {
    this.ball.x += this.ball.velocityX;
    this.ball.y += this.ball.velocityY;

    const maxSafeVelocity = 50;
    this.ball.velocityX = Math.min(Math.abs(this.ball.velocityX), maxSafeVelocity) * Math.sign(this.ball.velocityX);
    this.ball.velocityY = Math.min(Math.abs(this.ball.velocityY), maxSafeVelocity) * Math.sign(this.ball.velocityY);

    if (this.ball.y - this.ball.size / 2 <= 0 || this.ball.y + this.ball.size / 2 >= this.height) {
      this.ball.velocityY *= -1;
    }

    if (this.ball.x - this.ball.size / 2 <= this.paddleWidth) {
      const paddle1 = this.paddles[this.player1Id];
      const ballBottomEdge = this.ball.y + this.ball.size / 2;
      const ballTopEdge = this.ball.y - this.ball.size / 2;

      if (ballBottomEdge >= paddle1.y && ballTopEdge <= paddle1.y + this.paddleHeight) {
        this.ball.velocityX *= -1;
        this.ball.x = this.paddleWidth + this.ball.size / 2;
        this.increaseBallSpeed();
      } else if (this.ball.x <= 0) {
        this.handleOutOfBounds("left");
      }
    }

    if (this.ball.x + this.ball.size / 2 >= this.width - this.paddleWidth) {
      const paddle2 = this.paddles[this.player2Id];
      const ballBottomEdge = this.ball.y + this.ball.size / 2;
      const ballTopEdge = this.ball.y - this.ball.size / 2;

      if (ballBottomEdge >= paddle2.y && ballTopEdge <= paddle2.y + this.paddleHeight) {
        this.ball.velocityX *= -1;
        this.ball.x = this.width - this.paddleWidth - this.ball.size / 2;
        this.increaseBallSpeed();
      } else if (this.ball.x >= this.width) {
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

  // Handles the situation when the ball goes out of bounds (missed by a player)
  private handleOutOfBounds(side: "left" | "right") {
    const scorer = side === "left" ? this.player2Id : this.player1Id;

    // The opponent of the player who missed the ball gets 1 point
    this.scores[scorer] += 1;

    // Emit the score update to the clients

    const scorePayload: I_ScorePayload = {
      player1: { userName: "a", userId: this.player1Id, score: this.scores[this.player1Id] },
      player2: { userName: "b", userId: this.player2Id, score: this.scores[this.player2Id] }
    };

    this.io.to(this.player1SocketId).emit("score_update", scorePayload);
    this.io.to(this.player2SocketId).emit("score_update", scorePayload);

    // Check if the player has reached the points required to win the game
    if (this.scores[scorer] >= this.pointsToWin) {
      this.endGame(); // Ends the game if someone reaches the pointsToWin
    } else {
      // Reset the ball for the next round
      this.resetBall(side);
    }
  }

  // Resets the ball's position and velocity for the next round
  private resetBall(side: "left" | "right") {
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;
    this.ball.velocityX = side === "left" ? 2 : -2;
    this.ball.velocityY = 2; // Reset speed for the next rally
  }

  // Ends the game and declares the winner
  private endGame() {
    let winner: string | null = null;

    if (this.scores[this.player1Id] > this.scores[this.player2Id]) {
      winner = this.player1Id;
    } else if (this.scores[this.player2Id] > this.scores[this.player1Id]) {
      winner = this.player2Id;
    }

    // Emit the game_over event only to the players in this game

    const payload: I_GameOverPayload = {
      score: {
        player1: { userName: "a", userId: this.player1Id, score: this.scores[this.player1Id] },
        player2: { userName: "b", userId: this.player2Id, score: this.scores[this.player2Id] }
      },
      winner: winner
    }

    this.io.to(this.player1SocketId).emit("game_over", payload);
    this.io.to(this.player2SocketId).emit("game_over", payload);

    this.stopGame();
  }

  // Updates the paddle position for a given player
  public updatePaddlePosition(userId: string, y: number) {
    if (y < 0) y = 0;
    if (y > this.height - this.paddleHeight) y = this.height - this.paddleHeight;

    if (this.paddles[userId]) {
      this.paddles[userId].y = y;
    }
  }

  // Sends the game state (ball and paddles positions) to both players
  private sendGameState() {
    const payload = {
      ball: this.ball,
      player1: this.paddles[this.player1Id],
      player2: this.paddles[this.player2Id],
    };

    this.io.to(this.player1SocketId).emit("game_update", payload);
    this.io.to(this.player2SocketId).emit("game_update", payload);
  }

  // Stops the game loop
  public stopGame() {
    clearInterval(this.intervalId);
  }
}

export default Game;
