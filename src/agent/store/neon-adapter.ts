import { db } from "@/lib/db"
import type { AgentStore } from "./interface"
import type { AgentState, Task, HumanFeedback } from "../../types/agent"

export class NeonAdapter implements AgentStore {
  async saveState(state: AgentState): Promise<void> {
    await db`
      INSERT INTO agent_states 
      (id, status, current_task, completed_tasks, failed_tasks, created_at, updated_at, metadata, user_id)
      VALUES (${state.id}, ${state.status}, ${JSON.stringify(state.currentTask)}, 
              ${JSON.stringify(state.completedTasks)}, ${JSON.stringify(state.failedTasks)},
              ${state.createdAt.toISOString()}, ${state.updatedAt.toISOString()}, 
              ${JSON.stringify(state.metadata)}, ${state.userId || null})
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        current_task = EXCLUDED.current_task,
        completed_tasks = EXCLUDED.completed_tasks,
        failed_tasks = EXCLUDED.failed_tasks,
        updated_at = EXCLUDED.updated_at,
        metadata = EXCLUDED.metadata
    `
  }

  async loadState(agentId: string): Promise<AgentState | null> {
    const results = await db`SELECT * FROM agent_states WHERE id = ${agentId}`
    const row = results[0]

    if (!row) return null

    return {
      id: row.id,
      status: row.status,
      currentTask: row.current_task ? JSON.parse(row.current_task) : undefined,
      completedTasks: JSON.parse(row.completed_tasks || "[]"),
      failedTasks: JSON.parse(row.failed_tasks || "[]"),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      metadata: JSON.parse(row.metadata || "{}"),
      userId: row.user_id,
    }
  }

  async deleteState(agentId: string): Promise<void> {
    await db`DELETE FROM agent_states WHERE id = ${agentId}`
  }

  async saveTask(task: Task): Promise<void> {
    await db`
      INSERT INTO tasks 
      (id, agent_id, type, payload, status, priority, scheduled_at, started_at, completed_at, result, error, retry_count, max_retries)
      VALUES (${task.id}, ${task.agentId || null}, ${task.type}, ${JSON.stringify(task.payload)}, 
              ${task.status}, ${task.priority}, ${task.scheduledAt?.toISOString()}, 
              ${task.startedAt?.toISOString()}, ${task.completedAt?.toISOString()},
              ${task.result ? JSON.stringify(task.result) : null}, ${task.error}, 
              ${task.retryCount}, ${task.maxRetries})
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        started_at = EXCLUDED.started_at,
        completed_at = EXCLUDED.completed_at,
        result = EXCLUDED.result,
        error = EXCLUDED.error,
        retry_count = EXCLUDED.retry_count
    `
  }

  async loadTask(taskId: string): Promise<Task | null> {
    const results = await db`SELECT * FROM tasks WHERE id = ${taskId}`
    const row = results[0]

    if (!row) return null

    return {
      id: row.id,
      agentId: row.agent_id,
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
  }

  async loadTasksByAgent(agentId: string): Promise<Task[]> {
    const rows = await db`SELECT * FROM tasks WHERE agent_id = ${agentId} ORDER BY scheduled_at DESC`

    return rows.map((row) => ({
      id: row.id,
      agentId: row.agent_id,
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
  }

  async updateTaskStatus(taskId: string, status: string): Promise<void> {
    await db`UPDATE tasks SET status = ${status} WHERE id = ${taskId}`
  }

  async saveFeedback(feedback: HumanFeedback): Promise<void> {
    await db`
      INSERT INTO feedback (task_id, rating, comments, suggestions, timestamp)
      VALUES (${feedback.taskId}, ${feedback.rating}, ${feedback.comments}, 
              ${feedback.suggestions}, ${feedback.timestamp.toISOString()})
    `
  }

  async loadFeedback(taskId: string): Promise<HumanFeedback[]> {
    const rows = await db`SELECT * FROM feedback WHERE task_id = ${taskId} ORDER BY timestamp DESC`

    return rows.map((row) => ({
      taskId: row.task_id,
      rating: row.rating,
      comments: row.comments,
      suggestions: row.suggestions,
      timestamp: new Date(row.timestamp),
    }))
  }

  async getAgentMetrics(agentId: string): Promise<any> {
    const results = await db`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_tasks,
        AVG(CASE WHEN completed_at IS NOT NULL AND started_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000 
            ELSE NULL END) as avg_execution_time
      FROM tasks WHERE agent_id = ${agentId}
    `

    const row = results[0]

    return {
      totalTasks: Number.parseInt(row.total_tasks) || 0,
      completedTasks: Number.parseInt(row.completed_tasks) || 0,
      failedTasks: Number.parseInt(row.failed_tasks) || 0,
      averageExecutionTime: Number.parseFloat(row.avg_execution_time) || 0,
      successRate: row.total_tasks > 0 ? row.completed_tasks / row.total_tasks : 0,
    }
  }

  async getTaskHistory(agentId: string, limit = 100): Promise<Task[]> {
    const rows = await db`
      SELECT * FROM tasks 
      WHERE agent_id = ${agentId} 
      ORDER BY scheduled_at DESC 
      LIMIT ${limit}
    `

    return rows.map((row) => ({
      id: row.id,
      agentId: row.agent_id,
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
  }

  async close(): Promise<void> {
    // Neon connections are automatically managed
  }
}
