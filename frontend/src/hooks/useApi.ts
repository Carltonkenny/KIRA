/**
 * Custom hook encapsulating all KIRA API interactions.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Memory, Profile, ChatMessage, MCPLog, RefinementHistoryItem } from '../types';

const API_BASE = 'http://localhost:8090';

export function useApi(session_id: string) {
  // Core states
  const [rawPrompt, setRawPrompt] = useState('');
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [density, setDensity] = useState<'short' | 'medium' | 'detailed'>('short');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Memory and Profile
  const [memories, setMemories] = useState<Memory[]>([]);
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState('tech_stack');
  const [profile, setProfile] = useState<Profile>({
    primary_use: 'development',
    preferred_tone: 'direct',
    density_preference: 'short',
  });

  // Chat
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Logs & Metrics
  const [mcpLogs, setMcpLogs] = useState<MCPLog[]>([]);
  const [historyList, setHistoryList] = useState<RefinementHistoryItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // --- Data Fetchers ---

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/profile`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setDensity(data.density_preference || 'short');
      }
    } catch (e) {
      console.error('Failed to load profile preferences:', e);
    }
  }, []);

  const fetchMemories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/memories`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (e) {
      console.error('Failed to fetch memories:', e);
    }
  }, []);

  const fetchLogsAndHistory = useCallback(async () => {
    setLogsLoading(true);
    try {
      const [logsRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/mcp/logs`),
        fetch(`${API_BASE}/api/v1/history/all`)
      ]);
      if (logsRes.ok) setMcpLogs(await logsRes.json());
      if (historyRes.ok) setHistoryList(await historyRes.json());
    } catch (e) {
      console.error('Failed to load logs/history:', e);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
    fetchMemories();
  }, [fetchProfile, fetchMemories]);

  // --- Action Handlers ---

  const updateProfile = useCallback(async (updated: Partial<Profile>) => {
    const nextProfile = { ...profile, ...updated };
    setProfile(nextProfile);
    try {
      await fetch(`${API_BASE}/api/v1/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextProfile),
      });
    } catch (e) {
      console.error('Failed to save profile changes:', e);
    }
  }, [profile]);

  const handleRefine = useCallback(async () => {
    if (!rawPrompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: rawPrompt, density, session_id }),
      });
      if (res.ok) {
        const data = await res.json();
        setRefinedPrompt(data.refined_prompt);
        fetchMemories();
        setChatHistory([
          { id: 'init-usr', role: 'user', message: rawPrompt },
          {
            id: 'init-ast', role: 'assistant',
            message: `Initiated prompt refinement. Intent: ${data.intent}. Domain: ${data.domain}.`,
            refined_prompt: data.refined_prompt,
          }
        ]);
      }
    } catch (e) {
      console.error('Prompt refinement request failed:', e);
      setRefinedPrompt('### Error\nFailed to reach KIRA Backend API. Please ensure FastAPI is running on port 8090.');
    } finally {
      setLoading(false);
    }
  }, [rawPrompt, density, session_id, fetchMemories]);

  const handleSendChat = useCallback(async () => {
    if (!chatMessage.trim() || chatLoading) return;
    const userMsg = chatMessage;
    setChatMessage('');
    setChatLoading(true);

    const userTurn: ChatMessage = { id: `usr-${Date.now()}`, role: 'user', message: userMsg };
    setChatHistory(prev => [...prev, userTurn]);

    try {
      const res = await fetch(`${API_BASE}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, session_id }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, {
          id: `ast-${Date.now()}`, role: 'assistant',
          message: data.response, refined_prompt: data.refined_prompt
        }]);
        setRefinedPrompt(data.refined_prompt);
      }
    } catch (e) {
      console.error('Conversational follow-up failed:', e);
    } finally {
      setChatLoading(false);
    }
  }, [chatMessage, chatLoading, session_id]);

  const handleAddMemory = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory, fact: newFact }),
      });
      if (res.ok) {
        setNewFact('');
        fetchMemories();
      }
    } catch (e) {
      console.error('Failed to add memory fact:', e);
    }
  }, [newFact, newCategory, fetchMemories]);

  const handleDeleteMemory = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/memories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchMemories();
    } catch (e) {
      console.error('Failed to delete memory fact:', e);
    }
  }, [fetchMemories]);

  const copyToClipboard = useCallback(() => {
    if (!refinedPrompt) return;
    navigator.clipboard.writeText(refinedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [refinedPrompt]);

  return {
    // State
    rawPrompt, setRawPrompt,
    refinedPrompt,
    density, setDensity,
    loading, copied,
    memories, newFact, setNewFact, newCategory, setNewCategory,
    profile,
    chatMessage, setChatMessage, chatHistory, chatLoading,
    mcpLogs, historyList, logsLoading,
    // Actions
    updateProfile, handleRefine, handleSendChat,
    handleAddMemory, handleDeleteMemory, copyToClipboard,
    fetchLogsAndHistory,
  };
}
