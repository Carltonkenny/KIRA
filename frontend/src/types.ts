/**
 * Shared TypeScript type definitions for the KIRA frontend.
 */

export interface Memory {
  id: string;
  category: string;
  fact: string;
}

export interface Profile {
  primary_use: string;
  preferred_tone: string;
  density_preference: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  refined_prompt?: string;
}

export interface MCPServer {
  name: string;
  command: string;
  args: string[];
  status: 'connected' | 'disconnected';
  pid: number | null;
}

export interface MCPLog {
  id: string;
  tool_name: string;
  agent_name: string;
  arguments: string;
  duration_ms: number;
  status: string;
  created_at: string;
}

export interface RefinementHistoryItem {
  id: string;
  session_id: string;
  role: string;
  message: string;
  refined_prompt: string;
  created_at: string;
}
