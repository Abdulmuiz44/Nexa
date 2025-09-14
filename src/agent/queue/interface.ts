import type { Task } from "../../types/agent"

export interface JobQueue {
  add(task: Task): Promise<void>
  getNext(): Promise<Task | null>
  remove(taskId: string): Promise<void>
  clear(): Promise<void>
  size(): Promise<number>
}
