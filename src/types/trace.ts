export interface ClaudeTraceEntry {
  request: TraceRequest;
  response: TraceResponse;
  logged_at: string;
}

export interface TraceRequest {
  timestamp: number;
  method: "POST";
  url: string;
  headers: Record<string, string>;
  body: {
    model: string;
    max_tokens: number;
    messages: Array<{
      role: "user" | "assistant";
      content: string | Array<{type: string; [key: string]: unknown}>;
    }>;
    system?: Array<{
      type: "text";
      text: string;
      cache_control?: {type: "ephemeral"};
    }>;
    temperature?: number;
    metadata: {user_id: string};
    stream?: boolean;
    tools?: Array<{
      name: string;
      description: string;
      input_schema: Record<string, unknown>;
    }>;
  };
}

export interface TraceResponse {
  timestamp: number;
  status_code: number;
  headers: Record<string, string>;
  body?: {
    model: string;
    id: string;
    type: "message";
    role: "assistant";
    content: Array<{type: string; text?: string; [key: string]: unknown}>;
    stop_reason: string | null;
    usage: TokenUsage;
  };
  body_raw?: string;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  cache_creation: {
    ephemeral_5m_input_tokens: number;
    ephemeral_1h_input_tokens: number;
  };
  service_tier: string;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  filename: string;
  requests: ClaudeTraceEntry[];
  totalTokensUsed: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreationTokens: number;
  totalCacheReadTokens: number;
  totalCacheCreation5mTokens: number;
  totalCacheCreation1hTokens: number;
  totalRequests: number;
  duration: number;
  startTime: number;
  endTime: number;
  modelsUsed: string[];
  toolsAvailable: string[];
  toolsUsed: string[];
  hasErrors: boolean;
  conversationCount?: number;
}

export interface DirectoryHandle extends FileSystemDirectoryHandle {
  name: string;
  kind: 'directory';
}

export interface FileHandle extends FileSystemFileHandle {
  name: string;
  kind: 'file';
}

export interface ParsedSession {
  sessionId: string;
  metadata: SessionMetadata;
  filePath: string;
}

export interface SessionMetadata {
  userId: string;
  requestCount: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreationTokens: number;
  totalCacheReadTokens: number;
  totalCacheCreation5mTokens: number;
  totalCacheCreation1hTokens: number;
  duration: number;
  startTime: number;
  endTime: number;
  modelsUsed: Set<string>;
  toolsAvailable: Set<string>;
  toolsUsed: Set<string>;
  hasErrors: boolean;
  conversationCount?: number;
}

export interface ConversationGroup {
  id: string; // Hash of normalized first message
  requests: ClaudeTraceEntry[];
  firstUserMessage: string;
  longestRequestIndex: number;
  models: Set<string>;
  totalMessages: number;
}

export interface ConversationMetadata {
  conversationCount: number;
  longestConversation: {
    firstUserMessage: string;
    messageCount: number;
  } | null;
}