class Game {
  // Ball object, containing its position and velocity
  private ball: { x: number; y: number; velocityX: number; velocityY: number; size: number };
  // Object storing paddle positions for each player by their ID
  private paddles: { [key: string]: { x: number; y: number } };
  // The io object for emitting events via socket.io
  private io: any;
  // Socket IDs for both players
  private player1SocketId: string;
  private player2SocketId: string;
  // Player IDs for both players
  private player1Id: string;
  private player2Id: string;
  //@ts-ignore - Ignored to prevent TypeScript warning about NodeJS.Timeout
  private intervalId: NodeJS.Timeout;
  // Game dimensions
  private width: number;
  private height: number;
  // Paddle dimensions
  private paddleHeight: number;
  private paddleWidth: number;
  // Factor by which the ball's speed will increase on each paddle hit
  private velocityIncreaseFactor: number;
  // Maximum allowable velocity for the ball
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
    this.velocityIncreaseFactor = velocityIncreaseFactor;

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
    // Update the ball's position based on its velocity
    this.ball.x += this.ball.velocityX;
    this.ball.y += this.ball.velocityY;

    // Clamp the velocity to prevent the ball from moving too fast
    const maxSafeVelocity = 50;
    this.ball.velocityX = Math.min(Math.abs(this.ball.velocityX), maxSafeVelocity) * Math.sign(this.ball.velocityX);
    this.ball.velocityY = Math.min(Math.abs(this.ball.velocityY), maxSafeVelocity) * Math.sign(this.ball.velocityY);

    // Check for collision with the top boundary
    if (this.ball.y - this.ball.size / 2 <= 0) {
      this.ball.y = this.ball.size / 2; // Correct position to prevent going out of bounds
      this.ball.velocityY *= -1; // Reverse direction of the ball
    }

    // Check for collision with the bottom boundary
    if (this.ball.y + this.ball.size / 2 >= this.height) {
      this.ball.y = this.height - this.ball.size / 2; // Correct position to prevent going out of bounds
      this.ball.velocityY *= -1; // Reverse direction of the ball
    }

    // Check for collision with the left paddle (player 1)
    if (this.ball.x - (this.ball.size / 2) <= this.paddleWidth) {
      const paddle1 = this.paddles[this.player1Id];
      const ballBottomEdge = this.ball.y + this.ball.size / 2;
      const ballTopEdge = this.ball.y - this.ball.size / 2;

      // Check if the ball is within the paddle's vertical range
      if (ballBottomEdge >= paddle1.y && ballTopEdge <= paddle1.y + this.paddleHeight) {
        this.ball.velocityX *= -1; // Reflect ball horizontally
        this.ball.x = this.paddleWidth + (this.ball.size / 2); // Adjust position to avoid overlapping
        this.increaseBallSpeed(); // Speed up the ball after hitting the paddle
      } else if (this.ball.x <= 0) {
        this.handleOutOfBounds("left"); // Ball went past the paddle (left player misses)
      }
    }

    // Check for collision with the right paddle (player 2)
    if (this.ball.x + (this.ball.size / 2) >= this.width - this.paddleWidth) {
      const paddle2 = this.paddles[this.player2Id];
      const ballBottomEdge = this.ball.y + this.ball.size / 2;
      const ballTopEdge = this.ball.y - this.ball.size / 2;

      // Check if the ball is within the paddle's vertical range
      if (ballBottomEdge >= paddle2.y && ballTopEdge <= paddle2.y + this.paddleHeight) {
        this.ball.velocityX *= -1; // Reflect ball horizontally
        this.ball.x = this.width - this.paddleWidth - (this.ball.size / 2); // Adjust position to avoid overlapping
        this.increaseBallSpeed(); // Speed up the ball after hitting the paddle
      } else if (this.ball.x + this.ball.size >= this.width) {
        this.handleOutOfBounds("right"); // Ball went past the paddle (right player misses)
      }
    }
  }

  // Increases the ball's velocity after hitting a paddle
  private increaseBallSpeed() {
    // Increase both velocityX and velocityY by the increase factor
    this.ball.velocityX *= this.velocityIncreaseFactor;
    this.ball.velocityY *= this.velocityIncreaseFactor;

    // Ensure the velocityX doesn't exceed the max velocity
    if (Math.abs(this.ball.velocityX) > this.maxVelocity) {
      this.ball.velocityX = this.maxVelocity * Math.sign(this.ball.velocityX); // Keep direction the same
    }

    // Ensure the velocityY doesn't exceed the max velocity
    if (Math.abs(this.ball.velocityY) > this.maxVelocity) {
      this.ball.velocityY = this.maxVelocity * Math.sign(this.ball.velocityY); // Keep direction the same
    }
  }

  // Handles the situation when the ball goes out of bounds (missed by a player)
  private handleOutOfBounds(side: "left" | "right") {
    // Reset the ball to the center
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;
    // Set initial velocity depending on which side missed
    this.ball.velocityX = side === "left" ? 2 : -2;
    this.ball.velocityY = 2;

    // todo 
    // Emit a score update to the clients
    // this.io.emit("score", { side, message: "Ball out of bounds, reset!" });
  }

  // Updates the paddle position for a given player
  public updatePaddlePosition(userId: string, y: number) {
    // Clamp the paddle position to the game area
    if (y < 0) y = 0;
    if (y > this.height - this.paddleHeight) y = this.height - this.paddleHeight;

    // Update the paddle position for the given user
    if (this.paddles[userId]) {
      this.paddles[userId].y = y;
    } else {
      console.log(`No paddle found for userId: ${userId}`);
    }
  }

  // Sends the game state (ball and paddles positions) to both players
  private sendGameState() {
    const payload = {
      ball: this.ball,
      player1: this.paddles[this.player1Id],
      player2: this.paddles[this.player2Id],
    };

    // Emit the game state to both players
    this.io.to(this.player1SocketId).emit("game_update", payload);
    this.io.to(this.player2SocketId).emit("game_update", payload);
  }

  // Stops the game loop
  public stopGame() {
    clearInterval(this.intervalId);
  }
}

export default Game;
