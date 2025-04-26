import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Helper function to ensure tables exist
export async function ensureTablesExist() {
  try {
    // Perform a simple query to check if tables exist
    await db.query.users.findMany({ limit: 1 });
    console.log("Database tables exist");
  } catch (error) {
    console.error("Error connecting to database or tables don't exist:", error);
    console.error("Make sure to run 'npm run db:push' to create tables");
  }
}
