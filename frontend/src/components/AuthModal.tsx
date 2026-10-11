import React, { useState } from 'react';
import { Mail, Check, X, ArrowRight, Shield, Database, ExternalLink, User } from 'lucide-react';
import type { AuthUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string) => Promise<AuthUser | null>;
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentUser,
  onLogout,
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
        setMessage(`Welcome! New session created and registered in Neon DB.`);
      } else {
        setMessage(`Welcome back! Restored ${authData.memories_count || 0} memories from Neon DB.`);
      }
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1200);
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

              <div className="auth-action-row">
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

                <div className="auth-btn-row">
                  <button
                    type="submit"
                    className="btn-auth-primary"
                    disabled={isSubmitting || !email.trim()}
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
                    Quick Demo Access
                  </button>
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
