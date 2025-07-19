import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import pg from "pg";
const { Pool } = pg;
import dotenv from "dotenv";
import http from "http";
import SocketHandler from "./socket.js";

// Load environment variables from .env file
dotenv.config();

const app = express();

// Database connection
const pool = new Pool({
	connectionString:
		process.env.DB_URL ||
		"postgresql://captcha_royale_user:lbukpE2V5zUX6fueLfBq79A9Dukwdiim@dpg-d1thep3ipnbc73cb36d0-a.oregon-postgres.render.com/captcha_royale",
	ssl: { rejectUnauthorized: false },
});


// Middleware
// The server will run on port 3001 to avoid conflicts with other common ports.
const SERVER_PORT = process.env.SERVER_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to parse JSON request bodies
app.use(express.json());

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
new SocketHandler(server);

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

app.post("/create_game", authenticateToken, async (req, res) => {
	try {
		const userId = req.user.id;

		// Insert new game with the authenticated user as user1
		const result = await pool.query(
			"INSERT INTO games (user1) VALUES ($1) RETURNING id, game_code, created_at",
			[userId],
		);

		const game = result.rows[0];

		res.status(201).json({
			message: "Game created successfully",
			game: {
				id: game.id,
				game_code: game.game_code,
				created_at: game.created_at,
				user1: userId,
				user2: null,
				winner: null,
			},
		});
	} catch (error) {
		console.error("Create game error:", error);
		res.status(500).json({ error: "Failed to create game" });
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

// Game routes
app.post("/create-game", (req, res) => {
	// TODO: Implement create game logic
	res.status(501).json({ message: "Create game endpoint - implementation pending" });
});

app.post("/join-game", (req, res) => {
	// TODO: Implement join game logic
	res.status(501).json({ message: "Join game endpoint - implementation pending" });
});

app.get("/user/:id", (req, res) => {
	// TODO: Implement get user statistics logic
	res.status(501).json({ message: "Get user statistics endpoint - implementation pending" });
});