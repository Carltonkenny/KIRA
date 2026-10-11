// frontend/src/components/landing/NewsletterForm.tsx
import React, { useState } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;

    setStatus('loading');
    try {
      // Simulate or call newsletter subscribe
      await new Promise((res) => setTimeout(res, 600));
      setStatus('success');
      setEmail('');
      localStorage.setItem('pf_newsletter', 'subscribed');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <p className="font-mono text-[13px] text-success flex items-center gap-2">
        <span>✓</span> You&apos;re in! We&apos;ll keep you posted.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="flex gap-2 w-full md:w-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 md:w-64 px-4 py-2.5 rounded-lg bg-white/5 border border-border-default text-text-bright text-[13px] placeholder:text-text-muted focus:outline-none focus:border-kira/40 transition-colors"
        required
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-5 py-2.5 rounded-lg bg-kira text-white text-[13px] font-medium btn-glow hover:bg-kira-light transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? '...' : 'Subscribe'}
      </button>
    </form>
  );
}
