'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const PROFILE_PROMPT = `CRITICAL: Return ONLY valid JSON. Do not write code. Do not build a website. Do not explain. Your entire response must be valid JSON that starts with { and ends with }.

Create a collaboration profile based on our conversation history.

EXACT JSON FORMAT REQUIRED:
{
  "display_name": "Your Name",
  "hook": "2 sentences: what you're building and your unique angle",
  "working_style": {
    "vibe": "1-2 sentences describing your collaboration texture",
    "core_dimensions": {
      "sync_async": {
        "score": 50,
        "confidence": "high",
        "proof": "Specific behavioral evidence from our conversations"
      },
      "fast_ship_high_polish": {
        "score": 50,
        "confidence": "medium",
        "proof": "Evidence of shipping speed vs polish preference"
      },
      "solo_multiplier": {
        "score": 50,
        "confidence": "high",
        "proof": "Evidence of solo vs team preference"
      },
      "builder_strategist": {
        "score": 50,
        "confidence": "medium",
        "proof": "Evidence of execution vs strategy preference"
      }
    }
  },
  "collaboration_fit": {
    "looking_for": "Specific type of collaborator",
    "works_best_with": "Types of people you collaborate well with",
    "struggles_with": "Real friction points in collaboration",
    "brings": "What you offer to collaborators"
  },
  "proof_points": [
    {
      "name": "Project Name",
      "description": "Brief description (max 15 words)",
      "impact": "Specific metrics or outcomes",
      "reveals": "What this shows about your working style"
    }
  ]
}

SCORES: 0=left extreme, 50=balanced, 100=right extreme
- sync_async: 0=real-time everything, 100=deep async
- fast_ship_high_polish: 0=high polish, 100=fast ship
- solo_multiplier: 0=solo contributor, 100=team multiplier
- builder_strategist: 0=pure execution, 100=pure strategy

Be specific. Use actual examples from our conversations. Return ONLY the JSON object.`;

type PublicProfile = {
  id: string;
  display_name: string | null;
  role: string | null;
  mission: string | null;
  looking_for: string | null;
};

export default function ConnectPage() {
  const params = useParams();
  const router = useRouter();
  const initiatorProfileId = params.profileId as string;

  const [initiatorProfile, setInitiatorProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);

  useEffect(() => {
    // Check both new and old localStorage keys for backward compatibility
    const savedProfileId = localStorage.getItem('mm_profile_id') || localStorage.getItem('mission_match_profile_id');
    setExistingProfileId(savedProfileId);
    console.log('[CONNECT] Existing profile ID:', savedProfileId);
    fetchInitiatorProfile();
  }, []);

  const fetchInitiatorProfile = async () => {
    try {
      const response = await fetch(`/api/get-profile?profileId=${initiatorProfileId}`);
      if (!response.ok) throw new Error('Profile not found');
      const data = await response.json();
      setInitiatorProfile(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setLoading(false);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(PROFILE_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openAIApp = (app: 'chatgpt' | 'claude') => {
    const urls = { chatgpt: 'https://chat.openai.com/', claude: 'https://claude.ai/' };
    window.open(urls[app], '_blank');
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.trim()) {
      setSubmitError('Please paste your profile data from your AI');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      let myProfileId = existingProfileId;

      if (!myProfileId) {
        // Send raw text to API - server handles sanitization and parsing
        const saveResponse = await fetch('/api/save-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileData: profileData }),
        });

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json();
          throw new Error(errorData.error || 'Failed to create profile');
        }

        const saveData = await saveResponse.json();
        myProfileId = saveData.profileId;
        localStorage.setItem('mm_profile_id', myProfileId!);
        localStorage.setItem('mm_device_id', saveData.deviceId);
      }

      const handshakeResponse = await fetch('/api/create-handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiatorId: initiatorProfileId,
          recipientId: myProfileId,
        }),
      });

      if (!handshakeResponse.ok) {
        const errorData = await handshakeResponse.json();
        throw new Error(errorData.error || 'Failed to create handshake');
      }

      const handshakeData = await handshakeResponse.json();
      router.push(`/handshake-result/${handshakeData.handshakeId}`);
    } catch (err) {
      console.error('Connect error:', err);
      setSubmitError(err instanceof Error ? err.message : 'Invalid JSON format');
      setSubmitting(false);
    }
  };

  const handleQuickConnect = async () => {
    console.log('[QUICK-CONNECT] Starting with existingProfileId:', existingProfileId);
    if (!existingProfileId) {
      console.log('[QUICK-CONNECT] No existing profile ID, aborting');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    try {
      const handshakeResponse = await fetch('/api/create-handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiatorId: initiatorProfileId,
          recipientId: existingProfileId,
        }),
      });

      if (!handshakeResponse.ok) {
        const errorData = await handshakeResponse.json();
        throw new Error(errorData.error || 'Failed to create handshake');
      }

      const handshakeData = await handshakeResponse.json();
      router.push(`/handshake-result/${handshakeData.handshakeId}`);
    } catch (err) {
      console.error('Quick connect error:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to connect');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#4ecdc4] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff6b6b] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-[#8338ec] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="text-[var(--mm-cyan)] text-6xl mb-6 animate-pulse">...</div>
          <h2 className="font-display text-2xl font-bold uppercase">Loading</h2>
        </div>
      </>
    );
  }

  if (error || !initiatorProfile) {
    return (
      <>
        <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#4ecdc4] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff6b6b] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-[#8338ec] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          <div className="bg-[var(--mm-bg-dark)] border-l-4 border-red-500 p-6">
            <div className="text-red-400 font-bold uppercase text-sm mb-2">Error</div>
            <p className="text-[var(--mm-text)]">{error || 'Profile not found'}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="mt-6 w-full py-4 bg-gray-800 text-[var(--mm-text)] font-display font-bold uppercase tracking-widest hover:bg-[var(--mm-cyan)] hover:text-black transition-colors"
          >
            Go Home
          </button>
        </div>
      </>
    );
  }

  const displayName = initiatorProfile.display_name || 'Someone';
  const hook = initiatorProfile.role; // The "role" field contains the hook

  return (
    <>
      {/* Modern gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
        {/* Subtle floating orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#4ecdc4] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff6b6b] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-[#8338ec] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <header className="relative mb-12 py-10 border-t-2 border-b-2 border-[var(--mm-cyan)] text-center">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[var(--mm-bg-dark)] px-3 text-xs font-bold tracking-widest text-[var(--mm-cyan)]">
            HANDSHAKE_INITIATED
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight mb-4">
            {displayName}
          </h1>
          {hook && (
            <p className="text-[var(--mm-text)] text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
              {hook}
            </p>
          )}
        </header>

        {initiatorProfile.mission && (
          <div className="section mb-8" data-section="THEIR_MISSION">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-4 flex items-center gap-4">
              <span className="text-[var(--mm-cyan)] text-xl">//</span>
              Their Mission
            </h2>
            <div className="bg-[var(--mm-bg-dark)] border-l-4 border-[var(--mm-cyan)] p-6">
              <p className="text-[var(--mm-text)] italic">"{initiatorProfile.mission}"</p>
            </div>
          </div>
        )}

        {existingProfileId && (
          <div className="section mb-8" data-section="QUICK_CONNECT">
            <div className="bg-[var(--mm-bg-dark)] border-2 border-[var(--mm-red)] p-6">
              <div className="text-[var(--mm-red)] font-bold uppercase text-sm mb-3">
                You Already Have a Profile
              </div>
              <p className="text-[var(--mm-text)] mb-4">
                Connect instantly using your existing profile.
              </p>
              <button
                onClick={handleQuickConnect}
                disabled={submitting}
                className="w-full py-4 bg-[var(--mm-red)] text-white font-display font-bold uppercase tracking-widest hover:shadow-glow-orange transition-all disabled:opacity-50"
              >
                {submitting ? 'Connecting...' : 'Quick Connect'}
              </button>
            </div>
          </div>
        )}

        <div className="section mb-8" data-section="INSTRUCTIONS">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-4 flex items-center gap-4">
            <span className="text-[var(--mm-cyan)] text-xl">//</span>
            {existingProfileId ? 'Or Create New Profile' : 'Create Your Profile'}
          </h2>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 pl-6 border-l-2 border-[var(--mm-cyan)] relative">
              <span className="absolute -left-2 text-[var(--mm-cyan)] font-bold text-sm">1</span>
              <div className="text-[var(--mm-text)]">
                <strong className="text-[var(--mm-red)]">Copy</strong> the prompt below
              </div>
            </div>
            <div className="flex items-start gap-3 pl-6 border-l-2 border-[var(--mm-cyan)] relative">
              <span className="absolute -left-2 text-[var(--mm-cyan)] font-bold text-sm">2</span>
              <div className="text-[var(--mm-text)]">
                <strong className="text-[var(--mm-red)]">Open</strong> your AI and paste it
              </div>
            </div>
            <div className="flex items-start gap-3 pl-6 border-l-2 border-[var(--mm-cyan)] relative">
              <span className="absolute -left-2 text-[var(--mm-cyan)] font-bold text-sm">3</span>
              <div className="text-[var(--mm-text)]">
                <strong className="text-[var(--mm-red)]">Paste</strong> the JSON response back here
              </div>
            </div>
          </div>
        </div>

        <div className="section mb-8" data-section="PROMPT">
          <div className="flex gap-3 mb-4">
            <button
              onClick={copyPrompt}
              className={`flex-1 py-4 font-display font-bold uppercase tracking-widest transition-all ${
                copied ? 'bg-[var(--mm-cyan)] text-black' : 'bg-[var(--mm-red)] text-white hover:shadow-glow-orange'
              }`}
            >
              {copied ? '✓ Copied!' : 'Copy Prompt'}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => openAIApp('chatgpt')}
              className="flex-1 py-3 bg-gray-800 text-[var(--mm-text)] font-display font-bold uppercase text-sm tracking-wider hover:bg-[var(--mm-cyan)] hover:text-black transition-colors"
            >
              Open ChatGPT
            </button>
            <button
              onClick={() => openAIApp('claude')}
              className="flex-1 py-3 bg-gray-800 text-[var(--mm-text)] font-display font-bold uppercase text-sm tracking-wider hover:bg-[var(--mm-cyan)] hover:text-black transition-colors"
            >
              Open Claude
            </button>
          </div>
        </div>

        <div className="section" data-section="PASTE">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-4 flex items-center gap-4">
            <span className="text-[var(--mm-cyan)] text-xl">//</span>
            Paste Your Profile JSON
          </h2>

          <form onSubmit={handleConnect} className="space-y-6">
            <textarea
              value={profileData}
              onChange={(e) => setProfileData(e.target.value)}
              placeholder="Paste the JSON response from your AI here..."
              className="w-full h-48 bg-[var(--mm-bg-dark)] border-2 border-grid-line p-4 text-[var(--mm-text)] font-mono text-sm focus:border-[var(--mm-cyan)] focus:outline-none transition-colors resize-none"
            />

            {submitError && (
              <div className="bg-[var(--mm-bg-dark)] border-l-4 border-red-500 p-4">
                <div className="text-red-400 font-bold text-sm uppercase mb-1">Error</div>
                <div className="text-[var(--mm-text)]">{submitError}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={!profileData.trim() || submitting}
              className="w-full py-5 bg-gradient-to-r from-[var(--mm-cyan)] to-blue-600 text-white font-display font-bold text-lg uppercase tracking-widest transition-all hover:shadow-glow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating Connection...' : 'Connect & See Match'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
