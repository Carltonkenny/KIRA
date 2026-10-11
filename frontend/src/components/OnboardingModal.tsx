// frontend/src/components/OnboardingModal.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  User,
  Building2,
  Share2,
  Gamepad2,
  Terminal,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: {
    fullName: string;
    enterpriseScale: string;
    referral: string;
    hobbies: string[];
    aiFrustration: string;
    choice: 'app' | 'mcp';
  }) => void;
  onGoToApp: () => void;
  onGoToMcp: () => void;
}

const ENTERPRISE_SCALES = [
  { id: 'solo', label: 'Solo Engineer / Indie Hacker', desc: 'Personal projects & rapid shipping' },
  { id: 'startup', label: 'Early Startup (2-10)', desc: 'Small agile team moving at high velocity' },
  { id: 'growth', label: 'Growth Scale (10-50)', desc: 'Cross-functional engineering organization' },
  { id: 'enterprise', label: 'Enterprise (50+)', desc: 'Strict security, SOC2 & compliance guidelines' },
];

const REFERRAL_SOURCES = [
  'GitHub Repository / Open Source',
  'X / Twitter',
  'Colleague / Team Recommendation',
  'Hacker News / Reddit',
  'Anthropic / MCP Ecosystem Showcase',
];

const HOBBIES = [
  { id: 'gaming', label: 'Video Games & Indie Game Dev', icon: '🎮' },
  { id: 'scifi', label: 'Sci-Fi & Speculative Fiction', icon: '🚀' },
  { id: 'keyboards', label: 'Custom Mechanical Keyboards', icon: '⌨️' },
  { id: 'dist_systems', label: 'Distributed Systems & Compilers', icon: '⚙️' },
  { id: 'music', label: 'Synthwave & Audio Production', icon: '🎵' },
  { id: 'robotics', label: 'Embedded Hardware & Robotics', icon: '🤖' },
];

const FRUSTRATIONS = [
  { id: 'vague', label: 'AI outputs are too vague & generic', desc: 'Lacks production-ready specificity' },
  { id: 'amnesia', label: 'Zero-shot amnesia across sessions', desc: 'Forgets our schemas and stack decisions' },
  { id: 'hallucinations', label: 'Inventing unverified ORMs / APIs', desc: 'Generates non-existent library methods' },
  { id: 'wordy', label: 'Too much conversational fluff', desc: 'I want pure, razor-sharp code specs' },
];

export function OnboardingModal({
  isOpen,
  onComplete,
  onGoToApp,
  onGoToMcp,
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('Carlton Kenny');
  const [enterpriseScale, setEnterpriseScale] = useState('startup');
  const [referral, setReferral] = useState('GitHub Repository / Open Source');
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([
    'Video Games & Indie Game Dev',
    'Sci-Fi & Speculative Fiction',
  ]);
  const [aiFrustration, setAiFrustration] = useState('amnesia');

  if (!isOpen) return null;

  const toggleHobby = (hobbyLabel: string) => {
    setSelectedHobbies((prev) =>
      prev.includes(hobbyLabel)
        ? prev.filter((h) => h !== hobbyLabel)
        : [...prev, hobbyLabel]
    );
  };

  const handleFinish = (choice: 'app' | 'mcp') => {
    onComplete({
      fullName,
      enterpriseScale,
      referral,
      hobbies: selectedHobbies,
      aiFrustration,
      choice,
    });
    if (choice === 'app') {
      onGoToApp();
    } else {
      onGoToMcp();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0B0D14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Progress Track */}
        <div className="px-8 pt-8 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between text-xs font-mono text-text-dim mb-3">
            <span className="text-kira flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              KIRA 3.0 · Tailoring Your Cognitive Layer
            </span>
            <span>Step {step} of 3</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-kira to-purple-500 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-text-bright tracking-tight mb-1">
                      Welcome to PromptForge.
                    </h2>
                    <p className="text-sm text-text-dim">
                      Let&apos;s establish your baseline profile so Kira remembers your development preferences.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFullName('Carlton Kenny');
                      setStep(2);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-slate-100 transition-colors shrink-0 shadow-sm"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-text-dim flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-kira" />
                    Your Name / Engineer Handle
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="E.g., Alex Mercer"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-bright focus:border-kira focus:outline-none transition-colors text-sm"
                  />
                </div>

                {/* Enterprise Scale */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-text-dim flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-kira" />
                    Team & Enterprise Scale
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ENTERPRISE_SCALES.map((scale) => (
                      <div
                        key={scale.id}
                        onClick={() => setEnterpriseScale(scale.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          enterpriseScale === scale.id
                            ? 'border-kira bg-kira/10 text-white shadow-sm'
                            : 'border-white/5 bg-white/[0.02] text-text-dim hover:border-white/20'
                        }`}
                      >
                        <div className="text-xs font-semibold text-text-bright mb-1">
                          {scale.label}
                        </div>
                        <div className="text-[11px] text-text-dim leading-snug">{scale.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Referral */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-text-dim flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5 text-kira" />
                    How Did You Discover Us?
                  </label>
                  <select
                    value={referral}
                    onChange={(e) => setReferral(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-bright focus:border-kira focus:outline-none text-sm cursor-pointer"
                  >
                    {REFERRAL_SOURCES.map((s) => (
                      <option key={s} value={s} className="bg-[#0B0D14] text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-text-bright tracking-tight mb-2">
                    Passions, Hobbies & Cognitive Boundaries
                  </h2>
                  <p className="text-sm text-text-dim">
                    Kira avoids generic analogies. Select your interests to ground its synthetic prompts.
                  </p>
                </div>

                {/* Hobbies Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-text-dim flex items-center gap-2">
                    <Gamepad2 className="w-3.5 h-3.5 text-kira" />
                    Personal Hobbies & Domains (Multi-Select)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {HOBBIES.map((h) => {
                      const isSelected = selectedHobbies.includes(h.label);
                      return (
                        <div
                          key={h.id}
                          onClick={() => toggleHobby(h.label)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'border-kira bg-kira/15 text-white shadow-sm'
                              : 'border-white/5 bg-white/[0.02] text-text-dim hover:border-white/20'
                          }`}
                        >
                          <span className="text-xl">{h.icon}</span>
                          <span className="text-xs font-medium text-text-bright">{h.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-kira ml-auto" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Frustration */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-text-dim flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-rose-400" />
                    Biggest Frustration with Current AI Tools
                  </label>
                  <div className="space-y-2.5">
                    {FRUSTRATIONS.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => setAiFrustration(f.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          aiFrustration === f.id
                            ? 'border-kira bg-kira/10 text-white'
                            : 'border-white/5 bg-white/[0.02] text-text-dim hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-medium text-text-bright">{f.label}</div>
                          <div className="text-[11px] text-text-dim">{f.desc}</div>
                        </div>
                        {aiFrustration === f.id && (
                          <CheckCircle2 className="w-4 h-4 text-kira flex-shrink-0 ml-3" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-text-bright tracking-tight mb-2">
                    How Would You Like to Connect?
                  </h2>
                  <p className="text-sm text-text-dim">
                    Choose your primary mode of interaction with Kira. You can switch at any time.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {/* Option 1: Web Console App */}
                  <div
                    onClick={() => handleFinish('app')}
                    className="p-6 rounded-2xl border border-kira/30 bg-kira/5 hover:bg-kira/10 transition-all cursor-pointer flex flex-col justify-between group shadow-lg hover:shadow-kira/10"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-kira/20 border border-kira/40 flex items-center justify-center text-kira mb-4 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-text-bright mb-1.5">
                        Direct to App Console
                      </h3>
                      <p className="text-xs text-text-dim leading-relaxed mb-4">
                        Launch the full interactive intelligence dashboard. Inspect knowledge graphs, chat with isolated project memory, and audit past prompt sessions.
                      </p>
                    </div>
                    <button className="w-full py-2.5 rounded-xl bg-kira text-white font-medium text-xs flex items-center justify-center gap-2 group-hover:bg-kira-light transition-colors">
                      Enter Workspace →
                    </button>
                  </div>

                  {/* Option 2: Connect via MCP */}
                  <div
                    onClick={() => handleFinish('mcp')}
                    className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer flex flex-col justify-between group shadow-lg"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition-transform">
                        <Terminal className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-text-bright mb-1.5">
                        Connect via MCP
                      </h3>
                      <p className="text-xs text-text-dim leading-relaxed mb-4">
                        Integrate Kira directly into Claude Code, Google Antigravity, Cursor, or Codex. Automatic prompt interception and pgvector memory injection in your IDE.
                      </p>
                    </div>
                    <button className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors border border-white/10">
                      View IDE Config & Rules →
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-8 py-5 border-t border-white/5 flex items-center justify-between bg-black/40">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2)}
              className="px-4 py-2 rounded-xl text-xs font-mono text-text-dim hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 && (
            <button
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              className="px-6 py-2.5 rounded-xl bg-kira hover:bg-kira-light text-white text-xs font-medium transition-all flex items-center gap-2 btn-glow"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
