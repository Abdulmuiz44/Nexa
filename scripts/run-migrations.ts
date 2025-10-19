import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!)

async function runMigrations() {
  console.log("Running database migrations...");

  try {
    await sql`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';`;
    console.log("✅ Added 'role' column to 'users' table.");

    await sql`UPDATE users SET role = 'admin' WHERE email = 'abdulmuizproject@gmail.com';`;
    console.log("✅ Set user 'abdulmuizproject@gmail.com' as admin.");

    console.log("Database migrations completed successfully!");
  } catch (error) {
    console.error("Database migrations failed:", error);
    process.exit(1);
  }
}

runMigrations();
