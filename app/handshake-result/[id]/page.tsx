'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import RadarChart from '@/components/RadarChart';

type OverlapItem = {
  category: string;
  items: string[];
  why_matters: string;
};

type Analysis = {
  overlap: OverlapItem[];
  conversation_starters: string[];
};

type Profile = {
  id: string;
  role_aspects: any;
  shipping_aspects: any;
  communication_aspects: any;
  decision_aspects: any;
  energy_aspects: any;
};

export default function HandshakeResultPage() {
  const params = useParams();
  const handshakeId = params.id as string;

  const [status, setStatus] = useState<'loading' | 'analyzing' | 'ready' | 'error'>('loading');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [profiles, setProfiles] = useState<{ personA: Profile | null; personB: Profile | null }>({
    personA: null,
    personB: null,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAnalysisStatus();
    const interval = setInterval(checkAnalysisStatus, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchProfiles = async (handshakeIdFromAnalysis: string) => {
    try {
      // Get handshake to find profile IDs
      const handshakeRes = await fetch(`/api/get-handshake?handshakeId=${handshakeIdFromAnalysis}`);
      if (!handshakeRes.ok) return;

      const handshakeData = await handshakeRes.json();

      // Fetch both profiles
      const [profileARes, profileBRes] = await Promise.all([
        fetch(`/api/get-profile?profileId=${handshakeData.initiator_id}`),
        fetch(`/api/get-profile?profileId=${handshakeData.recipient_id}`),
      ]);

      if (profileARes.ok && profileBRes.ok) {
        const profileA = await profileARes.json();
        const profileB = await profileBRes.json();
        setProfiles({ personA: profileA, personB: profileB });
      }
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
    }
  };

  const checkAnalysisStatus = async () => {
    try {
      const response = await fetch(`/api/get-analysis?handshakeId=${handshakeId}&stage=1`);

      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }

      const data = await response.json();

      if (data.analysis_status === 'completed') {
        setAnalysis({
          overlap: data.overlap,
          conversation_starters: data.conversation_starters,
        });

        // Fetch both profiles for aspect visualization
        fetchProfiles(data.handshake_id);

        setStatus('ready');
      } else if (data.analysis_status === 'failed') {
        setError(data.error_message || 'Analysis failed');
        setStatus('error');
      } else {
        setStatus('analyzing');
      }
    } catch (err) {
      console.error('Error checking analysis:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('error');
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
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {(status === 'loading' || status === 'analyzing') && (
          <div className="section" data-section="ANALYZING">
            <div className="text-center">
              <div className="text-accent-cyan text-6xl mb-6 animate-spin">⟳</div>
              <h2 className="font-display text-4xl font-bold uppercase mb-4">
                {status === 'loading' ? 'Loading...' : 'Analyzing Profiles'}
              </h2>
              <p className="text-text-secondary text-lg">
                Claude is finding your collaboration overlap...
              </p>
            </div>
          </div>
        )}

        {status === 'ready' && analysis && (
          <>
            {/* Header */}
            <header className="relative mb-12 py-8 border-t-2 border-b-2 border-accent-cyan text-center">
              <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight mb-2">
                Collaboration Match
              </h1>
              <p className="text-text-secondary text-sm">
                Quick visual overview of where you align and differ
              </p>
            </header>

            {/* Radar Chart */}
            {profiles.personA && profiles.personB && (
              <div className="section mb-12" data-section="VISUAL">
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 text-center">
                  Working Style Comparison
                </h2>
                <div className="flex justify-center">
                  <RadarChart
                    personA={{
                      Creative: profiles.personA.role_aspects?.creative_vs_executor?.score || 50,
                      Specialist: profiles.personA.role_aspects?.generalist_vs_specialist?.score || 50,
                      Ideas: profiles.personA.shipping_aspects?.idea_generation?.score || 50,
                      Speed: profiles.personA.shipping_aspects?.iteration_speed?.score || 50,
                      Structure: profiles.personA.communication_aspects?.structure_vs_chaos?.score || 50,
                      Direct: profiles.personA.communication_aspects?.directness?.score || 50,
                    }}
                    personB={{
                      Creative: profiles.personB.role_aspects?.creative_vs_executor?.score || 50,
                      Specialist: profiles.personB.role_aspects?.generalist_vs_specialist?.score || 50,
                      Ideas: profiles.personB.shipping_aspects?.idea_generation?.score || 50,
                      Speed: profiles.personB.shipping_aspects?.iteration_speed?.score || 50,
                      Structure: profiles.personB.communication_aspects?.structure_vs_chaos?.score || 50,
                      Direct: profiles.personB.communication_aspects?.directness?.score || 50,
                    }}
                    size={400}
                  />
                </div>
              </div>
            )}

            {/* Simplified Overlap - Top 3 only */}
            <div className="section mb-8" data-section="OVERLAP">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-4 flex items-center gap-3">
                <span className="text-accent-cyan text-xl">//</span>
                What You Have in Common
              </h2>

              <div className="space-y-4">
                {analysis.overlap.slice(0, 3).map((item, i) => (
                  <div key={i} className="bg-forge-black border-l-4 border-accent-cyan p-5">
                    <div className="text-accent-cyan font-bold text-sm mb-2">
                      {item.category}
                    </div>
                    <div className="text-text-secondary text-sm">
                      {item.why_matters}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 3 Conversation Starters */}
            <div className="section mb-8" data-section="CONVERSATION">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-4 flex items-center gap-3">
                <span className="text-accent-orange text-xl">//</span>
                Start Here
              </h2>

              <div className="space-y-3">
                {analysis.conversation_starters.slice(0, 3).map((starter, i) => (
                  <div key={i} className="bg-forge-black p-4 border-l-4 border-accent-orange">
                    <div className="text-text-primary">
                      {starter}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="section" data-section="NEXT_STEPS">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
                <span className="text-accent-cyan text-xl">//</span>
                Privacy First
              </h2>

              <div className="bg-forge-black p-6 border border-grid-line mb-6">
                <p className="text-text-primary mb-4">
                  This is your <strong>Stage 1</strong> analysis - showing overlap areas only.
                  Full profiles with aspect scores are still private.
                </p>
                <p className="text-text-secondary text-sm">
                  Want to see detailed aspect analysis and pairing risks? Both people need to consent to Stage 2.
                </p>
              </div>

              <button
                className="w-full py-6 bg-gradient-to-r from-accent-cyan to-blue-600 text-white font-display font-bold text-lg uppercase tracking-widest transition-all hover:shadow-glow-cyan hover:translate-y-[-2px]"
                onClick={() => alert('Stage 2 consent coming soon!')}
              >
                Request Full Analysis (Stage 2)
              </button>
            </div>
          </>
        )}

        {status === 'error' && (
          <div className="section" data-section="ERROR">
            <h2 className="font-display text-3xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
              <span className="text-red-500 text-2xl">//</span>
              Analysis Failed
            </h2>

            <div className="bg-forge-black border-l-4 border-red-500 p-6">
              <p className="text-text-primary">{error}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
