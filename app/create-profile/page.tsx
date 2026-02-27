'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
        <header className="relative mb-16 py-10 border-t-2 border-b-2 border-accent-orange text-center">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-forge-black px-3 text-xs font-bold tracking-widest text-accent-orange">
            PROFILE_CREATION
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight mb-3">
            Create Your Profile
          </h1>
          <p className="text-text-secondary uppercase tracking-[0.3em] text-sm font-medium">
            60 Seconds with Your AI
          </p>
        </header>

        {/* Instructions */}
        <div className="section mb-8" data-section="INSTRUCTIONS">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
            <span className="text-accent-cyan text-xl">//</span>
            How It Works
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3 pl-6 border-l-3 border-accent-cyan relative">
              <span className="absolute -left-2.5 text-accent-cyan font-bold">&gt;</span>
              <div>
                <div className="text-accent-orange font-bold uppercase text-sm mb-1">Step 1: Copy Prompt</div>
                <div className="text-text-primary">
                  Copy the prompt below (click the button)
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 pl-6 border-l-3 border-accent-cyan relative">
              <span className="absolute -left-2.5 text-accent-cyan font-bold">&gt;</span>
              <div>
                <div className="text-accent-orange font-bold uppercase text-sm mb-1">Step 2: Paste in AI</div>
                <div className="text-text-primary">
                  Open Claude, ChatGPT, or any AI on your phone. Paste the prompt. Answer the questions.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 pl-6 border-l-3 border-accent-cyan relative">
              <span className="absolute -left-2.5 text-accent-cyan font-bold">&gt;</span>
              <div>
                <div className="text-accent-orange font-bold uppercase text-sm mb-1">Step 3: Paste Back Here</div>
                <div className="text-text-primary">
                  Copy the JSON response from your AI and paste it below. Done!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prompt to Copy */}
        <div className="section mb-8" data-section="PROMPT">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
            <span className="text-accent-cyan text-xl">//</span>
            Step 1: Copy This Prompt
          </h2>

          <div className="bg-black border-2 border-accent-cyan mb-4 shadow-glow-cyan">
            <div className="bg-accent-cyan px-6 py-3 flex justify-between items-center">
              <span className="text-black font-bold text-sm tracking-widest">PROFILE_GENERATOR.TXT</span>
              <div className="flex gap-2">
                <span className="w-3 h-3 bg-black rounded-full"></span>
                <span className="w-3 h-3 bg-black rounded-full"></span>
                <span className="w-3 h-3 bg-black rounded-full"></span>
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <pre className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap font-mono">
                {PROFILE_PROMPT}
              </pre>
            </div>
          </div>

          <button
            onClick={copyPrompt}
            className={`w-full py-5 font-display font-bold text-lg uppercase tracking-widest transition-all ${
              copied
                ? 'bg-gradient-to-r from-accent-cyan to-blue-600 shadow-glow-cyan'
                : 'bg-gradient-to-r from-accent-orange to-red-600 hover:shadow-glow-orange hover:translate-y-[-2px]'
            } text-white`}
          >
            {copied ? '✓ Copied!' : 'Copy Prompt'}
          </button>
        </div>

        {/* Paste Profile Data */}
        <div className="section" data-section="PASTE">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
            <span className="text-accent-cyan text-xl">//</span>
            Step 3: Paste Your Profile
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <textarea
              value={profileData}
              onChange={(e) => setProfileData(e.target.value)}
              placeholder="Paste the JSON response from your AI here..."
              className="w-full h-64 bg-forge-black border-2 border-grid-line p-6 text-text-primary font-mono text-sm focus:border-accent-cyan focus:outline-none transition-colors resize-none"
            />

            {error && (
              <div className="bg-forge-black border-l-4 border-red-500 p-4">
                <div className="text-red-400 font-bold text-sm uppercase mb-1">Error</div>
                <div className="text-text-primary">{error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={!profileData.trim() || loading}
              className="w-full py-6 bg-gradient-to-r from-accent-orange to-red-600 text-white font-display font-bold text-lg uppercase tracking-widest transition-all hover:shadow-glow-orange hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="animate-spin">⟳</span>
                  Saving Profile...
                </span>
              ) : (
                'Create Profile →'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
