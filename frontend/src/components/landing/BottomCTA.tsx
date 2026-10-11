// frontend/src/components/landing/BottomCTA.tsx
import { Button } from '../ui/Button';

interface BottomCTAProps {
  onStartFree: () => void;
}

export function BottomCTA({ onStartFree }: BottomCTAProps) {
  return (
    <section className="py-24 md:py-32 px-5 md:px-12 relative">
      <div className="gradient-line absolute top-0 left-[10%] right-[10%]" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-kira/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight text-text-bright mb-4">
          Ready to engineer better prompts?
        </h2>
        <p className="text-[14px] md:text-[15px] text-text-dim mb-8 max-w-xl mx-auto">
          Join developers and power users who get sharper results every day.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5">
          <Button
            variant="primary"
            size="lg"
            className="btn-glow glow-kira w-full sm:w-auto"
            onClick={onStartFree}
          >
            Get started free →
          </Button>
        </div>
        <p className="font-mono text-[10px] text-text-dim">
          Also available as MCP for Cursor, Antigravity, and Claude Desktop
        </p>
      </div>
    </section>
  );
}
