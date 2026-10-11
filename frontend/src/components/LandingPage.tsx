import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Check,
  ChevronDown,
} from 'lucide-react';

interface LandingPageProps {
  onLaunchApp: () => void;
  onOpenAuth: () => void;
  onOpenMcp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
  onOpenAuth,
  onOpenMcp,
}) => {
  const [activeSessionStage, setActiveSessionStage] = useState<'cold' | 'warm' | 'tuned'>('tuned');
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);
  const [trialPrompt, setTrialPrompt] = useState('add oauth authentication with google and github');

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Staff Product Architect · FinTech Org',
      quote:
        'I used to spend 15 minutes manually writing constraints into prompts for Claude Code. KIRA injects our exact stack context in 0.5s.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    },
    {
      name: 'Rohan Desai',
      role: 'Principal Engineer · SaaS Enterprise',
      quote:
        'Zero-shot amnesia was our biggest issue with coding agents. KIRA’s project-isolated pgvector memory remembers our schemas effortlessly.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
    {
      name: 'Alex C.',
      role: 'Founding Engineer · Distributed Infra',
      quote:
        'The anti-hallucination constraint is the killer feature. It never invents random ORMs or routes; it always uses exact placeholders.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
    {
      name: 'Karthik N.',
      role: 'Lead Backend Developer · High-Throughput E-Commerce',
      quote:
        'Our junior devs write vague requests. KIRA refines them into strict contracts with edge cases and test specs before running.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    },
  ];

  const faqs = [
    {
      question: 'How is KIRA different from standard ChatGPT or Copilot?',
      answer:
        'Traditional AI tools start with zero context on every session. KIRA is a dedicated prompt intelligence layer that intercepts your raw requests, recalls your persistent project knowledge base, enforces strict anti-hallucination boundaries, and generates unambiguous, production-grade instructions.',
    },
    {
      question: 'How does project-scoped memory isolation work?',
      answer:
        'KIRA isolates memories by `project_id`. Rules for your Next.js frontend will never contaminate your Rust microservice. You can switch project scopes in the console or query the MCP tool with specific project tags.',
    },
    {
      question: 'What is the Model Context Protocol (MCP) server integration?',
      answer:
        'KIRA exports a native FastMCP server over stdio. You can plug `backend/mcp_server.py` into Cursor, Claude Desktop, Antigravity, or OpenCode. The IDE automatically invokes `kira_enhance` before executing coding plans.',
    },
    {
      question: 'Is my codebase and proprietary data secure?',
      answer:
        'Yes. KIRA runs locally with an optional Neon PostgreSQL or local SQLite backend. No prompt data is used for model training, and all cloud memory syncing via Mem0 uses client-isolated user IDs.',
    },
  ];

  return (
    <div className="landing-container">
      {/* Top Floating Glass Navigation */}
      <header className="landing-navbar">
        <div className="landing-nav-inner">
          <div className="landing-brand" onClick={onLaunchApp}>
            <span className="landing-brand-icon">⬡</span>
            <span className="landing-brand-text">PromptForge</span>
            <span className="landing-brand-badge">KIRA 3.0</span>
          </div>

          <nav className="landing-links">
            <a href="#how-it-works" className="landing-link">
              How it works
            </a>
            <a href="#mcp-ecosystem" className="landing-link">
              MCP Ecosystem
            </a>
            <a href="#memory-matrix" className="landing-link">
              Memory Matrix
            </a>
            <a href="#pricing" className="landing-link">
              Pricing
            </a>
            <a href="#faq" className="landing-link">
              FAQ
            </a>
          </nav>

          <div className="landing-nav-actions">
            <button className="landing-btn-secondary" onClick={onOpenAuth}>
              Sign In
            </button>
            <button className="landing-btn-primary" onClick={onLaunchApp}>
              <span>Launch App</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-glow"></div>
        <div className="landing-hero-content">
          <div className="landing-pill-tag">
            <Sparkles size={12} className="tag-sparkle" />
            <span>// the prompt intelligence layer</span>
          </div>

          <h1 className="landing-hero-title">
            Your prompts, <br />
            <span className="gradient-text-hero">precisely</span> engineered.
          </h1>

          <p className="landing-hero-subtitle">
            Kira learns how you think. Every session, your prompts get sharper.
          </p>

          <div className="landing-hero-cta-group">
            <button className="landing-btn-cta-primary" onClick={onOpenAuth}>
              <span>Start for free</span>
              <ArrowRight size={16} />
            </button>
            <a href="#live-demo" className="landing-btn-cta-secondary" style={{ textDecoration: 'none' }}>
              <span>Watch it work ↓</span>
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="landing-metrics-strip">
            <div className="metric-box">
              <span className="metric-val">500+</span>
              <span className="metric-lbl">Prompts Engineered Daily</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-box">
              <span className="metric-val">0.49s</span>
              <span className="metric-lbl">Avg Response Time (Groq)</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-box">
              <span className="metric-val">99.9%</span>
              <span className="metric-lbl">Uptime & Cloud Sync</span>
            </div>
          </div>

          {/* Interactive Live Demo Card */}
          <div className="landing-live-demo-card">
            <div className="demo-card-header">
              <div className="demo-status-pill">
                <span className="demo-live-dot"></span>
                <span>LIVE ENGINE · NEON & MEM0 CONNECTED</span>
              </div>
              <span className="demo-engine-label">KIRA DENSITY: SHORT & DETAILED</span>
            </div>

            <div className="demo-card-body">
              <div className="demo-input-row">
                <input
                  type="text"
                  value={trialPrompt}
                  onChange={(e) => setTrialPrompt(e.target.value)}
                  placeholder="Type a coding prompt (e.g. 'stripe webhook handler in go')..."
                  className="demo-input-field"
                />
                <button className="demo-run-btn" onClick={onLaunchApp}>
                  <Sparkles size={14} />
                  <span>Refine in Console</span>
                </button>
              </div>

              <div className="demo-chips-preview">
                <span className="demo-chip-hint">Example prompts:</span>
                <button
                  className="demo-chip"
                  onClick={() => setTrialPrompt('add oauth authentication with google and github')}
                >
                  OAuth Flow
                </button>
                <button
                  className="demo-chip"
                  onClick={() => setTrialPrompt('diagnose API returning 500 error on checkout')}
                >
                  Debug API 500
                </button>
                <button
                  className="demo-chip"
                  onClick={() => setTrialPrompt('resilient stripe payment webhook with idempotency in Go')}
                >
                  Stripe Webhook
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Kira: Zero-Shot Amnesia Elimination Section */}
      <section id="memory-matrix" className="landing-feature-section">
        <div className="landing-section-header">
          <span className="landing-section-badge">// 02 Meet Kira</span>
          <h2 className="landing-section-title">Not a chatbot. A collaborator that learns your base.</h2>
          <p className="landing-section-desc">
            She reads your profile before every response. Click the timeline or let it play to watch her rewrite responses based on memory.
          </p>
        </div>

        <div className="memory-evolution-card">
          <div className="evolution-nav-tabs">
            <button
              className={`evolution-tab ${activeSessionStage === 'cold' ? 'active' : ''}`}
              onClick={() => setActiveSessionStage('cold')}
            >
              <span className="stage-num">SESSION 01</span>
              <span className="stage-name">Cold</span>
            </button>
            <button
              className={`evolution-tab ${activeSessionStage === 'warm' ? 'active' : ''}`}
              onClick={() => setActiveSessionStage('warm')}
            >
              <span className="stage-num">SESSION 18</span>
              <span className="stage-name">Warm</span>
            </button>
            <button
              className={`evolution-tab ${activeSessionStage === 'tuned' ? 'active' : ''}`}
              onClick={() => setActiveSessionStage('tuned')}
            >
              <span className="stage-num">SESSION 54</span>
              <span className="stage-name">Tuned</span>
            </button>
          </div>

          <div className="evolution-stage-content">
            {activeSessionStage === 'cold' && (
              <div className="stage-pane">
                <div className="stage-quote">
                  "Before I write this prompt — what dialect or framework are we using? Are we on Next.js or Vite?
                  Should I use PostgreSQL or SQLite? And do you have preferred error-handling patterns?"
                </div>
                <div className="stage-footer">
                  <span className="stage-impact">Baseline Clarification: KIRA detects missing stack context and uses placeholders.</span>
                  <span className="stage-score">Profile Mapped: 15%</span>
                </div>
              </div>
            )}

            {activeSessionStage === 'warm' && (
              <div className="stage-pane">
                <div className="stage-quote">
                  "Targeting existing Neon PostgreSQL connection pool (`asyncpg`) and FastAPI backend. Reusing standard
                  HTTP exception middleware. Requesting error traceback before hypothesizing checkout bug."
                </div>
                <div className="stage-footer">
                  <span className="stage-impact">Context Recalled: Automatically incorporates project-specific dependencies.</span>
                  <span className="stage-score">Profile Mapped: 68%</span>
                </div>
              </div>
            )}

            {activeSessionStage === 'tuned' && (
              <div className="stage-pane">
                <div className="stage-quote">
                  "Zero boilerplate. Automatically enforcing project rule: Strict TypeScript 5+, no unverified ORMs,
                  idempotency keys on webhook handlers, and unit test suites for edge cases."
                </div>
                <div className="stage-footer">
                  <span className="stage-impact">Zero-Shot Perfection: Direct, bulletproof prompt ready for immediate IDE injection.</span>
                  <span className="stage-score">Profile Mapped: 96%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Model Context Protocol (MCP) Ecosystem */}
      <section id="mcp-ecosystem" className="landing-feature-section alt-bg">
        <div className="landing-section-header">
          <span className="landing-section-badge">// 02 UNIVERSAL TOOLING</span>
          <h2 className="landing-section-title">Works where you work. Native MCP Bridge.</h2>
          <p className="landing-section-desc">
            PromptForge isn't just a web dashboard. Connect KIRA directly into your terminal or IDE
            via Model Context Protocol (`mcp_server.py`).
          </p>
        </div>

        <div className="mcp-grid-cards">
          <div className="mcp-ide-card">
            <div className="mcp-ide-icon">⚡</div>
            <h3 className="mcp-ide-name">Cursor</h3>
            <p className="mcp-ide-desc">Native prompt enhancement and persistent memory tool inside Cursor Composer.</p>
          </div>
          <div className="mcp-ide-card">
            <div className="mcp-ide-icon">🧠</div>
            <h3 className="mcp-ide-name">Claude Desktop</h3>
            <p className="mcp-ide-desc">Intercept and rewrite system prompts with project-scoped knowledge base recall.</p>
          </div>
          <div className="mcp-ide-card">
            <div className="mcp-ide-icon">🛸</div>
            <h3 className="mcp-ide-name">Antigravity</h3>
            <p className="mcp-ide-desc">Full agent pairing with background execution tracing and session-aware memory.</p>
          </div>
          <div className="mcp-ide-card">
            <div className="mcp-ide-icon">💻</div>
            <h3 className="mcp-ide-name">OpenCode CLI</h3>
            <p className="mcp-ide-desc">Command-line native agent hooks for headless development and CI/CD pipelines.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Marquee */}
      <section className="landing-feature-section">
        <div className="landing-section-header">
          <span className="landing-section-badge">// 03 WHAT BUILDERS SAY</span>
          <h2 className="landing-section-title">Trusted by engineers who care about quality.</h2>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, idx) => (
            <div key={idx} className="testimonial-card">
              <p className="testimonial-quote">"{t.quote}"</p>
              <div className="testimonial-author">
                <img src={t.avatar} alt={t.name} className="testimonial-avatar" />
                <div>
                  <h4 className="author-name">{t.name}</h4>
                  <span className="author-role">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="landing-feature-section alt-bg">
        <div className="landing-section-header">
          <span className="landing-section-badge">// 04 PRICING</span>
          <h2 className="landing-section-title">Simple. Honest. Free tier is real.</h2>
        </div>

        <div className="pricing-cards-container">
          <div className="pricing-card free-tier">
            <div className="tier-tag">FREE FOREVER</div>
            <div className="tier-price">$0</div>
            <p className="tier-desc">Everything needed for solo developers and personal open-source projects.</p>
            <ul className="tier-features">
              <li><Check size={14} className="feature-check" /> Unlimited prompt refinement</li>
              <li><Check size={14} className="feature-check" /> Local SQLite & Neon PostgreSQL sync</li>
              <li><Check size={14} className="feature-check" /> Dynamic quality scoring</li>
              <li><Check size={14} className="feature-check" /> Project memory isolation</li>
              <li><Check size={14} className="feature-check" /> Standard FastMCP integration</li>
            </ul>
            <button className="pricing-btn-primary" onClick={onLaunchApp}>
              Launch Free Console
            </button>
          </div>

          <div className="pricing-card pro-tier">
            <div className="tier-tag-pro">PRO · WAITLIST</div>
            <div className="tier-price">
              $20<span className="price-cycle">/month</span>
            </div>
            <p className="tier-desc">Advanced team workspaces with shared pgvector knowledge graphs.</p>
            <ul className="tier-features">
              <li><Check size={14} className="feature-check" /> Everything in Free</li>
              <li><Check size={14} className="feature-check" /> Multi-seat team knowledge graph</li>
              <li><Check size={14} className="feature-check" /> Enterprise repository indexing</li>
              <li><Check size={14} className="feature-check" /> SOC2 audit logs & custom RLS policies</li>
              <li><Check size={14} className="feature-check" /> Priority Groq low-latency queue</li>
            </ul>
            <button className="pricing-btn-waitlist" onClick={onOpenAuth}>
              Join Pro Waitlist
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="landing-feature-section">
        <div className="landing-section-header">
          <span className="landing-section-badge">// 05 FREQUENTLY ASKED QUESTIONS</span>
          <h2 className="landing-section-title">Questions? Answers.</h2>
        </div>

        <div className="faq-accordion-container">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${faqOpenIndex === index ? 'open' : ''}`}
              onClick={() => setFaqOpenIndex(faqOpenIndex === index ? null : index)}
            >
              <div className="faq-question-row">
                <span className="faq-q-text">{faq.question}</span>
                <ChevronDown
                  size={16}
                  className={`faq-arrow ${faqOpenIndex === index ? 'rotated' : ''}`}
                />
              </div>
              {faqOpenIndex === index && (
                <div className="faq-answer-pane">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="landing-cta-banner">
        <div className="cta-banner-inner">
          <h2 className="cta-banner-title">Ready to engineer better prompts?</h2>
          <p className="cta-banner-subtitle">
            Join developers and power users who get sharper results every single day.
          </p>
          <div className="cta-banner-actions">
            <button className="landing-btn-cta-primary" onClick={onLaunchApp}>
              <span>Get Started Free</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand-col">
            <div className="landing-brand">
              <span className="landing-brand-icon">⬡</span>
              <span className="landing-brand-text">PromptForge / KIRA</span>
            </div>
            <p className="footer-tagline">
              Stateful memory & anti-hallucination intelligence for LLM developer agents.
            </p>
          </div>

          <div className="footer-links-col">
            <span className="col-title">Product</span>
            <button onClick={onLaunchApp} className="footer-link-btn">Console App</button>
            <button onClick={onOpenMcp} className="footer-link-btn">MCP Hub</button>
            <button onClick={onOpenAuth} className="footer-link-btn">Neon Cloud Auth</button>
          </div>

          <div className="footer-links-col">
            <span className="col-title">Connect</span>
            <a
              href="https://github.com/Carltonkenny/KIRA"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link-btn"
            >
              GitHub Repository
            </a>
            <a
              href="https://knowledgeable-interface-for-refinem.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link-btn"
            >
              Vercel Deployment
            </a>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span>© 2026 PromptForge. All rights reserved.</span>
          <span>Engineered by Carlton Kenny.</span>
        </div>
      </footer>
    </div>
  );
};
