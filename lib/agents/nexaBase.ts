import { createLogger } from '@/lib/logger';

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

  async summarizeActivity(): Promise<string> {
    // TODO: Implement activity summarization
    return `Activity summary for user ${this.userId}`;
  }
}
