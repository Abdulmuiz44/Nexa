import { initializeDatabase } from "../lib/db"

async function main() {
  try {
    console.log("Initializing database...")
    await initializeDatabase()
    console.log("Database initialization completed successfully!")
  } catch (error) {
    console.error("Database initialization failed:", error)
    process.exit(1)
  }
}

main()
