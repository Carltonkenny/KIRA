// frontend/src/components/landing/LandingNav.tsx
import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Meet Kira', href: '#kira-voice' },
  { label: 'Ecosystem', href: '#integrations' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const LEGAL_LINKS = [
  { label: 'Terms & Conditions', href: '#terms' },
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Cookie Policy', href: '#cookies' },
];

interface LandingNavProps {
  onSignIn: () => void;
  onStartFree: () => void;
  onBrandClick?: () => void;
}

export function LandingNav({ onSignIn, onStartFree, onBrandClick }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass-nav-scrolled py-3' : 'glass-nav py-4'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 md:px-6 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#"
            onClick={(e) => {
              if (onBrandClick) {
                e.preventDefault();
                onBrandClick();
              }
            }}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <span className="text-2xl transition-transform duration-300 group-hover:scale-110">⬡</span>
            <span className="font-display font-bold text-text-bright text-lg tracking-tight">
              PromptForge
            </span>
          </a>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-text-dim hover:text-text-bright transition-colors duration-200 link-hover"
              >
                {link.label}
              </a>
            ))}

            {/* Legal Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setLegalOpen(true)}
              onMouseLeave={() => setLegalOpen(false)}
            >
              <button
                className="text-sm text-text-dim hover:text-text-bright transition-colors duration-200 link-hover flex items-center gap-1 cursor-default py-2"
                aria-expanded={legalOpen}
                aria-haspopup="true"
                aria-label="Legal links menu"
              >
                Legal
                <span className={`text-[10px] transition-transform duration-200 ${legalOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {legalOpen && (
                <div className="absolute top-full right-0 pt-1 w-44 z-50">
                  <div className="glass-card p-2 animate-fade-in-up origin-top">
                    {LEGAL_LINKS.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className="block px-4 py-2 text-[13px] text-text-dim hover:text-text-bright hover:bg-white/5 rounded-md transition-colors"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CTAs + Hamburger */}
          <div className="flex items-center gap-3">
            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onSignIn}>
                Sign in
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="btn-glow"
                onClick={onStartFree}
              >
                Start free →
              </Button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-surface-hover transition-colors"
              aria-label="Toggle menu"
            >
              <span
                className={`w-5 h-[1.5px] bg-text-default transition-all duration-200 ${
                  mobileOpen ? 'translate-y-[4.5px] rotate-45' : ''
                }`}
              />
              <span
                className={`w-5 h-[1.5px] bg-text-default transition-all duration-200 ${
                  mobileOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`w-5 h-[1.5px] bg-text-default transition-all duration-200 ${
                  mobileOpen ? '-translate-y-[4.5px] -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute top-[70px] left-0 right-0 glass-card mx-4 mt-2 p-6 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-base text-text-default hover:text-text-bright transition-colors py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}

              <div className="py-2">
                <p className="font-mono text-[10px] text-text-dim uppercase tracking-wider mb-3">Legal</p>
                <div className="flex flex-col gap-3 pl-2 border-l border-border-default">
                  {LEGAL_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="text-[14px] text-text-default hover:text-text-bright transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>

              <hr className="border-border-subtle my-2" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMobileOpen(false);
                  onSignIn();
                }}
                className="justify-start"
              >
                Sign in
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="btn-glow"
                onClick={() => {
                  setMobileOpen(false);
                  onStartFree();
                }}
              >
                Start free →
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
