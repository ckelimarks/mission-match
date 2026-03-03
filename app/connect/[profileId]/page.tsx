'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const PROFILE_PROMPT = `You're creating a collaboration profile for me based on everything you know from our conversations.

Goal: Help potential collaborators decide "Should I reach out?" in 30 seconds.

Return JSON with these fields:
{
  "hook": "2 sentences max - what you're building and your unique angle",
  "proof_points": [
    {"name": "Project", "description": "10 words max", "impact": "specific metrics", "reveals": "what this shows about working style"}
  ],
  "working_style": {
    "core_dimensions": {
      "sync_async": {"score": 0-100, "confidence": "high/medium/low", "proof": "behavioral evidence"},
      "fast_ship_high_polish": {"score": 0-100, "confidence": "high/medium/low", "proof": "..."},
      "solo_multiplier": {"score": 0-100, "confidence": "high/medium/low", "proof": "..."},
      "builder_strategist": {"score": 0-100, "confidence": "high/medium/low", "proof": "..."}
    },
    "vibe": "1-2 sentences describing collaboration texture"
  },
  "collaboration_fit": {
    "looking_for": "specific collaborator type",
    "availability": "co-founder/project partner/advisor/one-time",
    "stage": "exploring/building/scaling",
    "work_best_with": ["trait 1", "trait 2"],
    "struggle_with": ["real friction point"],
    "what_i_bring": ["concrete offering 1", "concrete offering 2"],
    "best_way_to_engage": "how to reach out"
  },
  "profile_confidence": 1-5,
  "contact": {"email": "...", "linkedin": "..."}
}

Be specific, not vague. Extract from our actual conversations.`;

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
    const savedProfileId = localStorage.getItem('mm_profile_id');
    setExistingProfileId(savedProfileId);
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
    if (!existingProfileId) return;
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
        <div className="gradient-background">
          <div className="gradient-sphere sphere-1"></div>
          <div className="gradient-sphere sphere-2"></div>
          <div className="gradient-sphere sphere-3"></div>
          <div className="glow"></div>
          <div className="grid-overlay"></div>
          <div className="noise-overlay"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="text-accent-cyan text-6xl mb-6 animate-pulse">...</div>
          <h2 className="font-display text-2xl font-bold uppercase">Loading</h2>
        </div>
      </>
    );
  }

  if (error || !initiatorProfile) {
    return (
      <>
        <div className="gradient-background">
          <div className="gradient-sphere sphere-1"></div>
          <div className="gradient-sphere sphere-2"></div>
          <div className="gradient-sphere sphere-3"></div>
          <div className="glow"></div>
          <div className="grid-overlay"></div>
          <div className="noise-overlay"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          <div className="bg-forge-black border-l-4 border-red-500 p-6">
            <div className="text-red-400 font-bold uppercase text-sm mb-2">Error</div>
            <p className="text-text-primary">{error || 'Profile not found'}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="mt-6 w-full py-4 bg-grid-line text-text-primary font-display font-bold uppercase tracking-widest hover:bg-accent-cyan hover:text-black transition-colors"
          >
            Go Home
          </button>
        </div>
      </>
    );
  }

  const displayName = initiatorProfile.display_name || initiatorProfile.role || 'Someone';

  return (
    <>
      <div className="gradient-background">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
        <div className="glow"></div>
        <div className="grid-overlay"></div>
        <div className="noise-overlay"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <header className="relative mb-12 py-10 border-t-2 border-b-2 border-accent-cyan text-center">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-forge-black px-3 text-xs font-bold tracking-widest text-accent-cyan">
            HANDSHAKE_INITIATED
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight mb-3">
            Connect with {displayName}
          </h1>
          <p className="text-text-secondary uppercase tracking-[0.2em] text-sm font-medium">
            {initiatorProfile.role || 'Collaborator'}
          </p>
        </header>

        {initiatorProfile.mission && (
          <div className="section mb-8" data-section="THEIR_MISSION">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-4 flex items-center gap-4">
              <span className="text-accent-cyan text-xl">//</span>
              Their Mission
            </h2>
            <div className="bg-forge-black border-l-4 border-accent-cyan p-6">
              <p className="text-text-primary italic">"{initiatorProfile.mission}"</p>
            </div>
          </div>
        )}

        {existingProfileId && (
          <div className="section mb-8" data-section="QUICK_CONNECT">
            <div className="bg-forge-black border-2 border-accent-orange p-6">
              <div className="text-accent-orange font-bold uppercase text-sm mb-3">
                You Already Have a Profile
              </div>
              <p className="text-text-primary mb-4">
                Connect instantly using your existing profile.
              </p>
              <button
                onClick={handleQuickConnect}
                disabled={submitting}
                className="w-full py-4 bg-accent-orange text-white font-display font-bold uppercase tracking-widest hover:shadow-glow-orange transition-all disabled:opacity-50"
              >
                {submitting ? 'Connecting...' : 'Quick Connect'}
              </button>
            </div>
          </div>
        )}

        <div className="section mb-8" data-section="INSTRUCTIONS">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-4 flex items-center gap-4">
            <span className="text-accent-cyan text-xl">//</span>
            {existingProfileId ? 'Or Create New Profile' : 'Create Your Profile'}
          </h2>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 pl-6 border-l-2 border-accent-cyan relative">
              <span className="absolute -left-2 text-accent-cyan font-bold text-sm">1</span>
              <div className="text-text-primary">
                <strong className="text-accent-orange">Copy</strong> the prompt below
              </div>
            </div>
            <div className="flex items-start gap-3 pl-6 border-l-2 border-accent-cyan relative">
              <span className="absolute -left-2 text-accent-cyan font-bold text-sm">2</span>
              <div className="text-text-primary">
                <strong className="text-accent-orange">Open</strong> your AI and paste it
              </div>
            </div>
            <div className="flex items-start gap-3 pl-6 border-l-2 border-accent-cyan relative">
              <span className="absolute -left-2 text-accent-cyan font-bold text-sm">3</span>
              <div className="text-text-primary">
                <strong className="text-accent-orange">Paste</strong> the JSON response back here
              </div>
            </div>
          </div>
        </div>

        <div className="section mb-8" data-section="PROMPT">
          <div className="flex gap-3 mb-4">
            <button
              onClick={copyPrompt}
              className={`flex-1 py-4 font-display font-bold uppercase tracking-widest transition-all ${
                copied ? 'bg-accent-cyan text-black' : 'bg-accent-orange text-white hover:shadow-glow-orange'
              }`}
            >
              {copied ? '✓ Copied!' : 'Copy Prompt'}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => openAIApp('chatgpt')}
              className="flex-1 py-3 bg-grid-line text-text-primary font-display font-bold uppercase text-sm tracking-wider hover:bg-accent-cyan hover:text-black transition-colors"
            >
              Open ChatGPT
            </button>
            <button
              onClick={() => openAIApp('claude')}
              className="flex-1 py-3 bg-grid-line text-text-primary font-display font-bold uppercase text-sm tracking-wider hover:bg-accent-cyan hover:text-black transition-colors"
            >
              Open Claude
            </button>
          </div>
        </div>

        <div className="section" data-section="PASTE">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-4 flex items-center gap-4">
            <span className="text-accent-cyan text-xl">//</span>
            Paste Your Profile JSON
          </h2>

          <form onSubmit={handleConnect} className="space-y-6">
            <textarea
              value={profileData}
              onChange={(e) => setProfileData(e.target.value)}
              placeholder="Paste the JSON response from your AI here..."
              className="w-full h-48 bg-forge-black border-2 border-grid-line p-4 text-text-primary font-mono text-sm focus:border-accent-cyan focus:outline-none transition-colors resize-none"
            />

            {submitError && (
              <div className="bg-forge-black border-l-4 border-red-500 p-4">
                <div className="text-red-400 font-bold text-sm uppercase mb-1">Error</div>
                <div className="text-text-primary">{submitError}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={!profileData.trim() || submitting}
              className="w-full py-5 bg-gradient-to-r from-accent-cyan to-blue-600 text-white font-display font-bold text-lg uppercase tracking-widest transition-all hover:shadow-glow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating Connection...' : 'Connect & See Match'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
