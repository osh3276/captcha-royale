import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET =
	process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware
app.use(express.json());

// Rate limiting
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5, // 5 attempts per window
	message: { error: "Too many authentication attempts" },
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

// Routes
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

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
