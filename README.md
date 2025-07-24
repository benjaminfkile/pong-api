
# Multiplayer Pong Game Backend (Work in Progress)

This project is a **multiplayer Pong game backend** built with **Node.js**, **Express**, **Socket.IO**, and **PostgreSQL**. It enables real-time multiplayer Pong gameplay over websockets, tracking online players, handling player challenges, and synchronizing game state.

> ⚠️ **Work in Progress:** The project is under active development. APIs, features, and database schema may change.

---

## Project Structure

```
.
├── src
│   ├── app.ts                   # Express app setup and middleware
│   ├── index.ts                 # Server entry point, HTTP server + Socket.IO setup
│   ├── data
│   │   └── onlinePlayersData.ts # Database access for online players (Knex/PostgreSQL)
│   ├── game
│   │   └── game.ts              # Game logic: ball physics, scoring, paddle updates
│   ├── routes
│   │   └── onlinePlayersRoute.ts # Express REST endpoint for online players
│   ├── socket_io
│   │   └── socketService.ts     # Socket.IO events: connection, challenges, gameplay
│   ├── utils
│   │   ├── convertSnakeToPascal.ts  # Utility to convert snake_case to PascalCase strings
│   │   ├── initOnlinePlayerCleanup.ts # Periodic cleanup of inactive online players
│   │   └── randomName.ts         # Generates random usernames using adjective+color+animal
│   └── interfaces               # TypeScript interfaces for payloads and data models
├── .env                        # Environment variables
├── package.json                # NPM dependencies and scripts
└── README.md                   # This file
```

---

## Environment Variables

Create a `.env` file in the project root with:

```env
PORT=8000
DATABASE_URL=postgres://user:password@host:port/database
DB_SSL=true                # Set to false if not using SSL
CARDIAC_ARREST_THRESHOLD_SECONDS=30    # Threshold to consider players inactive (seconds)
ONLINE_PLAYER_CLEANUP_INTERVAL=60000   # Interval for cleanup job (milliseconds)
NODE_ENV=development       # Or production
```

---

## Installation

1. Clone the repository:

```bash
git clone <repo-url>
cd <repo-folder>
```

2. Install dependencies:

```bash
npm install
```

3. Setup your PostgreSQL database and ensure you have a table for tracking online players.

---

## Running the Server

Start the backend server with:

```bash
npm start
```

The server listens on `PORT` from `.env` or defaults to `8000`.

---

## API Endpoints

- `GET /api/onlinePlayers/getOnlinePlayers`

  Returns JSON array of currently online players with their `user_id`, `user_name`, and `last_active` timestamp.

---

## Services

### Socket Service (`socketService`)

Handles all real-time websocket communication using **Socket.IO**:

- Manages user connections and mappings between user IDs and socket IDs.
- Handles player presence and heartbeats to update online status.
- Supports sending and responding to game challenges between players.
- Initiates games with unique game instances.
- Manages game state updates like paddle movements and scores.
- Cleans up games and online player data on disconnect.

### Online Players Data (`onlinePlayersData`)

Manages database operations related to online players:

- Fetching all online players.
- Adding or updating player records with timestamps.
- Removing inactive or disconnected players.
- Cleaning up players inactive beyond a configured threshold.

### Game Logic (`game`)

Implements the Pong game mechanics server-side:

- Ball position and velocity updates at 60 frames per second.
- Paddle position updates.
- Collision detection and ball speed increases.
- Scoring and win condition handling.
- Emitting game state and game over events to players.

---

## Utility Functions

- `randomName`: Generates fun random usernames combining adjectives, colors, and animals.
- `convertSnakeToPascal`: Converts snake_case strings into PascalCase.
- `initOnlinePlayerCleanup`: Starts a periodic job to remove inactive players from the online list.

---

## How Socket.IO Enables Multiplayer Gameplay

The server establishes a Socket.IO websocket connection with clients for real-time bidirectional communication:

- When a client connects, it emits `"join_online"` with their user ID and optionally a username.
- The server adds or updates the player in the online database, assigns a socket ID, and broadcasts the updated player list.
- Players can send challenges (`"send_challenge"`) to others who are online.
- On challenge acceptance (`"accept_challenge"`), a new `Game` instance is created with unique IDs for the players and game.
- The server sends `"game_started"` events to both players with game parameters.
- During gameplay, players send `"update_paddle"` events with paddle positions, which the server applies in the game logic.
- The server runs the game loop updating ball physics and scoring, emitting `"game_update"` events frequently.
- When a player reaches the win condition, the server emits a `"game_over"` event to both clients.
- Heartbeats keep players marked as active; inactive players get cleaned up automatically.
- On disconnect, player data and game instances are cleaned up accordingly.

---

## Notes

- This project is actively being developed. API contracts, features, and database schema are subject to change.
- Contributions and issues are welcome.
- For any questions, reach out to the maintainer, Ben Kile.

---

Thank you for checking out this project!

---