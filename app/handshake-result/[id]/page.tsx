'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Handshake, Analysis, OverlapItem } from '@/types';
import ConsentModal from '@/components/ConsentModal';

export default function HandshakeResultPage() {
  const params = useParams();
  const router = useRouter();
  const handshakeId = params.id as string;

  const [handshake, setHandshake] = useState<Handshake | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [granting, setGranting] = useState(false);
  const [showDebug, setShowDebug] = useState(true);

  useEffect(() => {
    const profileId = localStorage.getItem('mm_profile_id');
    setMyProfileId(profileId);
    fetchHandshake();
  }, []);

  // Auto-poll while analysis is pending
  useEffect(() => {
    if (analysis?.analysis_status === 'pending') {
      const interval = setInterval(() => {
        fetchHandshake();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [analysis?.analysis_status]);

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
  const hasConsented = isInitiator ? handshake?.initiator_consented : handshake?.recipient_consented;
  const mutualConsent = handshake?.status === 'approved';

  const handleGrantConsent = async () => {
    if (!myProfileId) {
      console.error('No profileId in localStorage');
      alert('No profile ID found. Please create a profile first.');
      return;
    }

    console.log('🔍 Grant Consent Debug:', {
      myProfileId,
      handshakeId,
      initiator_id: handshake?.initiator_id,
      recipient_id: handshake?.recipient_id,
      isInitiator,
    });

    try {
      setGranting(true);
      const response = await fetch('/api/grant-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handshakeId,
          profileId: myProfileId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to grant consent');
      }

      setShowConsentModal(false);

      // Refresh handshake data
      await fetchHandshake();

      // Show success notification if mutual consent
      if (data.mutualConsent) {
        alert('🎉 Mutual consent granted! Full profiles unlocked.');
      }
    } catch (err) {
      console.error('Consent error:', err);
      alert(err instanceof Error ? err.message : 'Failed to grant consent');
    } finally {
      setGranting(false);
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

            {/* Debug Panel */}
            {showDebug && (
              <div className="section mb-8" data-section="DEBUG">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-display text-xl font-bold uppercase tracking-wide flex items-center gap-4">
                    <span className="text-accent-orange text-xl">//</span>
                    Debug Info
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        fetchHandshake();
                        alert('Refreshing data...');
                      }}
                      className="px-3 py-1 bg-accent-orange text-black text-xs font-bold uppercase hover:opacity-80"
                    >
                      Force Refresh
                    </button>
                    <button
                      onClick={() => setShowDebug(false)}
                      className="text-text-secondary text-xs hover:text-accent-cyan"
                    >
                      Hide
                    </button>
                  </div>
                </div>
                <div className="bg-forge-black border-l-4 border-accent-orange p-6 font-mono text-xs">
                  <div className="space-y-2">
                    <div>
                      <span className="text-accent-orange">My Profile ID:</span>
                      <div className="text-text-primary break-all">{myProfileId || 'NOT SET'}</div>
                    </div>
                    <div>
                      <span className="text-accent-orange">Initiator ID:</span>
                      <div className="text-text-primary break-all">{handshake.initiator_id}</div>
                    </div>
                    <div>
                      <span className="text-accent-orange">Recipient ID:</span>
                      <div className="text-text-primary break-all">{handshake.recipient_id}</div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-grid-line">
                      <span className="text-accent-orange">Match Status:</span>
                      <div className="text-text-primary">
                        {myProfileId === handshake.initiator_id && '✓ You are the INITIATOR'}
                        {myProfileId === handshake.recipient_id && '✓ You are the RECIPIENT'}
                        {myProfileId !== handshake.initiator_id && myProfileId !== handshake.recipient_id && '✗ Profile ID mismatch - this is the bug!'}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-grid-line">
                      <span className="text-accent-orange">Analysis Status:</span>
                      <div className="text-text-primary">
                        {analysis ? `${analysis.analysis_status} (stage ${analysis.stage})` : 'No analysis data'}
                      </div>
                    </div>
                    <div>
                      <span className="text-accent-orange">Has Overlap Data:</span>
                      <div className="text-text-primary">
                        {analysis?.overlap ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                      <div className="flex gap-4 justify-center mt-6">
                        <button
                          onClick={fetchHandshake}
                          className="px-8 py-3 bg-grid-line text-text-primary font-bold uppercase tracking-wider hover:bg-accent-cyan hover:text-black transition-colors"
                        >
                          Refresh
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/analyze-stage1', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ handshakeId }),
                              });
                              const data = await res.json();
                              if (!res.ok) {
                                alert(`Analysis failed: ${data.error}\n${data.details || ''}`);
                              } else {
                                alert('Analysis triggered! Refreshing...');
                                fetchHandshake();
                              }
                            } catch (err) {
                              alert(`Error: ${err}`);
                            }
                          }}
                          className="px-8 py-3 bg-accent-orange text-white font-bold uppercase tracking-wider hover:shadow-glow-orange transition-all"
                        >
                          Retry Analysis
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {analysis.analysis_status === 'completed' && analysis.stage === 1 && (
                  <div className="section mb-8" data-section="OVERLAP_ANALYSIS">
                    {/* Hook Alignment - now stored in overlap.hook_alignment */}
                    {(analysis.overlap as any)?.hook_alignment && (
                      <div className="mb-8">
                        <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
                          <span className="text-accent-cyan text-xl">//</span>
                          Mission Alignment
                        </h2>
                        <div className="bg-forge-black border-l-4 border-accent-cyan p-6">
                          <p className="text-text-primary text-lg italic">
                            "{(analysis.overlap as any).hook_alignment}"
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Overlap Areas - now stored in overlap.items */}
                    <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
                      <span className="text-accent-cyan text-xl">//</span>
                      Overlap Analysis
                    </h2>

                    {(() => {
                      // Handle both old format (array) and new format (object with items)
                      const overlapItems = Array.isArray(analysis.overlap)
                        ? analysis.overlap
                        : (analysis.overlap as any)?.items || [];
                      return overlapItems.length > 0 ? (
                      <div className="space-y-6">
                        {(overlapItems as OverlapItem[]).map((item, i) => (
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
                    );
                    })()}

                    {/* Working Style Preview - now stored in overlap.working_style_preview */}
                    {(() => {
                      const wsPreview = Array.isArray(analysis.overlap)
                        ? [] // old format didn't have this
                        : (analysis.overlap as any)?.working_style_preview || [];
                      return wsPreview.length > 0 && (
                      <div className="mt-8">
                        <h3 className="font-display text-xl font-bold uppercase tracking-wide mb-4 flex items-center gap-3">
                          <span className="text-accent-cyan">//</span>
                          Working Style Compatibility
                        </h3>
                        <div className="grid gap-3">
                          {wsPreview.map((ws: any, i: number) => (
                            <div key={i} className="bg-forge-black p-4 border-l-2 border-accent-orange">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-text-primary">{ws.dimension}</span>
                                <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                                  ws.alignment === 'aligned' ? 'bg-accent-cyan/20 text-accent-cyan' :
                                  ws.alignment === 'complementary' ? 'bg-accent-orange/20 text-accent-orange' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {ws.alignment}
                                </span>
                              </div>
                              <p className="text-text-secondary text-sm">{ws.insight}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                    })()}

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

                    {/* Consent for Stage 2 */}
                    {!mutualConsent && (
                      <div className="mt-8 bg-forge-black border-2 border-accent-orange p-6">
                        <div className="text-accent-orange font-bold uppercase text-sm mb-3">
                          Want Deeper Insights?
                        </div>
                        <p className="text-text-primary mb-4">
                          Stage 2 analysis includes complementarity scores, aspect mismatches, and collaboration risks. Both parties must consent to unlock this.
                        </p>
                        {hasConsented ? (
                          <div className="text-accent-cyan font-bold uppercase text-sm">
                            ✓ You have consented. Waiting for other party...
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowConsentModal(true)}
                            disabled={granting}
                            className="w-full py-4 bg-accent-orange text-white font-display font-bold uppercase tracking-widest hover:shadow-glow-orange transition-all disabled:opacity-50"
                          >
                            {granting ? 'Granting Consent...' : 'Grant Consent (Stage 2)'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Stage 2 Results */}
                    {mutualConsent && (
                      <div className="mt-8 bg-forge-black border-2 border-accent-cyan p-6 shadow-glow-cyan">
                        <div className="text-accent-cyan font-bold uppercase text-sm mb-3 flex items-center gap-2">
                          <span>✓</span> Full Profile Access Enabled
                        </div>
                        <p className="text-text-primary">
                          Both parties have granted consent. Stage 2 analysis with full profiles will be available soon!
                        </p>
                      </div>
                    )}
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

      {/* Consent Modal */}
      <ConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsent={handleGrantConsent}
        otherPersonName="Collaborator"
      />
    </>
  );
}
