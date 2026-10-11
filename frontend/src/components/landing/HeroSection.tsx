// frontend/src/components/landing/HeroSection.tsx
import { Button } from '../ui/Button';
import { LiveDemoWidget } from './LiveDemoWidget';

const HERO_STATS = [
  { value: '500+', label: 'prompts engineered daily' },
  { value: '4.2s', label: 'avg response time' },
  { value: '99.9%', label: 'uptime' },
];

interface HeroSectionProps {
  onStartFree: () => void;
  onSignIn?: () => void;
}

export function HeroSection({ onStartFree, onSignIn }: HeroSectionProps) {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 px-5 md:px-6 overflow-hidden"
    >
      {/* Aurora background */}
      <div className="aurora-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
      </div>

      {/* Content — sits above aurora */}
      <div className="relative z-10 flex flex-col items-center max-w-5xl w-full">
        {/* Eyebrow */}
        <p className="font-mono text-kira tracking-[3px] uppercase text-[10px] md:text-[11px] mb-6 opacity-90 animate-fade-in-up">
          // the prompt intelligence layer
        </p>

        {/* H1 */}
        <h1 className="text-[36px] md:text-[56px] lg:text-[64px] font-bold tracking-tight text-text-bright leading-[1.05] text-center mb-6 animate-fade-in-up animate-stagger-1">
          Your prompts,
          <br />
          <em className="gradient-text not-italic">precisely</em> engineered.
        </h1>

        {/* Sub */}
        <p className="text-[15px] md:text-[17px] text-text-dim font-light leading-[1.7] text-center max-w-2xl mb-10 animate-fade-in-up animate-stagger-2">
          Kira learns how you think. Every session, your prompts get sharper.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-12 animate-fade-in-up animate-stagger-3">
          <Button
            variant="primary"
            size="lg"
            className="btn-glow glow-kira w-full sm:w-auto"
            onClick={onStartFree}
          >
            Start for free
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => {
              document.getElementById('live-demo')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Watch it work ↓
          </Button>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mb-8 animate-fade-in-up animate-stagger-4">
          {HERO_STATS.map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              {i > 0 && <span className="hidden md:block w-px h-8 bg-border-default" />}
              <div className={`text-center ${i > 0 ? 'md:pl-4' : ''}`}>
                <span className="block font-mono text-xl md:text-2xl font-bold text-text-bright">
                  {stat.value}
                </span>
                <span className="block font-mono text-[10px] text-text-dim tracking-wider uppercase">
                  {stat.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Developer Stack Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-14 animate-fade-in-up animate-stagger-4">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-text-dim flex items-center gap-1.5 hover:border-kira/40 hover:text-white transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            FastMCP 2026 Ready
          </span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-text-dim flex items-center gap-1.5 hover:border-kira/40 hover:text-white transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-kira animate-pulse" />
            Groq LPU (0.42s latency)
          </span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-text-dim flex items-center gap-1.5 hover:border-kira/40 hover:text-white transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
            Neon Serverless pgvector
          </span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-text-dim flex items-center gap-1.5 hover:border-kira/40 hover:text-white transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Cloud HTTPS SSE
          </span>
        </div>

        {/* Live Demo Widget */}
        <div id="live-demo" className="w-full max-w-2xl">
          <LiveDemoWidget onStartFree={onStartFree} onSignIn={onSignIn} />
        </div>
      </div>
    </section>
  );
}
