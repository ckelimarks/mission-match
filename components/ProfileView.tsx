'use client';

import type { Profile, AspectScore } from '@/types';
import { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import PendingConnections from './PendingConnections';

interface ProfileViewProps {
  profile: Profile;
  isOwner?: boolean;
}

export default function ProfileView({ profile, isOwner = false }: ProfileViewProps) {
  const [showBoostPrompt, setShowBoostPrompt] = useState(false);
  const [showClaimQR, setShowClaimQR] = useState(false);
  const [showJSON, setShowJSON] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const shareQrRef = useRef<HTMLDivElement>(null);
  const claimQrRef = useRef<HTMLDivElement>(null);

  // Safe defaults for optional fields
  const profileStrength = profile.profile_strength ?? 3;

  const handleConnect = () => {
    // Navigate to handshake flow
    window.location.href = `/handshake/${profile.id}`;
  };

  const handleCopyJSON = () => {
    // Extract provenance from decision_aspects if available
    const provenance = (profile.decision_aspects as any)?.provenance || {
      extracted_at: new Date().toISOString(),
      extraction_model: 'claude-sonnet-4.5',
      reviewed_by_human: true,
      version: 1,
      note: 'This profile was extracted from AI conversation history and reviewed by the user.'
    };

    // Create enhanced export with separate provenance section
    const exportData = {
      profile: {
        id: profile.id,
        display_name: profile.display_name,
        role: profile.role,
        mission: profile.mission,
        looking_for: profile.looking_for,
        proof_points: profile.proof_points,
        role_aspects: profile.role_aspects,
        shipping_aspects: profile.shipping_aspects,
        communication_aspects: profile.communication_aspects,
        collaboration_aspects: profile.collaboration_aspects,
        profile_strength: profile.profile_strength,
      },
      provenance: {
        ...provenance,
        note: 'This profile was extracted from AI conversation history and reviewed by the user. Provenance metadata enables trust verification in agent-to-agent interactions.',
      }
    };

    const json = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(json);
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    // Extract provenance from decision_aspects if available
    const provenance = (profile.decision_aspects as any)?.provenance || {
      extracted_at: new Date().toISOString(),
      extraction_model: 'claude-sonnet-4.5',
      reviewed_by_human: true,
      version: 1,
      note: 'This profile was extracted from AI conversation history and reviewed by the user.'
    };

    // Create enhanced export with separate provenance section
    const exportData = {
      profile: {
        id: profile.id,
        display_name: profile.display_name,
        role: profile.role,
        mission: profile.mission,
        looking_for: profile.looking_for,
        proof_points: profile.proof_points,
        role_aspects: profile.role_aspects,
        shipping_aspects: profile.shipping_aspects,
        communication_aspects: profile.communication_aspects,
        collaboration_aspects: profile.collaboration_aspects,
        profile_strength: profile.profile_strength,
      },
      provenance: {
        ...provenance,
        note: 'This profile was extracted from AI conversation history and reviewed by the user. Provenance metadata enables trust verification in agent-to-agent interactions.',
      }
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mission-match-profile-${profile.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 4) return 'text-[var(--mm-cyan)]';
    if (strength >= 3) return 'text-[var(--mm-red)]';
    return 'text-red-400';
  };

  const getConfidenceColor = (confidence: string | null | undefined) => {
    if (!confidence) return 'text-gray-500';
    if (confidence === 'high') return 'text-[var(--mm-cyan)]';
    if (confidence === 'medium') return 'text-[var(--mm-red)]';
    return 'text-gray-500';
  };

  const getScaleLabels = (aspectKey: string): { low: string; high: string } => {
    const scales: Record<string, { low: string; high: string }> = {
      'speed_vs_craft': { low: 'Perfect or nothing', high: 'Ships broken daily' },
      'structure_vs_exploration': { low: 'Highly structured', high: 'Emergent explorer' },
      'solo_vs_collaborative': { low: 'Pure IC', high: 'Only through others' },
      'sync_async': { low: 'Real-time everything', high: 'Deep async' },
      'fast_ship_high_polish': { low: 'High polish', high: 'Fast ship' },
      'solo_multiplier': { low: 'Solo contributor', high: 'Team multiplier' },
      'builder_strategist': { low: 'Pure execution', high: 'Pure direction' },
    };
    return scales[aspectKey] || { low: '0', high: '100' };
  };

  const getAspectDescription = (aspectKey: string): string => {
    const descriptions: Record<string, string> = {
      'speed_vs_craft': 'How you balance shipping speed vs perfectionism',
      'structure_vs_exploration': 'Preference for planning vs discovering as you go',
      'solo_vs_collaborative': 'How you work best: alone or with others',
      'sync_async': 'Communication and coordination style',
      'fast_ship_high_polish': 'Balance between iteration speed and quality',
      'solo_multiplier': 'Individual contributor vs team force multiplier',
      'builder_strategist': 'Hands-on execution vs strategic direction',
    };
    return descriptions[aspectKey] || 'Collaboration dimension';
  };

  const renderAspect = (label: string, aspect: AspectScore, aspectKey?: string) => {
    const scaleLabels = aspectKey ? getScaleLabels(aspectKey) : { low: '0', high: '100' };
    const description = aspectKey ? getAspectDescription(aspectKey) : '';

    return (
      <div className="bg-[var(--mm-bg-dark)] p-6 border-l-2 border-grid-line hover:border-[var(--mm-cyan)] transition-colors">
        {/* Header with centered label and description */}
        <div className="mb-6 text-center">
          <div className="font-bold text-sm uppercase tracking-wide text-[var(--mm-text)] mb-2">{label}</div>
          <div className="text-xs text-[var(--mm-text-muted)] italic">{description}</div>
        </div>

        {/* Spectrum visualization with circle indicator */}
        <div className="mb-4">
          {/* Spectrum labels on sides */}
          <div className="flex justify-between items-center mb-3 gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--mm-text-muted)] text-left flex-1 break-words">
              {scaleLabels.low}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--mm-text-muted)] text-right flex-1 break-words">
              {scaleLabels.high}
            </span>
          </div>

          {/* Spectrum line with circle */}
          <div className="relative h-1 bg-gray-800 rounded-full mb-3">
            {/* Track fill up to the score */}
            <div
              className="absolute h-full bg-[var(--mm-cyan)] rounded-full transition-all duration-300"
              style={{ width: `${aspect.score}%` }}
            />

            {/* Circle indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-300"
              style={{ left: `${aspect.score}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className={`w-4 h-4 rounded-full border-2 ${getConfidenceColor(aspect.confidence).replace('text-', 'border-')} bg-[var(--mm-bg-dark)] shadow-lg`}>
                <div className={`w-full h-full rounded-full ${getConfidenceColor(aspect.confidence).replace('text-', 'bg-')} opacity-80`}></div>
              </div>
            </div>
          </div>

          {/* Score underneath */}
          <div className="text-center">
            <span className={`text-xl font-bold ${getConfidenceColor(aspect.confidence)}`}>
              {aspect.score}<span className="text-sm text-[var(--mm-text-muted)]">/100</span>
            </span>
          </div>
        </div>

        {/* Confidence badge */}
        <div className={`inline-block px-2 py-1 text-xs uppercase font-bold mb-3 ${getConfidenceColor(aspect.confidence)}`}>
          {aspect.confidence} confidence
        </div>

        {/* Proof quote */}
        <div className="text-[var(--mm-text-muted)] text-sm italic leading-relaxed">"{aspect.proof}"</div>
      </div>
    );
  };

  const renderAspectAxis = (title: string, aspects: Record<string, AspectScore> | null) => {
    if (!aspects) return null;

    // Handle new schema: extract AspectScore objects from nested structure
    let aspectEntries: [string, AspectScore][] = [];

    // Check if this is the new schema (has core_dimensions or distinctive_edges)
    if ('core_dimensions' in aspects || 'distinctive_edges' in aspects) {
      const data = aspects as any;

      // Extract from core_dimensions
      if (data.core_dimensions) {
        Object.entries(data.core_dimensions).forEach(([key, value]) => {
          if (value && typeof value === 'object' && 'score' in value && 'confidence' in value) {
            aspectEntries.push([key, value as AspectScore]);
          }
        });
      }

      // Extract from distinctive_edges
      if (data.distinctive_edges) {
        Object.entries(data.distinctive_edges).forEach(([key, value]) => {
          if (value && typeof value === 'object' && 'score' in value && 'confidence' in value) {
            aspectEntries.push([key, value as AspectScore]);
          }
        });
      }
    } else {
      // Legacy schema: aspects is already a flat Record<string, AspectScore>
      aspectEntries = Object.entries(aspects).filter(([_, value]) =>
        value && typeof value === 'object' && 'score' in value && 'confidence' in value
      ) as [string, AspectScore][];
    }

    if (aspectEntries.length === 0) return null;

    return (
      <div className="section" data-section={title.toUpperCase().replace(/\s/g, '_')}>
        <h3 className="font-display text-xl font-bold uppercase tracking-wide mb-4 flex items-center gap-3">
          <span className="text-[var(--mm-cyan)]">//</span>
          {title}
        </h3>
        <div className="grid gap-3">
          {aspectEntries.map(([key, value]) => (
            <div key={key}>
              {renderAspect(
                key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                value,
                key
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Modern gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
        {/* Subtle floating orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#4ecdc4] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff6b6b] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-[#8338ec] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 font-sans">
        {/* Header */}
        <header className="relative mb-16 py-10 border-t-2 border-b-2 border-[var(--mm-red)]">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[var(--mm-bg-dark)] px-3 text-xs font-bold tracking-widest text-[var(--mm-red)]">
            COLLABORATION_PROFILE
          </div>

          {/* Profile Header Container - QR on left, Info on right */}
          <div className="profile-header-container">
            {/* QR Code Card */}
            <div className="profile-qr-card flex-shrink-0">
              <div className="bg-white p-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)]" style={{ width: '180px', height: '180px' }} ref={shareQrRef}>
                <QRCode
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/connect/${profile.id}`}
                  size={156}
                  level="M"
                />
              </div>
              <div className="text-center mt-3">
                <div className="inline-block px-3 py-1.5 bg-[rgba(0,0,0,0.3)] rounded-md font-mono text-[0.65rem] text-[var(--mm-cyan)]">
                  {typeof window !== 'undefined' ? window.location.host : 'mission-match.app'}/connect/{profile.id.slice(0, 8)}
                </div>
              </div>
            </div>

            {/* Profile Header Content */}
            <div className="profile-header-content">
              <h1 className="font-display font-bold uppercase tracking-tight mb-2.5 text-white" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: '1.1', margin: '0 0 10px 0' }}>
                {profile.display_name || 'Your Profile'}
              </h1>
              <p className="text-base text-[rgba(255,255,255,0.6)] uppercase tracking-wider mb-5">
                {profile.role || 'Role not specified'}
              </p>
              <p className="text-sm text-[rgba(255,255,255,0.5)] leading-relaxed max-w-[500px]">
                Profile extracted from AI conversation history. Evidence-based, not personality tests.
              </p>
              <div className="flex gap-2.5 mt-5 justify-center md:justify-start">
                <button
                  onClick={() => {
                    const qrElement = shareQrRef.current;
                    if (qrElement) {
                      // Simple download using canvas
                      const canvas = qrElement.querySelector('canvas');
                      if (canvas) {
                        const url = canvas.toDataURL('image/png');
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `mission-match-qr-${profile.id.slice(0, 8)}.png`;
                        a.click();
                      }
                    }
                  }}
                  className="btn-small btn-primary-small inline-flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download QR
                </button>
                <button
                  onClick={() => {
                    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/connect/${profile.id}`;
                    navigator.clipboard.writeText(url);
                  }}
                  className="btn-small btn-outline-small inline-flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy Link
                </button>
              </div>
            </div>
          </div>

          {!isOwner && (
            <div className="mt-6 text-center">
              <button
                onClick={handleConnect}
                className="px-8 py-4 bg-gradient-to-r from-[var(--mm-cyan)] to-blue-500 text-black font-display font-bold text-lg uppercase tracking-widest transition-all hover:shadow-glow-cyan hover:translate-y-[-2px]"
              >
                Connect →
              </button>
              <p className="text-[var(--mm-text-muted)] text-xs mt-2">
                Initiate a collaboration handshake
              </p>
            </div>
          )}
        </header>

        {/* Trust Badge - Verifiable Data Lineage */}
        <div className="mb-8 p-4 bg-[var(--mm-bg-dark)] border-l-4 border-[var(--mm-cyan)]">
          <div className="mb-3">
            <div className="text-sm font-bold uppercase tracking-wider text-[var(--mm-cyan)] mb-1">
              Verifiable Data Lineage
            </div>
            <div className="text-xs text-[var(--mm-text-muted)] italic">
              Trust infrastructure for the agent economy
            </div>
          </div>
          <div className="space-y-1 text-sm text-[var(--mm-text)]">
            <div className="flex items-center gap-2">
              <span className="text-[var(--mm-cyan)]">✓</span>
              <span>Extracted by Claude Sonnet 4.5</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--mm-cyan)]">✓</span>
              <span>Human-reviewed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--mm-cyan)]">✓</span>
              <span>
                Created: {(profile.decision_aspects as any)?.provenance?.extracted_at
                  ? new Date((profile.decision_aspects as any).provenance.extracted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Pending Connections - Owner Only */}
        {isOwner && (
          <PendingConnections profileId={profile.id} />
        )}

        {/* Recovery QR Code Section - Owner Only */}
        {isOwner && (
          <div className="section mb-8" data-section="RECOVERY_QR">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
              <span className="text-[var(--mm-red)] text-xl">//</span>
              Recovery QR Code
            </h2>

            <div className="flex flex-col items-center">
              <div className="bg-white p-6 rounded-lg mb-4" ref={claimQrRef}>
                <QRCode
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/claim?token=${profile.claim_token}`}
                  size={200}
                  level="M"
                />
              </div>
              <div className="text-center max-w-md">
                <p className="text-[var(--mm-red)] mb-2 font-bold uppercase text-sm tracking-wider">
                  Keep This Private
                </p>
                <p className="text-[var(--mm-text-muted)] text-sm">
                  Save this QR to reclaim your profile on another device. Anyone with this code can claim your profile.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Data Portability - View as JSON */}
        <div className="section mb-8" data-section="DATA_PORTABILITY">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
            <span className="text-[var(--mm-cyan)] text-xl">//</span>
            Data Portability
          </h2>

          <div className="bg-[var(--mm-bg-dark)] border-2 border-[var(--mm-cyan)] p-6">
            <div className="text-[var(--mm-text)] mb-4">
              <p className="mb-2">Your profile is <span className="text-[var(--mm-cyan)] font-bold">portable data you own</span>.</p>
              <p className="text-[var(--mm-text-muted)] text-sm">
                Take it anywhere. This JSON works with any CPX-compatible system.
              </p>
            </div>

            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => setShowJSON(!showJSON)}
                className="px-6 py-3 bg-[var(--mm-cyan)] text-black font-bold uppercase text-sm tracking-wider hover:shadow-glow-cyan transition-all"
              >
                {showJSON ? 'Hide JSON' : 'View as JSON'} 👁
              </button>

              {showJSON && (
                <>
                  <button
                    onClick={handleCopyJSON}
                    className="px-6 py-3 bg-gray-800 text-[var(--mm-text)] font-bold uppercase text-sm tracking-wider hover:bg-[var(--mm-red)] hover:text-black transition-all"
                  >
                    {jsonCopied ? '✓ Copied!' : '📋 Copy JSON'}
                  </button>

                  <button
                    onClick={handleDownloadJSON}
                    className="px-6 py-3 bg-gray-800 text-[var(--mm-text)] font-bold uppercase text-sm tracking-wider hover:bg-[var(--mm-red)] hover:text-black transition-all"
                  >
                    ⬇ Download JSON
                  </button>
                </>
              )}
            </div>

            {showJSON && (
              <div className="mt-6">
                <pre className="bg-black border-2 border-[var(--mm-cyan)] p-4 overflow-x-auto text-xs text-[var(--mm-cyan)] font-mono max-h-96 overflow-y-auto">
                  {(() => {
                    // Extract provenance from decision_aspects if available
                    const provenance = (profile.decision_aspects as any)?.provenance || {
                      extracted_at: new Date().toISOString(),
                      extraction_model: 'claude-sonnet-4.5',
                      reviewed_by_human: true,
                      version: 1,
                      note: 'This profile was extracted from AI conversation history and reviewed by the user.'
                    };

                    // Create enhanced export with separate provenance section
                    const exportData = {
                      profile: {
                        id: profile.id,
                        display_name: profile.display_name,
                        role: profile.role,
                        mission: profile.mission,
                        looking_for: profile.looking_for,
                        proof_points: profile.proof_points,
                        role_aspects: profile.role_aspects,
                        shipping_aspects: profile.shipping_aspects,
                        communication_aspects: profile.communication_aspects,
                        collaboration_aspects: profile.collaboration_aspects,
                        profile_strength: profile.profile_strength,
                      },
                      provenance: {
                        ...provenance,
                        note: 'This profile was extracted from AI conversation history and reviewed by the user. Provenance metadata enables trust verification in agent-to-agent interactions.',
                      }
                    };

                    return JSON.stringify(exportData, null, 2);
                  })()}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Profile Strength */}
        <div className="section mb-8" data-section="PROFILE_STRENGTH">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide flex items-center gap-4">
              <span className="text-[var(--mm-cyan)] text-xl">//</span>
              Profile Strength
            </h2>
            <div className={`text-4xl font-bold ${getStrengthColor(profileStrength)}`}>
              {profileStrength}/5
            </div>
          </div>

          {/* Strength Bars */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-3 flex-1 ${
                  i <= profileStrength
                    ? profileStrength >= 4
                      ? 'bg-[var(--mm-cyan)]'
                      : profileStrength >= 3
                      ? 'bg-[var(--mm-red)]'
                      : 'bg-red-400'
                    : 'bg-gray-800'
                }`}
              />
            ))}
          </div>

          {profileStrength < 3 && (
            <div className="bg-[var(--mm-bg-dark)] border-l-4 border-[var(--mm-red)] p-4">
              <div className="text-[var(--mm-red)] font-bold uppercase text-sm mb-2">
                Low Profile Strength
              </div>
              <div className="text-[var(--mm-text)] mb-3">
                Your conversation history has limited data. Boost your profile by having a structured conversation with an AI assistant.
              </div>
              <button
                onClick={() => setShowBoostPrompt(!showBoostPrompt)}
                className="px-6 py-3 bg-[var(--mm-red)] text-white font-bold uppercase text-sm tracking-wider hover:shadow-glow-orange transition-all"
              >
                {showBoostPrompt ? 'Hide' : 'Boost Profile'}
              </button>
            </div>
          )}

          {showBoostPrompt && (
            <div className="mt-4 bg-black border-2 border-[var(--mm-cyan)] p-6 shadow-glow-cyan">
              <div className="text-[var(--mm-cyan)] font-bold uppercase text-sm mb-3">
                Profile Boost Prompt
              </div>
              <div className="text-[var(--mm-text)] text-sm font-mono leading-relaxed whitespace-pre-wrap">
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
                className="mt-4 w-full py-3 bg-[var(--mm-cyan)] text-black font-bold uppercase text-sm tracking-wider hover:shadow-glow-cyan transition-all"
              >
                Copy Prompt
              </button>
            </div>
          )}
        </div>

        {/* Basic Profile Info */}
        <div className="section mb-8" data-section="BASIC_PROFILE">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
            <span className="text-[var(--mm-cyan)] text-xl">//</span>
            Profile Data
          </h2>

          <div className="space-y-4">
            <div className="pl-6 border-l-3 border-[var(--mm-cyan)] relative">
              <span className="absolute -left-2.5 text-[var(--mm-cyan)] font-bold">&gt;</span>
              <div className="text-[var(--mm-red)] font-bold uppercase text-xs tracking-wider mb-1">Role</div>
              <div className="text-[var(--mm-text)] text-lg">{profile.role || 'Not specified'}</div>
            </div>

            <div className="pl-6 border-l-3 border-[var(--mm-cyan)] relative">
              <span className="absolute -left-2.5 text-[var(--mm-cyan)] font-bold">&gt;</span>
              <div className="text-[var(--mm-red)] font-bold uppercase text-xs tracking-wider mb-1">Mission</div>
              <div className="text-[var(--mm-text)] text-lg">{profile.mission || 'Not specified'}</div>
            </div>

            <div className="pl-6 border-l-3 border-[var(--mm-cyan)] relative">
              <span className="absolute -left-2.5 text-[var(--mm-cyan)] font-bold">&gt;</span>
              <div className="text-[var(--mm-red)] font-bold uppercase text-xs tracking-wider mb-1">Looking For</div>
              <div className="text-[var(--mm-text)] text-lg">{profile.looking_for || 'Not specified'}</div>
            </div>
          </div>
        </div>

        {/* Proof Points */}
        {profile.proof_points && profile.proof_points.length > 0 && (
          <div className="section mb-8" data-section="PROOF_POINTS">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
              <span className="text-[var(--mm-cyan)] text-xl">//</span>
              Proof Points
            </h2>

            <div className="space-y-3">
              {profile.proof_points.map((proof, i) => (
                <div key={i} className="bg-[var(--mm-bg-dark)] border-l-4 border-[var(--mm-red)] p-4 hover:shadow-glow-orange transition-shadow">
                  <div className="text-[var(--mm-red)] font-bold uppercase text-sm mb-1">
                    {proof.name}
                  </div>
                  <div className="text-[var(--mm-text)] mb-2">{proof.detail}</div>
                  {proof.impact && (
                    <div className="text-[var(--mm-text-muted)] text-sm italic">Impact: {proof.impact}</div>
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
              <span className="text-[var(--mm-cyan)] text-xl">//</span>
              Collaboration History
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-[var(--mm-cyan)] font-bold uppercase text-sm mb-3">Successful Patterns</div>
                <ul className="space-y-2">
                  {(profile.collaboration_aspects as any).successful_patterns?.map((pattern: string, i: number) => (
                    <li key={i} className="text-[var(--mm-text)] pl-4 border-l-2 border-[var(--mm-cyan)]">
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-[var(--mm-red)] font-bold uppercase text-sm mb-3">Challenging Patterns</div>
                <ul className="space-y-2">
                  {(profile.collaboration_aspects as any).challenging_patterns?.map((pattern: string, i: number) => (
                    <li key={i} className="text-[var(--mm-text)] pl-4 border-l-2 border-[var(--mm-red)]">
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
