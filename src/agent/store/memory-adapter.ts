import type { AgentStore, AgentState, LogEntry } from "./interface"

export class MemoryStoreAdapter implements AgentStore {
  private states = new Map<string, AgentState>()
  private logs = new Map<string, LogEntry[]>()

  async saveState(state: AgentState): Promise<void> {
    this.states.set(state.id, { ...state })
  }

  async getState(agentId: string): Promise<AgentState | null> {
    const state = this.states.get(agentId)
    return state ? { ...state } : null
  }

  async deleteState(agentId: string): Promise<void> {
    this.states.delete(agentId)
    this.logs.delete(agentId)
  }

  async saveLog(agentId: string, entry: LogEntry): Promise<void> {
    if (!this.logs.has(agentId)) {
      this.logs.set(agentId, [])
    }
    this.logs.get(agentId)!.push({ ...entry })
  }

  async getLogs(agentId: string, options: { limit?: number; offset?: number } = {}): Promise<LogEntry[]> {
    const logs = this.logs.get(agentId) || []
    const { limit = 50, offset = 0 } = options

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(offset, offset + limit)
  }

  async clearLogs(agentId: string): Promise<void> {
    this.logs.delete(agentId)
  }
}
