import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import http from "http";
import SocketHandler from "./socket.js";

// Load environment variables from .env file
dotenv.config();

const app = express();

// The server will run on port 3001 to avoid conflicts with other common ports.
const SERVER_PORT = process.env.SERVER_PORT || 3001;

const server = http.createServer(app);
server.listen(SERVER_PORT, () => {
    console.log(`Server is running on http://localhost:${SERVER_PORT}`);
});
new SocketHandler(server);

// Middleware to parse JSON request bodies
app.use(express.json());

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

});

// Route to join an existing game
app.post("/join-game", (req, res) => {
	
});

// Route to get user statistics by ID
app.get("/user/:id", (req, res) => {
	
});
