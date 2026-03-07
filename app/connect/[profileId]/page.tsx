'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Copy, CheckCircle, ArrowRight, User } from 'lucide-react';

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
    const savedProfileId = localStorage.getItem('mm_profile_id') || localStorage.getItem('mission_match_profile_id');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !initiatorProfile) {
    return (
      <div className="min-h-screen px-6 py-16 max-w-md mx-auto">
        <div className="card-surface p-6">
          <div className="text-destructive font-bold uppercase text-sm mb-2">Error</div>
          <p className="text-foreground mb-4">{error || 'Profile not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const displayName = initiatorProfile.display_name || 'Someone';
  const hook = initiatorProfile.role;

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="p-4 border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back
          </button>
          <span className="text-xs uppercase tracking-wider font-mono text-primary">Connection Request</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Profile Card */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{displayName}</h1>
            {hook && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                {hook}
              </p>
            )}
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              wants to connect
            </span>
          </div>
        </motion.div>

        {/* Quick Connect */}
        {existingProfileId && (
          <motion.div
            className="card-surface p-6 border-l-4 border-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Profile Found
              </span>
            </div>
            <p className="text-sm text-foreground mb-4">
              Connect instantly using your existing profile.
            </p>
            <button
              onClick={handleQuickConnect}
              disabled={submitting}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? 'Connecting...' : (
                <>
                  Quick Connect
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {existingProfileId ? 'Or Create New Profile' : 'Create Your Profile'}
          </h2>

          <div className="card-surface p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p className="text-sm text-foreground">
                  Copy the prompt and paste it into <strong>Claude</strong> or <strong>ChatGPT</strong>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p className="text-sm text-foreground">
                  Your AI will analyze your conversation history and generate a profile
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p className="text-sm text-foreground">
                  Paste the JSON response back here to connect
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <button
                onClick={copyPrompt}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  copied
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Prompt
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openAIApp('claude')}
                  className="py-2.5 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition-colors"
                >
                  Open Claude
                </button>
                <button
                  onClick={() => openAIApp('chatgpt')}
                  className="py-2.5 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition-colors"
                >
                  Open ChatGPT
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Paste Profile */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Paste Profile JSON
          </h2>

          <form onSubmit={handleConnect} className="space-y-4">
            <textarea
              value={profileData}
              onChange={(e) => setProfileData(e.target.value)}
              placeholder='{"display_name": "Your Name", ...}'
              className="w-full h-32 card-surface p-4 text-foreground font-mono text-xs focus:border-primary focus:outline-none transition-colors resize-none"
            />

            {submitError && (
              <div className="card-surface p-4 border-l-4 border-destructive">
                <div className="text-destructive font-bold text-sm uppercase mb-1">Error</div>
                <div className="text-foreground text-sm">{submitError}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={!profileData.trim() || submitting}
              className="w-full py-4 px-4 bg-primary text-primary-foreground rounded-lg font-bold text-base uppercase tracking-wide transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? 'Creating Connection...' : (
                <>
                  Connect & See Match
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
