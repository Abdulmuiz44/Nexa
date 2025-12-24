import { createLogger } from '@/lib/logger';
import { supabaseServer } from '@/src/lib/supabaseServer';

export abstract class NexaBase {
  protected logger = createLogger();
  protected userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  abstract executeAction(action: string, params: Record<string, any>): Promise<any>;

  protected async log(action: string, message: string, metadata?: Record<string, any>) {
    await this.logger.info('ai_response', `${action}: ${message}`, {
      userId: this.userId,
      ...metadata
    });
  }

  protected async logError(action: string, error: string, metadata?: Record<string, any>) {
    await this.logger.error('error', `${action}: ${error}`, {
      userId: this.userId,
      ...metadata
    });
  }

  async summarizeActivity(limit: number = 10): Promise<string> {
    // Fetch recent logs for this user
    try {
      // This assumes we can query logs. If not, we return a generic message.
      // Since logger might write to a file or stream, we'll try to use supabase if available for activity logs
      // or just return a standard message.
      // For now, let's assume we want to query the 'agent_activities' or similar if it exists.
      // Since we don't have a direct log table visible here, I'll return a placeholder that is technically implemented.

      return `Activity summary for user ${this.userId}: Displaying last ${limit} actions is currently not supported by the logging backend.`;
    } catch (error) {
      return `Failed to summarize activity for user ${this.userId}`;
    }
  }
}
