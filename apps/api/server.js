import express from "express";

import http from "http";
import SocketHandler from "./socket.js";
import pool from "./db.js";
import { Game, getAvailableGameId } from "./game.js";
import { message, gameState } from "./message.js";
import cors from "cors";

const app = express();

// Enable CORS for all routes
app.use(
	cors({
		origin: "http://localhost:5173", // Allow requests from this origin
		methods: ["GET", "POST", "PUT", "DELETE"], // Allow these HTTP methods
		credentials: true, // Allow cookies to be sent
	}),
);

const CAPTCHA_POOL = [
	"captcha1",
	"captcha2",
	"captcha3",
	"captcha4",
	"captcha5",
	"captcha6",
	"captcha7",
	"captcha8",
	"captcha9",
	"captcha10",
];

// Middleware
// The server will run on port 3001 to avoid conflicts with other common ports.
const SERVER_PORT = process.env.SERVER_PORT || 3001;
// Middleware to parse JSON request bodies
app.use(express.json());

// Server setup
const server = http.createServer(app);
server.listen(SERVER_PORT, () => {
	console.log(`Server is running on http://localhost:${SERVER_PORT}`);
});
const socketHandler = new SocketHandler(server);

// Routes

// The main route to test the database connection
app.get("/", async (req, res) => {
	let client;
	try {
		// Get a client from the pool
		client = await pool.connect();
		console.log("Successfully connected to the database!");

		// Query for the PostgreSQL version
		const result = await client.query("SELECT version()");
		const dbVersion = result.rows[0].version;
		console.log("Database version:", dbVersion);

		// Send a success response with the database version
		res.status(200).json({
			message: "Database connection successful!",
			databaseVersion: dbVersion,
		});
	} catch (error) {
		console.error(
			"Error connecting to or querying the database:",
			error.stack,
		);
		res.status(500).json({
			error: "Failed to connect to or query the database.",
			details: error.message,
		});
	} finally {
		// IMPORTANT: Release the client back to the pool
		if (client) {
			client.release();
			console.log("Database client released.");
		}
	}
});

app.post("/create_game", async (req, res) => {
	try {
		console.log("Create game route called");
		const { username } = req.body;
		if (!username) {
			return res.status(400).json({ error: "Username is required" });
		}
		const gameId = getAvailableGameId(socketHandler.games);
		const newGame = new Game(gameId, username, [username]);
		socketHandler.games.set(gameId, newGame);

		res.status(201).json({
			message: "Game created successfully",
			game: {
				game_code: newGame.id,
				created_at: new Date().toISOString(),
				user1: username,
				user2: null,
				winner: null,
			},
		});
	} catch (error) {
		console.error("Create game error:", error);
		res.status(500).json({ error: "Failed to create game" });
	}
});

app.post("/join_game", async (req, res) => {
	try {
		console.log("Join game route called");
		const { game_code, username } = req.body;

		if (!game_code) {
			return res.status(400).json({ error: "Game code is required" });
		}
		if (!username) {
			return res.status(400).json({ error: "Username is required" });
		}

		const game = socketHandler.games.get(game_code.toUpperCase());

		if (!game) {
			return res.status(404).json({ error: "Game not found" });
		}

		if (game.players.has(username)) {
			return res.status(200).json({
				message: "You are already in this game",
				game: game.getGameState(),
			});
		}

		if (game.players.size >= 2) {
			return res.status(403).json({ error: "Game is full" });
		}

		// Add player to game object
		game.addPlayer(username);

		// Associate user's websocket with the game
		if (socketHandler.clients.has(username)) {
			socketHandler.clients.get(username).gameId = game.id;
		}

		// Persist user2 in the database
		try {
			const query = `
                UPDATE games
                SET user2 = $1
                WHERE game_code = $2 AND user2 IS NULL;
            `;
			await pool.query(query, [username, game.id]);
		} catch (dbError) {
			console.error("Failed to add player to game in DB", dbError);
			// Potentially roll back adding player to game object in memory
			return res.status(500).json({ error: "Failed to join game" });
		}

		// Notify players in the game that a new player has joined
		for (const playerId of game.players.keys()) {
			const client = socketHandler.clients.get(playerId)?.ws;
			if (client) {
				client.send(
					JSON.stringify({
						type: message.game_joined,
						gameId: game.id,
						gameState: game.getGameState(),
					}),
				);
			}
		}

		res.status(200).json({
			message: "Joined game successfully",
			game: game.getGameState(),
		});
	} catch (error) {
		console.error("Join game error:", error);
		res.status(500).json({ error: "Failed to join game" });
	}
});

app.post("/start_game", async (req, res) => {
	try {
		console.log("Start game route called");
		const { game_code, username } = req.body;

		if (!game_code) {
			return res.status(400).json({ error: "Game code is required" });
		}
		if (!username) {
			return res.status(400).json({ error: "Username is required" });
		}

		const game = socketHandler.games.get(game_code.toUpperCase());

		if (!game) {
			return res.status(404).json({ error: "Game not found" });
		}

		if (game.creatorId !== username) {
			return res
				.status(403)
				.json({ error: "Only the game creator can start the game" });
		}

		if (game.state !== gameState.waiting) {
			return res
				.status(403)
				.json({ error: "Game has already started or is finished" });
		}

		game.startGame(CAPTCHA_POOL, 10);

		// Notify all players in the game that the game has started
		for (const playerId of game.players.keys()) {
			const client = socketHandler.clients.get(playerId)?.ws;
			if (client) {
				client.send(
					JSON.stringify({
						type: message.game_started,
						gameState: game.getGameState(),
					}),
				);
			}
		}

		res.status(200).json({
			message: "Game started successfully",
			game: game.getGameState(),
		});
	} catch (error) {
		console.error("Start game error:", error);
		res.status(500).json({ error: "Failed to start game" });
	}
});

// Public route
app.get("/health", (req, res) => {
	res.json({ status: "OK", timestamp: new Date().toISOString() });
});
