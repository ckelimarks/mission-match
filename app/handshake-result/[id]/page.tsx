'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Handshake, Analysis, OverlapItem } from '@/types';
import ConsentModal from '@/components/ConsentModal';

interface ProfileData {
  id: string;
  role?: string;
  mission?: string;
  proof_points?: any[];
  role_aspects?: any; // working_style
  collaboration_aspects?: any; // collaboration_fit
  communication_aspects?: any; // contact info
  shipping_aspects?: any; // intellectual_signature
}

export default function HandshakeResultPage() {
  const params = useParams();
  const router = useRouter();
  const handshakeId = params.id as string;

  const [handshake, setHandshake] = useState<Handshake | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [initiatorProfile, setInitiatorProfile] = useState<ProfileData | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [granting, setGranting] = useState(false);

  // Prioritization state
  const [priorityMethod, setPriorityMethod] = useState<'quick-pick' | 'point-allocation'>('quick-pick');
  const [quickPickAnswers, setQuickPickAnswers] = useState<Record<number, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [pointsRemaining, setPointsRemaining] = useState(10);
  const [pointAllocation, setPointAllocation] = useState<Record<string, number>>({});

  useEffect(() => {
    const profileId = localStorage.getItem('mm_profile_id') || localStorage.getItem('mission_match_profile_id');
    setMyProfileId(profileId);
    fetchHandshake();
  }, []);

  // Auto-poll while analysis is pending
  useEffect(() => {
    if (analysis?.analysis_status === 'pending') {
      const interval = setInterval(() => {
        fetchHandshake();
      }, 3000);
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

      // Fetch profile data for both people
      if (data.handshake) {
        fetchProfiles(data.handshake.initiator_id, data.handshake.recipient_id);
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const fetchProfiles = async (initiatorId: string, recipientId: string) => {
    try {
      console.log('[FETCH-PROFILES] Fetching profiles:', { initiatorId, recipientId });

      if (!initiatorId || !recipientId) {
        console.error('[FETCH-PROFILES] Missing profile IDs', { initiatorId, recipientId });
        return;
      }

      const [initRes, recRes] = await Promise.all([
        fetch(`/api/get-profile?id=${initiatorId}`),
        fetch(`/api/get-profile?id=${recipientId}`),
      ]);

      console.log('[FETCH-PROFILES] Response status:', {
        initiator: initRes.status,
        recipient: recRes.status
      });

      if (initRes.ok) {
        const initData = await initRes.json();
        console.log('[FETCH-PROFILES] Initiator profile:', initData.profile?.id);
        console.log('[FETCH-PROFILES] Initiator profile keys:', Object.keys(initData.profile || {}));
        console.log('[FETCH-PROFILES] Initiator has communication_aspects:', !!initData.profile?.communication_aspects);
        console.log('[FETCH-PROFILES] Initiator has role_aspects:', !!initData.profile?.role_aspects);
        setInitiatorProfile(initData.profile);
      } else {
        console.error('[FETCH-PROFILES] Initiator fetch failed:', await initRes.text());
      }

      if (recRes.ok) {
        const recData = await recRes.json();
        console.log('[FETCH-PROFILES] Recipient profile:', recData.profile?.id);
        console.log('[FETCH-PROFILES] Recipient profile keys:', Object.keys(recData.profile || {}));
        console.log('[FETCH-PROFILES] Recipient has communication_aspects:', !!recData.profile?.communication_aspects);
        console.log('[FETCH-PROFILES] Recipient has role_aspects:', !!recData.profile?.role_aspects);
        setRecipientProfile(recData.profile);
      } else {
        console.error('[FETCH-PROFILES] Recipient fetch failed:', await recRes.text());
      }
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
    }
  };

  const isInitiator = handshake?.initiator_id === myProfileId;
  const hasConsented = isInitiator ? handshake?.initiator_consented : handshake?.recipient_consented;
  const mutualConsent = handshake?.status === 'approved';

  // Debug mutual consent
  useEffect(() => {
    if (handshake) {
      console.log('[MUTUAL-CONSENT] Status:', {
        handshakeStatus: handshake.status,
        mutualConsent,
        initiatorConsented: handshake.initiator_consented,
        recipientConsented: handshake.recipient_consented,
      });
    }
  }, [handshake, mutualConsent]);

  const handleGrantConsent = async () => {
    if (!myProfileId) {
      alert('No profile ID found. Please create a profile first.');
      return;
    }

    try {
      setGranting(true);
      const response = await fetch('/api/grant-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handshakeId, profileId: myProfileId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to grant consent');

      setShowConsentModal(false);
      await fetchHandshake();

      if (data.mutualConsent) {
        alert('Mutual consent granted! Full profiles unlocked.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to grant consent');
    } finally {
      setGranting(false);
    }
  };

  const retryAnalysis = async () => {
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
        fetchHandshake();
      }
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  // Extract profile display info
  const getProfileName = (profile: ProfileData | null, fallback: string) => {
    if (!profile) return fallback;
    // role contains the hook in new format, extract first name if possible
    const hook = profile.role || '';
    // Try to extract a name-like string, otherwise use fallback
    return fallback;
  };

  const getProfileRole = (profile: ProfileData | null) => {
    if (!profile) return 'Collaborator';
    // mission or role could contain role info
    return profile.mission?.split('.')[0]?.slice(0, 60) || 'Collaborator';
  };

  // Parse overlap data
  const getOverlapItems = (): OverlapItem[] => {
    if (!analysis?.overlap) return [];
    return Array.isArray(analysis.overlap)
      ? analysis.overlap
      : (analysis.overlap as any)?.items || [];
  };

  const getWorkingStylePreview = (): any[] => {
    if (!analysis?.overlap || Array.isArray(analysis.overlap)) return [];
    return (analysis.overlap as any)?.working_style_preview || [];
  };

  const getHookAlignment = (): string | null => {
    if (!analysis?.overlap || Array.isArray(analysis.overlap)) return null;
    return (analysis.overlap as any)?.hook_alignment || null;
  };

  const getConversationStarters = (): string[] => {
    return (analysis?.conversation_starters as string[]) || [];
  };

  // Prioritization data
  const quickPickQuestions = [
    {
      question: "What kind of collaboration are you most interested in?",
      options: [
        "Building a product together",
        "Running experiments & learning",
        "Strategic advising / mentorship"
      ]
    },
    {
      question: "What's your preferred working style?",
      options: [
        "Technical co-founder (build together)",
        "Design & strategy partner",
        "Async collaboration (flexible)"
      ]
    },
    {
      question: "How much time can you commit?",
      options: [
        "Nights & weekends sprint (10-20 hrs/wk)",
        "Slow burn side project (2-5 hrs/wk)",
        "Occasional / ad-hoc (1-2 hrs/wk)"
      ]
    },
    {
      question: "What's your primary goal?",
      options: [
        "Ship a real product to users",
        "Learn new skills & explore",
        "Build portfolio / credibility"
      ]
    }
  ];

  const handleQuickPickAnswer = (questionIndex: number, answer: string) => {
    setQuickPickAnswers(prev => ({ ...prev, [questionIndex]: answer }));
    if (questionIndex < quickPickQuestions.length - 1) {
      setCurrentQuestion(questionIndex + 1);
    }
  };

  const adjustPoints = (optionId: string, delta: number) => {
    const currentValue = pointAllocation[optionId] || 0;
    const newValue = Math.max(0, currentValue + delta);
    const pointDiff = newValue - currentValue;

    if (pointsRemaining - pointDiff >= 0) {
      setPointAllocation(prev => ({ ...prev, [optionId]: newValue }));
      setPointsRemaining(prev => prev - pointDiff);
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
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 font-dm-sans">

        {loading && (
          <div className="text-center py-24">
            <div className="text-[var(--mm-cyan)] text-6xl mb-6 animate-spin">&#x21BB;</div>
            <h2 className="text-2xl font-bold mb-4">Loading Analysis</h2>
            <p className="text-[var(--mm-text-muted)]">Retrieving collaboration data...</p>
          </div>
        )}

        {error && (
          <div className="bg-[var(--forge-dark)] border-l-4 border-red-500 p-6 rounded-lg">
            <div className="text-red-400 font-bold uppercase text-sm mb-2">Error</div>
            <p className="text-white">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 mm-btn-primary"
            >
              Go Home
            </button>
          </div>
        )}

        {!loading && !error && handshake && (
          <>
            {/* Travis Bonnet Style Header */}
            <div className="results-header">
              <div className="results-header-label">
                Collaboration Protocol &middot; {
                  mutualConsent
                    ? 'Stage 2 Access Granted'
                    : analysis?.analysis_status === 'completed'
                    ? 'Stage 1 Complete'
                    : 'Analyzing...'
                }
              </div>

              <div className="results-header-people">
                <div className="person-header left">
                  <div className="person-name">Person A</div>
                  <div className="person-role">{getProfileRole(initiatorProfile)}</div>
                </div>

                <div className="vs-divider">&times;</div>

                <div className="person-header right">
                  <div className="person-name">Person B</div>
                  <div className="person-role">{getProfileRole(recipientProfile)}</div>
                </div>
              </div>

              <div className="results-description">
                <p>
                  {mutualConsent
                    ? 'Both parties have granted consent. Full profiles with contact information are now visible.'
                    : 'Two profiles analyzed for collaboration fit. This is Stage 1 — public data only, no PII shared.'}
                </p>
              </div>
            </div>

            {/* Analysis Status: Pending */}
            {(!analysis || analysis.analysis_status === 'pending') && (
              <div className="text-center py-16">
                <div className="text-[var(--mm-yellow)] text-6xl mb-6 animate-spin">&#x21BB;</div>
                <h2 className="text-2xl font-bold mb-4">Analyzing Collaboration Potential</h2>
                <p className="text-[var(--mm-text-muted)] mb-8">
                  Claude is analyzing your overlap areas and complementarity...
                </p>
                <div className="flex gap-4 justify-center">
                  <button onClick={fetchHandshake} className="mm-btn-primary">
                    Refresh
                  </button>
                  <button
                    onClick={retryAnalysis}
                    className="px-6 py-3 bg-[var(--mm-yellow)] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Retry Analysis
                  </button>
                </div>
              </div>
            )}

            {/* Analysis Complete */}
            {analysis?.analysis_status === 'completed' && (
              <>
                {/* Hook Alignment / Mission Connection */}
                {getHookAlignment() && (
                  <div className="powerful-question mb-8">
                    <div className="label">&#x2728; Mission Alignment</div>
                    <div className="question-text">
                      &ldquo;{getHookAlignment()}&rdquo;
                    </div>
                  </div>
                )}

                {/* Overlap Analysis */}
                {getOverlapItems().length > 0 && (
                  <div className="mb-10">
                    <h2 className="mm-section-header">
                      <span className="icon">&#x25C8;</span>
                      Shared Ground
                    </h2>

                    {getOverlapItems().map((item, i) => (
                      <div key={i} className="overlap-card">
                        <div className="category">{item.category}</div>
                        <ul className="items list-none">
                          {item.items.map((overlap, j) => (
                            <li key={j}>{overlap}</li>
                          ))}
                        </ul>
                        <div className="why-matters">
                          {item.why_matters}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Working Style Compatibility */}
                {getWorkingStylePreview().length > 0 && (
                  <div className="mb-10">
                    <h2 className="mm-section-header">
                      <span className="icon">&#x2B21;</span>
                      Working Style Compatibility
                    </h2>

                    <div className="two-sided-section">
                      <div className="side-left">
                        <div className="side-label">Compatibility Signals</div>
                        {getWorkingStylePreview().slice(0, 2).map((ws, i) => (
                          <div key={i} className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-medium text-sm">{ws.dimension}</span>
                              <span className={`alignment-badge ${ws.alignment}`}>
                                {ws.alignment}
                              </span>
                            </div>
                            <p className="text-[var(--mm-text-muted)] text-sm">{ws.insight}</p>
                          </div>
                        ))}
                      </div>

                      <div className="side-right">
                        <div className="side-label">More Signals</div>
                        {getWorkingStylePreview().slice(2, 4).map((ws, i) => (
                          <div key={i} className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-medium text-sm">{ws.dimension}</span>
                              <span className={`alignment-badge ${ws.alignment}`}>
                                {ws.alignment}
                              </span>
                            </div>
                            <p className="text-[var(--mm-text-muted)] text-sm">{ws.insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Conversation Starters */}
                {getConversationStarters().length > 0 && (
                  <div className="powerful-question">
                    <div className="label">&#x26A1; Start Your Conversation Here</div>
                    <div className="space-y-4">
                      {getConversationStarters().map((starter, i) => (
                        <div key={i} className="question-text text-base">
                          &ldquo;{starter}&rdquo;
                        </div>
                      ))}
                    </div>
                    <div className="explanation mt-4">
                      <strong style={{ color: 'var(--mm-cyan)' }}>Why these questions:</strong><br />
                      These conversation starters are generated based on your specific overlap areas and complementary strengths. They&apos;re designed to help you discover what you&apos;d actually build together.
                    </div>
                  </div>
                )}

                {/* Privacy / Consent Section */}
                {!mutualConsent && (
                  <div className="consent-section mt-10">
                    <h3>&#x1F512; Stage 1: Public Profile Access</h3>
                    <p>
                      This analysis uses <strong>public profile data only</strong> — like a Slack bot that can see channels but can&apos;t post until invited.
                    </p>
                    <div className="bg-black/30 p-4 rounded-lg font-mono text-xs text-[var(--mm-text-muted)] mb-4">
                      GET /cpx/human/&#123;id&#125;/public → 200 OK<br />
                      ✓ Aspects, mission, work style visible<br /><br />
                      GET /cpx/human/&#123;id&#125;/full → 403 Forbidden<br />
                      ✗ Name, contact, LinkedIn require consent
                    </div>

                    {hasConsented ? (
                      <div className="flex items-center gap-2 text-[var(--mm-cyan)] font-semibold">
                        <span>&#x2713;</span> You have consented. Waiting for other party...
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowConsentModal(true)}
                        disabled={granting}
                        className="mm-btn-primary w-full"
                      >
                        {granting ? 'Granting Consent...' : 'Grant Consent (Stage 2)'}
                      </button>
                    )}
                  </div>
                )}

                {/* STAGE 2: Mutual Consent Achieved - Full Profile Access */}
                {mutualConsent && (
                  <>
                    {console.log('[STAGE2] Rendering Stage 2 content', { initiatorProfile: !!initiatorProfile, recipientProfile: !!recipientProfile })}
                    {/* Consent Badge */}
                    <div className="text-center mt-10 mb-8">
                      <div className="consent-badge">
                        <span>&#x2713;</span> Full Profile Access Enabled
                      </div>
                      <p className="text-[var(--mm-text-muted)] text-sm mt-4">
                        Debug: Profiles loaded - Initiator: {initiatorProfile ? 'Yes' : 'No'}, Recipient: {recipientProfile ? 'Yes' : 'No'}
                      </p>
                    </div>

                    {/* Contact Cards */}
                    <div className="mb-10">
                      <h2 className="mm-section-header">
                        <span className="icon">&#x1F464;</span>
                        Contact Information
                      </h2>
                      <p className="text-[var(--mm-text-muted)] text-sm mb-4">Now that consent is granted, you can connect directly.</p>

                      <div className="contact-cards">
                        {/* Person A Contact Card */}
                        <div className="contact-card left">
                          <h3>PERSON A</h3>
                          <div className="role">{getProfileRole(initiatorProfile)}</div>
                          <div className="contact-info">
                            {initiatorProfile?.communication_aspects?.email && (
                              <div className="contact-info-item">
                                <span className="icon">&#x2709;</span>
                                <a href={`mailto:${initiatorProfile.communication_aspects.email}`}>
                                  {initiatorProfile.communication_aspects.email}
                                </a>
                              </div>
                            )}
                            {initiatorProfile?.communication_aspects?.phone && (
                              <div className="contact-info-item">
                                <span className="icon">&#x260E;</span>
                                <span>{initiatorProfile.communication_aspects.phone}</span>
                              </div>
                            )}
                            {initiatorProfile?.communication_aspects?.linkedin && (
                              <div className="contact-info-item">
                                <span className="icon">&#x1F517;</span>
                                <a href={initiatorProfile.communication_aspects.linkedin} target="_blank" rel="noopener noreferrer">
                                  LinkedIn
                                </a>
                              </div>
                            )}
                            {initiatorProfile?.communication_aspects?.twitter && (
                              <div className="contact-info-item">
                                <span className="icon">&#x1F426;</span>
                                <a href={`https://twitter.com/${initiatorProfile.communication_aspects.twitter}`} target="_blank" rel="noopener noreferrer">
                                  @{initiatorProfile.communication_aspects.twitter}
                                </a>
                              </div>
                            )}
                            {initiatorProfile?.communication_aspects?.website && (
                              <div className="contact-info-item">
                                <span className="icon">&#x1F310;</span>
                                <a href={initiatorProfile.communication_aspects.website} target="_blank" rel="noopener noreferrer">
                                  {initiatorProfile.communication_aspects.website}
                                </a>
                              </div>
                            )}
                            {initiatorProfile?.communication_aspects?.timezone && (
                              <div className="contact-info-item">
                                <span className="icon">&#x1F551;</span>
                                <span>{initiatorProfile.communication_aspects.timezone}</span>
                              </div>
                            )}
                            {initiatorProfile?.collaboration_aspects?.availability && (
                              <div className="contact-info-item">
                                <span className="icon">&#x1F4C5;</span>
                                <span>{initiatorProfile.collaboration_aspects.availability}</span>
                              </div>
                            )}
                          </div>
                          {initiatorProfile?.communication_aspects?.email && (
                            <div className="contact-actions">
                              <a
                                href={`mailto:${initiatorProfile.communication_aspects.email}`}
                                className="btn-small primary"
                              >
                                &#x2709; Email
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Person B Contact Card */}
                        <div className="contact-card right">
                          <h3>PERSON B</h3>
                          <div className="role">{getProfileRole(recipientProfile)}</div>
                          <div className="contact-info">
                            {recipientProfile?.communication_aspects?.email && (
                              <div className="contact-info-item">
                                <span className="icon">&#x2709;</span>
                                <a href={`mailto:${recipientProfile.communication_aspects.email}`}>
                                  {recipientProfile.communication_aspects.email}
                                </a>
                              </div>
                            )}
                            {recipientProfile?.communication_aspects?.phone && (
                              <div className="contact-info-item">
                                <span className="icon">&#x260E;</span>
                                <span>{recipientProfile.communication_aspects.phone}</span>
                              </div>
                            )}
                            {recipientProfile?.communication_aspects?.linkedin && (
                              <div className="contact-info-item">
                                <span className="icon">&#x1F517;</span>
                                <a href={recipientProfile.communication_aspects.linkedin} target="_blank" rel="noopener noreferrer">
                                  LinkedIn
                                </a>
                              </div>
                            )}
                            {recipientProfile?.communication_aspects?.twitter && (
                              <div className="contact-info-item">
                                <span className="icon">&#x1F426;</span>
                                <a href={`https://twitter.com/${recipientProfile.communication_aspects.twitter}`} target="_blank" rel="noopener noreferrer">
                                  @{recipientProfile.communication_aspects.twitter}
                                </a>
                              </div>
                            )}
                            {recipientProfile?.communication_aspects?.website && (
                              <div className="contact-info-item">
                                <span className="icon">&#x1F310;</span>
                                <a href={recipientProfile.communication_aspects.website} target="_blank" rel="noopener noreferrer">
                                  {recipientProfile.communication_aspects.website}
                                </a>
                              </div>
                            )}
                            {recipientProfile?.communication_aspects?.timezone && (
                              <div className="contact-info-item">
                                <span className="icon">&#x1F551;</span>
                                <span>{recipientProfile.communication_aspects.timezone}</span>
                              </div>
                            )}
                            {recipientProfile?.collaboration_aspects?.availability && (
                              <div className="contact-info-item">
                                <span className="icon">&#x1F4C5;</span>
                                <span>{recipientProfile.collaboration_aspects.availability}</span>
                              </div>
                            )}
                          </div>
                          {recipientProfile?.communication_aspects?.email && (
                            <div className="contact-actions">
                              <a
                                href={`mailto:${recipientProfile.communication_aspects.email}`}
                                className="btn-small primary"
                              >
                                &#x2709; Email
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Deep Dive: Evidence-Based Aspects */}
                    <div className="mb-10">
                      <h2 className="mm-section-header">
                        <span className="icon">&#x1F50D;</span>
                        Deep Dive: Evidence-Based Profiles
                      </h2>
                      <p className="text-[var(--mm-text-muted)] text-sm mb-4">Not personality tests — concrete evidence from work history and shipped projects.</p>

                      <div className="two-sided-section">
                        {/* Person A Profile */}
                        <div className="side-left">
                          <div className="side-label">Person A&apos;s Profile</div>

                          {/* Working Style Dimensions */}
                          {initiatorProfile?.role_aspects?.core_dimensions && typeof initiatorProfile.role_aspects.core_dimensions === 'object' && (
                            <>
                              {Object.entries(initiatorProfile.role_aspects.core_dimensions).map(([key, dim]: [string, any]) => (
                                <div key={key} className="aspect-detailed">
                                  <div className="aspect-detailed-header">
                                    <h4>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                                    <div className="aspect-score-badge">{dim?.score || 0}/100</div>
                                  </div>
                                  {dim?.evidence && (
                                    <div className="aspect-description">{dim.evidence}</div>
                                  )}
                                </div>
                              ))}
                            </>
                          )}

                          {/* Proof Points as Evidence */}
                          {Array.isArray(initiatorProfile?.proof_points) && initiatorProfile.proof_points.slice(0, 2).map((pp: any, i: number) => (
                            <div key={i} className="evidence-box">
                              <div className="label">Proof Point</div>
                              <div className="quote">&ldquo;{pp?.description || pp?.detail || pp?.name || 'No description'}&rdquo;</div>
                              {pp?.url && <div className="source">— {pp.url}</div>}
                            </div>
                          ))}

                          {/* Watch Points */}
                          {Array.isArray(initiatorProfile?.collaboration_aspects?.struggle_with) && initiatorProfile.collaboration_aspects.struggle_with.length > 0 && (
                            <div className="aspect-detailed">
                              <div className="aspect-detailed-header">
                                <h4>Watch Points</h4>
                                <div className="aspect-score-badge warning">&#x26A0; Risk</div>
                              </div>
                              <div className="aspect-description">
                                {initiatorProfile.collaboration_aspects.struggle_with.join(', ')}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Person B Profile */}
                        <div className="side-right">
                          <div className="side-label">Person B&apos;s Profile</div>

                          {/* Working Style Dimensions */}
                          {recipientProfile?.role_aspects?.core_dimensions && typeof recipientProfile.role_aspects.core_dimensions === 'object' && (
                            <>
                              {Object.entries(recipientProfile.role_aspects.core_dimensions).map(([key, dim]: [string, any]) => (
                                <div key={key} className="aspect-detailed">
                                  <div className="aspect-detailed-header">
                                    <h4>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                                    <div className="aspect-score-badge">{dim?.score || 0}/100</div>
                                  </div>
                                  {dim?.evidence && (
                                    <div className="aspect-description">{dim.evidence}</div>
                                  )}
                                </div>
                              ))}
                            </>
                          )}

                          {/* Proof Points as Evidence */}
                          {Array.isArray(recipientProfile?.proof_points) && recipientProfile.proof_points.slice(0, 2).map((pp: any, i: number) => (
                            <div key={i} className="evidence-box">
                              <div className="label">Proof Point</div>
                              <div className="quote">&ldquo;{pp?.description || pp?.detail || pp?.name || 'No description'}&rdquo;</div>
                              {pp?.url && <div className="source">— {pp.url}</div>}
                            </div>
                          ))}

                          {/* Watch Points */}
                          {Array.isArray(recipientProfile?.collaboration_aspects?.struggle_with) && recipientProfile.collaboration_aspects.struggle_with.length > 0 && (
                            <div className="aspect-detailed">
                              <div className="aspect-detailed-header">
                                <h4>Watch Points</h4>
                                <div className="aspect-score-badge warning">&#x26A0; Risk</div>
                              </div>
                              <div className="aspect-description">
                                {recipientProfile.collaboration_aspects.struggle_with.join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Repeat Conversation Starters for Stage 2 */}
                    {getConversationStarters().length > 0 && (
                      <div className="powerful-question">
                        <div className="label">&#x26A1; Your First Conversation Question</div>
                        <div className="space-y-4">
                          {getConversationStarters().slice(0, 1).map((starter, i) => (
                            <div key={i} className="question-text">
                              &ldquo;{starter}&rdquo;
                            </div>
                          ))}
                        </div>
                        <div className="explanation mt-4">
                          <strong style={{ color: 'var(--mm-cyan)' }}>Now that you can contact each other:</strong><br />
                          &bull; Schedule a 30-minute call to discuss your answers<br />
                          &bull; Share specific examples from your work<br />
                          &bull; See if the answers reveal a concrete project you could collaborate on<br />
                          &bull; If yes → move to a working session. If no → still a valuable connection.
                        </div>
                      </div>
                    )}

                    {/* PRIORITIZATION SECTION */}
                    <div className="mt-12">
                      <h2 className="mm-section-header">
                        <span className="icon">&#x1F3AF;</span>
                        Prioritize Your Collaboration
                      </h2>
                      <p className="text-[var(--mm-text-muted)] text-sm mb-6">
                        Choose how you want to reveal your priorities:
                      </p>

                      {/* Tab Switcher */}
                      <div className="prioritization-tabs">
                        <button
                          className={`priority-tab ${priorityMethod === 'quick-pick' ? 'active' : ''}`}
                          onClick={() => setPriorityMethod('quick-pick')}
                        >
                          &#x2713; Quick Pick (4 clicks)
                        </button>
                        <button
                          className={`priority-tab ${priorityMethod === 'point-allocation' ? 'active' : ''}`}
                          onClick={() => setPriorityMethod('point-allocation')}
                        >
                          &#x1F3AE; Point Allocation (RPG)
                        </button>
                      </div>

                      {/* Quick Pick Method */}
                      {priorityMethod === 'quick-pick' && (
                        <div className="priority-method active" style={{
                          background: 'rgba(78, 205, 196, 0.05)',
                          border: '1px solid rgba(78, 205, 196, 0.2)',
                          borderRadius: '8px',
                          padding: '30px',
                          marginTop: '20px'
                        }}>
                          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                            <div style={{ fontSize: '15px', color: 'var(--mm-cyan)', fontWeight: 600, marginBottom: '8px' }}>
                              TAP ONE ANSWER PER QUESTION
                            </div>
                            <div style={{ fontSize: '13px', color: '#888' }}>
                              Question {currentQuestion + 1} of {quickPickQuestions.length}
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${(currentQuestion / quickPickQuestions.length) * 100}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #4ecdc4 0%, #ff6b6b 100%)',
                                transition: 'width 0.3s'
                              }}></div>
                            </div>
                          </div>

                          {/* Questions */}
                          {quickPickQuestions.map((q, qIndex) => (
                            <div
                              key={qIndex}
                              style={{ display: currentQuestion === qIndex ? 'block' : 'none' }}
                            >
                              <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '20px' }}>
                                {q.question}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {q.options.map((option, oIndex) => (
                                  <button
                                    key={oIndex}
                                    onClick={() => handleQuickPickAnswer(qIndex, option)}
                                    className="quick-option"
                                    style={{
                                      background: quickPickAnswers[qIndex] === option ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                                      border: quickPickAnswers[qIndex] === option ? '2px solid var(--mm-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                                      borderRadius: '8px',
                                      padding: '16px 20px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      textAlign: 'left',
                                      fontSize: '15px',
                                      color: '#fff',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <span>{option}</span>
                                    {quickPickAnswers[qIndex] === option && (
                                      <span style={{ color: 'var(--mm-cyan)', fontSize: '20px' }}>✓</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}

                          {/* Navigation */}
                          {currentQuestion > 0 && (
                            <button
                              onClick={() => setCurrentQuestion(prev => prev - 1)}
                              className="mm-btn-primary mt-6"
                              style={{ opacity: 0.7 }}
                            >
                              ← Previous Question
                            </button>
                          )}

                          {/* Submit Button */}
                          {Object.keys(quickPickAnswers).length === quickPickQuestions.length && (
                            <button
                              onClick={() => {/* TODO: Save answers */}}
                              className="mm-btn-primary w-full mt-6"
                            >
                              Save My Priorities
                            </button>
                          )}
                        </div>
                      )}

                      {/* Point Allocation Method */}
                      {priorityMethod === 'point-allocation' && (
                        <div className="priority-method active" style={{
                          background: 'rgba(78, 205, 196, 0.05)',
                          border: '1px solid rgba(78, 205, 196, 0.2)',
                          borderRadius: '8px',
                          padding: '30px',
                          marginTop: '20px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <div style={{ fontSize: '14px', color: 'var(--mm-cyan)', fontWeight: 600 }}>
                              YOUR ALLOCATION
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'Space Mono, monospace' }}>
                              <span style={{ color: pointsRemaining === 0 ? 'var(--mm-cyan)' : '#ff6b6b' }}>
                                {pointsRemaining}
                              </span>
                              <span style={{ color: '#888', fontSize: '14px', marginLeft: '6px' }}>
                                POINTS LEFT
                              </span>
                            </div>
                          </div>

                          <p style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
                            Allocate 10 points across options. Higher points = stronger preference.
                          </p>

                          {/* Point Allocation Questions */}
                          {quickPickQuestions.map((q, qIndex) => (
                            <div key={qIndex} style={{ marginBottom: '30px' }}>
                              <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '15px' }}>
                                {q.question}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {q.options.map((option, oIndex) => {
                                  const optionId = `q${qIndex}-o${oIndex}`;
                                  const points = pointAllocation[optionId] || 0;
                                  return (
                                    <div key={oIndex} style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      background: 'rgba(255, 255, 255, 0.02)',
                                      border: '1px solid rgba(255, 255, 255, 0.08)',
                                      borderRadius: '6px',
                                      padding: '12px 16px'
                                    }}>
                                      <span style={{ fontSize: '14px', color: '#fff', flex: 1 }}>
                                        {option}
                                      </span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <button
                                          onClick={() => adjustPoints(optionId, -1)}
                                          disabled={points === 0}
                                          style={{
                                            background: points === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(78, 205, 196, 0.1)',
                                            border: '1px solid rgba(78, 205, 196, 0.3)',
                                            borderRadius: '4px',
                                            width: '32px',
                                            height: '32px',
                                            cursor: points === 0 ? 'not-allowed' : 'pointer',
                                            color: points === 0 ? '#444' : 'var(--mm-cyan)',
                                            fontSize: '16px'
                                          }}
                                        >
                                          ◀
                                        </button>
                                        <span style={{
                                          fontFamily: 'Space Mono, monospace',
                                          fontSize: '18px',
                                          fontWeight: 700,
                                          color: 'var(--mm-cyan)',
                                          minWidth: '24px',
                                          textAlign: 'center'
                                        }}>
                                          {points}
                                        </span>
                                        <button
                                          onClick={() => adjustPoints(optionId, 1)}
                                          disabled={pointsRemaining === 0}
                                          style={{
                                            background: pointsRemaining === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(78, 205, 196, 0.1)',
                                            border: '1px solid rgba(78, 205, 196, 0.3)',
                                            borderRadius: '4px',
                                            width: '32px',
                                            height: '32px',
                                            cursor: pointsRemaining === 0 ? 'not-allowed' : 'pointer',
                                            color: pointsRemaining === 0 ? '#444' : 'var(--mm-cyan)',
                                            fontSize: '16px'
                                          }}
                                        >
                                          ▶
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}

                          {/* Submit Button */}
                          <button
                            onClick={() => {/* TODO: Save points */}}
                            disabled={pointsRemaining !== 0}
                            className="mm-btn-primary w-full mt-6"
                            style={{
                              opacity: pointsRemaining !== 0 ? 0.5 : 1,
                              cursor: pointsRemaining !== 0 ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {pointsRemaining !== 0 ? `Allocate ${pointsRemaining} more points` : 'Save My Priorities'}
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Analysis Failed */}
            {analysis?.analysis_status === 'failed' && (
              <div className="bg-[var(--forge-dark)] border-l-4 border-red-500 p-6 rounded-lg">
                <div className="text-red-400 font-bold uppercase text-sm mb-2">Analysis Failed</div>
                <p className="text-white mb-4">{analysis.error_message || 'Failed to analyze collaboration potential.'}</p>
                <button onClick={retryAnalysis} className="mm-btn-primary">
                  Retry Analysis
                </button>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex gap-4 mt-12">
              <button
                onClick={() => router.push('/')}
                className="flex-1 py-4 bg-[var(--forge-dark)] border border-[var(--grid-line)] text-white font-semibold rounded-lg hover:border-[var(--mm-cyan)] transition-colors"
              >
                Home
              </button>
              {myProfileId && (
                <button
                  onClick={() => router.push(`/profile/${myProfileId}`)}
                  className="flex-1 mm-btn-primary"
                >
                  My Profile
                </button>
              )}
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
