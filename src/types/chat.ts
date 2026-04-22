// Chat types for Latzu Platform

export type MessageRole = "user" | "assistant" | "system" | "function" | "agent_action";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  functionCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
  isStreaming?: boolean;
  suggestions?: string[];
}

export interface ChatSession {
  sessionId: string;
  tenantId: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  hasActiveFlow: boolean;
  metadata?: Record<string, unknown>;
}

export interface FlowStep {
  stepId: string;
  stepType: "question" | "validation" | "action" | "decision" | "complete";
  prompt: string;
  required: boolean;
  validationRules?: Record<string, unknown>;
  nextStep?: string;
  conditions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface FlowContext {
  flowId: string;
  currentStep: string;
  collectedData: Record<string, unknown>;
  steps: FlowStep[];
  completed: boolean;
  startedAt: Date;
  completedAt?: Date;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  requiresInput: boolean;
  flowStep?: FlowStep;
  suggestions: string[];
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface ProactiveSuggestion {
  id: string;
  type: "task" | "concept" | "exercise" | "reminder" | "tip";
  title: string;
  description: string;
  action?: {
    label: string;
    prompt?: string;
    href?: string;
  };
  priority: number;
  expiresAt?: Date;
  context?: {
    topic?: string;
    lessonId?: string;
    conceptId?: string;
  };
}

export interface CreateSessionRequest {
  tenantId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface SendMessageRequest {
  sessionId: string;
  tenantId: string;
  message: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// Streaming types
export interface StreamChunk {
  type: "content" | "suggestion" | "suggestions" | "function_call" | "done" | "error";
  content?: string;
  suggestion?: ProactiveSuggestion;
  suggestions?: string[];
  functionCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
  error?: string;
}
