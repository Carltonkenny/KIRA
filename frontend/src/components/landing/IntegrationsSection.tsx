// frontend/src/components/landing/IntegrationsSection.tsx
import { useState } from 'react';

const INTEGRATIONS = [
  { name: 'Cursor', desc: 'IDE native support via MCP layer.', icon: '⚡', gridClass: 'md:col-start-1 md:row-start-1' },
  { name: 'GitHub Copilot', desc: 'Injected context for Copilot Chat.', icon: '🐙', gridClass: 'md:col-start-3 md:row-start-1' },
  { name: 'Claude Desktop', desc: 'Read/Write access for system prompts.', icon: '🧠', gridClass: 'md:col-start-1 md:row-start-2' },
  { name: 'Antigravity', desc: 'Secure agentic framework.', icon: '🛸', gridClass: 'md:col-start-3 md:row-start-2' },
  { name: 'Qwen Matrix', desc: 'Deep reasoning context sync.', icon: '⚛️', gridClass: 'md:col-start-1 md:row-start-3' },
  { name: 'OpenCode IDE', desc: 'Open source local architecture.', icon: '💻', gridClass: 'md:col-start-3 md:row-start-3' },
];

const AGENT_RULES = {
  claude: {
    title: 'Claude Code',
    filename: 'CLAUDE.md',
    directive: `# CLAUDE.md — KIRA Intelligence Integration Rule\nYou are connected to the KIRA Prompt Enhancement & Context Engine.\n\n## Pre-Flight Prompt Interception Rule\n1. Before fulfilling any engineering user request, invoke the KIRA tool \`kira_enhance\` with the user's prompt.\n2. Use the exact structured specification returned by KIRA to generate your code.`,
  },
  antigravity: {
    title: 'Google Antigravity',
    filename: '.agents/AGENTS.md',
    directive: `# .agents/AGENTS.md — KIRA Integration Rules\nYou are connected to the KIRA Prompt Enhancement MCP Server.\n\n## Prompt Interception Rule\n1. Before answering any engineering request, invoke the KIRA tool \`kira_enhance\` with:\n   - \`prompt\`: Raw user input\n   - \`agent_name\`: "antigravity"\n   - \`session_id\`: Active conversation ID\n2. Use the exact structured specification returned by \`kira_enhance\` to generate your code.`,
  },
  cursor: {
    title: 'Cursor IDE',
    filename: '.cursorrules',
    directive: `# .cursorrules — KIRA Prompt Intelligence Directive\nConnect to KIRA MCP (https://api.promptforge.ai/mcp/sse).\nAlways execute \`kira_enhance\` to fetch verified architectural constraints and active project memory before generating boilerplate code.`,
  },
};

interface IntegrationsSectionProps {
  onOpenMcp?: () => void;
}

export function IntegrationsSection({ onOpenMcp }: IntegrationsSectionProps) {
  const [selectedAgent, setSelectedAgent] = useState<'claude' | 'antigravity' | 'cursor'>('claude');
  const [copied, setCopied] = useState(false);

  const handleCopyRule = () => {
    navigator.clipboard.writeText(AGENT_RULES[selectedAgent].directive);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="integrations" className="py-24 md:py-32 px-5 md:px-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-kira/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 md:mb-24">
          <p className="font-mono text-kira tracking-[3px] uppercase text-[10px] mb-4">
            // Ecosystem
          </p>
          <h2 className="text-[28px] md:text-[40px] font-bold tracking-tight text-text-bright mb-4">
            Works where you work.
          </h2>
          <p className="text-[15px] md:text-[17px] text-text-dim max-w-xl mx-auto">
            PromptForge acts as an underlying Model Context Protocol (MCP) server, injecting stateful memory and zero-hallucination constraints directly into your favorite coding agents.
          </p>
        </div>

        {/* Node Graph Layout */}
        <div className="relative max-w-5xl mx-auto mb-16">
          {/* Animated SVG Connections (Desktop Only) */}
          <div className="hidden md:block absolute inset-0 pointer-events-none z-0">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="glowLine" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(99,102,241,0.1)" />
                  <stop offset="50%" stopColor="rgba(99,102,241,0.6)" />
                  <stop offset="100%" stopColor="rgba(99,102,241,0.1)" />
                </linearGradient>
              </defs>
              <path d="M 50% 50% L 20% 20%" stroke="url(#glowLine)" strokeWidth="1" fill="none" />
              <path d="M 50% 50% L 80% 20%" stroke="url(#glowLine)" strokeWidth="1" fill="none" />
              <path d="M 50% 50% L 20% 50%" stroke="url(#glowLine)" strokeWidth="1" fill="none" />
              <path d="M 50% 50% L 80% 50%" stroke="url(#glowLine)" strokeWidth="1" fill="none" />
              <path d="M 50% 50% L 20% 80%" stroke="url(#glowLine)" strokeWidth="1" fill="none" />
              <path d="M 50% 50% L 80% 80%" stroke="url(#glowLine)" strokeWidth="1" fill="none" />
            </svg>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-x-12 md:gap-y-16 relative z-10 w-full min-h-[500px] items-center">
            {/* Center Node */}
            <div
              onClick={onOpenMcp}
              className="md:col-start-2 md:row-start-2 mx-auto w-40 h-40 rounded-2xl bg-layer2/80 backdrop-blur-md border-[2px] border-kira/40 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.3)] relative z-20 group cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="absolute inset-0 rounded-2xl border border-kira animate-ping opacity-20" />
              <div className="text-center">
                <div className="w-6 h-6 bg-kira rounded-sm mx-auto mb-3 animate-pulse shadow-[0_0_15px_rgba(99,102,241,1)]" />
                <span className="font-mono text-[11px] uppercase tracking-widest text-kira font-bold">
                  MCP Server
                </span>
                <span className="block font-mono text-[9px] text-text-dim mt-1 group-hover:text-kira-light">
                  Click to connect
                </span>
              </div>
            </div>

            {/* Peripheral Nodes */}
            {INTEGRATIONS.map((integ) => (
              <div
                key={integ.name}
                className={`glass-card p-5 relative group overflow-hidden border-border-default/50 hover:border-text-bright/20 h-full flex flex-col justify-center ${integ.gridClass}`}
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-layer2 border border-border-default flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all shadow-inner">
                    {integ.icon}
                  </div>
                  <h3 className="text-[15px] font-semibold text-text-bright">{integ.name}</h3>
                </div>
                <p className="text-[12px] text-text-dim leading-relaxed ml-14">
                  {integ.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* High-Leverage: 1-Click Agent Directives Box */}
        <div className="max-w-3xl mx-auto rounded-xl bg-layer2/90 border border-white/10 p-6 backdrop-blur-md shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <h4 className="text-sm font-semibold text-text-bright">
                  1-Click Agent Integration Directives
                </h4>
              </div>
              <p className="text-xs text-text-dim font-mono mt-0.5">
                Drop this rule in your repo. Your agent auto-connects to KIRA memory before writing code.
              </p>
            </div>

            {/* Agent Selector Pills */}
            <div className="flex items-center bg-black/40 p-1 rounded-lg border border-white/10">
              {(['claude', 'antigravity', 'cursor'] as const).map((agentKey) => (
                <button
                  key={agentKey}
                  type="button"
                  onClick={() => setSelectedAgent(agentKey)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                    selectedAgent === agentKey
                      ? 'bg-kira text-white font-semibold shadow-sm'
                      : 'text-text-dim hover:text-white'
                  }`}
                >
                  {AGENT_RULES[agentKey].title}
                </button>
              ))}
            </div>
          </div>

          {/* Rule Code Preview */}
          <div className="relative">
            <div className="flex items-center justify-between px-3 py-1.5 bg-black/60 rounded-t-lg border border-white/5 border-b-0">
              <span className="text-[11px] font-mono text-kira font-bold">
                {AGENT_RULES[selectedAgent].filename}
              </span>
              <button
                type="button"
                onClick={handleCopyRule}
                className="text-[11px] font-mono flex items-center gap-1.5 text-text-dim hover:text-white transition-colors"
              >
                {copied ? (
                  <span className="text-emerald-400 font-bold">✓ Copied to clipboard!</span>
                ) : (
                  <span>📋 Copy Directive</span>
                )}
              </button>
            </div>
            <pre className="p-3.5 bg-black/40 rounded-b-lg border border-white/5 text-[11px] font-mono text-text-muted overflow-x-auto whitespace-pre leading-relaxed">
              {AGENT_RULES[selectedAgent].directive}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
