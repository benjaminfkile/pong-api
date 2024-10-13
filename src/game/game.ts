class Game {
    private player1Y!: number
    private player2Y!: number
    private ballX!: number
    private ballY!: number
    private ballVelocityX!: number
    private ballVelocityY!: number
    private scorePlayer1!: number
    private scorePlayer2!: number
  
    constructor() {
      this.resetGame() // Initialize all properties when a new game is created
    }
  
    // Reset the game state to its initial values
    resetGame() {
      this.player1Y = 50 // Starting position for player 1
      this.player2Y = 50 // Starting position for player 2
      this.ballX = 50 // Center of the game area
      this.ballY = 50 // Center of the game area
      this.ballVelocityX = 2 // Starting velocity of the ball on the X-axis
      this.ballVelocityY = 2 // Starting velocity of the ball on the Y-axis
      this.scorePlayer1 = 0 // Initial score for player 1
      this.scorePlayer2 = 0 // Initial score for player 2
    }
  
    // Update the ball's position based on its velocity
    updateBallPosition() {
      this.ballX += this.ballVelocityX
      this.ballY += this.ballVelocityY
  
      // Handle ball collisions with top and bottom walls
      if (this.ballY <= 0 || this.ballY >= 100) {
        this.ballVelocityY *= -1 // Reverse the Y-velocity if the ball hits the wall
      }
  
      // Add more logic here to handle paddle collisions and scoring
    }
  
    // Move a player's paddle
    movePlayer(player: number, newY: number) {
      if (player === 1) {
        this.player1Y = newY // Update player 1's Y position
      } else {
        this.player2Y = newY // Update player 2's Y position
      }
    }
  
    // Return the current game state to be sent to the client
    getGameState() {
      return {
        player1Y: this.player1Y,
        player2Y: this.player2Y,
        ballX: this.ballX,
        ballY: this.ballY,
        scorePlayer1: this.scorePlayer1,
        scorePlayer2: this.scorePlayer2,
      }
    }
  }
  
  export default Game
  