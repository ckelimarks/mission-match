'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, Copy, Check, Sparkles, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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

export default function CreateProfile() {
  const router = useRouter();
  const [profileData, setProfileData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyPrompt = () => {
    navigator.clipboard.writeText(PROFILE_PROMPT);
    setCopied(true);
    toast.success('Prompt copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileData.trim()) {
      setError('Please paste your profile data from your AI assistant');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Extract JSON from the pasted data (might be wrapped in markdown code blocks)
      const jsonMatch = profileData.match(/```json\n([\s\S]*?)\n```/) ||
                        profileData.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : profileData;
      const extractedData = JSON.parse(jsonText);

      // Send to API to save profile
      const response = await fetch('/api/save-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileData: extractedData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      const data = await response.json();

      // Save profile ID and device ID to localStorage
      localStorage.setItem('mission_match_profile_id', data.profileId);
      localStorage.setItem('mission_match_device_id', data.deviceId);

      // Check if there's a pending handshake
      const pendingHandshake = localStorage.getItem('pending_handshake');
      if (pendingHandshake) {
        localStorage.removeItem('pending_handshake');
        router.push(`/handshake/${pendingHandshake}`);
        return;
      }

      // Redirect to profile view
      router.push(`/profile/${data.profileId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format. Make sure you copied the complete response from your AI.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 p-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <span className="text-sm font-medium text-muted-foreground">Create Profile</span>
        <button
          onClick={() => router.push('/')}
          className="ml-auto p-2 rounded-lg hover:bg-muted transition-colors"
          title="Home"
        >
          <Home className="w-5 h-5 text-muted-foreground" />
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 pb-8 max-w-sm mx-auto w-full space-y-8">
        {/* Page Title */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-foreground">
            Create Your Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            60 seconds with your AI assistant
          </p>
        </motion.div>

        {/* Instructions */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            How It Works
          </h2>

          <div className="space-y-3">
            <div className="card-surface p-4 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">
                1
              </div>
              <div>
                <div className="text-sm font-medium text-foreground mb-1">Copy Prompt</div>
                <div className="text-xs text-muted-foreground">
                  Copy the prompt below using the button
                </div>
              </div>
            </div>
            <div className="card-surface p-4 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">
                2
              </div>
              <div>
                <div className="text-sm font-medium text-foreground mb-1">Paste in AI</div>
                <div className="text-xs text-muted-foreground">
                  Open Claude, ChatGPT, or any AI. Paste the prompt and answer questions
                </div>
              </div>
            </div>
            <div className="card-surface p-4 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">
                3
              </div>
              <div>
                <div className="text-sm font-medium text-foreground mb-1">Paste Back Here</div>
                <div className="text-xs text-muted-foreground">
                  Copy the JSON response and paste it below
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Prompt to Copy */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Step 1: Copy This Prompt
          </h2>

          <div className="card-surface overflow-hidden">
            <div className="bg-muted px-4 py-2 flex items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Profile Generator</span>
              </div>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              <pre className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-mono">
                {PROFILE_PROMPT}
              </pre>
            </div>
          </div>

          <Button
            onClick={copyPrompt}
            className="w-full gap-2"
            variant={copied ? "secondary" : "default"}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Prompt
              </>
            )}
          </Button>
        </motion.div>

        {/* Paste Profile Data */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Step 3: Paste Your Profile
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={profileData}
              onChange={(e) => setProfileData(e.target.value)}
              placeholder="Paste the JSON response from your AI here..."
              className="w-full h-48 card-surface p-4 text-foreground font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-none rounded-md"
            />

            {error && (
              <div className="card-surface border-l-4 border-destructive p-3">
                <div className="text-destructive font-semibold text-xs mb-1">Error</div>
                <div className="text-foreground text-xs">{error}</div>
              </div>
            )}

            <Button
              type="submit"
              disabled={!profileData.trim() || loading}
              className="w-full h-12 text-base font-semibold gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  Create Profile
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
