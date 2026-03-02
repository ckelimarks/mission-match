'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Handshake, Analysis, OverlapItem } from '@/types';

export default function HandshakeResultPage() {
  const params = useParams();
  const router = useRouter();
  const handshakeId = params.id as string;

  const [handshake, setHandshake] = useState<Handshake | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  useEffect(() => {
    const profileId = localStorage.getItem('mission_match_profile_id');
    setMyProfileId(profileId);
    fetchHandshake();
  }, []);

  const fetchHandshake = async () => {
    try {
      const response = await fetch(`/api/get-handshake?id=${handshakeId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch handshake');
      }

      const data = await response.json();
      setHandshake(data.handshake);
      setAnalysis(data.analysis);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const isInitiator = handshake?.initiator_id === myProfileId;
  const otherPersonRole = isInitiator ? 'Recipient' : 'Initiator';

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
        <header className="relative mb-16 py-10 border-t-2 border-b-2 border-accent-cyan text-center">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-forge-black px-3 text-xs font-bold tracking-widest text-accent-cyan">
            HANDSHAKE_ANALYSIS
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight mb-3">
            Collaboration Match
          </h1>
          <p className="text-text-secondary uppercase tracking-[0.3em] text-sm font-medium">
            ID: {handshakeId.slice(0, 8)}...
          </p>
        </header>

        {loading && (
          <div className="section" data-section="LOADING">
            <div className="text-center py-16">
              <div className="text-accent-cyan text-6xl mb-6 animate-spin">⟳</div>
              <h2 className="font-display text-3xl font-bold uppercase mb-4">
                Loading Handshake
              </h2>
              <p className="text-text-secondary">
                Retrieving collaboration analysis...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="section" data-section="ERROR">
            <div className="bg-forge-black border-l-4 border-red-500 p-6">
              <div className="text-red-400 font-bold uppercase text-sm mb-2">Error</div>
              <p className="text-text-primary">{error}</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="mt-6 w-full py-4 bg-grid-line text-text-primary font-display font-bold uppercase tracking-widest hover:bg-accent-cyan hover:text-black transition-colors"
            >
              Go Home
            </button>
          </div>
        )}

        {!loading && !error && handshake && (
          <>
            {/* Handshake Status */}
            <div className="section mb-8" data-section="STATUS">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
                <span className="text-accent-cyan text-xl">//</span>
                Status
              </h2>
              <div className="bg-forge-black border-l-4 border-accent-cyan p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-accent-cyan font-bold uppercase text-sm mb-2">
                      Handshake Status
                    </div>
                    <div className="text-text-primary text-2xl font-bold uppercase">
                      {handshake.status}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-text-secondary text-xs uppercase mb-1">
                      You are the {isInitiator ? 'Initiator' : 'Recipient'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Status */}
            {analysis && (
              <>
                {analysis.analysis_status === 'pending' && (
                  <div className="section mb-8" data-section="ANALYSIS_PENDING">
                    <div className="text-center py-12">
                      <div className="text-accent-orange text-6xl mb-6 animate-spin">⟳</div>
                      <h2 className="font-display text-2xl font-bold uppercase mb-4">
                        Analyzing Collaboration Potential
                      </h2>
                      <p className="text-text-secondary">
                        Claude is analyzing your overlap areas and complementarity...
                      </p>
                      <button
                        onClick={fetchHandshake}
                        className="mt-6 px-8 py-3 bg-grid-line text-text-primary font-bold uppercase tracking-wider hover:bg-accent-cyan hover:text-black transition-colors"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                )}

                {analysis.analysis_status === 'completed' && analysis.stage === 1 && (
                  <div className="section mb-8" data-section="OVERLAP_ANALYSIS">
                    <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
                      <span className="text-accent-cyan text-xl">//</span>
                      Overlap Analysis
                    </h2>

                    {analysis.overlap && (analysis.overlap as OverlapItem[]).length > 0 ? (
                      <div className="space-y-6">
                        {(analysis.overlap as OverlapItem[]).map((item, i) => (
                          <div key={i} className="bg-forge-black border-l-4 border-accent-orange p-6">
                            <div className="text-accent-orange font-bold uppercase text-sm mb-3">
                              {item.category}
                            </div>
                            <ul className="space-y-2 mb-4">
                              {item.items.map((overlap, j) => (
                                <li key={j} className="text-text-primary pl-4 border-l-2 border-accent-cyan">
                                  {overlap}
                                </li>
                              ))}
                            </ul>
                            <div className="text-text-secondary text-sm italic">
                              Why this matters: {item.why_matters}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-forge-black border-l-4 border-grid-line p-6">
                        <p className="text-text-secondary">No overlap analysis available yet.</p>
                      </div>
                    )}

                    {/* Conversation Starters */}
                    {analysis.conversation_starters && (analysis.conversation_starters as string[]).length > 0 && (
                      <div className="mt-8">
                        <h3 className="font-display text-xl font-bold uppercase tracking-wide mb-4 flex items-center gap-3">
                          <span className="text-accent-cyan">//</span>
                          Conversation Starters
                        </h3>
                        <div className="space-y-3">
                          {(analysis.conversation_starters as string[]).map((starter, i) => (
                            <div key={i} className="bg-forge-black p-4 border-l-2 border-accent-cyan">
                              <p className="text-text-primary">{starter}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Consent for Stage 2 (placeholder for future) */}
                    <div className="mt-8 bg-forge-black border-2 border-accent-orange p-6">
                      <div className="text-accent-orange font-bold uppercase text-sm mb-3">
                        Want Deeper Insights?
                      </div>
                      <p className="text-text-primary mb-4">
                        Stage 2 analysis includes complementarity scores, aspect mismatches, and collaboration risks. Both parties must consent to unlock this.
                      </p>
                      <button
                        disabled
                        className="w-full py-4 bg-grid-line text-text-dim font-display font-bold uppercase tracking-widest cursor-not-allowed"
                      >
                        Consent to Stage 2 (Coming Soon)
                      </button>
                    </div>
                  </div>
                )}

                {analysis.analysis_status === 'failed' && (
                  <div className="section mb-8" data-section="ANALYSIS_FAILED">
                    <div className="bg-forge-black border-l-4 border-red-500 p-6">
                      <div className="text-red-400 font-bold uppercase text-sm mb-2">
                        Analysis Failed
                      </div>
                      <p className="text-text-primary">
                        {analysis.error_message || 'Failed to analyze collaboration potential.'}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div className="section mt-8" data-section="ACTIONS">
              <div className="flex gap-4">
                <button
                  onClick={() => router.push(`/profile/${myProfileId}`)}
                  className="flex-1 py-4 bg-grid-line text-text-primary font-display font-bold uppercase tracking-widest hover:bg-accent-cyan hover:text-black transition-colors"
                >
                  My Profile
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="flex-1 py-4 bg-accent-cyan text-black font-display font-bold uppercase tracking-widest hover:shadow-glow-cyan transition-all"
                >
                  Home
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
