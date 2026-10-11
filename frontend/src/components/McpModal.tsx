import React, { useState } from 'react';
import {
  Zap,
  Check,
  Copy,
  X,
  Server,
  Database,
  Cpu,
  Layers,
  Activity,
  Code2,
  BookOpen,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

interface McpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const McpModal: React.FC<McpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'config' | 'instructions' | 'memory-tiers'>('config');
  const [activeIde, setActiveIde] = useState<'claude' | 'antigravity' | 'cursor'>('claude');
  const [copied, setCopied] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  if (!isOpen) return null;

  const claudeCodeRules = `# CLAUDE.md — KIRA Intelligence Integration Rule

You are connected to the KIRA Prompt Enhancement & Context Engine.

## Mandatory Pre-Flight Enhancement Rule
1. Before fulfilling complex engineering or architecture prompts, invoke the KIRA MCP tool:
   \`kira_enhance(prompt=user_prompt, agent_name="claude-code", session_id="active-session")\`
2. Use the returned production specification to implement the requested solution.

## 3-Tier Memory Architecture
KIRA maintains 3 distinct memory layers:
- **Global Memory (\`global\`)**: Cross-project developer traits, core preferences (e.g. strict TypeScript, no placeholder code, direct concise tone).
- **Session / Project Memory (\`project_id\`)**: Repository-specific stack rules (e.g. Next.js 14 App Router, Neon Postgres pool, Stripe webhook signatures).
- **Prompt Memory (\`turn\`)**: Ephemeral, in-flight refinement context for the active prompt turn.

## Selective User Ingestion Protocol
When the user mentions or confirms a personal standard or team architectural rule:
1. Ask the user: *"Would you like me to store this in your KIRA global memory so it persists across all your projects?"*
2. Upon confirmation, call \`kira_extract\` with \`project_id="global"\` and the appropriate category (\`tech_stack\`, \`constraints\`, or \`writing_style\`).
`;

  const antigravityRules = `# .agents/AGENTS.md — KIRA Integration Rules

You are connected to the KIRA Prompt Enhancement MCP Server.

## Prompt Interception Rule
1. Before answering any engineering user request, invoke the KIRA tool \`kira_enhance\`:
   - \`prompt\`: Raw user input
   - \`agent_name\`: "antigravity"
   - \`session_id\`: Active conversation ID
2. Use the exact structured specification returned by \`kira_enhance\` to generate your code and plan.

## Autonomous Global Memory Ingestion
When the user specifies fundamental preferences (e.g. preferred testing framework, API standards, or strict formatting):
1. Selectively prompt the user: *"Should I record this rule into KIRA Global Memory for all future workspaces?"*
2. Save verified rules to Neon PostgreSQL via \`kira_extract\` with \`project_id: "global"\`.
`;

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        kira: {
          command: "python",
          args: ["C:/Users/user/OneDrive/Desktop/KIRA/backend/mcp_server.py"],
          env: {
            PYTHONUNBUFFERED: "1",
            DATABASE_MODE: "postgres",
          },
        },
      },
    },
    null,
    2
  );

  const activeSnippet =
    activeIde === 'claude'
      ? claudeCodeRules
      : activeIde === 'antigravity'
      ? antigravityRules
      : cursorConfig;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePing = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('http://localhost:8090/health');
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        setPingStatus(`Active • ${latency}ms latency • Neon DB Connected`);
      } else {
        setPingStatus(`HTTP ${res.status}`);
      }
    } catch {
      setPingStatus('Backend offline or unreachable');
    } finally {
      setIsPinging(false);
    }
  };

  const tools = [
    {
      name: 'kira_enhance',
      desc: 'Automatic interceptor that retrieves context & transforms raw prompts into production specs.',
      type: 'Core Interceptor',
    },
    {
      name: 'kira_extract',
      desc: 'Autonomous background entity learner that mines stack decisions and saves them to Neon DB.',
      type: 'Memory Miner',
    },
    {
      name: 'kira_profile',
      desc: 'Developer persona manager controlling style, verbosity, density, and output structure.',
      type: 'Profile Engine',
    },
    {
      name: 'kira_search',
      desc: 'Semantic vector similarity search across all project memories with zero leakage.',
      type: 'Vector Search',
    },
    {
      name: 'kira_logs',
      desc: 'Execution trace recorder capturing duration, token expansion factor, and caller agent.',
      type: 'Telemetry',
    },
  ];

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="modal-card mcp-modal-card animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="mcp-modal-badge-icon">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="modal-title">Model Context Protocol (MCP) Hub</h3>
              <span className="mcp-subtitle">
                Enterprise protocol bridge connecting KIRA to Claude Code, Antigravity & Cursor
              </span>
            </div>
          </div>
          <button className="icon-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body mcp-modal-body">
          {/* Status HUD Banner */}
          <div className="mcp-status-hud">
            <div className="mcp-hud-metric">
              <span className="hud-label">SERVER STATUS</span>
              <div className="hud-val-row">
                <span className="mcp-live-dot-pulse"></span>
                <span className="hud-val live">Active & Intercepting</span>
              </div>
            </div>

            <div className="mcp-hud-metric">
              <span className="hud-label">DATABASE SYNC</span>
              <div className="hud-val-row">
                <Database size={13} style={{ color: 'var(--violet-400)' }} />
                <span className="hud-val">Neon PostgreSQL (Serverless)</span>
              </div>
            </div>

            <div className="mcp-hud-metric">
              <span className="hud-label">REGISTERED TOOLS</span>
              <div className="hud-val-row">
                <Layers size={13} style={{ color: 'var(--emerald-400)' }} />
                <span className="hud-val">5 Active Handlers</span>
              </div>
            </div>

            <div className="mcp-hud-metric">
              <span className="hud-label">TEST CONNECTION</span>
              <button
                className="btn-mcp-ping"
                onClick={handlePing}
                disabled={isPinging}
              >
                <Activity size={12} className={isPinging ? 'spin-icon' : ''} />
                <span>{pingStatus || 'Ping Server'}</span>
              </button>
            </div>
          </div>

          {/* Nav Tabs Inside Modal */}
          <div className="mcp-view-subnav">
            <button
              className={`mcp-subnav-btn ${activeTab === 'config' ? 'active' : ''}`}
              onClick={() => setActiveTab('config')}
            >
              <Code2 size={13} />
              <span>Client Setup</span>
            </button>
            <button
              className={`mcp-subnav-btn ${activeTab === 'instructions' ? 'active' : ''}`}
              onClick={() => setActiveTab('instructions')}
            >
              <BookOpen size={13} />
              <span>Agent System Prompts</span>
            </button>
            <button
              className={`mcp-subnav-btn ${activeTab === 'memory-tiers' ? 'active' : ''}`}
              onClick={() => setActiveTab('memory-tiers')}
            >
              <ShieldCheck size={13} />
              <span>3-Tier Memory Architecture</span>
            </button>
          </div>

          {/* Tab 1: Client Setup */}
          {activeTab === 'config' && (
            <div className="mcp-tab-pane animate-fade-in">
              <div className="mcp-tools-section">
                <h4 className="section-title-clean">
                  <Cpu size={14} style={{ color: 'var(--violet-400)', marginRight: '6px' }} />
                  Registered Protocol Handlers
                </h4>
                <div className="mcp-tools-grid">
                  {tools.map((tool) => (
                    <div key={tool.name} className="mcp-tool-card">
                      <div className="tool-card-header">
                        <span className="tool-name-code">{tool.name}</span>
                        <span className="tool-type-badge">{tool.type}</span>
                      </div>
                      <p className="tool-desc">{tool.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mcp-ide-config-section" style={{ marginTop: '14px' }}>
                <div className="ide-config-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Code2 size={14} style={{ color: 'var(--violet-400)' }} />
                    <h4 className="section-title-clean">Client Configuration</h4>
                  </div>

                  <div className="ide-switch-pills">
                    <button
                      className={`ide-pill ${activeIde === 'claude' ? 'active' : ''}`}
                      onClick={() => setActiveIde('claude')}
                    >
                      Claude Code
                    </button>
                    <button
                      className={`ide-pill ${activeIde === 'antigravity' ? 'active' : ''}`}
                      onClick={() => setActiveIde('antigravity')}
                    >
                      Antigravity
                    </button>
                    <button
                      className={`ide-pill ${activeIde === 'cursor' ? 'active' : ''}`}
                      onClick={() => setActiveIde('cursor')}
                    >
                      Cursor IDE
                    </button>
                  </div>
                </div>

                <div className="ide-code-box-wrapper">
                  <div className="ide-code-header">
                    <span className="code-filename">
                      {activeIde === 'claude'
                        ? 'CLAUDE.md'
                        : activeIde === 'antigravity'
                        ? '.agents/AGENTS.md'
                        : '.cursor/mcp.json'}
                    </span>
                    <button className="btn-copy-code" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <Check size={12} style={{ color: '#10B981' }} />
                          <span style={{ color: '#10B981' }}>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Rules</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="ide-code-block">{activeSnippet}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Agent System Prompts */}
          {activeTab === 'instructions' && (
            <div className="mcp-tab-pane animate-fade-in">
              <div className="agent-instructions-card">
                <div className="instructions-header">
                  <HelpCircle size={15} style={{ color: 'var(--violet-400)' }} />
                  <h4 className="instructions-title">Guiding Claude Code & Antigravity to Use KIRA Appropriately</h4>
                </div>
                <p className="instructions-body-text">
                  To ensure agents don't hallucinate or disregard your coding standards, configure your agent's system prompt to enforce KIRA interception.
                </p>

                <div className="instruction-step-box">
                  <span className="step-tag">Rule 1</span>
                  <strong>Intercept Before Generation:</strong> When a user gives an engineering goal, always call <code>kira_enhance</code> first.
                </div>

                <div className="instruction-step-box">
                  <span className="step-tag">Rule 2</span>
                  <strong>Selective User Ingestion:</strong> When the user shares architectural preferences (e.g., <em>"We always use pnpm"</em>, <em>"Never write any console.log in production"</em>), the agent should ask:
                  <blockquote className="quote-box">
                    "I noticed you prefer pnpm and strict zero-logging. Would you like me to store this in your KIRA global memory across all projects?"
                  </blockquote>
                </div>

                <div className="instruction-step-box">
                  <span className="step-tag">Rule 3</span>
                  <strong>Project Scoping:</strong> Keep repository-specific secrets and configs scoped to the project ID, preventing leakage into other repositories.
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: 3-Tier Memory Architecture */}
          {activeTab === 'memory-tiers' && (
            <div className="mcp-tab-pane animate-fade-in">
              <div className="memory-tiers-container">
                <div className="tier-card tier-global">
                  <div className="tier-badge">TIER 1 • GLOBAL MEMORY</div>
                  <h4 className="tier-name">Cross-Project Developer Persona</h4>
                  <p className="tier-desc">
                    Persistent traits shared across all repositories. Includes developer coding style, seniority constraints, preferred tools, and density preferences.
                  </p>
                  <div className="tier-meta">
                    <span>Scope: <code>project_id='global'</code></span>
                    <span>Storage: Neon Cloud DB</span>
                  </div>
                </div>

                <div className="tier-card tier-project">
                  <div className="tier-badge">TIER 2 • PROJECT / SESSION MEMORY</div>
                  <h4 className="tier-name">Repository & Workspace Context</h4>
                  <p className="tier-desc">
                    Specific architectural choices and technical boundaries tied to an individual workspace (e.g. Next.js 14 App Router, Stripe API keys, Tailwind v4).
                  </p>
                  <div className="tier-meta">
                    <span>Scope: <code>project_id='&lt;workspace&gt;'</code></span>
                    <span>Storage: Neon Cloud DB</span>
                  </div>
                </div>

                <div className="tier-card tier-prompt">
                  <div className="tier-badge">TIER 3 • PROMPT MEMORY</div>
                  <h4 className="tier-name">Turn-Level Ephemeral Execution</h4>
                  <p className="tier-desc">
                    Dynamic parameters and conversational refinements within the active prompt turn. Evaporates once the session or refinement cycle finishes.
                  </p>
                  <div className="tier-meta">
                    <span>Scope: In-flight Session Context</span>
                    <span>Storage: Session Cache</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="mcp-footer-info">
            <Server size={13} style={{ color: 'var(--text-muted)' }} />
            <span>Transport: JSON-RPC 2.0 via STDIO & FastAPI Port 8090</span>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};
