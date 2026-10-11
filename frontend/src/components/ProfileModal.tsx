import React, { useState, useEffect } from 'react';
import {
  User,
  Sparkles,
  Zap,
  Check,
  Copy,
  ArrowRight,
  X,
  Terminal,
} from 'lucide-react';
import type { UserProfile, AuthUser } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onSaveProfile: (profile: UserProfile) => void;
  onGoToApp: () => void;
  onGoToMcp: () => void;
}

const ENTERPRISE_TIERS = [
  { id: 'Indie / Solo Developer', label: 'Indie / Solo Builder', icon: '⚡' },
  { id: 'Startup (1-20 engineers)', label: 'Startup (1–20)', icon: '🚀' },
  { id: 'Mid-Market (20-100 engineers)', label: 'Growth (20–100)', icon: '🏢' },
  { id: 'Enterprise (100+ engineers)', label: 'Enterprise (100+)', icon: '🏛️' },
];

const REFERRAL_OPTIONS = [
  { id: 'X / Twitter', label: 'X / Twitter', icon: '🐦' },
  { id: 'GitHub / Open Source', label: 'GitHub / OSS', icon: '🐙' },
  { id: 'Hacker News / Reddit', label: 'Hacker News', icon: '🟧' },
  { id: 'Colleague / Referral', label: 'Peer Referral', icon: '👥' },
  { id: 'Other', label: 'Search / Other', icon: '🌐' },
];

const HOBBY_AND_PASSION_TAGS = [
  '🎮 Video Games & Game Dev',
  '🚀 Indie Hacking & Side Hustles',
  '📖 Sci-Fi & Speculative Fiction',
  '🎵 Music Production & Beats',
  '☕ Specialty Coffee & Food Craft',
  '🏃 Fitness, Running & Outdoors',
  '🎨 Digital Art & Visual Design',
  '🤖 Robotics, IoT & Hardware',
  '♟️ Chess & Logic Puzzles',
  '✍️ Creative Writing & Sci-Fi',
  '📈 Markets & Crypto Trading',
  '🛠️ 3D Printing & Tinkering',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveProfile,
  onGoToApp,
  onGoToMcp,
}) => {
  const [name, setName] = useState('');
  const [enterpriseLevel, setEnterpriseLevel] = useState('Indie / Solo Developer');
  const [referralSource, setReferralSource] = useState('X / Twitter');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    '🎮 Video Games & Game Dev',
    '🚀 Indie Hacking & Side Hustles',
    '📖 Sci-Fi & Speculative Fiction',
  ]);
  const [mode, setMode] = useState<'app' | 'mcp'>('app');
  const [copiedSection, setCopiedSection] = useState<'prompt' | 'config' | null>(null);
  const [agentPlatform, setAgentPlatform] = useState<'cursor' | 'claude' | 'chatgpt' | 'antigravity'>('cursor');

  // Load existing profile from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kira_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) setName(parsed.name);
        if (parsed.enterprise_level) setEnterpriseLevel(parsed.enterprise_level);
        if (parsed.referral_source) setReferralSource(parsed.referral_source);
        if (parsed.interests) setSelectedInterests(parsed.interests);
        if (parsed.connection_mode) setMode(parsed.connection_mode);
      } else if (currentUser?.email) {
        const defaultName = currentUser.email.split('@')[0];
        setName(defaultName.charAt(0).toUpperCase() + defaultName.slice(1));
      }
    } catch {
      // ignore parse errors
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const toggleInterest = (tag: string) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    const profile: UserProfile = {
      name: name.trim() || 'Developer',
      email: currentUser?.email || 'local_user',
      enterprise_level: enterpriseLevel,
      referral_source: referralSource,
      interests: selectedInterests,
      connection_mode: mode,
    };
    onSaveProfile(profile);
  };

  const handleChooseApp = () => {
    handleSave();
    onGoToApp();
    onClose();
  };

  const handleChooseMcp = () => {
    setMode('mcp');
    handleSave();
    onGoToMcp();
  };

  const copyToClipboard = (text: string, section: 'prompt' | 'config') => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Generate dynamic system prompt tailored to user
  const effectiveName = name.trim() || (currentUser?.email ? currentUser.email.split('@')[0] : 'Developer');
  const mcpPrompt = `# KIRA Prompt Enhancement Rule
You are connected to the KIRA Prompt Intelligence MCP Server.
Developer Profile: ${effectiveName} (${enterpriseLevel})
Hobbies & Creative Domains: ${selectedInterests.join(', ') || 'Indie Hacking, Creative Building'}

Operational Directives:
1. Before answering any technical coding task, architecture question, or bug report:
   Invoke the MCP tool \`kira_enhance\` with:
   - \`prompt\`: Raw developer instruction
   - \`agent_name\`: "${agentPlatform}"
   - \`project_id\`: "default"
2. KIRA will automatically recall persistent memories from Neon PostgreSQL and enforce zero-hallucination placeholders.
3. Use the exact refined prompt specification returned by \`kira_enhance\` to generate your code or plan.`;

  const mcpConfigJson = JSON.stringify(
    {
      mcpServers: {
        kira: {
          command: "python",
          args: [
            "-m",
            "mcp_server"
          ],
          cwd: "${workspaceFolder}/backend",
          env: {
            DATABASE_MODE: "postgres",
            AGENT_NAME: agentPlatform,
            USER_ID: currentUser?.email || "local_user"
          }
        }
      }
    },
    null,
    2
  );

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="modal-card profile-modal-card animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="auth-modal-badge-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <User size={18} />
            </div>
            <div>
              <h3 className="modal-title">Developer Profile & Onboarding</h3>
              <span className="auth-subtitle">
                Configure your persistent identity & workspace gateway
              </span>
            </div>
          </div>
          <button className="icon-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Section 1: Basic Details */}
          <div className="profile-section">
            <label className="profile-field-label">
              <span>Your Name / Developer Handle</span>
              <span className="field-hint">Used for prompt personalization & team attribution</span>
            </label>
            <div className="input-group-clean">
              <User size={15} className="input-icon-clean" />
              <input
                type="text"
                className="input-text-clean"
                placeholder="e.g. Carlton Kenny"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Enterprise Tier / Team Scale */}
          <div className="profile-section">
            <label className="profile-field-label">
              <span>Enterprise Scale / Team Stage</span>
              <span className="field-hint">Tailors prompt architecture depth & security rigor</span>
            </label>
            <div className="profile-chip-grid">
              {ENTERPRISE_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setEnterpriseLevel(tier.id)}
                  className={`profile-tier-chip ${enterpriseLevel === tier.id ? 'active' : ''}`}
                >
                  <span className="chip-icon">{tier.icon}</span>
                  <span className="chip-text">{tier.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Referral Source */}
          <div className="profile-section">
            <label className="profile-field-label">
              <span>How did you hear about PromptForge / KIRA?</span>
            </label>
            <div className="profile-chip-grid">
              {REFERRAL_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setReferralSource(item.id)}
                  className={`profile-tier-chip ${referralSource === item.id ? 'active' : ''}`}
                >
                  <span className="chip-icon">{item.icon}</span>
                  <span className="chip-text">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Hobbies & Creative Pursuits */}
          <div className="profile-section">
            <label className="profile-field-label">
              <span>Favorite Hobbies, Builder Passions & Free-Time Pursuits</span>
              <span className="field-hint">Helps KIRA tune analogies, personality, and tone to how you genuinely think</span>
            </label>
            <div className="profile-interests-wrap">
              {HOBBY_AND_PASSION_TAGS.map((tag) => {
                const isSelected = selectedInterests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    className={`interest-tag-pill ${isSelected ? 'selected' : ''}`}
                  >
                    {isSelected && <Check size={12} style={{ marginRight: '4px' }} />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: The Gateway Decision */}
          <div className="profile-section-gateway">
            <label className="profile-field-label" style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                Where would you like to start?
              </span>
            </label>

            <div className="gateway-cards-grid">
              {/* Card 1: Go to App */}
              <div
                className={`gateway-card ${mode === 'app' ? 'selected' : ''}`}
                onClick={handleChooseApp}
              >
                <div className="gateway-card-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                  <Sparkles size={22} />
                </div>
                <div className="gateway-card-info">
                  <div className="gateway-card-header">
                    <h4>Launch Web Console</h4>
                    <span className="gateway-badge live">DEPLOYED</span>
                  </div>
                  <p>
                    Open the interactive PromptForge console. Refine prompts with ChatGPT-style live chat,
                    manage project memories, and view your knowledge graph.
                  </p>
                  <div className="gateway-card-action">
                    <span>Enter Console</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>

              {/* Card 2: Connect via MCP */}
              <div
                className={`gateway-card ${mode === 'mcp' ? 'selected' : ''}`}
                onClick={handleChooseMcp}
              >
                <div className="gateway-card-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
                  <Zap size={22} />
                </div>
                <div className="gateway-card-info">
                  <div className="gateway-card-header">
                    <h4>Connect via MCP</h4>
                    <span className="gateway-badge mcp">INTEGRATION</span>
                  </div>
                  <p>
                    Get instant setup prompt & configuration for Cursor, Claude Desktop, Antigravity,
                    or ChatGPT to run KIRA natively inside your IDE.
                  </p>
                  <div className="gateway-card-action">
                    <span>View MCP Prompt & Config</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: MCP Snippet Viewer (If MCP is selected) */}
          {mode === 'mcp' && (
            <div className="mcp-connect-drawer animate-fade-in">
              <div className="mcp-drawer-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={16} color="#a855f7" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                    Connect KIRA to your AI Agent
                  </span>
                </div>
                {/* Agent platform tabs */}
                <div className="agent-pill-selector">
                  {(['cursor', 'claude', 'antigravity', 'chatgpt'] as const).map((agent) => (
                    <button
                      key={agent}
                      type="button"
                      onClick={() => setAgentPlatform(agent)}
                      className={`agent-tab-chip ${agentPlatform === agent ? 'active' : ''}`}
                    >
                      {agent === 'cursor' && 'Cursor'}
                      {agent === 'claude' && 'Claude'}
                      {agent === 'antigravity' && 'Antigravity'}
                      {agent === 'chatgpt' && 'ChatGPT'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Copyable Agent Prompt */}
              <div className="mcp-code-block-wrap">
                <div className="code-block-bar">
                  <span className="code-block-title">
                    System Interception Prompt (Paste into {agentPlatform.toUpperCase()})
                  </span>
                  <button
                    type="button"
                    className="btn-copy-small"
                    onClick={() => copyToClipboard(mcpPrompt, 'prompt')}
                  >
                    {copiedSection === 'prompt' ? (
                      <>
                        <Check size={12} color="#10b981" />
                        <span style={{ color: '#10b981' }}>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="code-block-pre">
                  <code>{mcpPrompt}</code>
                </pre>
              </div>

              {/* Copyable MCP Config JSON */}
              <div className="mcp-code-block-wrap" style={{ marginTop: '12px' }}>
                <div className="code-block-bar">
                  <span className="code-block-title">IDE Configuration Snippet</span>
                  <button
                    type="button"
                    className="btn-copy-small"
                    onClick={() => copyToClipboard(mcpConfigJson, 'config')}
                  >
                    {copiedSection === 'config' ? (
                      <>
                        <Check size={12} color="#10b981" />
                        <span style={{ color: '#10b981' }}>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="code-block-pre">
                  <code>{mcpConfigJson}</code>
                </pre>
              </div>

              {/* Proceed to console action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="landing-btn-primary"
                  onClick={handleChooseApp}
                  style={{ padding: '8px 18px', fontSize: '13px' }}
                >
                  <span>Continue to Deployed Console</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
