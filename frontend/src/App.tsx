import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, Copy, Send, Check, RefreshCw, Settings, Database, Brain, MessageSquare, Activity, Terminal, Clock } from 'lucide-react';

const API_BASE = 'http://localhost:8090';

interface Memory {
  id: string;
  category: string;
  fact: string;
}

interface Profile {
  primary_use: string;
  preferred_tone: string;
  density_preference: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  refined_prompt?: string;
}

export default function App() {
  const [session_id] = useState<string>(() => `sess-${Math.random().toString(36).substr(2, 9)}`);
  
  // App States
  const [rawPrompt, setRawPrompt] = useState('');
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [density, setDensity] = useState<'short' | 'medium' | 'detailed'>('short');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Memory and Profile States
  const [memories, setMemories] = useState<Memory[]>([]);
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState('tech_stack');
  const [profile, setProfile] = useState<Profile>({
    primary_use: 'development',
    preferred_tone: 'direct',
    density_preference: 'short',
  });
  
  // Chat States
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Tab/View State
  const [activeTab, setActiveTab] = useState<'forge' | 'logs'>('forge');

  // MCP status state
  interface MCPServer {
    name: string;
    command: string;
    args: string[];
    status: 'connected' | 'disconnected';
    pid: number | null;
  }
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);

  // Logs & Metrics state
  interface MCPLog {
    id: string;
    tool_name: string;
    agent_name: string;
    arguments: string;
    duration_ms: number;
    status: string;
    created_at: string;
  }
  const [mcpLogs, setMcpLogs] = useState<MCPLog[]>([]);

  interface RefinementHistoryItem {
    id: string;
    session_id: string;
    role: string;
    message: string;
    refined_prompt: string;
    created_at: string;
  }
  const [historyList, setHistoryList] = useState<RefinementHistoryItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Fetch initial profile and memories
  useEffect(() => {
    fetchProfile();
    fetchMemories();
  }, []);

  // WebSocket for MCP status tracking with polling fallback
  useEffect(() => {
    let socket: WebSocket | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let isMounted = true;

    const startPolling = () => {
      if (pollInterval) return;
      console.log('Falling back to polling for MCP server status...');
      const fetchStatus = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/v1/mcp/status`);
          if (res.ok && isMounted) {
            const data = await res.json();
            setMcpServers(data.servers);
          }
        } catch (e) {
          console.error('Polling status fetch failed:', e);
        }
      };
      fetchStatus();
      pollInterval = setInterval(fetchStatus, 4000);
    };

    const connectWebSocket = () => {
      try {
        socket = new WebSocket(`ws://localhost:8090/api/v1/mcp/status/ws`);
        
        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data && data.servers) {
              setMcpServers(data.servers);
            }
          } catch (err) {
            console.error('Error parsing WS message:', err);
          }
        };

        socket.onerror = (err) => {
          console.warn('WebSocket error, switching to polling:', err);
          startPolling();
        };

        socket.onclose = () => {
          if (isMounted) {
            console.warn('WebSocket closed, switching to polling...');
            startPolling();
          }
        };
      } catch (err) {
        console.error('Failed to create WebSocket:', err);
        startPolling();
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (socket) {
        socket.close();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  const fetchLogsAndHistory = async () => {
    setLogsLoading(true);
    try {
      const logsRes = await fetch(`${API_BASE}/api/v1/mcp/logs`);
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setMcpLogs(logsData);
      }
      const historyRes = await fetch(`${API_BASE}/api/v1/history/all`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistoryList(historyData);
      }
    } catch (e) {
      console.error('Failed to load logs/history:', e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogsAndHistory();
      const interval = setInterval(fetchLogsAndHistory, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const fetchProfile = async () => {
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
  };

  const fetchMemories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/memories`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (e) {
      console.error('Failed to fetch memories:', e);
    }
  };

  const updateProfile = async (updated: Partial<Profile>) => {
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
  };

  const handleRefine = async () => {
    if (!rawPrompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: rawPrompt,
          density: density,
          session_id: session_id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRefinedPrompt(data.refined_prompt);
        // Refresh memory list since the refiner might have learned new facts
        fetchMemories();
        // Insert starting conversation log
        setChatHistory([
          {
            id: 'init-usr',
            role: 'user',
            message: rawPrompt,
          },
          {
            id: 'init-ast',
            role: 'assistant',
            message: `Initiated prompt refinement. Intent: ${data.intent}. Domain: ${data.domain}.`,
            refined_prompt: data.refined_prompt,
          }
        ]);
      }
    } catch (e) {
      console.error('Prompt refinement request failed:', e);
      setRefinedPrompt('### Error\nFailed to reach KIRA Backend API. Please ensure FastAPI is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim() || chatLoading) return;
    const userMsg = chatMessage;
    setChatMessage('');
    setChatLoading(true);

    // Append user message immediately
    const userTurn: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      message: userMsg,
    };
    setChatHistory(prev => [...prev, userTurn]);

    try {
      const res = await fetch(`${API_BASE}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          session_id: session_id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          message: data.response,
          refined_prompt: data.refined_prompt
        }]);
        setRefinedPrompt(data.refined_prompt);
      }
    } catch (e) {
      console.error('Conversational follow-up failed:', e);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          fact: newFact,
        }),
      });
      if (res.ok) {
        setNewFact('');
        fetchMemories();
      }
    } catch (e) {
      console.error('Failed to add memory fact:', e);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/memories/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchMemories();
      }
    } catch (e) {
      console.error('Failed to delete memory fact:', e);
    }
  };

  const copyToClipboard = () => {
    if (!refinedPrompt) return;
    navigator.clipboard.writeText(refinedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="app-container">
      {/* SIDEBAR: Preferences & Learned Memories */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon"></div>
          <div>
            <h1 className="logo-text">KIRA PROMPT</h1>
            <span className="logo-badge">V3.0 LOCAL</span>
          </div>
        </div>

        {/* VIEW SELECTOR */}
        <div style={{ padding: '0 16px 16px 16px', borderBottom: '2px solid var(--border)' }}>
          <div className="segmented-control" style={{ marginTop: '16px' }}>
            <div
              className={`segment-item ${activeTab === 'forge' ? 'active' : ''}`}
              onClick={() => setActiveTab('forge')}
            >
              Console
            </div>
            <div
              className={`segment-item ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              Logs & Metrics
            </div>
          </div>
        </div>

        {/* PROFILE SETTINGS */}
        <div className="section-title">
          <Settings size={14} /> Profile Settings
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Primary Use</label>
            <select
              value={profile.primary_use}
              onChange={(e) => updateProfile({ primary_use: e.target.value })}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text)',
                border: '2px solid var(--border)',
                padding: '8px',
                outline: 'none',
              }}
            >
              <option value="development">Development/Coding</option>
              <option value="copywriting">Copywriting/Creative</option>
              <option value="research">Academic/Research</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Response Tone</label>
            <select
              value={profile.preferred_tone}
              onChange={(e) => updateProfile({ preferred_tone: e.target.value })}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text)',
                border: '2px solid var(--border)',
                padding: '8px',
                outline: 'none',
              }}
            >
              <option value="direct">Direct & Concise</option>
              <option value="explanatory">Detailed & Explanatory</option>
              <option value="creative">Creative & Expansive</option>
            </select>
          </div>
        </div>

        {/* MEMORIES LIST */}
        <div className="section-title">
          <Brain size={14} /> Context Memories
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '2px solid var(--border)' }}>
            {memories.length === 0 ? (
              <p style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No facts learned yet. Enter prompts in the console to auto-learn.
              </p>
            ) : (
              memories.map((m) => (
                <div key={m.id} className="memory-item">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.8rem' }}>{m.fact}</span>
                    <div style={{ display: 'flex' }}>
                      <span className="memory-tag">{m.category}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteMemory(m.id)} className="delete-btn" title="Forget Memory">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* ADD MANUAL MEMORY */}
          <form onSubmit={handleAddMemory} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
            <label className="form-label">Add Memory Constraint</label>
            <input
              type="text"
              placeholder="e.g. Uses Go 1.20"
              value={newFact}
              onChange={(e) => setNewFact(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text)',
                border: '2px solid var(--border)',
                padding: '8px',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={{
                  flex: 1,
                  background: 'var(--bg-input)',
                  color: 'var(--text)',
                  border: '2px solid var(--border)',
                  padding: '6px',
                  fontSize: '0.75rem',
                  outline: 'none',
                }}
              >
                <option value="tech_stack">Tech Stack</option>
                <option value="writing_style">Writing Style</option>
                <option value="constraints">Constraints</option>
              </select>
              <button type="submit" className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                Add
              </button>
            </div>
          </form>
        </div>

        {/* MCP SERVERS STATUS */}
        <div className="section-title" style={{ marginTop: 'auto', borderTop: '2px solid var(--border)' }}>
          <Settings size={14} /> MCP CONNECTIONS
        </div>
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--bg)' }}>
          <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {mcpServers.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No MCP servers configured.</p>
            ) : (
              mcpServers.map((srv) => (
                <div key={srv.name} style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', padding: '6px 8px', backgroundColor: 'var(--bg-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`status-dot ${srv.status === 'connected' ? 'status-connected' : 'status-disconnected'}`} style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: srv.status === 'connected' ? 'var(--accent)' : 'var(--error)',
                        display: 'inline-block'
                      }}></span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{srv.name.toUpperCase()}</span>
                    </div>
                    {srv.pid && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>PID: {srv.pid}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px', fontFamily: 'var(--font-mono)' }} title={`${srv.command} ${srv.args.join(' ')}`}>
                    {srv.command} {srv.args.join(' ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE COLUMN */}
      <main className="main-content">
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>POSTGRESQL ACTIVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Session ID: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{session_id}</span>
          </div>
        </header>

        {activeTab === 'forge' ? (
          <div className="workspace-panel">
            {/* CONSOLE: Entry and Refined Output */}
            <div className="console-column">
              {/* Raw Input */}
              <div className="brutalist-card">
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Raw Prompt Input</label>
                  <textarea
                    className="text-area"
                    placeholder="Enter a raw prompt to refine (e.g. 'build a dashboard to display sales records')"
                    value={rawPrompt}
                    onChange={(e) => setRawPrompt(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ width: '260px' }}>
                    <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Target Density</label>
                    <div className="segmented-control">
                      <div
                        className={`segment-item ${density === 'short' ? 'active' : ''}`}
                        onClick={() => {
                          setDensity('short');
                          updateProfile({ density_preference: 'short' });
                        }}
                      >
                        Short (Rules)
                      </div>
                      <div
                        className={`segment-item ${density === 'medium' ? 'active' : ''}`}
                        onClick={() => {
                          setDensity('medium');
                          updateProfile({ density_preference: 'medium' });
                        }}
                      >
                        Medium (RPG)
                      </div>
                      <div
                        className={`segment-item ${density === 'detailed' ? 'active' : ''}`}
                        onClick={() => {
                          setDensity('detailed');
                          updateProfile({ density_preference: 'detailed' });
                        }}
                      >
                        Detailed
                      </div>
                    </div>
                  </div>

                  <button
                    className={`btn btn-accent ${loading ? 'btn-disabled' : ''}`}
                    disabled={loading}
                    onClick={handleRefine}
                    style={{ alignSelf: 'flex-end', height: '40px' }}
                  >
                    {loading ? (
                      <RefreshCw size={14} className="pulse" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    Forge Prompt
                  </button>
                </div>
              </div>

              {/* Refined Output */}
              {refinedPrompt && (
                <div className="brutalist-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <h3 className="logo-text" style={{ fontSize: '1rem', color: 'var(--accent)' }}>FORGED HIGH-FIDELITY INSTRUCTION</h3>
                    <button className="btn" onClick={copyToClipboard} style={{ padding: '6px 12px' }}>
                      {copied ? <Check size={14} style={{ color: 'var(--accent)' }} /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="mono-output" style={{ flex: 1, minHeight: '260px' }}>
                    {refinedPrompt}
                  </pre>
                </div>
              )}
            </div>

            {/* CHAT PANEL: Conversational refinement follow-up */}
            <div className="panel-column">
              <div className="section-title">
                <MessageSquare size={14} /> Follow-Up Refinement
              </div>
              
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {chatHistory.length === 0 ? (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '200px' }}>
                      Generate a refined prompt first to start follow-up conversation.
                    </p>
                  </div>
                ) : (
                  chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      style={{
                        alignSelf: chat.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        background: chat.role === 'user' ? 'var(--border)' : 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        padding: '12px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '0.7rem', color: chat.role === 'user' ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {chat.role === 'user' ? 'DEVELOPER' : 'KIRA ARCHITECT'}
                      </div>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{chat.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Chat inputs */}
              <div style={{ padding: '16px', borderTop: '2px solid var(--border)', backgroundColor: 'var(--bg-input)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="e.g. 'make it shorter', 'add db logging'"
                    disabled={chatHistory.length === 0 || chatLoading}
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    style={{
                      flex: 1,
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      border: '2px solid var(--border)',
                      padding: '10px',
                      fontSize: '0.8rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={chatHistory.length === 0 || chatLoading}
                    className={`btn btn-accent ${chatHistory.length === 0 || chatLoading ? 'btn-disabled' : ''}`}
                    style={{ padding: '10px' }}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="metric-row">
              <div className="metric-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <Activity size={14} style={{ color: 'var(--accent)' }} /> ACTIVE MCP SERVERS
                </div>
                <div className="metric-card-val">
                  {mcpServers.filter(s => s.status === 'connected').length} / {mcpServers.length}
                </div>
              </div>
              <div className="metric-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <Clock size={14} style={{ color: 'var(--accent)' }} /> TOTAL REFINE CALLS
                </div>
                <div className="metric-card-val">
                  {historyList.length}
                </div>
              </div>
              <div className="metric-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <Terminal size={14} style={{ color: 'var(--accent)' }} /> TOTAL MCP ACTIONS
                </div>
                <div className="metric-card-val">
                  {mcpLogs.length}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Column: Prompt History (Before vs After) */}
              <div className="brutalist-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 className="section-title" style={{ padding: '0 0 12px 0', borderBottom: '2px solid var(--border)', marginBottom: '16px' }}>
                  <Clock size={14} /> PROMPT IMPROVEMENT HISTORY
                </h3>
                <div style={{ overflowY: 'auto', maxHeight: '450px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {historyList.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No refinement history logs found.</p>
                  ) : (
                    historyList.map((item) => (
                      <div key={item.id} style={{ border: '2px solid var(--border)', padding: '12px', backgroundColor: 'var(--bg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          <span>SESSION: {item.session_id}</span>
                          <span>{item.created_at}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <div className="form-label" style={{ fontSize: '0.65rem', marginBottom: '4px' }}>Original Prompt</div>
                            <div style={{ fontSize: '0.75rem', padding: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                              {item.message}
                            </div>
                          </div>
                          <div>
                            <div className="form-label" style={{ fontSize: '0.65rem', marginBottom: '4px', color: 'var(--accent)' }}>Refined Output</div>
                            <div style={{ fontSize: '0.75rem', padding: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                              {item.refined_prompt}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: MCP Logs (Trace Logs & Metrics) */}
              <div className="brutalist-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 className="section-title" style={{ padding: '0 0 12px 0', borderBottom: '2px solid var(--border)', marginBottom: '16px' }}>
                  <Terminal size={14} /> MCP TRACE LOGS & METRICS
                </h3>
                <div style={{ overflowY: 'auto', maxHeight: '450px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {mcpLogs.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No MCP trace logs found.</p>
                  ) : (
                    mcpLogs.map((log) => (
                      <div key={log.id} style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', padding: '10px', backgroundColor: 'var(--bg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                            {log.tool_name}
                          </span>
                          <span className={`badge ${log.status === 'success' ? 'badge-success' : 'badge-error'}`}>
                            {log.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                          <span>CALLER: {log.agent_name}</span>
                          <span>LATENCY: {log.duration_ms.toFixed(1)} ms</span>
                        </div>
                        <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', borderTop: '1px dashed var(--border)', paddingTop: '6px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflowY: 'auto', maxHeight: '80px' }}>
                          ARGS: {log.arguments}
                        </div>
                        <div style={{ alignSelf: 'flex-end', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {log.created_at}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
