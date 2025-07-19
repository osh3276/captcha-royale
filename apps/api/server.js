import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import pg from "pg";
import dotenv from "dotenv";
import http from "http";
import SocketHandler from "./socket.js";

// Load environment variables from .env file
dotenv.config();

const app = express();

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

// Database connection
const pool = new pg.Pool({
	connectionString: process.env.DB_URL,
	ssl: {
		rejectUnauthorized: false,
	},
});

// In-memory user store (replace with database in production)
const users = new Map();

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

		if (users.has(username)) {
			return res.status(409).json({ error: "Username already exists" });
		}

		const hashedPassword = await bcrypt.hash(password, 12);
		users.set(username, { username, password: hashedPassword });

		res.status(201).json({ message: "User registered successfully" });
	} catch (error) {
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

		const user = users.get(username);
		if (!user || !(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const token = jwt.sign({ username: user.username }, JWT_SECRET, {
			expiresIn: "1h",
		});

		res.json({ token, expiresIn: "1h" });
	} catch (error) {
		res.status(500).json({ error: "Login failed" });
	}
});

// Protected route example
app.get("/profile", authenticateToken, (req, res) => {
	res.json({
		message: "Protected route accessed",
		user: req.user.username,
	});
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