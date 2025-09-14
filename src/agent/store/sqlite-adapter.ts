import { Database } from "sqlite3"
import type { AgentStore } from "./interface"
import type { AgentState, Task, HumanFeedback } from "../../types/agent"

export class SQLiteAdapter implements AgentStore {
  private db: Database

  constructor(dbPath = "./data/nexa.db") {
    this.db = new Database(dbPath)
    this.initializeTables()
  }

  private async initializeTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Agent states table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS agent_states (
            id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            current_task TEXT,
            completed_tasks TEXT,
            failed_tasks TEXT,
            created_at DATETIME,
            updated_at DATETIME,
            metadata TEXT
          )
        `)

        // Tasks table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            agent_id TEXT,
            type TEXT NOT NULL,
            payload TEXT,
            status TEXT NOT NULL,
            priority INTEGER,
            scheduled_at DATETIME,
            started_at DATETIME,
            completed_at DATETIME,
            result TEXT,
            error TEXT,
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 3,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `)

        // Feedback table
        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT NOT NULL,
            rating INTEGER NOT NULL,
            comments TEXT,
            suggestions TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `,
          (err) => {
            if (err) reject(err)
            else resolve()
          },
        )
      })
    })
  }

  async saveState(state: AgentState): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO agent_states 
        (id, status, current_task, completed_tasks, failed_tasks, created_at, updated_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      stmt.run(
        [
          state.id,
          state.status,
          state.currentTask ? JSON.stringify(state.currentTask) : null,
          JSON.stringify(state.completedTasks),
          JSON.stringify(state.failedTasks),
          state.createdAt.toISOString(),
          state.updatedAt.toISOString(),
          JSON.stringify(state.metadata),
        ],
        (err) => {
          if (err) reject(err)
          else resolve()
        },
      )

      stmt.finalize()
    })
  }

  async loadState(agentId: string): Promise<AgentState | null> {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM agent_states WHERE id = ?", [agentId], (err, row: any) => {
        if (err) {
          reject(err)
          return
        }

        if (!row) {
          resolve(null)
          return
        }

        const state: AgentState = {
          id: row.id,
          status: row.status,
          currentTask: row.current_task ? JSON.parse(row.current_task) : undefined,
          completedTasks: JSON.parse(row.completed_tasks || "[]"),
          failedTasks: JSON.parse(row.failed_tasks || "[]"),
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          metadata: JSON.parse(row.metadata || "{}"),
        }

        resolve(state)
      })
    })
  }

  async deleteState(agentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM agent_states WHERE id = ?", [agentId], (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async saveTask(task: Task): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO tasks 
        (id, type, payload, status, priority, scheduled_at, started_at, completed_at, result, error, retry_count, max_retries)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      stmt.run(
        [
          task.id,
          task.type,
          JSON.stringify(task.payload),
          task.status,
          task.priority,
          task.scheduledAt?.toISOString(),
          task.startedAt?.toISOString(),
          task.completedAt?.toISOString(),
          task.result ? JSON.stringify(task.result) : null,
          task.error,
          task.retryCount,
          task.maxRetries,
        ],
        (err) => {
          if (err) reject(err)
          else resolve()
        },
      )

      stmt.finalize()
    })
  }

  async loadTask(taskId: string): Promise<Task | null> {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM tasks WHERE id = ?", [taskId], (err, row: any) => {
        if (err) {
          reject(err)
          return
        }

        if (!row) {
          resolve(null)
          return
        }

        const task: Task = {
          id: row.id,
          type: row.type,
          payload: JSON.parse(row.payload),
          status: row.status,
          priority: row.priority,
          scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
          startedAt: row.started_at ? new Date(row.started_at) : undefined,
          completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
          result: row.result ? JSON.parse(row.result) : undefined,
          error: row.error,
          retryCount: row.retry_count,
          maxRetries: row.max_retries,
        }

        resolve(task)
      })
    })
  }

  async loadTasksByAgent(agentId: string): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM tasks WHERE agent_id = ? ORDER BY created_at DESC", [agentId], (err, rows: any[]) => {
        if (err) {
          reject(err)
          return
        }

        const tasks = rows.map((row) => ({
          id: row.id,
          type: row.type,
          payload: JSON.parse(row.payload),
          status: row.status,
          priority: row.priority,
          scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
          startedAt: row.started_at ? new Date(row.started_at) : undefined,
          completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
          result: row.result ? JSON.parse(row.result) : undefined,
          error: row.error,
          retryCount: row.retry_count,
          maxRetries: row.max_retries,
        }))

        resolve(tasks)
      })
    })
  }

  async updateTaskStatus(taskId: string, status: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run("UPDATE tasks SET status = ? WHERE id = ?", [status, taskId], (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async saveFeedback(feedback: HumanFeedback): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO feedback (task_id, rating, comments, suggestions, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `)

      stmt.run(
        [feedback.taskId, feedback.rating, feedback.comments, feedback.suggestions, feedback.timestamp.toISOString()],
        (err) => {
          if (err) reject(err)
          else resolve()
        },
      )

      stmt.finalize()
    })
  }

  async loadFeedback(taskId: string): Promise<HumanFeedback[]> {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM feedback WHERE task_id = ? ORDER BY timestamp DESC", [taskId], (err, rows: any[]) => {
        if (err) {
          reject(err)
          return
        }

        const feedback = rows.map((row) => ({
          taskId: row.task_id,
          rating: row.rating,
          comments: row.comments,
          suggestions: row.suggestions,
          timestamp: new Date(row.timestamp),
        }))

        resolve(feedback)
      })
    })
  }

  async getAgentMetrics(agentId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `
        SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_tasks,
          AVG(CASE WHEN completed_at IS NOT NULL AND started_at IS NOT NULL 
              THEN (julianday(completed_at) - julianday(started_at)) * 86400000 
              ELSE NULL END) as avg_execution_time
        FROM tasks WHERE agent_id = ?
      `,
        [agentId],
        (err, row: any) => {
          if (err) {
            reject(err)
            return
          }

          resolve({
            totalTasks: row.total_tasks || 0,
            completedTasks: row.completed_tasks || 0,
            failedTasks: row.failed_tasks || 0,
            averageExecutionTime: row.avg_execution_time || 0,
            successRate: row.total_tasks > 0 ? row.completed_tasks / row.total_tasks : 0,
          })
        },
      )
    })
  }

  async getTaskHistory(agentId: string, limit = 100): Promise<Task[]> {
    return this.loadTasksByAgent(agentId)
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.db.close(() => resolve())
    })
  }
}
