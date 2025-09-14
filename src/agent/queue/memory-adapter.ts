import type { JobQueue } from "./interface"
import type { Task } from "../../types/agent"

export class MemoryQueueAdapter implements JobQueue {
  private queue: Task[] = []

  async add(task: Task): Promise<void> {
    // Insert task in priority order (higher priority first)
    const insertIndex = this.queue.findIndex((t) => t.priority < task.priority)
    if (insertIndex === -1) {
      this.queue.push(task)
    } else {
      this.queue.splice(insertIndex, 0, task)
    }
  }

  async getNext(): Promise<Task | null> {
    return this.queue.shift() || null
  }

  async remove(taskId: string): Promise<void> {
    const index = this.queue.findIndex((task) => task.id === taskId)
    if (index !== -1) {
      this.queue.splice(index, 1)
    }
  }

  async clear(): Promise<void> {
    this.queue = []
  }

  async size(): Promise<number> {
    return this.queue.length
  }

  // Additional methods for debugging
  peek(): Task | null {
    return this.queue[0] || null
  }

  getAll(): Task[] {
    return [...this.queue]
  }
}
