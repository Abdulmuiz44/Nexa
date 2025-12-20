/**
 * Agent Types and Interfaces for the Nexa Agentic System
 */

export interface AgentState {
  userId: string;
  userBrief: string;
  toolkits: string[]; // 'twitter', 'reddit', etc.
  contentDraft?: string;
  contentVariations?: Record<string, string>; // platform -> content
  executionLog: string[];
  toolCalls?: any[];
  error?: string;
  timestamp: number;
}

export interface AgentToolSchema {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}

export interface AgentResponse {
  success: boolean;
  message: string;
  data?: any;
  executionLog: string[];
  error?: string;
}

export interface ContentGenerationRequest {
  userId: string;
  brief: string;
  toolkits: string[]; // ['twitter', 'reddit']
  tone?: 'professional' | 'casual' | 'humorous';
  maxLength?: number;
  additionalContext?: string;
}

export interface ContentGenerationResult {
  twitter?: string;
  reddit?: string;
  linkedin?: string;
  [key: string]: any; // Allow other platforms
  analysis?: string;
  metadata: {
    generatedAt: number;
    model: string;
    tokensUsed: number;
  };
}
