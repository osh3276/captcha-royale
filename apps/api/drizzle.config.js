import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * @type { import("drizzle-kit").Config }
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.js',
  out: './drizzle',
  dbCredentials: {
    // This connection string is used by Drizzle Kit to connect to your database.
    // Make sure to set the DATABASE_URL environment variable.
    // For local development, you can create a .env file in this directory
    // with the following content:
    // DATABASE_URL='postgresql://postgres:your_password@db.vcelgwzcxuqstjsxgvvt.supabase.co:5432/postgres'
    url: process.env.DATABASE_URL,
  },
  // This allows Drizzle Kit to print more detailed information to the console.
  verbose: true,
  // This ensures that Drizzle Kit will fail if it encounters any issues.
  strict: true,
});
