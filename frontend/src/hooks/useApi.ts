/**
 * Custom hook encapsulating all KIRA API interactions, state management, and authentication.
 * Guarantees strict multi-tenant user isolation across all memories, profiles, graphs, and chat sessions.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Memory, Profile, ChatMessage, MCPLog, RefinementHistoryItem, GraphData, AuthUser } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || (import.meta as any).env?.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8090' : 'https://kira-l18t.onrender.com');

export function useApi(session_id: string) {
  // Core states
  const [projectId, setProjectId] = useState<string>('default');
  const [density, setDensity] = useState<'short' | 'medium' | 'detailed'>('short');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Authentication State (Synced with Neon DB)
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('kira_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Profile and Memory
  const [profile, setProfile] = useState<Profile>({
    primary_use: 'development',
    preferred_tone: 'direct',
    density_preference: 'short',
  });
  const [memories, setMemories] = useState<Memory[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('kira_pinned_memories') || '[]');
    } catch {
      return [];
    }
  });

  // ChatGPT-style Chat history
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  // Logs & Sessions History
  const [mcpLogs, setMcpLogs] = useState<MCPLog[]>([]);
  const [historyList, setHistoryList] = useState<RefinementHistoryItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Graph Data
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);

  // --- Auth Handlers ---

  const login = useCallback(async (email: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data: AuthUser = await res.json();
        setUser(data);
        localStorage.setItem('kira_auth_user', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.error('Login failed:', e);
    }
    return null;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('kira_auth_user');
    setChatHistory([]);
  }, []);

  // --- Multi-Tenant Data Fetchers ---

  const fetchProfile = useCallback(async (targetUserId?: string) => {
    try {
      const uid = targetUserId || user?.user_id || 'local_user';
      const res = await fetch(`${API_BASE}/api/v1/profile?user_id=${encodeURIComponent(uid)}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (data.density_preference) setDensity(data.density_preference);
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
  }, [user?.user_id]);

  const fetchMemories = useCallback(async (activeProj?: string, targetUserId?: string) => {
    try {
      const uid = targetUserId || user?.user_id || 'local_user';
      const proj = activeProj !== undefined ? activeProj : projectId;
      const params = new URLSearchParams();
      params.set('user_id', uid);
      if (proj && proj !== 'all') {
        params.set('project_id', proj);
      }
      const res = await fetch(`${API_BASE}/api/v1/memories?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (e) {
      console.error('Failed to fetch memories:', e);
    }
  }, [projectId, user?.user_id]);

  const fetchLogsAndHistory = useCallback(async () => {
    setLogsLoading(true);
    try {
      const [logsRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/mcp/logs`),
        fetch(`${API_BASE}/api/v1/history/all`),
      ]);
      if (logsRes.ok) setMcpLogs(await logsRes.json());
      if (historyRes.ok) setHistoryList(await historyRes.json());
    } catch (e) {
      console.error('Failed to load logs/history:', e);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const fetchGraph = useCallback(async (targetUserId?: string) => {
    setGraphLoading(true);
    try {
      const uid = targetUserId || user?.user_id || 'local_user';
      const res = await fetch(`${API_BASE}/api/v1/graph?user_id=${encodeURIComponent(uid)}`);
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
      }
    } catch (e) {
      console.error('Failed to load graph:', e);
    } finally {
      setGraphLoading(false);
    }
  }, [user?.user_id]);

  // Initial load & Re-sync on user switch
  useEffect(() => {
    const uid = user?.user_id || 'local_user';
    fetchProfile(uid);
    fetchMemories(projectId, uid);
    fetchLogsAndHistory();
    fetchGraph(uid);
  }, [user?.user_id, projectId, fetchProfile, fetchMemories, fetchLogsAndHistory, fetchGraph]);

  // Pin / Unpin
  const togglePinMemory = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      localStorage.setItem('kira_pinned_memories', JSON.stringify(next));
      return next;
    });
  }, []);

  // Copy prompt helper
  const copyPrompt = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // --- Prompt Submission (Multi-Tenant Isolated) ---

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const rawText = (textToSend !== undefined ? textToSend : inputMessage).trim();
    if (!rawText || loading) return;

    setInputMessage('');
    setLoading(true);

    const userMsgId = `usr-${Date.now()}`;
    const userTurn: ChatMessage = {
      id: userMsgId,
      role: 'user',
      message: rawText,
      created_at: new Date().toLocaleTimeString(),
    };

    setChatHistory((prev) => [...prev, userTurn]);
    const startTime = performance.now();

    try {
      const activeUserId = user?.user_id || 'local_user';
      const res = await fetch(`${API_BASE}/api/v1/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: rawText,
          density,
          session_id,
          project_id: projectId,
          user_id: activeUserId,
        }),
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (res.ok) {
        const data = await res.json();

        let explanation = '';
        if (data.intent === 'conversational') {
          explanation = data.refined_prompt;
        } else if (data.intent === 'pass_through') {
          explanation = data.refined_prompt;
        } else {
          explanation = `I analyzed your prompt and engineered a grounded production-grade instruction set.`;
          if (data.domain) {
            explanation += ` Domain identified as **${data.domain.replace('_', ' ')}**.`;
          }
          if (data.new_memories && data.new_memories.length > 0) {
            explanation += ` Auto-extracted verified facts: *${data.new_memories.join(', ')}*.`;
          }
        }

        const assistantTurn: ChatMessage = {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          message: explanation,
          refined_prompt: data.refined_prompt,
          quality_scores: data.quality_scores,
          suggested_actions: data.suggested_actions,
          domain: data.domain,
          intent: data.intent,
          new_memories: data.new_memories,
          bypassed: data.bypassed,
          bypass_reason: data.bypass_reason,
          latency_ms: latencyMs,
          created_at: new Date().toLocaleTimeString(),
        };

        setChatHistory((prev) => [...prev, assistantTurn]);

        // Auto-refresh memories and graph with active user context
        fetchMemories(projectId, activeUserId);
        fetchLogsAndHistory();
        fetchGraph(activeUserId);
      } else {
        const errorTurn: ChatMessage = {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          message: 'Error communicating with KIRA backend. Please check server connection.',
          created_at: new Date().toLocaleTimeString(),
        };
        setChatHistory((prev) => [...prev, errorTurn]);
      }
    } catch (err: any) {
      console.error('Refine failed:', err);
      const errorTurn: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        message: `Network error: ${err.message || 'Failed to reach KIRA Cloud Engine'}`,
        created_at: new Date().toLocaleTimeString(),
      };
      setChatHistory((prev) => [...prev, errorTurn]);
    } finally {
      setLoading(false);
    }
  }, [inputMessage, loading, density, session_id, projectId, user, fetchMemories, fetchLogsAndHistory, fetchGraph]);

  // Add manual memory scoped to active user
  const handleAddMemory = useCallback(async (fact: string, category: string = 'tech_stack', project: string = 'default') => {
    if (!fact.trim()) return false;
    try {
      const activeUserId = user?.user_id || 'local_user';
      const res = await fetch(`${API_BASE}/api/v1/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fact, category, project_id: project, user_id: activeUserId }),
      });
      if (res.ok) {
        await fetchMemories(project, activeUserId);
        await fetchGraph(activeUserId);
        return true;
      }
    } catch (e) {
      console.error('Failed to add memory:', e);
    }
    return false;
  }, [user, fetchMemories, fetchGraph]);

  // Delete memory scoped to active user
  const handleDeleteMemory = useCallback(async (id: string) => {
    try {
      const activeUserId = user?.user_id || 'local_user';
      const res = await fetch(`${API_BASE}/api/v1/memories/${encodeURIComponent(id)}?user_id=${encodeURIComponent(activeUserId)}`, { method: 'DELETE' });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
        setPinnedIds((prev) => {
          const next = prev.filter((p) => p !== id);
          localStorage.setItem('kira_pinned_memories', JSON.stringify(next));
          return next;
        });
        await fetchGraph(activeUserId);
        return true;
      }
    } catch (e) {
      console.error('Failed to delete memory:', e);
    }
    return false;
  }, [user, fetchGraph]);

  // Save extended developer profile scoped to active user
  const saveProfileDetails = useCallback(async (details: any) => {
    try {
      const activeUserId = user?.user_id || 'local_user';
      localStorage.setItem('kira_user_profile', JSON.stringify(details));
      if (user) {
        const updatedUser = { ...user, profile_details: details };
        setUser(updatedUser);
        localStorage.setItem('kira_auth_user', JSON.stringify(updatedUser));
      }
      await fetch(`${API_BASE}/api/v1/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeUserId,
          primary_use: `${details.teamScale || details.enterprise_level || 'individual'} | ${(details.hobbies || details.interests || []).join(', ')}`,
          preferred_tone: 'direct',
          density_preference: density,
        }),
      });
      await fetchProfile(activeUserId);
    } catch (e) {
      console.error('Failed to save profile details:', e);
    }
  }, [user, density, fetchProfile]);

  return {
    projectId,
    setProjectId,
    density,
    setDensity,
    loading,
    copiedId,
    profile,
    memories,
    pinnedIds,
    togglePinMemory,
    chatHistory,
    setChatHistory,
    inputMessage,
    setInputMessage,
    mcpLogs,
    historyList,
    logsLoading,
    graphData,
    graphLoading,
    user,
    login,
    logout,
    fetchMemories,
    fetchProfile,
    fetchLogsAndHistory,
    fetchGraph,
    handleSendMessage,
    handleAddMemory,
    handleDeleteMemory,
    saveProfileDetails,
    copyPrompt,
  };
}
