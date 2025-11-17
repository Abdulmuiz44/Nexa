export type LogLevel = 'info' | 'warn' | 'error';
export type LogEvent =
  | 'user_action'
  | 'ai_response'
  | 'system'
  | 'error'
  | 'analytics_event'
  | 'payment'
  | 'oauth'
  | 'composio'
  | 'agent';

/**
 * Log entry interface for database storage
 */
export interface LogEntry {
  id?: string;
  userId?: string;
  event: LogEvent;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Flexible logger class that supports multiple usage patterns
 */
class Logger {
  private userId?: string;

  constructor(userId?: string) {
    this.userId = userId;
  }

  /**
   * Format log message with timestamp, level, and context
   */
  private formatMessage(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>
  ): string {
    const timestamp = new Date().toISOString();
    const userInfo = this.userId ? ` [User: ${this.userId}]` : '';
    let formattedMessage = `[${timestamp}] ${level.toUpperCase()}${userInfo}: ${message}`;

    if (metadata && Object.keys(metadata).length > 0) {
      formattedMessage += ` | ${JSON.stringify(metadata)}`;
    }

    return formattedMessage;
  }

  /**
   * Determine log level from event type
   */
  private getLogLevelFromEvent(event: LogEvent): LogLevel {
    if (event === 'error') return 'error';
    return 'info';
  }

  /**
   * Core logging method - supports flexible arguments
   */
  info(message: string, metadata?: Record<string, unknown>): void;
  info(event: LogEvent, message: string, metadata?: Record<string, unknown>): void;
  info(
    messageOrEvent: string,
    messageOrMetadata?: string | Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): void {
    const { message, meta } = this.parseArgs(messageOrEvent, messageOrMetadata, metadata);
    const formatted = this.formatMessage('info', message, meta);
    console.log(formatted);
  }

  /**
   * Warning level logging - supports flexible arguments
   */
  warn(message: string, metadata?: Record<string, unknown>): void;
  warn(event: LogEvent, message: string, metadata?: Record<string, unknown>): void;
  warn(
    messageOrEvent: string,
    messageOrMetadata?: string | Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): void {
    const { message, meta } = this.parseArgs(messageOrEvent, messageOrMetadata, metadata);
    const formatted = this.formatMessage('warn', message, meta);
    console.warn(formatted);
  }

  /**
   * Error level logging - supports flexible arguments
   */
  error(message: string, metadata?: Record<string, unknown>): void;
  error(event: LogEvent, message: string, metadata?: Record<string, unknown>): void;
  error(
    messageOrEvent: string,
    messageOrMetadata?: string | Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): void {
    const { message, meta } = this.parseArgs(messageOrEvent, messageOrMetadata, metadata);
    const formatted = this.formatMessage('error', message, meta);
    console.error(formatted);
  }

  /**
   * Parse flexible argument patterns
   * Pattern 1: (message, metadata?)
   * Pattern 2: (event, message, metadata?)
   */
  private parseArgs(
    arg1: string,
    arg2?: string | Record<string, unknown>,
    arg3?: Record<string, unknown>
  ): { message: string; meta?: Record<string, unknown> } {
    // If arg2 is an object, we're in pattern 1
    if (typeof arg2 === 'object' && arg2 !== null) {
      return { message: arg1, meta: arg2 };
    }
    // Otherwise pattern 2
    if (typeof arg2 === 'string') {
      return { message: arg2, meta: arg3 };
    }
    // Just message
    return { message: arg1 };
  }
}

/**
 * Create a logger instance (optionally with user context)
 */
export function createLogger(userId?: string): Logger {
  return new Logger(userId);
}

/**
 * Default logger instance
 */
export const logger = createLogger();
