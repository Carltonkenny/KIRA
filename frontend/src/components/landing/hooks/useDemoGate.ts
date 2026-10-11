// frontend/src/components/landing/hooks/useDemoGate.ts
import { useState, useEffect, useCallback } from 'react';

const DEMO_MAX_USES = 3;
const DEMO_STORAGE_KEY = 'pf_demo_uses';

export function useDemoGate() {
  const [usesRemaining, setUsesRemaining] = useState<number>(DEMO_MAX_USES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) {
          setUsesRemaining(Math.max(0, DEMO_MAX_USES - parsed));
        }
      }
    } catch {
      // localStorage fallback
    }
    setIsLoaded(true);
  }, []);

  const recordUse = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY);
      const current = stored ? parseInt(stored, 10) : 0;
      const newValue = current + 1;
      localStorage.setItem(DEMO_STORAGE_KEY, String(newValue));
      setUsesRemaining((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  }, []);

  const isGated = usesRemaining <= 0;

  return { usesRemaining, isGated, recordUse, isLoaded };
}
