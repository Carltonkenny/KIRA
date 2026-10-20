import React, { useRef, useEffect } from 'react';
import { Send, Copy, Check, Sparkles, Clock, ArrowRight, RefreshCw, Terminal, Layers } from 'lucide-react';
import type { ChatMessage } from '../types';

interface HomeTabProps {
  chatHistory: ChatMessage[];
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  loading: boolean;
  copiedId: string | null;
  density: 'short' | 'medium' | 'detailed';
  setDensity: (d: 'short' | 'medium' | 'detailed') => void;
  projectId: string;
  setProjectId: (p: string) => void;
  onSendMessage: (text?: string) => void;
  onCopy: (id: string, text: string) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  chatHistory,
  inputMessage,
  setInputMessage,
  loading,
  copiedId,
  density,
  setDensity,
  projectId,
  setProjectId,
  onSendMessage,
  onCopy,
}) => {
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const starterSuggestions = [
    {
      title: 'Stripe Payment Webhook',
      prompt: 'Build a secure Stripe webhook handler with signature verification and idempotency keys',
      tag: 'Backend',
    },
    {
      title: 'React 19 Modal Dialog',
      prompt: 'Create a reusable, fully accessible modal dialog component using React 19 with backdrop blur and escape key handling',
      tag: 'Frontend',
    },
    {
      title: 'PostgreSQL Connection Pool',
      prompt: 'Write an asynchronous connection pool manager with health check queries, connection retry, and statement timeouts',
      tag: 'Database',
    },
    {
      title: 'Distributed Event Broker',
      prompt: 'Architect a low-latency event broker with consumer groups, exponential backoff, and dead-letter queues',
      tag: 'Architecture',
    },
  ];

  return (
    <div className="home-chat-wrapper">
      <div className="chat-stream-container">
        {chatHistory.length === 0 ? (
          <div className="welcome-hero animate-fade-in">
            <div className="hero-icon-glow">
              <Sparkles size={24} className="hero-icon" />
            </div>
            <h2 className="hero-title">KIRA Prompt Architecture</h2>
            <p className="hero-subtitle">
              Type your raw coding task or architecture goal. KIRA recalls your persistent project context,
              removes ambiguities, and generates production-ready prompts.
            </p>

            <div className="starters-grid">
              {starterSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="starter-card"
                  onClick={() => onSendMessage(item.prompt)}
                >
                  <div className="starter-card-top">
                    <span className="starter-tag">{item.tag}</span>
                    <ArrowRight size={13} className="starter-arrow" />
                  </div>
                  <h4 className="starter-card-title">{item.title}</h4>
                  <p className="starter-card-prompt">{item.prompt}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-stream">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble-row ${msg.role === 'user' ? 'user-row' : 'kira-row'}`}
              >
                {msg.role === 'user' ? (
                  <div className="user-bubble animate-slide-up">
                    <div className="bubble-header">
                      <span>YOU</span>
                      {msg.created_at && <span className="bubble-time">{msg.created_at}</span>}
                    </div>
                    <div className="bubble-text">{msg.message}</div>
                  </div>
                ) : (
                  <div className="kira-bubble animate-slide-up">
                    <div className="bubble-header">
                      <div className="kira-author">
                        <Sparkles size={14} className="kira-sparkle" />
                        <span>KIRA ARCHITECT</span>
                      </div>
                      {msg.latency_ms && (
                        <span className="badge-latency">
                          <Clock size={11} /> {msg.latency_ms} ms
                        </span>
                      )}
                    </div>

                    <div className="kira-explanation">{msg.message}</div>

                    {msg.refined_prompt && (
                      <div className="prompt-card">
                        <div className="prompt-card-header">
                          <div className="prompt-card-title">
                            <Terminal size={14} style={{ color: 'var(--violet-400)' }} />
                            <span>ENGINEERED PROMPT TEMPLATE</span>
                          </div>
                          <button
                            className="copy-btn"
                            onClick={() => onCopy(msg.id, msg.refined_prompt!)}
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check size={13} style={{ color: '#10B981' }} />
                                <span style={{ color: '#10B981' }}>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copy Prompt</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="prompt-card-body">
                          <pre className="prompt-pre">{msg.refined_prompt}</pre>
                        </div>
                      </div>
                    )}

                    {msg.quality_scores && (
                      <div className="meta-badges-row">
                        {msg.domain && (
                          <span className="meta-chip domain">
                            Domain: {msg.domain.replace('_', ' ')}
                          </span>
                        )}
                        <span className="meta-chip score">
                          Specificity: {msg.quality_scores.specificity?.toFixed(1) || '5.0'}
                        </span>
                        <span className="meta-chip score">
                          Clarity: {msg.quality_scores.clarity?.toFixed(1) || '5.0'}
                        </span>
                        <span className="meta-chip score">
                          Actionability: {msg.quality_scores.actionability?.toFixed(1) || '5.0'}
                        </span>
                      </div>
                    )}

                    {msg.intent !== 'pass_through' && msg.intent !== 'conversational' && (
                      <div className="followup-chips">
                        {(msg.suggested_actions && msg.suggested_actions.length > 0
                          ? msg.suggested_actions
                          : ['Make it shorter, higher density', 'Add comprehensive edge cases', 'Add test specifications']
                        ).map((action, idx) => (
                          <button
                            key={idx}
                            className="chip-btn"
                            onClick={() => onSendMessage(action)}
                          >
                            <span>{action}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chat-bubble-row kira-row">
                <div className="kira-bubble loading-bubble animate-pulse-gentle">
                  <div className="kira-author">
                    <Sparkles size={14} className="kira-sparkle pulse" />
                    <span>KIRA is recalling project context & synthesizing instructions...</span>
                  </div>
                  <div className="loading-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>
        )}
      </div>

      {/* Floating Bottom Input Bar */}
      <div className="chat-input-bar-container">
        <div className="chat-input-box">
          <div className="input-toolbar">
            <div className="density-pills">
              <span className="toolbar-label">DENSITY:</span>
              {(['short', 'medium', 'detailed'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  className={`density-pill-btn ${density === d ? 'active' : ''}`}
                >
                  {d.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Intuitive Scope Selector right in the input toolbar */}
            <div className="scope-inline-selector">
              <Layers size={12} className="scope-inline-icon" />
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="scope-inline-dropdown"
              >
                <option value="default">Scope: default</option>
                <option value="ecommerce-api">Scope: ecommerce-api</option>
                <option value="shop-frontend">Scope: shop-frontend</option>
                <option value="go-payments-backend">Scope: go-payments-backend</option>
                <option value="all">Scope: all projects</option>
              </select>
            </div>
          </div>

          <div className="textarea-wrapper">
            <textarea
              ref={textareaRef}
              rows={2}
              className="chat-textarea"
              placeholder="Message KIRA (e.g. 'build a resilient payment gateway in Go')..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

            <button
              className={`send-btn ${inputMessage.trim() && !loading ? 'active' : ''}`}
              disabled={!inputMessage.trim() || loading}
              onClick={() => onSendMessage()}
              title="Send to KIRA (Enter)"
            >
              {loading ? (
                <RefreshCw size={15} className="spin-icon" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
