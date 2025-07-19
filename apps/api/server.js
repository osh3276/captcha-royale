import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import pg from "pg";
const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET =
	process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Database connection
const pool = new Pool({
	connectionString:
		process.env.DB_URL ||
		"postgresql://captcha_royale_user:lbukpE2V5zUX6fueLfBq79A9Dukwdiim@dpg-d1thep3ipnbc73cb36d0-a.oregon-postgres.render.com/captcha_royale",
	ssl: { rejectUnauthorized: false },
});

// Initialize database table
const initDB = async () => {
	try {
		await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
		console.log("Database table initialized");
	} catch (error) {
		console.error("Database initialization error:", error);
	}
};

initDB();

// Middleware
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

// Routes
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

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
