// frontend/src/components/ui/Chip.tsx
import { type HTMLAttributes, forwardRef } from 'react';

export type ChipVariant = 'kira' | 'intent' | 'context' | 'domain' | 'engineer' | 'memory' | 'mcp' | 'teal' | 'success' | 'done';

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  active?: boolean;
  skipped?: boolean;
}

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ className = '', variant = 'kira', active = false, skipped = false, children, ...props }, ref) => {
    const variantStyles = {
      kira: 'border-kira text-kira bg-[var(--kira-dim)]',
      intent: 'border-intent text-intent bg-[rgba(244,63,94,0.12)]',
      context: 'border-context text-context bg-[rgba(16,185,129,0.12)]',
      domain: 'border-domain text-domain bg-[rgba(245,158,11,0.12)]',
      engineer: 'border-engineer text-engineer bg-[rgba(139,92,246,0.12)]',
      memory: 'border-memory text-memory bg-[rgba(236,72,153,0.12)]',
      mcp: 'border-mcp text-mcp bg-[rgba(251,146,60,0.12)]',
      teal: 'border-teal text-teal bg-[rgba(20,184,166,0.12)]',
      success: 'border-success text-success bg-[rgba(34,197,94,0.12)]',
      done: 'border-success text-success bg-[rgba(34,197,94,0.12)] opacity-50',
    };

    const activeStyles = active ? 'animate-pulse ring-1 ring-kira/40' : '';
    const skippedStyles = skipped ? 'opacity-40 grayscale' : '';

    return (
      <span
        ref={ref}
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono border ${variantStyles[variant]} ${activeStyles} ${skippedStyles} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Chip.displayName = 'Chip';
