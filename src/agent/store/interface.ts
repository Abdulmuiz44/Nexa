import type { AgentState, Task, HumanFeedback } from "../../types/agent"

export interface AgentStore {
  // Agent state management
  saveState(state: AgentState): Promise<void>
  loadState(agentId: string): Promise<AgentState | null>
  deleteState(agentId: string): Promise<void>

  // Task management
  saveTask(task: Task): Promise<void>
  loadTask(taskId: string): Promise<Task | null>
  loadTasksByAgent(agentId: string): Promise<Task[]>
  updateTaskStatus(taskId: string, status: string): Promise<void>

  // Feedback management
  saveFeedback(feedback: HumanFeedback): Promise<void>
  loadFeedback(taskId: string): Promise<HumanFeedback[]>

  // Analytics and metrics
  getAgentMetrics(agentId: string): Promise<any>
  getTaskHistory(agentId: string, limit?: number): Promise<Task[]>
}
