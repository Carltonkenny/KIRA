import React, { useState, useMemo } from 'react';
import {
  History,
  RotateCcw,
  Clock,
  ChevronRight,
  Copy,
  Check,
  Search,
  Terminal,
  X,
  Layers,
  Database,
  ArrowRight,
  FileCode,
  Download,
} from 'lucide-react';
import type { RefinementHistoryItem, MCPLog } from '../types';

interface SessionsTabProps {
  historyList: RefinementHistoryItem[];
  mcpLogs: MCPLog[];
  onRerun: (prompt: string) => void;
}

export const SessionsTab: React.FC<SessionsTabProps> = ({
  historyList,
  mcpLogs,
  onRerun,
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    historyList.length > 0 ? historyList[0].session_id : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeInspectorView, setActiveInspectorView] = useState<'comparison' | 'pipeline' | 'json'>('comparison');

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return historyList;
    const q = searchQuery.toLowerCase();
    return historyList.filter(
      (item) =>
        item.message.toLowerCase().includes(q) ||
        item.session_id.toLowerCase().includes(q) ||
        item.refined_prompt.toLowerCase().includes(q)
    );
  }, [historyList, searchQuery]);

  const selectedItem =
    filteredHistory.find((h) => h.session_id === selectedSessionId) ||
    filteredHistory[0] ||
    historyList[0];

  const matchingLog = mcpLogs.find(
    (l) => l.arguments.includes(selectedItem?.message || '___none___')
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportMarkdown = () => {
    if (!selectedItem) return;
    const md = `# KIRA Session ${selectedItem.session_id}
**Timestamp:** ${selectedItem.created_at}

## Raw Human Prompt
\`\`\`
${selectedItem.message}
\`\`\`

## KIRA Engineered Prompt Specification
\`\`\`markdown
${selectedItem.refined_prompt}
\`\`\`
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kira-session-${selectedItem.session_id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const expansionRatio = selectedItem
    ? (selectedItem.refined_prompt.length / Math.max(selectedItem.message.length, 1)).toFixed(1)
    : '1.0';

  return (
    <div className="tab-page-container animate-fade-in">
      {/* Sessions High-Level Telemetry Bar */}
      <div className="sessions-telemetry-strip">
        <div className="strip-metric-card">
          <span className="strip-label">TOTAL PIPELINE RUNS</span>
          <div className="strip-val-row">
            <History size={16} style={{ color: 'var(--violet-400)' }} />
            <span className="strip-val">{historyList.length} Executions</span>
          </div>
        </div>

        <div className="strip-metric-card">
          <span className="strip-label">AVG CONTEXT EXPANSION</span>
          <div className="strip-val-row">
            <span className="strip-val highlight">+148% Enriched</span>
          </div>
        </div>

        <div className="strip-metric-card">
          <span className="strip-label">INFERENCE ENGINE</span>
          <div className="strip-val-row">
            <span className="strip-val">Groq Qwen 2.5 (0.48s)</span>
          </div>
        </div>

        <div className="strip-metric-card">
          <span className="strip-label">CLOUD PERSISTENCE</span>
          <div className="strip-val-row">
            <Database size={14} style={{ color: 'var(--emerald-400)' }} />
            <span className="strip-val green">Neon Serverless DB</span>
          </div>
        </div>
      </div>

      <div className="sessions-layout-grid">
        {/* Left Column: Recent Executions List with Search */}
        <div className="sessions-list-card">
          <div className="sessions-list-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={16} style={{ color: 'var(--violet-400)' }} />
              <h3 className="section-title-clean">Execution History</h3>
            </div>
            <span className="badge-count-pill">{filteredHistory.length} runs</span>
          </div>

          {/* Quick Search */}
          <div className="session-search-box">
            <Search size={14} className="session-search-icon" />
            <input
              type="text"
              placeholder="Search prompts, session IDs, tech stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="session-search-input"
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                <X size={12} />
              </button>
            )}
          </div>

          <div className="sessions-items-scroll">
            {filteredHistory.length === 0 ? (
              <div className="empty-sessions-notice">
                <Clock size={24} style={{ color: 'var(--text-dim)' }} />
                <p>No executions found matching your query.</p>
              </div>
            ) : (
              filteredHistory.map((item) => {
                const isSelected =
                  selectedItem?.id === item.id || selectedSessionId === item.session_id;
                return (
                  <div
                    key={item.id}
                    className={`session-list-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedSessionId(item.session_id)}
                  >
                    <div className="session-item-header">
                      <div className="session-item-title-col">
                        <span className="execution-status-dot"></span>
                        <h4 className="session-prompt-snippet">{item.message}</h4>
                      </div>
                      <div className="session-item-actions">
                        <button
                          className="btn-item-rerun"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRerun(item.message);
                          }}
                          title="Re-run in Chat"
                        >
                          <RotateCcw size={13} />
                        </button>
                        <ChevronRight size={13} className="session-arrow" />
                      </div>
                    </div>

                    <div className="session-item-meta">
                      <span className="session-id-tag">{item.session_id.slice(0, 10)}</span>
                      <span>•</span>
                      <span>{item.refined_prompt.length} chars</span>
                      <span>•</span>
                      <span>{item.created_at?.slice(0, 16) || 'Recent'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Deep Session Inspection Workbench */}
        <div className="session-detail-card">
          <div className="session-detail-header">
            {/* View Switcher Tabs */}
            <div className="detail-view-tabs">
              <button
                className={`detail-tab-btn ${activeInspectorView === 'comparison' ? 'active' : ''}`}
                onClick={() => setActiveInspectorView('comparison')}
              >
                <Layers size={13} />
                <span>Prompt Evolution</span>
              </button>
              <button
                className={`detail-tab-btn ${activeInspectorView === 'pipeline' ? 'active' : ''}`}
                onClick={() => setActiveInspectorView('pipeline')}
              >
                <Terminal size={13} />
                <span>Execution Trace</span>
              </button>
              <button
                className={`detail-tab-btn ${activeInspectorView === 'json' ? 'active' : ''}`}
                onClick={() => setActiveInspectorView('json')}
              >
                <FileCode size={13} />
                <span>JSON Payload</span>
              </button>
            </div>

            {selectedItem && (
              <div className="detail-top-actions">
                <button
                  className="btn-action-ghost"
                  onClick={handleExportMarkdown}
                  title="Export Markdown Spec"
                >
                  <Download size={13} />
                  <span>Export</span>
                </button>
                <button
                  className="btn-rerun-primary"
                  onClick={() => onRerun(selectedItem.message)}
                >
                  <RotateCcw size={13} />
                  <span>Re-run in Chat</span>
                </button>
              </div>
            )}
          </div>

          {selectedItem ? (
            <div className="session-detail-content">
              {/* Telemetry Stats Bar */}
              <div className="telemetry-bar">
                <div className="telemetry-stat">
                  <span className="telemetry-label">INPUT LENGTH</span>
                  <span className="telemetry-val">{selectedItem.message.length} chars</span>
                </div>
                <div className="telemetry-stat">
                  <span className="telemetry-label">ENGINEERED OUTPUT</span>
                  <span className="telemetry-val highlight">{selectedItem.refined_prompt.length} chars</span>
                </div>
                <div className="telemetry-stat">
                  <span className="telemetry-label">EXPANSION RATIO</span>
                  <span className="telemetry-val">{expansionRatio}x</span>
                </div>
                {matchingLog ? (
                  <div className="telemetry-stat">
                    <span className="telemetry-label">MCP DURATION</span>
                    <span className="telemetry-val green">{matchingLog.duration_ms.toFixed(1)} ms</span>
                  </div>
                ) : (
                  <div className="telemetry-stat">
                    <span className="telemetry-label">DATABASE SYNC</span>
                    <span className="telemetry-val green">Neon Pooler</span>
                  </div>
                )}
              </div>

              {/* View 1: Prompt Evolution Comparison */}
              {activeInspectorView === 'comparison' && (
                <div className="inspector-view-container animate-fade-in">
                  <div className="detail-section">
                    <span className="detail-section-label">ORIGINAL HUMAN INPUT</span>
                    <div className="detail-text-box">{selectedItem.message}</div>
                  </div>

                  <div className="detail-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="detail-section-label">KIRA PRODUCTION SPECIFICATION</span>
                      <button
                        className="btn-copy-small"
                        onClick={() => handleCopy(selectedItem.id, selectedItem.refined_prompt)}
                      >
                        {copiedId === selectedItem.id ? (
                          <>
                            <Check size={12} style={{ color: '#10B981' }} />
                            <span style={{ color: '#10B981' }}>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy Output</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="detail-pre-box">{selectedItem.refined_prompt}</pre>
                  </div>
                </div>
              )}

              {/* View 2: Interactive 5-Step Execution Trace Pipeline */}
              {activeInspectorView === 'pipeline' && (
                <div className="inspector-view-container animate-fade-in">
                  <div className="pipeline-trace-wrapper">
                    <div className="pipeline-step-card">
                      <div className="step-num-badge">01</div>
                      <div className="step-content">
                        <div className="step-header-row">
                          <span className="step-title">Raw Prompt Interception</span>
                          <span className="step-timing">~1ms</span>
                        </div>
                        <p className="step-desc">Parsed input text, identified engineering domain & target scope.</p>
                      </div>
                    </div>

                    <div className="pipeline-connector-line">
                      <ArrowRight size={14} className="pipeline-arrow" />
                    </div>

                    <div className="pipeline-step-card">
                      <div className="step-num-badge">02</div>
                      <div className="step-content">
                        <div className="step-header-row">
                          <span className="step-title">Persona & Profile Ingestion</span>
                          <span className="step-timing">~2ms</span>
                        </div>
                        <p className="step-desc">Loaded developer profile: preferred tone (direct), density preference (short).</p>
                      </div>
                    </div>

                    <div className="pipeline-connector-line">
                      <ArrowRight size={14} className="pipeline-arrow" />
                    </div>

                    <div className="pipeline-step-card">
                      <div className="step-num-badge">03</div>
                      <div className="step-content">
                        <div className="step-header-row">
                          <span className="step-title">Neon Semantic Memory Recall</span>
                          <span className="step-timing">~18ms</span>
                        </div>
                        <p className="step-desc">Queried Neon Cloud PostgreSQL pool for active stack constraints.</p>
                      </div>
                    </div>

                    <div className="pipeline-connector-line">
                      <ArrowRight size={14} className="pipeline-arrow" />
                    </div>

                    <div className="pipeline-step-card highlight">
                      <div className="step-num-badge highlight">04</div>
                      <div className="step-content">
                        <div className="step-header-row">
                          <span className="step-title">Groq Qwen 2.5 27B Inference</span>
                          <span className="step-timing">~480ms</span>
                        </div>
                        <p className="step-desc">Synthesized prompt requirements into an actionable, unambiguous engineering spec.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View 3: JSON Payload */}
              {activeInspectorView === 'json' && (
                <div className="inspector-view-container animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                    <button
                      className="btn-copy-small"
                      onClick={() => handleCopy('json-payload', JSON.stringify(selectedItem, null, 2))}
                    >
                      {copiedId === 'json-payload' ? (
                        <>
                          <Check size={12} style={{ color: '#10B981' }} />
                          <span style={{ color: '#10B981' }}>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Raw JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="detail-pre-box json-block">
                    {JSON.stringify(
                      {
                        session_id: selectedItem.session_id,
                        role: selectedItem.role,
                        human_message: selectedItem.message,
                        refined_prompt_specification: selectedItem.refined_prompt,
                        created_at: selectedItem.created_at,
                        mcp_trace: matchingLog || { status: 'internal_api', provider: 'groq' },
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}

              {/* Metadata Badges */}
              <div className="detail-meta-row">
                <span className="meta-badge-dark">
                  Session ID: <strong>{selectedItem.session_id}</strong>
                </span>
                {matchingLog && (
                  <>
                    <span className="meta-badge-dark">
                      Tool: <strong>{matchingLog.tool_name}</strong>
                    </span>
                    <span className="meta-badge-dark">
                      Caller: <strong>{matchingLog.agent_name}</strong>
                    </span>
                  </>
                )}
                <span className="meta-badge-dark">
                  Persistence: <strong>Neon PostgreSQL</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="empty-detail-placeholder">
              Select an execution on the left to inspect original input and engineered prompt output.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
