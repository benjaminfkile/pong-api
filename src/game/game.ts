class Game {
  private ball: { x: number; y: number; velocityX: number; velocityY: number; radius: number };
  private paddles: { [key: string]: { x: number; y: number } };
  private io: any;
  private player1SocketId: string;
  private player2SocketId: string;
  private player1Id: string;
  private player2Id: string;
  //@ts-ignore
  private intervalId: NodeJS.Timeout;
  private width: number;   // New width property
  private height: number;  // New height property

  constructor(
    player1SocketId: string,
    player2SocketId: string,
    player1Id: string,
    player2Id: string,
    io: any,
    width: number,   // Pass width
    height: number,  // Pass height
    radius: number   // Pass radius
  ) {
    this.io = io;
    this.player1SocketId = player1SocketId;
    this.player2SocketId = player2SocketId;
    this.player1Id = player1Id;
    this.player2Id = player2Id;
    this.width = width;   // Set width
    this.height = height; // Set height
    this.ball = { x: width / 2, y: height / 2, velocityX: 2, velocityY: 2, radius: radius }; // Set radius from constructor
    this.paddles = {
      [player1Id]: { x: 0, y: height / 2 - 50 }, // Center paddles vertically
      [player2Id]: { x: width - 25, y: height / 2 - 50 } // Paddles at left and right edges, width = 25px
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

    // Ball collision with top and bottom, considering the ball's radius
    if (this.ball.y - this.ball.radius <= 0 || this.ball.y + this.ball.radius >= this.height) {
      this.ball.velocityY *= -1;
    }

    // Ball collision with left paddle (player1)
    if (this.ball.x - this.ball.radius <= 25) { // Paddle is 25px wide
      const paddle1 = this.paddles[this.player1Id];
      // Check if ball's y position is within the paddle's y range
      if (this.ball.y >= paddle1.y && this.ball.y <= paddle1.y + 100) { // Assuming paddle height is 100
        this.ball.velocityX *= -1; // Invert ball's x direction
        this.ball.x = 25 + this.ball.radius; // Move ball outside the paddle to avoid sticking
      } else if (this.ball.x - this.ball.radius <= 0) {
        // Ball actually hit the left wall (missed paddle)
        this.handleOutOfBounds("left");
      }
    }

    // Ball collision with right paddle (player2)
    if (this.ball.x + this.ball.radius >= this.width - 25) { // Right paddle at width - 25px
      const paddle2 = this.paddles[this.player2Id];
      // Check if ball's y position is within the paddle's y range
      if (this.ball.y >= paddle2.y && this.ball.y <= paddle2.y + 100) { // Assuming paddle height is 100
        this.ball.velocityX *= -1; // Invert ball's x direction
        this.ball.x = this.width - 25 - this.ball.radius; // Move ball outside the paddle to avoid sticking
      } else if (this.ball.x + this.ball.radius >= this.width) {
        // Ball actually hit the right wall (missed paddle)
        this.handleOutOfBounds("right");
      }
    }
  }

  private handleOutOfBounds(side: "left" | "right") {
    // Reset the ball to the center or handle scoring logic
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;
    this.ball.velocityX = side === "left" ? 2 : -2; // Reset velocity, and send it towards the opposite direction
    this.ball.velocityY = 2;
    
    // Optionally, emit a scoring event or notify players
    this.io.emit("score", { side, message: "Ball out of bounds, reset!" });
  }

  public updatePaddlePosition(userId: string, y: number) {
    // Ensure paddle stays within bounds
    if (y < 0) y = 0;
    if (y > this.height - 100) y = this.height - 100; // Assuming paddle height is 100

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
    };

    this.io.to(this.player1SocketId).emit("game_update", payload);
    this.io.to(this.player2SocketId).emit("game_update", payload);
  }

  public stopGame() {
    clearInterval(this.intervalId);
  }
}

export default Game;
