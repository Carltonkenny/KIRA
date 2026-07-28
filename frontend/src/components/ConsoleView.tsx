/**
 * ConsoleView — prompt input, density selector, forge button, and refined output display.
 */

import { Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import type { Profile } from '../types';

interface ConsoleViewProps {
  rawPrompt: string;
  setRawPrompt: (v: string) => void;
  refinedPrompt: string;
  density: 'short' | 'medium' | 'detailed';
  setDensity: (d: 'short' | 'medium' | 'detailed') => void;
  loading: boolean;
  copied: boolean;
  updateProfile: (updated: Partial<Profile>) => void;
  handleRefine: () => void;
  copyToClipboard: () => void;
}

export default function ConsoleView({
  rawPrompt, setRawPrompt,
  refinedPrompt,
  density, setDensity,
  loading, copied,
  updateProfile, handleRefine, copyToClipboard,
}: ConsoleViewProps) {
  return (
    <div className="console-column">
      {/* Raw Input */}
      <div className="brutalist-card">
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Raw Prompt Input</label>
          <textarea
            className="text-area"
            placeholder="Enter a raw prompt to refine (e.g. 'build a dashboard to display sales records')"
            value={rawPrompt}
            onChange={(e) => setRawPrompt(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ width: '260px' }}>
            <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Target Density</label>
            <div className="segmented-control">
              <div className={`segment-item ${density === 'short' ? 'active' : ''}`} onClick={() => { setDensity('short'); updateProfile({ density_preference: 'short' }); }}>
                Short (Rules)
              </div>
              <div className={`segment-item ${density === 'medium' ? 'active' : ''}`} onClick={() => { setDensity('medium'); updateProfile({ density_preference: 'medium' }); }}>
                Medium (RPG)
              </div>
              <div className={`segment-item ${density === 'detailed' ? 'active' : ''}`} onClick={() => { setDensity('detailed'); updateProfile({ density_preference: 'detailed' }); }}>
                Detailed
              </div>
            </div>
          </div>

          <button className={`btn btn-accent ${loading ? 'btn-disabled' : ''}`} disabled={loading} onClick={handleRefine} style={{ alignSelf: 'flex-end', height: '40px' }}>
            {loading ? <RefreshCw size={14} className="pulse" /> : <Sparkles size={14} />}
            Forge Prompt
          </button>
        </div>
      </div>

      {/* Refined Output */}
      {refinedPrompt && (
        <div className="brutalist-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 className="logo-text" style={{ fontSize: '1rem', color: 'var(--accent)' }}>FORGED HIGH-FIDELITY INSTRUCTION</h3>
            <button className="btn" onClick={copyToClipboard} style={{ padding: '6px 12px' }}>
              {copied ? <Check size={14} style={{ color: 'var(--accent)' }} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="mono-output" style={{ flex: 1, minHeight: '260px' }}>
            {refinedPrompt}
          </pre>
        </div>
      )}
    </div>
  );
}
