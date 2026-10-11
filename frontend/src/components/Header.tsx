import React, { useState } from 'react';
import { HelpCircle, Plus, Sparkles, History, Share2, Brain, X, Zap, User } from 'lucide-react';
import type { AuthUser } from '../types';

interface HeaderProps {
  activeTab: 'Home' | 'Sessions' | 'Graph' | 'Memory';
  setActiveTab: (tab: 'Home' | 'Sessions' | 'Graph' | 'Memory') => void;
  onNewChat: () => void;
  onOpenMcp: () => void;
  onOpenAuth: () => void;
  onOpenLanding?: () => void;
  user: AuthUser | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewChat,
  onOpenMcp,
  onOpenAuth,
  onOpenLanding,
  user,
}) => {
  const [showHowToUse, setShowHowToUse] = useState(false);

  return (
    <>
      <header className="header-bar-clean">
        {/* Clean Logo & PromptForge Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="header-brand-clean" onClick={() => setActiveTab('Home')}>
            <span className="kira-wordmark">KIRA</span>
            <span className="kira-glow-dot"></span>
          </div>

          <button
            type="button"
            onClick={onOpenLanding}
            className="header-landing-pill"
            title="View PromptForge Landing Showcase"
            style={{ cursor: 'pointer', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)' }}
          >
            <span>⬡ PromptForge</span>
            <span style={{ fontSize: '10px', opacity: 0.7, padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>Landing</span>
          </button>
        </div>

        {/* Center Tabs Navigation */}
        <nav className="header-nav-tabs">
          {(['Home', 'Sessions', 'Graph', 'Memory'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`nav-tab-pill ${activeTab === tab ? 'active' : ''}`}
            >
              {tab === 'Home' && <Sparkles size={13} className="tab-pill-icon" />}
              {tab === 'Sessions' && <History size={13} className="tab-pill-icon" />}
              {tab === 'Graph' && <Share2 size={13} className="tab-pill-icon" />}
              {tab === 'Memory' && <Brain size={13} className="tab-pill-icon" />}
              <span>{tab}</span>
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="header-actions-clean">
          {/* MCP Hub Button */}
          <button
            className="action-mcp-btn"
            onClick={onOpenMcp}
            title="Model Context Protocol (MCP) Hub & IDE Connection"
          >
            <span className="mcp-live-pulse-dot"></span>
            <Zap size={13} className="mcp-zap-icon" />
            <span>MCP Hub</span>
            <span className="mcp-pill-count">5 Tools</span>
          </button>

          {/* User Auth Session Button */}
          <button
            className="action-auth-btn"
            onClick={onOpenAuth}
            title={user ? `Signed in as ${user.email}` : "Sign in to your Neon database session"}
          >
            <User size={13} />
            <span>{user ? user.email.split('@')[0] : 'Sign In'}</span>
            {user && <span className="auth-online-dot"></span>}
          </button>

          <button
            className="action-new-chat-btn"
            onClick={onNewChat}
            title="Start new conversation (Ctrl+K)"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>

          <button
            className="action-icon-subtle"
            onClick={() => setShowHowToUse(true)}
            title="How KIRA works"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </header>

      {/* Clean How To Use Modal */}
      {showHowToUse && (
        <div className="modal-backdrop" onClick={() => setShowHowToUse(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--violet-400)' }} />
                <h3 className="modal-title">KIRA Prompt Architecture</h3>
              </div>
              <button className="icon-close" onClick={() => setShowHowToUse(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>KIRA</strong> intercepts vague engineering instructions, automatically extracts your active
                stack rules, and generates production-ready prompts in sub-seconds.
              </p>
              <div className="help-step">
                <span className="help-num">1</span>
                <div>
                  <strong>Chat-Driven Engineering:</strong> Simply type your goal in the text bar. KIRA explains its reasoning and returns the exact prompt template.
                </div>
              </div>
              <div className="help-step">
                <span className="help-num">2</span>
                <div>
                  <strong>Neon PostgreSQL Cloud Sync:</strong> Facts and histories persist seamlessly to serverless PostgreSQL with global low-latency pooling.
                </div>
              </div>
              <div className="help-step">
                <span className="help-num">3</span>
                <div>
                  <strong>Live Knowledge Graph:</strong> Inspect how project hubs connect to learned constraints and external agent callers.
                </div>
              </div>
              <div className="help-step">
                <span className="help-num">4</span>
                <div>
                  <strong>IDE Native (MCP):</strong> Use Cursor or Claude Desktop to call KIRA directly in your editor via stdio or HTTP.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-modal-close" onClick={() => setShowHowToUse(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
