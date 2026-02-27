'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type OverlapItem = {
  category: string;
  items: string[];
  why_matters: string;
};

type Analysis = {
  overlap: OverlapItem[];
  conversation_starters: string[];
};

export default function HandshakeResultPage() {
  const params = useParams();
  const handshakeId = params.id as string;

  const [status, setStatus] = useState<'loading' | 'analyzing' | 'ready' | 'error'>('loading');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAnalysisStatus();
    const interval = setInterval(checkAnalysisStatus, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

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
            <header className="relative mb-16 py-10 border-t-2 border-b-2 border-accent-orange text-center">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-forge-black px-3 text-xs font-bold tracking-widest text-accent-orange">
                STAGE_1_ANALYSIS
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-bold uppercase tracking-tight mb-3">
                Collaboration Overlap
              </h1>
              <p className="text-text-secondary uppercase tracking-[0.3em] text-sm font-medium">
                What You Have in Common
              </p>
            </header>

            {/* Overlap Areas */}
            <div className="section mb-8" data-section="OVERLAP">
              <h2 className="font-display text-3xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
                <span className="text-accent-cyan text-2xl">//</span>
                Overlap Areas
              </h2>

              <div className="space-y-6">
                {analysis.overlap.map((item, i) => (
                  <div key={i} className="bg-forge-black border-l-4 border-accent-cyan p-6 hover:shadow-glow-cyan transition-shadow">
                    <div className="text-accent-cyan font-bold uppercase text-sm mb-3">
                      {item.category}
                    </div>
                    <ul className="space-y-2 mb-4">
                      {item.items.map((thing, j) => (
                        <li key={j} className="text-text-primary text-lg flex items-start gap-3">
                          <span className="text-accent-orange">•</span>
                          {thing}
                        </li>
                      ))}
                    </ul>
                    <div className="text-text-secondary italic">
                      {item.why_matters}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversation Starters */}
            <div className="section mb-8" data-section="CONVERSATION">
              <h2 className="font-display text-3xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
                <span className="text-accent-orange text-2xl">//</span>
                Talk About This
              </h2>

              <div className="space-y-4">
                {analysis.conversation_starters.map((starter, i) => (
                  <div key={i} className="bg-forge-black p-6 border-l-4 border-accent-orange hover:shadow-glow-orange transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="text-accent-orange font-bold text-xl">
                        {i + 1}.
                      </div>
                      <div className="text-text-primary text-lg flex-1">
                        {starter}
                      </div>
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
