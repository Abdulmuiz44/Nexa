import Database from "better-sqlite3"
import { readFileSync } from "fs"
import { join } from "path"

const dbPath = process.env.DATABASE_URL || join(process.cwd(), "data", "nexa.db")
export const db = new Database(dbPath)

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL")
db.pragma("synchronous = NORMAL")
db.pragma("cache_size = 1000")
db.pragma("temp_store = MEMORY")

// Initialize database schema
export function initializeDatabase() {
  try {
    const schemaPath = join(process.cwd(), "scripts", "001-initial-schema.sql")
    const schema = readFileSync(schemaPath, "utf8")
    db.exec(schema)
    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Failed to initialize database:", error)
    throw error
  }
}

// Graceful shutdown
process.on("exit", () => db.close())
process.on("SIGHUP", () => process.exit(128 + 1))
process.on("SIGINT", () => process.exit(128 + 2))
process.on("SIGTERM", () => process.exit(128 + 15))
