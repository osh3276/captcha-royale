import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import http from "http";
import SocketHandler from "./socket.js";
import pool from "./db.js";
import { Game, getAvailableGameId } from "./game.js";
import { message, gameState } from "./message.js";
import cors from "cors";

const app = express();

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
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to parse JSON request bodies
app.use(express.json(), cors({
	origin: "http://localhost:5173", // Adjust this to your frontend URL
	credentials: true, // Allow cookies to be sent with requests
}));

// Rate limiting
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5, // 5 attempts per window
	message: { error: "Too many authentication attempts" },
});

// Auth middleware
const authenticateToken = (req, res, next) => {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (!token) {
		return res.status(401).json({ error: "Access token required" });
	}

	jwt.verify(token, JWT_SECRET, (err, user) => {
		if (err) {
			return res.status(403).json({ error: "Invalid or expired token" });
		}
		req.user = user;
		next();
	});
};

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

// Authentication routes
app.post("/register", authLimiter, async (req, res) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res
				.status(400)
				.json({ error: "Username and password required" });
		}

		// Check if user already exists
		const existingUser = await pool.query(
			"SELECT id FROM users WHERE username = $1",
			[username],
		);
		if (existingUser.rows.length > 0) {
			return res.status(409).json({ error: "Username already exists" });
		}

		const hashedPassword = await bcrypt.hash(password, 12);

		// Insert new user
		await pool.query(
			"INSERT INTO users (username, password) VALUES ($1, $2)",
			[username, hashedPassword],
		);

		res.status(201).json({ message: "User registered successfully" });
	} catch (error) {
		console.error("Registration error:", error);
		res.status(500).json({ error: "Registration failed" });
	}
});

app.post("/login", authLimiter, async (req, res) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res
				.status(400)
				.json({ error: "Username and password required" });
		}

		// Get user from database
		const result = await pool.query(
			"SELECT * FROM users WHERE username = $1",
			[username],
		);

		if (
			result.rows.length === 0 ||
			!(await bcrypt.compare(password, result.rows[0].password))
		) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const user = result.rows[0];
		const token = jwt.sign(
			{ id: user.id, username: user.username },
			JWT_SECRET,
			{ expiresIn: "1h" },
		);

		res.json({ token, expiresIn: "1h" });
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Login failed" });
	}
});

app.post("/create_game", async (req, res) => {
	const generateGameId = () => {
		return Math.random().toString(36).substring(2, 6).toUpperCase();
	};

	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		// 1. Insert creator into players table
		const { player_name, rounds } = req.body;
		const playerResult = await client.query(
			"INSERT INTO players (player_name) VALUES ($1) RETURNING player_id",
			[player_name]
		);
		const creatorId = playerResult.rows[0].player_id;

		// 2. Insert new game with creator and players array
		const gameResult = await client.query(
			`INSERT INTO games (creator, players, created_at, game_code, rounds)
       VALUES ($1, ARRAY[$1]::uuid[], NOW(), $2, $3)
       RETURNING id, created_at, game_code`,
			[creatorId, generateGameId(), rounds]
		);

		// 3. Fetch the complete game data with player details using JOIN
		const completeGameResult = await client.query(
			`SELECT 
				g.id, 
				g.created_at, 
				g.game_code,
				g.rounds,
				json_build_object('player_id', creator_p.player_id, 'player_name', creator_p.player_name) as creator,
				json_agg(
					json_build_object('player_id', p.player_id, 'player_name', p.player_name)
					ORDER BY p.player_name
				) as players
			FROM games g
			JOIN players creator_p ON g.creator = creator_p.player_id
			JOIN players p ON p.player_id = ANY(g.players)
			WHERE g.id = $1
			GROUP BY g.id, g.created_at, g.game_code, g.rounds, creator_p.player_id, creator_p.player_name`,
			[gameResult.rows[0].id]
		);

		await client.query("COMMIT");

		res.status(201).json({
			message: "Game created successfully",
			game: completeGameResult.rows[0],
		});
	} catch (error) {
		await client.query("ROLLBACK");
		console.error("Create game error:", error);
		res.status(500).json({ error: "Failed to create game", message: error.message });
	} finally {
		client.release();
	}
});

app.post("/join_game", async (req, res) => {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		const { game_code, player_name } = req.body;
		console.log(game_code, player_name);

		const playerResult = await client.query(
			"INSERT INTO players (player_name) VALUES ($1) RETURNING player_id",
			[player_name]
		);
		const userId = playerResult.rows[0].player_id;

		if (!game_code) {
			return res.status(400).json({ error: "Game code is required" });
		}

		const game = socketHandler.games.get(game_code.toUpperCase());

		if (!game) {
			return res.status(404).json({ error: "Game not found" });
		}

		if (game.players.has(userId)) {
			return res.status(200).json({
				message: "You are already in this game",
				game: game.getGameState(),
			});
		}

		// if (game.players.size >= 2) {
		// 	return res.status(403).json({ error: "Game is full" });
		// }

		// Add player to game object
		game.addPlayer(userId);

		// Associate user's websocket with the game
		if (socketHandler.clients.has(userId)) {
			socketHandler.clients.get(userId).gameId = game.id;
		}

		// Persist user2 in the database
		try {
			const query = `
                UPDATE games
                SET players = array_append(players, $1::uuid)
                WHERE game_code = $2;
            `;
			await pool.query(query, [userId, game.id]);
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

		await client.query("COMMIT");

		let ret = []
		for (const playerId of game.players.keys()) {
			ret.push({
				player_id: playerId,
				player_name: game.players.get(playerId).player_name ?? "Player"
			});
		}

		const result = await pool.query("SELECT player_id, player_name FROM players");
		const playerMap = new Map();
		for (const row of result.rows) {
			playerMap.set(row.player_id, row.player_name);
		}

		const gameRet = {
			created_at: game.createdAt,
			game_code: game.id,
			rounds: game.rounds,
			players: ret,
			creator: {
				player_id: game.creatorId,
				player_name: playerMap.get(game.creatorId),
			}
		}

		res.status(200).json({
			message: "Joined game successfully",
			game: gameRet,
		});
	} catch (error) {
		console.error("Join game error:", error);
		res.status(500).json({ error: "Failed to join game" });
	}
});

app.post("/start_game", authenticateToken, async (req, res) => {
	try {
		const { game_code } = req.body;
		const userId = req.user.id;

		if (!game_code) {
			return res.status(400).json({ error: "Game code is required" });
		}

		const game = socketHandler.games.get(game_code.toUpperCase());

		if (!game) {
			return res.status(404).json({ error: "Game not found" });
		}

		if (game.creatorId !== userId) {
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

// Protected route example
app.get("/profile", authenticateToken, async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT id, username, created_at FROM users WHERE id = $1",
			[req.user.id],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "User not found" });
		}

		res.json({
			message: "Protected route accessed",
			user: result.rows[0],
		});
	} catch (error) {
		console.error("Profile error:", error);
		res.status(500).json({ error: "Failed to fetch profile" });
	}
});

// Public route
app.get("/health", (req, res) => {
	res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/user/:id", (req, res) => {
	// TODO: Implement get user statistics logic
	res.status(501).json({
		message: "Get user statistics endpoint - implementation pending",
	});
});
