// frontend/src/components/landing/MoatSection.tsx
const metrics = [
  { label: 'Domain vector confidence', value: 'B2B SaaS — 91%', percent: 91, color: 'var(--kira)' },
  { label: 'Architectural alignment', value: 'Microservices, Event-driven', percent: 78, color: 'var(--context)' },
  { label: 'System prompt hit-rate', value: '↑ 34% this month', percent: 65, color: 'var(--success)' },
  { label: 'Manual context overhead', value: 'Down to 12%', percent: 12, color: 'var(--intent)' },
];

export function MoatSection() {
  return (
    <section id="memory-moat" className="py-20 md:py-28 px-5 md:px-12 relative overflow-hidden">
      <div className="absolute -right-[20%] top-[40%] text-[#0B0D14] font-mono text-[200px] leading-none opacity-50 select-none z-0 pointer-events-none">
        MEMORY
      </div>
      <div className="gradient-line absolute top-0 left-[10%] right-[10%]" />

      <div className="max-w-4xl mx-auto relative z-10">
        <p className="font-mono text-kira tracking-[3px] uppercase text-[10px] mb-4">
          // 04  Stateful Memory
        </p>

        <h2 className="text-[24px] md:text-[32px] font-bold tracking-tight text-text-bright mb-4">
          Zero-shot amnesia eliminated.
        </h2>

        <p className="text-[14px] md:text-[15px] text-text-dim mb-10 max-w-2xl leading-relaxed">
          Traditional AI tools start from absolute zero on every request. PromptForge utilizes a continuous{' '}
          <span className="text-text-bright tracking-wide font-mono">pgvector</span> embedding layer to map your
          coding habits, infrastructure preferences, and syntax styles over time.
        </p>

        <div className="glass-card p-6 md:p-8">
          <div className="space-y-6 flex flex-col pt-2">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-mono text-text-muted">{m.label}</span>
                  <span className="font-mono text-[10px]" style={{ color: m.color }}>
                    {m.value}
                  </span>
                </div>
                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-border-default/30 shadow-inner">
                  <div
                    className="h-full rounded-full shadow-[0_0_10px_currentColor] transition-all duration-1000"
                    style={{
                      width: `${m.percent}%`,
                      backgroundColor: m.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-border-subtle flex justify-between items-center">
            <p className="font-mono text-[9px] text-text-dim uppercase tracking-widest">
              Vector Database Synchronization
            </p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="font-mono text-[9px] text-success">ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
