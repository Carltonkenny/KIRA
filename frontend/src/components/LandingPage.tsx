// frontend/src/components/LandingPage.tsx
// Exact legacy landing page from PromptForge / Knowledgeable-Interface-for-Refinement-and-Adaptation
// Includes all 11 high-fidelity sections, grain overlay, aurora mesh, and morphing voice engine

import { LandingNav } from './landing/LandingNav';
import { HeroSection } from './landing/HeroSection';
import { KiraVoiceSection } from './landing/KiraVoiceSection';
import { SocialProofSection } from './landing/SocialProofSection';
import { HowItWorksSection } from './landing/HowItWorksSection';
import { IntegrationsSection } from './landing/IntegrationsSection';
import { MoatSection } from './landing/MoatSection';
import { PricingSection } from './landing/PricingSection';
import { FAQSection } from './landing/FAQSection';
import { BottomCTA } from './landing/BottomCTA';
import { LandingFooter } from './landing/LandingFooter';

interface LandingPageProps {
  onLaunchApp: () => void;
  onOpenAuth: () => void;
  onOpenMcp: () => void;
}

export function LandingPage({ onLaunchApp, onOpenAuth, onOpenMcp }: LandingPageProps) {
  return (
    <div className="relative min-h-screen bg-bg text-text-default font-display selection:bg-kira/30 selection:text-text-bright">
      {/* Grain overlay for texture */}
      <div className="grain-overlay" />

      {/* Navigation */}
      <LandingNav onSignIn={onOpenAuth} onStartFree={onOpenAuth} onBrandClick={onLaunchApp} />

      {/* Main Sections */}
      <main id="main-content">
        <HeroSection onStartFree={onOpenAuth} onSignIn={onOpenAuth} />
        <KiraVoiceSection />
        <SocialProofSection />
        <HowItWorksSection />
        <IntegrationsSection onOpenMcp={onOpenMcp} />
        <MoatSection />
        <PricingSection onStartFree={onOpenAuth} />
        <FAQSection />
        <BottomCTA onStartFree={onOpenAuth} />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
