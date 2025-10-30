import { supabaseServer } from '@/src/lib/supabaseServer';

export type LogLevel = 'info' | 'warn' | 'error';
export type LogEvent = 'user_action' | 'ai_response' | 'system' | 'error';

export interface LogEntry {
  id?: string;
  userId?: string;
  event: LogEvent;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

class Logger {
  private userId?: string;

  constructor(userId?: string) {
    this.userId = userId;
  }

  private formatMessage(event: LogEvent, message: string, metadata?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const level = this.getLogLevel(event);
    const userInfo = this.userId ? ` [User: ${this.userId}]` : '';

    let formattedMessage = `[${timestamp}] ${level.toUpperCase()}${userInfo} [${event}]: ${message}`;

    if (metadata) {
      formattedMessage += ` | Metadata: ${JSON.stringify(metadata)}`;
    }

    return formattedMessage;
  }

  private getLogLevel(event: LogEvent): LogLevel {
    switch (event) {
      case 'error':
        return 'error';
      case 'user_action':
      case 'ai_response':
        return 'info';
      case 'system':
        return 'info';
      default:
        return 'info';
    }
  }

  async logEvent(event: LogEvent, message: string, metadata?: Record<string, any>) {
    const logEntry: LogEntry = {
      userId: this.userId,
      event,
      level: this.getLogLevel(event),
      message,
      metadata,
      timestamp: new Date()
    };

    // Console logging
    const formattedMessage = this.formatMessage(event, message, metadata);
    console.log(formattedMessage);

    // Database logging (async, don't wait)
    try {
      await supabaseServer
        .from('logs')
        .insert({
          user_id: this.userId,
          event,
          level: logEntry.level,
          message,
          metadata,
          created_at: logEntry.timestamp.toISOString()
        });
    } catch (error) {
      // Silently fail database logging to avoid breaking the app
      console.error('Failed to save log to database:', error);
    }
  }

  // Convenience methods
  async info(event: LogEvent, message: string, metadata?: Record<string, any>) {
    await this.logEvent(event, message, metadata);
  }

  async warn(event: LogEvent, message: string, metadata?: Record<string, any>) {
    await this.logEvent(event, message, metadata);
  }

  async error(event: LogEvent, message: string, metadata?: Record<string, any>) {
    await this.logEvent(event, message, metadata);
  }
}

// Export a function to create logger instances
export function createLogger(userId?: string): Logger {
  return new Logger(userId);
}

// Export default logger instance
export const logger = createLogger();
