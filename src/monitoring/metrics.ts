import { EventEmitter } from "events"

export interface MetricData {
  name: string
  value: number
  tags?: Record<string, string>
  timestamp?: Date
}

export class MetricsCollector extends EventEmitter {
  private metrics: MetricData[] = []

  record(metric: MetricData): void {
    const metricWithTimestamp = {
      ...metric,
      timestamp: metric.timestamp || new Date(),
    }

    this.metrics.push(metricWithTimestamp)
    this.emit("metric", metricWithTimestamp)
  }

  increment(name: string, tags?: Record<string, string>): void {
    this.record({ name, value: 1, tags })
  }

  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.record({ name, value, tags })
  }

  timing(name: string, duration: number, tags?: Record<string, string>): void {
    this.record({ name, value: duration, tags })
  }

  getMetrics(since?: Date): MetricData[] {
    if (!since) return [...this.metrics]

    return this.metrics.filter((m) => m.timestamp! >= since)
  }

  clear(): void {
    this.metrics = []
  }
}

export const metrics = new MetricsCollector()
