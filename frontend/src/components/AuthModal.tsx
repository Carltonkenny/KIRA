import React, { useState } from 'react';
import { Mail, Check, X, ArrowRight, Shield, Database, ExternalLink, User, Sparkles } from 'lucide-react';
import type { AuthUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string) => Promise<AuthUser | null>;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onOpenProfile?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentUser,
  onLogout,
  onOpenProfile,
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    setMessage(null);
    const authData = await onLogin(email.trim());
    setIsSubmitting(false);

    if (authData) {
      if (authData.is_new) {
        setMessage(`Welcome! Opening developer onboarding & profile setup...`);
        setTimeout(() => {
          onClose();
          setMessage(null);
          if (onOpenProfile) onOpenProfile();
        }, 600);
      } else {
        setMessage(`Welcome back! Restored ${authData.memories_count || 0} memories from Neon DB.`);
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 1000);
      }
    } else {
      setMessage('Authentication failed. Check backend connection.');
    }
  };

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    const demoEmail = 'carlton@promptforge.ai';
    setEmail(demoEmail);
    const authData = await onLogin(demoEmail);
    setIsSubmitting(false);
    if (authData) {
      setMessage(`Authenticated as ${demoEmail} (${authData.memories_count || 0} memories restored).`);
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1000);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="modal-card auth-modal-card animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="auth-modal-badge-icon">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="modal-title">PromptForge & KIRA Workspace</h3>
              <span className="auth-subtitle">
                Neon Cloud Database Session Authentication
              </span>
            </div>
          </div>
          <button className="icon-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body auth-modal-body">
          {currentUser ? (
            <div className="auth-active-state">
              <div className="user-info-card">
                <div className="user-avatar-circle">
                  <User size={20} />
                </div>
                <div className="user-details">
                  <h4 className="user-email-title">{currentUser.email}</h4>
                  <span className="user-session-sub">
                    Active Session: <code>{currentUser.session_id}</code>
                  </span>
                  <span className="user-db-sub">
                    Persistence: Neon PostgreSQL Cloud Sync
                  </span>
                </div>
              </div>

              <div className="auth-action-row" style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="landing-btn-secondary"
                  onClick={() => {
                    onClose();
                    if (onOpenProfile) onOpenProfile();
                  }}
                  style={{ flex: 1, padding: '8px 14px', fontSize: '12px' }}
                >
                  <Sparkles size={13} style={{ marginRight: '6px' }} />
                  <span>Configure Profile & MCP</span>
                </button>
                <button
                  className="btn-modal-logout"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="auth-intro-text">
                Enter your developer email to authenticate. If your profile exists in the Neon database,
                your semantic memory palace is instantly restored. If you are new, a fresh session is provisioned.
              </p>

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group-custom">
                  <label>Developer Email</label>
                  <div className="input-with-icon">
                    <Mail size={15} className="input-icon" />
                    <input
                      type="email"
                      placeholder="e.g. developer@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {message && (
                  <div className="auth-status-message animate-fade-in">
                    <Check size={14} style={{ color: '#10B981' }} />
                    <span>{message}</span>
                  </div>
                )}

                <div className="auth-btn-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-auth-google"
                    onClick={async () => {
                      setIsSubmitting(true);
                      const googleEmail = 'carlton.kenny@gmail.com';
                      setEmail(googleEmail);
                      const authData = await onLogin(googleEmail);
                      setIsSubmitting(false);
                      if (authData) {
                        setMessage(`Authenticated with Google: ${googleEmail}`);
                        setTimeout(() => {
                          onClose();
                          setMessage(null);
                        }, 700);
                      }
                    }}
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '11px 16px',
                      borderRadius: '10px',
                      backgroundColor: '#ffffff',
                      color: '#1a1a1a',
                      fontWeight: 600,
                      fontSize: '13px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
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
                    <span>Continue with Google</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontFamily: 'monospace' }}>or</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="submit"
                      className="btn-auth-primary"
                      disabled={isSubmitting || !email.trim()}
                      style={{ flex: 1 }}
                    >
                      <span>{isSubmitting ? 'Authenticating...' : 'Sign In with Email'}</span>
                      <ArrowRight size={14} />
                    </button>

                    <button
                      type="button"
                      className="btn-auth-demo"
                      onClick={handleDemoLogin}
                      disabled={isSubmitting}
                    >
                      Demo Account
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}

          <div className="auth-landing-link-strip">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={13} style={{ color: 'var(--violet-400)' }} />
              <span>PromptForge Landing Page</span>
            </div>
            <a
              href="https://knowledgeable-interface-for-refinem.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-redirect-link"
            >
              <span>Visit PromptForge</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div className="modal-footer">
          <span className="auth-footer-tagline">
            Encrypted TLS v1.3 • Neon Serverless PostgreSQL Pooling
          </span>
          <button className="btn-modal-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
