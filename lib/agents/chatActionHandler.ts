/**
 * Chat Action Handler
 * Parses user requests from chat and executes corresponding actions
 * Makes Nexa actually perform tasks instead of just suggesting them
 */

import { actionExecutor, ActionRequest, ActionType } from './actionExecutor';

interface UserRequest {
  message: string;
  userId: string;
  agentMode: 'manual' | 'autonomous' | 'review';
}

interface ActionableRequest {
  actionType: ActionType;
  params: Record<string, any>;
  confidence: number;
  requiresConfirmation: boolean;
}

export class ChatActionHandler {
  /**
   * Parse user message and extract actionable requests
   */
  parseUserRequest(request: UserRequest): ActionableRequest[] {
    const message = request.message.toLowerCase();
    const actions: ActionableRequest[] = [];

    // Content creation
    if (this.matches(message, ['create', 'generate', 'write', 'draft'], ['content', 'post', 'caption'])) {
      actions.push({
        actionType: 'create_content',
        params: this.extractContentParams(request.message),
        confidence: 0.9,
        requiresConfirmation: true,
      });
    }

    // Schedule post
    if (this.matches(message, ['schedule', 'post'], ['tomorrow', 'later', 'next week'])) {
      actions.push({
        actionType: 'schedule_post',
        params: this.extractScheduleParams(request.message),
        confidence: 0.85,
        requiresConfirmation: true,
      });
    }

    // Publish directly
    if (this.matches(message, ['publish', 'post', 'send'], ['now', 'immediately', 'right away'])) {
      actions.push({
        actionType: 'publish_to_platform',
        params: this.extractPublishParams(request.message),
        confidence: 0.9,
        requiresConfirmation: request.agentMode !== 'autonomous',
      });
    }

    // Performance analysis
    if (this.matches(message, ['analyze', 'check', 'show'], ['performance', 'analytics', 'metrics', 'engagement'])) {
      actions.push({
        actionType: 'analyze_performance',
        params: this.extractAnalyticsParams(request.message),
        confidence: 0.8,
        requiresConfirmation: false,
      });
    }

    // Campaign management
    if (this.matches(message, ['create', 'start', 'launch', 'manage'], ['campaign', 'promotion'])) {
      actions.push({
        actionType: 'manage_campaign',
        params: this.extractCampaignParams(request.message),
        confidence: 0.8,
        requiresConfirmation: true,
      });
    }

    // Report generation
    if (this.matches(message, ['generate', 'create', 'show', 'send'], ['report', 'summary'])) {
      actions.push({
        actionType: 'generate_report',
        params: this.extractReportParams(request.message),
        confidence: 0.85,
        requiresConfirmation: false,
      });
    }

    // Content repurposing
    if (this.matches(message, ['repurpose', 'adapt', 'reuse', 'convert'], ['content', 'post'])) {
      actions.push({
        actionType: 'repurpose_content',
        params: this.extractRepurposeParams(request.message),
        confidence: 0.8,
        requiresConfirmation: true,
      });
    }

    // Audience engagement
    if (this.matches(message, ['respond', 'engage', 'reply'], ['comment', 'message', 'question'])) {
      actions.push({
        actionType: 'engage_audience',
        params: this.extractEngageParams(request.message),
        confidence: 0.75,
        requiresConfirmation: true,
      });
    }

    return actions;
  }

  /**
   * Execute actions based on agent mode
   */
  async executeActions(
    actions: ActionableRequest[],
    userId: string,
    agentMode: 'manual' | 'autonomous' | 'review'
  ): Promise<{ responses: string[]; executedActions: any[]; pendingApprovals?: string[] }> {
    const responses: string[] = [];
    const executedActions: any[] = [];
    const pendingApprovals: string[] = [];

    for (const action of actions) {
      // Skip low confidence actions
      if (action.confidence < 0.7) {
        responses.push(`I'm not confident about this action. Could you clarify: "${action.actionType}"?`);
        continue;
      }

      // Handle based on agent mode
      if (agentMode === 'autonomous' && !action.requiresConfirmation) {
        // Execute immediately
        const result = await actionExecutor.executeAction({
          type: action.actionType,
          userId,
          params: action.params,
        });

        if (result.success) {
          responses.push(result.message || `${action.actionType} completed successfully`);
          executedActions.push(result);
        } else {
          responses.push(`Failed to execute: ${result.error}`);
        }
      } else if (agentMode === 'review' || action.requiresConfirmation) {
        // Require approval
        pendingApprovals.push(
          `Ready to ${action.actionType} with: ${JSON.stringify(action.params, null, 2)}`
        );
        responses.push(
          `I'm ready to ${this.humanizeAction(action.actionType)}. Please confirm or adjust the details.`
        );
      } else {
        // Manual mode - just report
        responses.push(
          `I can help you ${this.humanizeAction(action.actionType)}. Would you like me to proceed?`
        );
      }
    }

    return {
      responses,
      executedActions,
      pendingApprovals: pendingApprovals.length > 0 ? pendingApprovals : undefined,
    };
  }

  /**
   * Helper: Check if message matches certain keywords
   */
  private matches(message: string, mainKeywords: string[], supportKeywords?: string[]): boolean {
    const hasMain = mainKeywords.some(kw => message.includes(kw));
    if (!supportKeywords) return hasMain;
    const hasSupport = supportKeywords.some(kw => message.includes(kw));
    return hasMain && hasSupport;
  }

  /**
   * Extract parameters for different action types
   */
  private extractContentParams(message: string): Record<string, any> {
    return {
      content: message,
      tone: this.extractTone(message),
      length: this.extractLength(message),
      platforms: this.extractPlatforms(message),
    };
  }

  private extractScheduleParams(message: string): Record<string, any> {
    return {
      content: message,
      platforms: this.extractPlatforms(message),
      scheduledTime: this.extractDateTime(message),
    };
  }

  private extractPublishParams(message: string): Record<string, any> {
    return {
      content: message,
      platforms: this.extractPlatforms(message),
      media: this.extractMedia(message),
    };
  }

  private extractAnalyticsParams(message: string): Record<string, any> {
    return {
      timeRange: this.extractTimeRange(message),
      metrics: this.extractMetrics(message),
      platform: this.extractSinglePlatform(message),
    };
  }

  private extractCampaignParams(message: string): Record<string, any> {
    return {
      name: this.extractCampaignName(message),
      description: message,
      platforms: this.extractPlatforms(message),
      budget: this.extractBudget(message),
      duration: this.extractDuration(message),
      goal: this.extractGoal(message),
    };
  }

  private extractReportParams(message: string): Record<string, any> {
    return {
      reportType: this.extractReportType(message),
      timeRange: this.extractTimeRange(message),
      format: 'pdf',
      includeMetrics: true,
    };
  }

  private extractRepurposeParams(message: string): Record<string, any> {
    return {
      sourceContent: message,
      targetPlatforms: this.extractPlatforms(message),
      style: this.extractStyle(message),
    };
  }

  private extractEngageParams(message: string): Record<string, any> {
    return {
      action: this.extractEngageAction(message),
      response: message,
    };
  }

  /**
   * Extraction helpers
   */
  private extractTone(message: string): string {
    const tones = ['professional', 'casual', 'formal', 'friendly', 'humorous'];
    for (const tone of tones) {
      if (message.includes(tone)) return tone;
    }
    return 'neutral';
  }

  private extractLength(message: string): string {
    if (message.includes('short')) return 'short';
    if (message.includes('long')) return 'long';
    return 'medium';
  }

  private extractPlatforms(message: string): string[] {
    const platforms: { [key: string]: string[] } = {
      twitter: ['twitter', 'x', 'tweet'],
      reddit: ['reddit'],
      linkedin: ['linkedin'],
      instagram: ['instagram'],
      facebook: ['facebook'],
      tiktok: ['tiktok'],
    };

    const found: string[] = [];
    for (const [platform, keywords] of Object.entries(platforms)) {
      if (keywords.some(kw => message.includes(kw))) {
        found.push(platform);
      }
    }
    return found.length > 0 ? found : ['twitter']; // Default to twitter
  }

  private extractSinglePlatform(message: string): string {
    const platforms = this.extractPlatforms(message);
    return platforms[0] || 'twitter';
  }

  private extractDateTime(message: string): string {
    // Simple extraction - can be enhanced
    if (message.includes('tomorrow')) return new Date(Date.now() + 86400000).toISOString();
    if (message.includes('next week')) return new Date(Date.now() + 604800000).toISOString();
    return new Date().toISOString();
  }

  private extractTimeRange(message: string): string {
    if (message.includes('week')) return '7d';
    if (message.includes('month')) return '30d';
    if (message.includes('quarter')) return '90d';
    return '7d';
  }

  private extractMetrics(message: string): string[] {
    const metrics = [];
    if (message.includes('engagement')) metrics.push('engagement');
    if (message.includes('reach')) metrics.push('reach');
    if (message.includes('impression')) metrics.push('impressions');
    if (message.includes('click')) metrics.push('clicks');
    return metrics.length > 0 ? metrics : ['engagement', 'reach'];
  }

  private extractBudget(message: string): number {
    const match = message.match(/\$?(\d+)/);
    return match ? parseInt(match[1]) : 1000;
  }

  private extractDuration(message: string): string {
    if (message.includes('week')) return '7d';
    if (message.includes('month')) return '30d';
    return '7d';
  }

  private extractGoal(message: string): string {
    if (message.includes('engagement')) return 'engagement';
    if (message.includes('reach')) return 'reach';
    if (message.includes('conversion')) return 'conversions';
    return 'engagement';
  }

  private extractCampaignName(message: string): string {
    // Extract quoted text or first few words
    const quoted = message.match(/"([^"]*)"/);
    if (quoted) return quoted[1];
    return message.substring(0, 50);
  }

  private extractReportType(message: string): string {
    if (message.includes('engagement')) return 'engagement';
    if (message.includes('performance')) return 'performance';
    if (message.includes('campaign')) return 'campaign';
    return 'performance';
  }

  private extractStyle(message: string): string {
    if (message.includes('formal')) return 'formal';
    if (message.includes('casual')) return 'casual';
    return 'adaptive';
  }

  private extractEngageAction(message: string): string {
    if (message.includes('respond')) return 'respond';
    if (message.includes('like')) return 'like';
    if (message.includes('share')) return 'share';
    return 'respond';
  }

  private extractMedia(message: string): string[] {
    return []; // Can be enhanced to detect media mentions
  }

  /**
   * Convert action type to human readable text
   */
  private humanizeAction(actionType: ActionType): string {
    const readable: { [key: string]: string } = {
      create_content: 'create content',
      schedule_post: 'schedule a post',
      publish_to_platform: 'publish to social media',
      analyze_performance: 'analyze performance metrics',
      manage_campaign: 'create a campaign',
      generate_report: 'generate a report',
      repurpose_content: 'repurpose content',
      engage_audience: 'engage with your audience',
    };
    return readable[actionType] || actionType;
  }
}

export const chatActionHandler = new ChatActionHandler();
