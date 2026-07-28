/**
 * Sidebar component — logo, tab selector, profile settings, memories, MCP connections.
 */

import React from 'react';
import { Settings, Brain, Trash2 } from 'lucide-react';
import type { Memory, Profile, MCPServer } from '../types';

interface SidebarProps {
  activeTab: 'forge' | 'logs';
  setActiveTab: (tab: 'forge' | 'logs') => void;
  profile: Profile;
  updateProfile: (updated: Partial<Profile>) => void;
  memories: Memory[];
  newFact: string;
  setNewFact: (v: string) => void;
  newCategory: string;
  setNewCategory: (v: string) => void;
  handleAddMemory: (e: React.FormEvent) => void;
  handleDeleteMemory: (id: string) => void;
  mcpServers: MCPServer[];
}

export default function Sidebar({
  activeTab, setActiveTab,
  profile, updateProfile,
  memories, newFact, setNewFact, newCategory, setNewCategory,
  handleAddMemory, handleDeleteMemory,
  mcpServers,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="logo-icon"></div>
        <div>
          <h1 className="logo-text">KIRA PROMPT</h1>
          <span className="logo-badge">V3.0 LOCAL</span>
        </div>
      </div>

      {/* View Selector */}
      <div style={{ padding: '0 16px 16px 16px', borderBottom: '2px solid var(--border)' }}>
        <div className="segmented-control" style={{ marginTop: '16px' }}>
          <div className={`segment-item ${activeTab === 'forge' ? 'active' : ''}`} onClick={() => setActiveTab('forge')}>
            Console
          </div>
          <div className={`segment-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
            Logs & Metrics
          </div>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="section-title">
        <Settings size={14} /> Profile Settings
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label className="form-label">Primary Use</label>
          <select
            value={profile.primary_use}
            onChange={(e) => updateProfile({ primary_use: e.target.value })}
            style={{ width: '100%', background: 'var(--bg-input)', color: 'var(--text)', border: '2px solid var(--border)', padding: '6px', fontSize: '0.75rem', outline: 'none' }}
          >
            <option value="development">Development</option>
            <option value="writing">Technical Writing</option>
            <option value="design">System Design</option>
          </select>
        </div>
        <div>
          <label className="form-label">Tone</label>
          <select
            value={profile.preferred_tone}
            onChange={(e) => updateProfile({ preferred_tone: e.target.value })}
            style={{ width: '100%', background: 'var(--bg-input)', color: 'var(--text)', border: '2px solid var(--border)', padding: '6px', fontSize: '0.75rem', outline: 'none' }}
          >
            <option value="direct">Direct / Concise</option>
            <option value="friendly">Friendly / Casual</option>
            <option value="academic">Academic / Formal</option>
          </select>
        </div>
      </div>

      {/* Learned Memories */}
      <div className="section-title">
        <Brain size={14} /> Learned Memories ({memories.length})
      </div>
      <div style={{ padding: '12px 16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {memories.length === 0 ? (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No memories yet. Forge a prompt to auto-learn facts.</p>
        ) : (
          memories.map((m) => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', border: '1px solid var(--border)', padding: '6px 8px', backgroundColor: 'var(--bg-input)' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '2px' }}>{m.category}</div>
                <div style={{ fontSize: '0.75rem' }}>{m.fact}</div>
              </div>
              <button onClick={() => handleDeleteMemory(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', flexShrink: 0 }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
        <form onSubmit={handleAddMemory}>
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
            <input
              type="text"
              placeholder="Add fact (e.g., 'Uses Go')"
              value={newFact}
              onChange={(e) => setNewFact(e.target.value)}
              style={{ flex: 1, background: 'var(--bg)', color: 'var(--text)', border: '2px solid var(--border)', padding: '6px', fontSize: '0.7rem', outline: 'none' }}
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '2px solid var(--border)', padding: '4px', fontSize: '0.65rem', outline: 'none' }}
            >
              <option value="tech_stack">Tech Stack</option>
              <option value="writing_style">Writing Style</option>
              <option value="constraints">Constraints</option>
            </select>
            <button type="submit" className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Add</button>
          </div>
        </form>
      </div>

      {/* MCP Connections */}
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
                    <span className={`status-dot ${srv.status === 'connected' ? 'status-connected' : 'status-disconnected'}`} style={{ width: '8px', height: '8px', backgroundColor: srv.status === 'connected' ? 'var(--accent)' : 'var(--error)', display: 'inline-block' }}></span>
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
  );
}
