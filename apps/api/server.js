import express from "express";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
// Middleware to parse JSON request bodies
app.use(express.json());
// The server will run on port 3001 to avoid conflicts with other common ports.
const SERVER_PORT = process.env.SERVER_PORT || 3001;

const pool = new pg.Pool({
	connectionString: process.env.DB_URL,
	ssl: {
		rejectUnauthorized: false,
	},
});

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
		// If there's an error, log it and send a 500 server error response
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

// --- API Routes for Game Logic ---

// Route to create a new game
app.post("/create-game", (req, res) => {
	// In a real application, you would generate a unique ID and store the game state.
	const newGameId = `game_${Math.random().toString(36).substring(2, 9)}`;
	console.log(`New game created with ID: ${newGameId}`);
	res.status(201).json({
		message: "Game created successfully!",
		gameId: newGameId,
	});
});

// Route to join an existing game
app.post("/join-game", (req, res) => {
	const { gameId, userId } = req.body;

	if (!gameId || !userId) {
		return res
			.status(400)
			.json({ error: "Both gameId and userId are required." });
	}

	// In a real application, you would validate the gameId and update its state with the new user.
	console.log(`User ${userId} joined game ${gameId}`);
	res.status(200).json({
		message: `Successfully joined game ${gameId}`,
		gameId,
		userId,
	});
});

// Route to get user statistics by ID
app.get("/user/:id", (req, res) => {
	const { id } = req.params;
	console.log(`Fetching stats for user ${id}`);

	// In a real application, you would fetch this data from your database.
	const userStats = {
		userId: id,
		username: `User_${id}`,
		gamesPlayed: Math.floor(Math.random() * 100),
		wins: Math.floor(Math.random() * 50),
		losses: Math.floor(Math.random() * 50),
	};

	res.status(200).json(userStats);
});

// Start the Express server
app.listen(SERVER_PORT, () => {
	console.log(`Server is running on http://localhost:${SERVER_PORT}`);
	console.log(
		"Navigate to the above URL in your browser to test the database connection.",
	);
});
