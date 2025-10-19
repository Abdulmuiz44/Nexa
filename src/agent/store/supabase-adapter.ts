import { supabase } from "@/src/lib/db"
import type { AgentStore } from "./interface"
import type { AgentState, Task, HumanFeedback } from "../../types/agent"

export class SupabaseAdapter implements AgentStore {
  async saveState(state: AgentState): Promise<void> {
    const { error } = await supabase.from('agent_states').upsert(state)
    if (error) throw error
  }

  async loadState(agentId: string): Promise<AgentState | null> {
    const { data, error } = await supabase
      .from('agent_states')
      .select('*')
      .eq('id', agentId)
      .single()
    if (error) return null
    return data
  }

  async deleteState(agentId: string): Promise<void> {
    const { error } = await supabase.from('agent_states').delete().eq('id', agentId)
    if (error) throw error
  }

  async saveTask(task: Task): Promise<void> {
    const { error } = await supabase.from('tasks').upsert(task)
    if (error) throw error
  }

  async loadTask(taskId: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()
    if (error) return null
    return data
  }

  async loadTasksByAgent(agentId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
    if (error) return []
    return data
  }

  async updateTaskStatus(taskId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId)
    if (error) throw error
  }

  async saveFeedback(feedback: HumanFeedback): Promise<void> {
    const { error } = await supabase.from('feedback').insert(feedback)
    if (error) throw error
  }

  async loadFeedback(taskId: string): Promise<HumanFeedback[]> {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('task_id', taskId)
      .order('timestamp', { ascending: false })
    if (error) return []
    return data
  }

  async getAgentMetrics(agentId: string): Promise<any> {
    const { data, error } = await supabase.rpc('get_agent_metrics', { agent_id: agentId })
    if (error) return {}
    return data
  }

  async getTaskHistory(agentId: string, limit = 100): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return data
  }

  async close(): Promise<void> {
    // Supabase client doesn't need to be closed
    return Promise.resolve()
  }
}
