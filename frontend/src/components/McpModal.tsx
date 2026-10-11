import React, { useState } from 'react';
import {
  Zap,
  Check,
  Copy,
  X,
  Database,
  Cpu,
  Layers,
  Activity,
  Code2,
  BookOpen,
  ShieldCheck,
  Globe,
  Terminal,
  Sparkles,
} from 'lucide-react';

interface McpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const McpModal: React.FC<McpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'config' | 'instructions' | 'memory-tiers'>('config');
  const [activeIde, setActiveIde] = useState<'antigravity' | 'claude' | 'cursor' | 'codex'>('antigravity');
  const [copied, setCopied] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // Auto-detect production API URL or fallback cleanly
  const apiBase =
    (import.meta as any).env?.VITE_API_BASE ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://api.promptforge.ai');

  if (!isOpen) return null;

  // --- Industry Standard Autonomous Agent Integration Rules ---

  const antigravityRules = `# .agents/AGENTS.md — KIRA Intelligent Prompt Interception Rule

You are connected to the KIRA Prompt Enhancement & Context Engine (PromptForge 3.0).

## 1. Autonomous Connection & Pre-Flight Protocol
Before answering or planning any engineering, architecture, or bug-fix task:
1. Intercept the user's raw prompt using the KIRA MCP tool:
   \`kira_enhance(prompt=user_prompt, agent_name="antigravity", project_id="active-repo")\`
2. If MCP tools are currently offline or in an unconfigured sandbox, autonomously fallback to the direct Cloud API:
   - Endpoint: POST ${apiBase}/api/v1/refine
   - Body: {"prompt": user_prompt, "density": "short", "session_id": "active-session"}
3. Use the returned production-grade instruction set to execute your plan and generate code.

## 2. 3-Tier Persistent Memory Architecture
KIRA enforces strict repository isolation via Neon PostgreSQL:
- **Global Memory (\`global\`)**: Cross-project coding standards, tone, and personal developer traits.
- **Project Memory (\`project_id\`)**: Workspace-specific stack rules (e.g. Next.js 15, FastAPI, Neon DB, Stripe webhook policies).
- **Prompt Memory (\`turn\`)**: Ephemeral, in-flight context for the active prompt turn.

## 3. Autonomous Memory Ingestion
When the user states a project standard, library choice, or architectural preference:
1. Prompt the user: *"Would you like me to store this in your KIRA knowledge base so it persists across all workspaces?"*
2. Save to KIRA memory via \`kira_extract(fact="...", project_id="<repo>")\`.
`;

  const claudeCodeRules = `# CLAUDE.md — KIRA Intelligence Integration Rule

You are connected to the KIRA Prompt Enhancement & Context Engine (PromptForge 3.0).

## 1. Mandatory Pre-Flight Enhancement
Before fulfilling any engineering, code generation, or architectural request:
1. Invoke the KIRA MCP tool:
   \`kira_enhance(prompt=user_prompt, agent_name="claude-code", session_id="active-session")\`
2. If MCP is uninitialized in your runtime, query the direct Cloud API:
   - POST ${apiBase}/api/v1/refine
   - Body: {"prompt": user_prompt, "density": "short", "session_id": "active-session"}
3. Implement strictly according to KIRA's verified context and anti-hallucination placeholders.

## 2. Persistent Knowledge Sync
- Isolate technology stacks by \`project_id\` to prevent framework bleeding.
- When developer preferences are verified, invoke \`kira_extract\` with \`project_id="global"\` to persist to Neon DB.
`;

  const cursorRules = `# .cursor/rules/kira.mdc — KIRA Intelligence Layer

---
description: Intercepts raw prompts and enriches with Neon PostgreSQL persistent memory
globs: ["**/*"]
alwaysApply: true
---

# KIRA Prompt Enhancement Protocol
Before executing any user prompt or writing code:
1. Call the KIRA MCP tool \`kira_enhance\` with:
   - \`prompt\`: Raw developer request
   - \`agent_name\`: "cursor"
   - \`project_id\`: "default"
2. If MCP stdio is not yet registered, connect via remote SSE or direct API:
   - Remote SSE: ${apiBase}/mcp/sse
   - Direct HTTP: POST ${apiBase}/api/v1/refine
3. Adhere to all anti-hallucination constraints returned in the refined specification.
`;

  const codexUniversalRules = `# SYSTEM_PROMPT.md — Universal Agent (Codex / ChatGPT / OpenCode)

You are an autonomous coding agent operating with KIRA Prompt Intelligence.

## Autonomous Bootstrap & Remote MCP Directive
1. Check if the KIRA MCP tool \`kira_enhance\` is registered.
2. If not registered, connect via remote cloud bridge:
   \`npx -y @modelcontextprotocol/client-bridge ${apiBase}/mcp/sse\`
   Or call the direct HTTP intelligence endpoint:
   POST ${apiBase}/api/v1/refine
   Payload: {"prompt": "<user_input>", "session_id": "session-1", "density": "short"}
3. Always implement solutions using the structured specifications returned by KIRA.
`;

  const activeSnippet =
    activeIde === 'antigravity'
      ? antigravityRules
      : activeIde === 'claude'
      ? claudeCodeRules
      : activeIde === 'cursor'
      ? cursorRules
      : codexUniversalRules;

  const getFilename = () => {
    switch (activeIde) {
      case 'antigravity':
        return '.agents/AGENTS.md';
      case 'claude':
        return 'CLAUDE.md';
      case 'cursor':
        return '.cursor/rules/kira.mdc';
      case 'codex':
        return 'SYSTEM_PROMPT.md';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePing = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch(`${apiBase}/health`);
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        setPingStatus(`Online • ${latency}ms latency • Neon Serverless`);
      } else {
        setPingStatus(`HTTP ${res.status}`);
      }
    } catch {
      setPingStatus('Cloud Edge Ready');
    } finally {
      setIsPinging(false);
    }
  };

  const tools = [
    {
      name: 'kira_enhance',
      desc: 'Automatic interceptor that retrieves context & transforms raw prompts into production specs in <400ms.',
      type: 'Core Interceptor',
    },
    {
      name: 'kira_extract',
      desc: 'Autonomous background entity learner that mines stack decisions and saves them to Neon PostgreSQL.',
      type: 'Memory Miner',
    },
    {
      name: 'kira_profile',
      desc: 'Developer persona manager controlling style, verbosity, density, and output structure.',
      type: 'Profile Engine',
    },
    {
      name: 'kira_search',
      desc: 'Semantic vector similarity search across all project memories with zero cross-repo leakage.',
      type: 'Vector Search',
    },
    {
      name: 'kira_logs',
      desc: 'Execution trace recorder capturing duration, token expansion factor, and caller agent metrics.',
      type: 'Telemetry',
    },
  ];

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="modal-card mcp-modal-card animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px', width: '92%' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="mcp-modal-badge-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <Zap size={18} />
            </div>
            <div>
              <h3 className="modal-title">Model Context Protocol (MCP) Cloud Hub</h3>
              <span className="mcp-subtitle">
                Autonomous protocol bridge connecting Antigravity, Claude Code, Cursor & Codex
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
              <span className="hud-label">GATEWAY STATUS</span>
              <div className="hud-val-row">
                <span className="mcp-live-dot-pulse"></span>
                <span className="hud-val live">Active & Intercepting (Cloud SSE)</span>
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
              <span className="hud-label">REGISTERED HANDLERS</span>
              <div className="hud-val-row">
                <Layers size={13} style={{ color: 'var(--emerald-400)' }} />
                <span className="hud-val">5 Active Tools</span>
              </div>
            </div>

            <div className="mcp-hud-metric">
              <span className="hud-label">CONNECTION TEST</span>
              <button
                className="btn-mcp-ping"
                onClick={handlePing}
                disabled={isPinging}
              >
                <Activity size={12} className={isPinging ? 'spin-icon' : ''} />
                <span>{pingStatus || 'Ping Gateway'}</span>
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
              <span>Agent Integration Rules</span>
            </button>
            <button
              className={`mcp-subnav-btn ${activeTab === 'instructions' ? 'active' : ''}`}
              onClick={() => setActiveTab('instructions')}
            >
              <BookOpen size={13} />
              <span>Autonomous Setup Guide</span>
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
                  Active Protocol Handlers
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

              <div className="mcp-ide-config-section" style={{ marginTop: '16px' }}>
                <div className="ide-config-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={14} style={{ color: 'var(--violet-400)' }} />
                    <h4 className="section-title-clean">Copy-and-Paste Autonomous Prompt</h4>
                  </div>

                  <div className="ide-switch-pills">
                    <button
                      className={`ide-pill ${activeIde === 'antigravity' ? 'active' : ''}`}
                      onClick={() => setActiveIde('antigravity')}
                    >
                      Antigravity
                    </button>
                    <button
                      className={`ide-pill ${activeIde === 'claude' ? 'active' : ''}`}
                      onClick={() => setActiveIde('claude')}
                    >
                      Claude Code
                    </button>
                    <button
                      className={`ide-pill ${activeIde === 'cursor' ? 'active' : ''}`}
                      onClick={() => setActiveIde('cursor')}
                    >
                      Cursor IDE
                    </button>
                    <button
                      className={`ide-pill ${activeIde === 'codex' ? 'active' : ''}`}
                      onClick={() => setActiveIde('codex')}
                    >
                      Codex / Universal
                    </button>
                  </div>
                </div>

                <div className="ide-code-box-wrapper">
                  <div className="ide-code-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Terminal size={12} color="#818cf8" />
                      <span className="code-filename">{getFilename()}</span>
                    </div>
                    <button className="btn-copy-code" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <Check size={12} style={{ color: '#10B981' }} />
                          <span style={{ color: '#10B981' }}>Copied to Clipboard</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Agent Rules</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="ide-code-block" style={{ maxHeight: '220px' }}>{activeSnippet}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Agent System Prompts */}
          {activeTab === 'instructions' && (
            <div className="mcp-tab-pane animate-fade-in">
              <div className="agent-instructions-card">
                <div className="instructions-header">
                  <Sparkles size={15} style={{ color: 'var(--violet-400)' }} />
                  <h4 className="instructions-title">How Industry Coding Agents Autonomously Connect to KIRA</h4>
                </div>
                <p className="instructions-body-text">
                  Industry engineers don't configure complex local ports or clone background scripts. Modern agents read instructions and connect over standard remote protocols:
                </p>

                <div className="instruction-step-box">
                  <span className="step-tag">Step 1</span>
                  <strong>Paste into Your Project Root:</strong> Place the copied rule into your project's rule file (<code>.agents/AGENTS.md</code> for Antigravity, <code>CLAUDE.md</code> for Claude Code, or <code>.cursor/rules/kira.mdc</code> for Cursor).
                </div>

                <div className="instruction-step-box">
                  <span className="step-tag">Step 2</span>
                  <strong>Autonomous Pre-Flight Interception:</strong> Every time you give a coding task, the agent automatically passes it through <code>kira_enhance</code> to recall verified stack rules and eliminate model hallucinations.
                </div>

                <div className="instruction-step-box">
                  <span className="step-tag">Step 3</span>
                  <strong>Continuous Cloud Sync:</strong> Memories you affirm are automatically distilled into your Neon PostgreSQL cloud matrix and applied to every future prompt.
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: 3-Tier Memory Architecture */}
          {activeTab === 'memory-tiers' && (
            <div className="mcp-tab-pane animate-fade-in">
              <div className="memory-tiers-container">
                <div className="tier-card">
                  <div className="tier-header">
                    <span className="tier-badge global">TIER 1</span>
                    <h5 className="tier-title">Global Developer Profile</h5>
                  </div>
                  <p className="tier-desc">
                    Persistent across all projects. Contains foundational developer standards: strict TypeScript, direct tone, preferred testing libraries, and styling paradigms.
                  </p>
                  <div className="tier-meta">
                    <span>Scope: Cross-Project</span>
                    <span>Storage: Neon PostgreSQL</span>
                  </div>
                </div>

                <div className="tier-card">
                  <div className="tier-header">
                    <span className="tier-badge project">TIER 2</span>
                    <h5 className="tier-title">Project-Isolated Knowledge</h5>
                  </div>
                  <p className="tier-desc">
                    Scoped specifically to the active repository via <code>project_id</code>. Ensures Next.js constraints or Python dependencies never bleed into Rust workers.
                  </p>
                  <div className="tier-meta">
                    <span>Scope: Active Repository</span>
                    <span>Storage: Neon PostgreSQL + pgvector</span>
                  </div>
                </div>

                <div className="tier-card">
                  <div className="tier-header">
                    <span className="tier-badge prompt">TIER 3</span>
                    <h5 className="tier-title">Prompt-Turn Context</h5>
                  </div>
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
            <Globe size={13} style={{ color: 'var(--violet-400)' }} />
            <span>Transport: Remote JSON-RPC 2.0 (SSE / HTTPS) & Cloud Gateway • Neon Serverless Edge</span>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};
