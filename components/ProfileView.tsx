'use client';

import type { Profile, AspectScore } from '@/types';
import { useState } from 'react';

interface ProfileViewProps {
  profile: Profile;
}

export default function ProfileView({ profile }: ProfileViewProps) {
  const [showBoostPrompt, setShowBoostPrompt] = useState(false);

  const getStrengthColor = (strength: number) => {
    if (strength >= 4) return 'text-accent-cyan';
    if (strength >= 3) return 'text-accent-orange';
    return 'text-red-400';
  };

  const getConfidenceColor = (confidence: string) => {
    if (confidence === 'high') return 'text-accent-cyan';
    if (confidence === 'medium') return 'text-accent-orange';
    return 'text-text-dim';
  };

  const renderAspect = (label: string, aspect: AspectScore) => (
    <div className="bg-forge-black p-4 border-l-2 border-grid-line hover:border-accent-cyan transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold text-sm uppercase tracking-wide text-text-primary">{label}</div>
        <div className={`text-2xl font-bold ${getConfidenceColor(aspect.confidence)}`}>
          {aspect.score}
        </div>
      </div>
      <div className={`text-xs uppercase font-bold mb-2 ${getConfidenceColor(aspect.confidence)}`}>
        {aspect.confidence} confidence
      </div>
      <div className="text-text-secondary text-sm italic">"{aspect.proof}"</div>
    </div>
  );

  const renderAspectAxis = (title: string, aspects: Record<string, AspectScore> | null) => {
    if (!aspects) return null;

    return (
      <div className="section" data-section={title.toUpperCase().replace(/\s/g, '_')}>
        <h3 className="font-display text-xl font-bold uppercase tracking-wide mb-4 flex items-center gap-3">
          <span className="text-accent-cyan">//</span>
          {title}
        </h3>
        <div className="grid gap-3">
          {Object.entries(aspects).map(([key, value]) => (
            <div key={key}>
              {renderAspect(
                key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                value
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Animated gradient background */}
      <div className="gradient-background">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
        <div className="glow"></div>
        <div className="grid-overlay"></div>
        <div className="noise-overlay"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="relative mb-16 py-10 border-t-2 border-b-2 border-accent-orange text-center">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-forge-black px-3 text-xs font-bold tracking-widest text-accent-orange">
            COLLABORATION_PROFILE
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight mb-3">
            {profile.display_name || 'Your Profile'}
          </h1>
          <p className="text-text-secondary uppercase tracking-[0.3em] text-sm font-medium">
            ID: {profile.id.slice(0, 8)}...
          </p>
        </header>

        {/* Profile Strength */}
        <div className="section mb-8" data-section="PROFILE_STRENGTH">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide flex items-center gap-4">
              <span className="text-accent-cyan text-xl">//</span>
              Profile Strength
            </h2>
            <div className={`text-4xl font-bold ${getStrengthColor(profile.profile_strength)}`}>
              {profile.profile_strength}/5
            </div>
          </div>

          {/* Strength Bars */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-3 flex-1 ${
                  i <= profile.profile_strength
                    ? profile.profile_strength >= 4
                      ? 'bg-accent-cyan'
                      : profile.profile_strength >= 3
                      ? 'bg-accent-orange'
                      : 'bg-red-400'
                    : 'bg-grid-line'
                }`}
              />
            ))}
          </div>

          {profile.profile_strength < 3 && (
            <div className="bg-forge-black border-l-4 border-accent-orange p-4">
              <div className="text-accent-orange font-bold uppercase text-sm mb-2">
                Low Profile Strength
              </div>
              <div className="text-text-primary mb-3">
                Your conversation history has limited data. Boost your profile by having a structured conversation with an AI assistant.
              </div>
              <button
                onClick={() => setShowBoostPrompt(!showBoostPrompt)}
                className="px-6 py-3 bg-accent-orange text-white font-bold uppercase text-sm tracking-wider hover:shadow-glow-orange transition-all"
              >
                {showBoostPrompt ? 'Hide' : 'Boost Profile'}
              </button>
            </div>
          )}

          {showBoostPrompt && (
            <div className="mt-4 bg-black border-2 border-accent-cyan p-6 shadow-glow-cyan">
              <div className="text-accent-cyan font-bold uppercase text-sm mb-3">
                Profile Boost Prompt
              </div>
              <div className="text-text-primary text-sm font-mono leading-relaxed whitespace-pre-wrap">
{`To help Mission Match create your collaboration profile, answer these:

1. What are you building right now?
2. Describe your last 3 shipped projects (what, when, impact)
3. How do you prefer to collaborate? (async? real-time? structured? chaotic?)
4. What's your natural rhythm? (sprint and rest? steady grind? burst mode?)
5. What kind of collaborator are you looking for?

Be specific. Include outcomes, timelines, and what energizes you.`}
              </div>
              <button
                onClick={() => {
                  const text = `To help Mission Match create your collaboration profile, answer these:\n\n1. What are you building right now?\n2. Describe your last 3 shipped projects (what, when, impact)\n3. How do you prefer to collaborate? (async? real-time? structured? chaotic?)\n4. What's your natural rhythm? (sprint and rest? steady grind? burst mode?)\n5. What kind of collaborator are you looking for?\n\nBe specific. Include outcomes, timelines, and what energizes you.`;
                  navigator.clipboard.writeText(text);
                }}
                className="mt-4 w-full py-3 bg-accent-cyan text-black font-bold uppercase text-sm tracking-wider hover:shadow-glow-cyan transition-all"
              >
                Copy Prompt
              </button>
            </div>
          )}
        </div>

        {/* Basic Profile Info */}
        <div className="section mb-8" data-section="BASIC_PROFILE">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
            <span className="text-accent-cyan text-xl">//</span>
            Profile Data
          </h2>

          <div className="space-y-4">
            <div className="pl-6 border-l-3 border-accent-cyan relative">
              <span className="absolute -left-2.5 text-accent-cyan font-bold">&gt;</span>
              <div className="text-accent-orange font-bold uppercase text-xs tracking-wider mb-1">Role</div>
              <div className="text-text-primary text-lg">{profile.role || &apos;Not specified&apos;}</div>
            </div>

            <div className="pl-6 border-l-3 border-accent-cyan relative">
              <span className="absolute -left-2.5 text-accent-cyan font-bold">&gt;</span>
              <div className="text-accent-orange font-bold uppercase text-xs tracking-wider mb-1">Mission</div>
              <div className="text-text-primary text-lg">{profile.mission || 'Not specified'}</div>
            </div>

            <div className="pl-6 border-l-3 border-accent-cyan relative">
              <span className="absolute -left-2.5 text-accent-cyan font-bold">&gt;</span>
              <div className="text-accent-orange font-bold uppercase text-xs tracking-wider mb-1">Looking For</div>
              <div className="text-text-primary text-lg">{profile.looking_for || 'Not specified'}</div>
            </div>
          </div>
        </div>

        {/* Proof Points */}
        {profile.proof_points && profile.proof_points.length > 0 && (
          <div className="section mb-8" data-section="PROOF_POINTS">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
              <span className="text-accent-cyan text-xl">//</span>
              Proof Points
            </h2>

            <div className="space-y-3">
              {profile.proof_points.map((proof, i) => (
                <div key={i} className="bg-forge-black border-l-4 border-accent-orange p-4 hover:shadow-glow-orange transition-shadow">
                  <div className="text-accent-orange font-bold uppercase text-sm mb-1">
                    {proof.name}
                  </div>
                  <div className="text-text-primary mb-2">{proof.detail}</div>
                  {proof.impact && (
                    <div className="text-text-secondary text-sm italic">Impact: {proof.impact}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aspect Axes */}
        {renderAspectAxis('Role Archetype', profile.role_aspects as Record<string, AspectScore> | null)}
        {renderAspectAxis('Shipping Cadence', profile.shipping_aspects as Record<string, AspectScore> | null)}
        {renderAspectAxis('Communication Style', profile.communication_aspects as Record<string, AspectScore> | null)}
        {renderAspectAxis('Decision Making', profile.decision_aspects as Record<string, AspectScore> | null)}
        {renderAspectAxis('Energy Pattern', profile.energy_aspects as Record<string, AspectScore> | null)}

        {/* Collaboration History */}
        {profile.collaboration_aspects && (
          <div className="section" data-section="COLLABORATION_HISTORY">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
              <span className="text-accent-cyan text-xl">//</span>
              Collaboration History
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-accent-cyan font-bold uppercase text-sm mb-3">Successful Patterns</div>
                <ul className="space-y-2">
                  {(profile.collaboration_aspects as any).successful_patterns?.map((pattern: string, i: number) => (
                    <li key={i} className="text-text-primary pl-4 border-l-2 border-accent-cyan">
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-accent-orange font-bold uppercase text-sm mb-3">Challenging Patterns</div>
                <ul className="space-y-2">
                  {(profile.collaboration_aspects as any).challenging_patterns?.map((pattern: string, i: number) => (
                    <li key={i} className="text-text-primary pl-4 border-l-2 border-accent-orange">
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
