import pg from "pg";
const { Pool } = pg;
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Database connection
const pool = new Pool({
	connectionString: process.env.DB_URL,
	ssl: { rejectUnauthorized: false },
});

export default pool;
