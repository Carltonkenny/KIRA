/**
 * Shared TypeScript type definitions for the KIRA frontend.
 */

export interface Memory {
  id: string;
  project_id?: string;
  category: string;
  fact: string;
  created_at?: string;
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
  intent?: string;
  domain?: string;
  new_memories?: string[];
  quality_scores?: {
    specificity?: number;
    clarity?: number;
    actionability?: number;
  };
  latency_ms?: number;
  created_at?: string;
  suggested_actions?: string[];
}

export interface AuthUser {
  user_id: string;
  email: string;
  session_id: string;
  is_new: boolean;
  memories_count?: number;
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

export interface GraphNode {
  id: string;
  label: string;
  type: 'project' | 'memory' | 'agent';
  color?: string;
  size?: number;
  project_id?: string;
  category?: string;
  full_fact?: string;
  call_count?: number;
  created_at?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  color?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    total_nodes: number;
    total_edges: number;
    project_count: number;
    memory_count: number;
    agent_count: number;
  };
}
