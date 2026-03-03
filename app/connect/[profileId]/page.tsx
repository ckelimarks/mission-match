'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const PROFILE_PROMPT = `I'm creating my collaboration profile for Mission Match. Based on our conversation history, analyze what you know about me and extract my profile in JSON format.

Extract:
- My role (what I do/build)
- My mission (what I'm building toward)
- Proof points (3-5 things I've built/shipped with impact)
- Who I'm looking for (collaborators I seek)
- How I work (analyze my shipping cadence, communication style, decision-making, energy patterns from our conversations)

Return ONLY this JSON structure:

\`\`\`json
{
  "role": "my role",
  "mission": "my mission statement",
  "proof_points": [
    {"name": "Project Name", "detail": "What it is", "impact": "Results/metrics"}
  ],
  "looking_for": "type of collaborators I seek",
  "role_aspects": {
    "creative_vs_executor": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote showing this"},
    "generalist_vs_specialist": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"},
    "individual_vs_multiplier": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"}
  },
  "shipping_aspects": {
    "idea_generation": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"},
    "completion_drive": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"},
    "iteration_speed": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"},
    "polish_tolerance": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"}
  },
  "communication_aspects": {
    "sync_vs_async": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"},
    "structure_vs_chaos": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"},
    "directness": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"}
  },
  "decision_aspects": {
    "data_driven_vs_intuition": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"},
    "speed_vs_deliberation": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"}
  },
  "energy_aspects": {
    "sprint_vs_marathon": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"},
    "parallel_vs_serial": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"}
  },
  "collaboration_aspects": {
    "successful_patterns": ["pattern 1", "pattern 2"],
    "challenging_patterns": ["pattern 1"],
    "evidence": ["proof 1", "proof 2"]
  },
  "profile_strength": 1-5
}
\`\`\``;

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

  // Check if user already has a profile
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);

  useEffect(() => {
    const savedProfileId = localStorage.getItem('mission_match_profile_id');
    setExistingProfileId(savedProfileId);
    fetchInitiatorProfile();
  }, []);

  const fetchInitiatorProfile = async () => {
    try {
      const response = await fetch(`/api/get-profile?profileId=${initiatorProfileId}`);

      if (!response.ok) {
        throw new Error('Profile not found');
      }

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
    const urls = {
      chatgpt: 'https://chat.openai.com/',
      claude: 'https://claude.ai/',
    };
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
      // Extract JSON from the pasted data
      const jsonMatch = profileData.match(/```json\n([\s\S]*?)\n```/) ||
                        profileData.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : profileData;
      const extractedData = JSON.parse(jsonText);

      let myProfileId = existingProfileId;

      // If user doesn't have a profile, create one
      if (!myProfileId) {
        const saveResponse = await fetch('/api/save-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileData: extractedData }),
        });

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json();
          throw new Error(errorData.error || 'Failed to create profile');
        }

        const saveData = await saveResponse.json();
        myProfileId = saveData.profileId;

        // Save to localStorage
        localStorage.setItem('mission_match_profile_id', myProfileId!);
        localStorage.setItem('mission_match_device_id', saveData.deviceId);
      }

      // Create handshake between initiator (User A) and recipient (User B / me)
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

      // Redirect to handshake result page
      router.push(`/handshake-result/${handshakeData.handshakeId}`);
    } catch (err) {
      console.error('Connect error:', err);
      setSubmitError(err instanceof Error ? err.message : 'Invalid JSON format. Make sure you copied the complete response.');
      setSubmitting(false);
    }
  };

  // If user already has a profile, offer quick connect
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
          <div className="text-accent-cyan text-6xl mb-6 animate-spin">...</div>
          <h2 className="font-display text-2xl font-bold uppercase">Loading Profile</h2>
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
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
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

        {/* Initiator's Mission */}
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

        {/* Quick Connect (if user already has profile) */}
        {existingProfileId && (
          <div className="section mb-8" data-section="QUICK_CONNECT">
            <div className="bg-forge-black border-2 border-accent-orange p-6">
              <div className="text-accent-orange font-bold uppercase text-sm mb-3">
                You Already Have a Profile
              </div>
              <p className="text-text-primary mb-4">
                Connect instantly using your existing profile, or create a new one below.
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

        {/* Instructions */}
        <div className="section mb-8" data-section="INSTRUCTIONS">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-4 flex items-center gap-4">
            <span className="text-accent-cyan text-xl">//</span>
            {existingProfileId ? 'Or Create New Profile' : 'Create Your Profile in 60 Seconds'}
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3 pl-6 border-l-2 border-accent-cyan relative">
              <span className="absolute -left-2 text-accent-cyan font-bold text-sm">1</span>
              <div className="text-text-primary">
                <strong className="text-accent-orange">Copy</strong> the prompt below
              </div>
            </div>
            <div className="flex items-start gap-3 pl-6 border-l-2 border-accent-cyan relative">
              <span className="absolute -left-2 text-accent-cyan font-bold text-sm">2</span>
              <div className="text-text-primary">
                <strong className="text-accent-orange">Open</strong> your AI (ChatGPT, Claude) and paste it
              </div>
            </div>
            <div className="flex items-start gap-3 pl-6 border-l-2 border-accent-cyan relative">
              <span className="absolute -left-2 text-accent-cyan font-bold text-sm">3</span>
              <div className="text-text-primary">
                <strong className="text-accent-orange">Copy</strong> the JSON response and paste it back here
              </div>
            </div>
          </div>
        </div>

        {/* Prompt + AI App Buttons */}
        <div className="section mb-8" data-section="PROMPT">
          <div className="flex gap-3 mb-4">
            <button
              onClick={copyPrompt}
              className={`flex-1 py-4 font-display font-bold uppercase tracking-widest transition-all ${
                copied
                  ? 'bg-accent-cyan text-black'
                  : 'bg-accent-orange text-white hover:shadow-glow-orange'
              }`}
            >
              {copied ? '... Copied!' : 'Copy Prompt'}
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

        {/* Paste Area */}
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
              {submitting ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="animate-spin">...</span>
                  Creating Connection...
                </span>
              ) : (
                'Connect & See Match'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
