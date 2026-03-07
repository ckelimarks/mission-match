'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Handshake, Analysis, OverlapItem } from '@/types';
import ConsentModal from '@/components/ConsentModal';
import CompatibilityRing from '@/components/CompatibilityRing';
import TrustBadge from '@/components/TrustBadge';

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
  const [prioritizationData, setPrioritizationData] = useState<any>(null);
  const [savingPrioritization, setSavingPrioritization] = useState(false);

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

  const getDisplayName = (profile: ProfileData | null) => {
    if (!profile) return 'Anonymous';

    // Try to get name from communication_aspects or role (hook)
    const fullName = profile.communication_aspects?.name || profile.role || '';

    // Parse to get first name + last initial
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastInitial = nameParts[nameParts.length - 1][0];
      return `${firstName} ${lastInitial}.`;
    }

    // Fallback: just return first name or hook first sentence
    return nameParts[0] || fullName.split('.')[0] || 'Anonymous';
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

  const savePrioritization = async (method: 'quick-pick' | 'point-allocation') => {
    if (!myProfileId) {
      alert('No profile ID found');
      return;
    }

    try {
      setSavingPrioritization(true);

      const answers = method === 'quick-pick' ? quickPickAnswers : pointAllocation;

      const response = await fetch('/api/save-prioritization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handshakeId,
          profileId: myProfileId,
          method,
          answers,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');

      alert('Priorities saved!');
      fetchPrioritizations();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save priorities');
    } finally {
      setSavingPrioritization(false);
    }
  };

  const fetchPrioritizations = async () => {
    try {
      const response = await fetch(`/api/get-prioritization?handshakeId=${handshakeId}`);
      if (!response.ok) return;

      const data = await response.json();
      console.log('[PRIORITIZATION] Fetched data:', data);
      console.log('[PRIORITIZATION] Both completed?', data.bothCompleted);
      setPrioritizationData(data);
    } catch (err) {
      console.error('Failed to fetch prioritizations:', err);
    }
  };

  // Fetch prioritizations when mutual consent is achieved
  useEffect(() => {
    if (mutualConsent && handshakeId) {
      console.log('[PRIORITIZATION] Triggering fetch, mutualConsent:', mutualConsent);
      fetchPrioritizations();
    }
  }, [mutualConsent, handshakeId]);

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
                  <div className="person-name">{getDisplayName(initiatorProfile)}</div>
                  <div className="person-role">{getProfileRole(initiatorProfile)}</div>
                </div>

                {/* Compatibility Ring */}
                {analysis?.compatibility_score !== undefined && (
                  <CompatibilityRing score={analysis.compatibility_score} size={100} />
                )}
                {!analysis?.compatibility_score && (
                  <div className="vs-divider">&times;</div>
                )}

                <div className="person-header right">
                  <div className="person-name">{getDisplayName(recipientProfile)}</div>
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

            {/* Analysis Status: Pending (only show if NOT mutual consent) */}
            {!mutualConsent && (!analysis || analysis.analysis_status === 'pending') && (
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

            {/* Analysis Complete OR Mutual Consent */}
            {(mutualConsent || analysis?.analysis_status === 'completed') && (
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
                      &#x2713; Aspects, mission, work style visible<br /><br />
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
                          <h3>{getDisplayName(initiatorProfile).toUpperCase()}</h3>
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
                          <h3>{getDisplayName(recipientProfile).toUpperCase()}</h3>
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

                    {/* Radar Chart Comparison */}
                    {initiatorProfile?.role_aspects?.core_dimensions && recipientProfile?.role_aspects?.core_dimensions && (
                      <div className="mb-10">
                        <h2 className="mm-section-header">
                          <span className="icon">&#x25C8;</span>
                          Collaboration Style Comparison
                        </h2>
                        <p className="text-[var(--mm-text-muted)] text-sm mb-6">
                          Visual comparison across key working dimensions. Based on actual behavior patterns, not personality tests.
                        </p>
                        <RadarChart
                          initiatorData={initiatorProfile.role_aspects.core_dimensions}
                          recipientData={recipientProfile.role_aspects.core_dimensions}
                        />
                        <p className="text-center mt-4 text-sm">
                          <span style={{ color: '#4ecdc4' }}>█</span> {getDisplayName(initiatorProfile)} &nbsp;&nbsp;&nbsp;
                          <span style={{ color: '#ff6b6b' }}>█</span> {getDisplayName(recipientProfile)}
                        </p>
                      </div>
                    )}

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

                      {/* No tab switcher - just Quick Pick */}

                      {/* Check if current user has completed prioritization */}
                      {(() => {
                        const isInit = handshake?.initiator_id === myProfileId;
                        const myPrioritization = isInit ? prioritizationData?.initiator : prioritizationData?.recipient;
                        return !myPrioritization;
                      })() && (
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
                                      <span style={{ color: 'var(--mm-cyan)', fontSize: '20px' }}>&#x2713;</span>
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
                              onClick={() => savePrioritization('quick-pick')}
                              disabled={savingPrioritization}
                              className="mm-btn-primary w-full mt-6"
                            >
                              {savingPrioritization ? 'Saving...' : 'Save My Priorities'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Already Completed Message */}
                      {(() => {
                        const isInit = handshake?.initiator_id === myProfileId;
                        const myPrioritization = isInit ? prioritizationData?.initiator : prioritizationData?.recipient;
                        return myPrioritization && !prioritizationData?.bothCompleted;
                      })() && (
                        <div style={{
                          background: 'rgba(78, 205, 196, 0.08)',
                          border: '2px solid var(--mm-cyan)',
                          borderRadius: '8px',
                          padding: '30px',
                          marginTop: '20px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '15px', color: 'var(--mm-cyan)', fontWeight: 600, marginBottom: '12px' }}>
                            &#x2713; YOU'VE COMPLETED YOUR PRIORITIES
                          </div>
                          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '16px', overflow: 'hidden' }}>
                            <div style={{
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(90deg, #4ecdc4 0%, #ff6b6b 100%)'
                            }}></div>
                          </div>
                          <p style={{ fontSize: '14px', color: '#888', marginBottom: '0' }}>
                            Waiting for other person to complete their priorities...
                          </p>
                        </div>
                      )}

                      {/* Results Display */}
                      {console.log('[RENDER] prioritizationData:', prioritizationData)}
                      {console.log('[RENDER] bothCompleted:', prioritizationData?.bothCompleted)}
                      {prioritizationData?.bothCompleted && (
                        <div style={{
                          background: 'rgba(78, 205, 196, 0.08)',
                          border: '2px solid var(--mm-cyan)',
                          borderRadius: '8px',
                          padding: '30px',
                          marginTop: '30px'
                        }}>
                          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                            <div style={{ fontSize: '15px', color: 'var(--mm-cyan)', fontWeight: 600, marginBottom: '12px' }}>
                              &#x2713; BOTH COMPLETED
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '20px', overflow: 'hidden' }}>
                              <div style={{
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(90deg, #4ecdc4 0%, #ff6b6b 100%)'
                              }}></div>
                            </div>
                          </div>

                          <h3 style={{ color: 'var(--mm-cyan)', marginBottom: '25px', textAlign: 'center', fontSize: '20px' }}>
                            &#x1F3AF; Collaboration Alignment
                          </h3>

                          {prioritizationData.initiator.method === 'quick-pick' && (
                            <>
                              <div className="two-sided-section" style={{ marginBottom: '30px' }}>
                                <div className="side-left">
                                  <div className="side-label" style={{ marginBottom: '20px', color: 'var(--mm-cyan)', fontWeight: 600 }}>
                                    Person A&apos;s Choices
                                  </div>
                                  {quickPickQuestions.map((q, i) => (
                                    <div key={i} style={{ marginBottom: '16px' }}>
                                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                                        {q.question}
                                      </div>
                                      <div style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>
                                        {prioritizationData.initiator.answers[i]}
                                        {prioritizationData.initiator.answers[i] === prioritizationData.recipient.answers[i] ? (
                                          <span style={{ color: 'var(--mm-cyan)', marginLeft: '8px' }}>&#x2713;</span>
                                        ) : (
                                          <span style={{ color: 'var(--mm-red)', marginLeft: '8px' }}>&#x26A0;</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="side-right">
                                  <div className="side-label" style={{ marginBottom: '20px', color: 'var(--mm-red)', fontWeight: 600 }}>
                                    Person B&apos;s Choices
                                  </div>
                                  {quickPickQuestions.map((q, i) => (
                                    <div key={i} style={{ marginBottom: '16px' }}>
                                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                                        {q.question}
                                      </div>
                                      <div style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>
                                        {prioritizationData.recipient.answers[i]}
                                        {prioritizationData.initiator.answers[i] === prioritizationData.recipient.answers[i] ? (
                                          <span style={{ color: 'var(--mm-cyan)', marginLeft: '8px' }}>&#x2713;</span>
                                        ) : (
                                          <span style={{ color: 'var(--mm-red)', marginLeft: '8px' }}>&#x26A0;</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                padding: '25px'
                              }}>
                                <div style={{ fontWeight: 600, color: 'var(--mm-cyan)', marginBottom: '12px', fontSize: '16px' }}>
                                  &#x1F3AF; {prioritizationData.alignment?.summary}
                                </div>
                                <div style={{ fontSize: '15px', lineHeight: 1.7, marginBottom: '15px' }}>
                                  <strong style={{ color: 'var(--mm-cyan)' }}>
                                    &#x2713; Matched on {prioritizationData.alignment?.matchedCount}/{prioritizationData.alignment?.totalQuestions}:
                                  </strong>{' '}
                                  You both agree on {prioritizationData.alignment?.matchedCount} priorities.
                                </div>
                                {prioritizationData.alignment?.divergences.length > 0 && (
                                  <div style={{ fontSize: '14px', color: 'var(--mm-red)', marginBottom: '15px' }}>
                                    <strong>&#x26A0; Divergence on {prioritizationData.alignment?.divergences.length}/{prioritizationData.alignment?.totalQuestions}:</strong>{' '}
                                    Different views on {prioritizationData.alignment?.divergences.length} priorities.
                                  </div>
                                )}
                                <div style={{
                                  fontSize: '14px',
                                  color: '#fff',
                                  background: 'rgba(78, 205, 196, 0.1)',
                                  padding: '12px',
                                  borderRadius: '6px',
                                  marginTop: '15px',
                                  borderLeft: '3px solid var(--mm-cyan)'
                                }}>
                                  <strong>→ First conversation topic:</strong> &quot;We {prioritizationData.alignment?.matchedCount > 2 ? 'mostly align' : 'have different priorities'}. Let&apos;s discuss how to make this work.&quot;
                                </div>
                              </div>
                            </>
                          )}
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

// Radar Chart Component
function RadarChart({ initiatorData, recipientData }: { initiatorData: any; recipientData: any }) {
  return (
    <div className="radar-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <svg className="radar-svg" viewBox="0 0 500 500" style={{ width: '100%', height: 'auto' }}>
        {/* Background circles */}
        <circle cx="250" cy="250" r="200" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
        <circle cx="250" cy="250" r="150" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
        <circle cx="250" cy="250" r="100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
        <circle cx="250" cy="250" r="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>

        {/* Axis lines */}
        <line x1="250" y1="250" x2="250" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
        <line x1="250" y1="250" x2="423.2" y2="150" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
        <line x1="250" y1="250" x2="423.2" y2="350" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
        <line x1="250" y1="250" x2="250" y2="450" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
        <line x1="250" y1="250" x2="76.8" y2="350" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
        <line x1="250" y1="250" x2="76.8" y2="150" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>

        {/* Recipient polygon (red/behind) */}
        <polygon
          points={calculatePolygon(recipientData)}
          fill="rgba(255,107,107,0.2)"
          stroke="#ff6b6b"
          strokeWidth="2"
        />

        {/* Initiator polygon (cyan/front) */}
        <polygon
          points={calculatePolygon(initiatorData)}
          fill="rgba(78,205,196,0.2)"
          stroke="#4ecdc4"
          strokeWidth="2"
        />

        {/* Axis labels */}
        <text x="250" y="35" textAnchor="middle" fill="#4ecdc4" fontSize="12" fontWeight="600">
          {Object.keys(initiatorData)[0]?.replace(/_/g, ' ') || 'Dimension 1'}
        </text>
        <text x="440" y="145" textAnchor="start" fill="#4ecdc4" fontSize="12" fontWeight="600">
          {Object.keys(initiatorData)[1]?.replace(/_/g, ' ') || 'Dimension 2'}
        </text>
        <text x="440" y="365" textAnchor="start" fill="#4ecdc4" fontSize="12" fontWeight="600">
          {Object.keys(initiatorData)[2]?.replace(/_/g, ' ') || 'Dimension 3'}
        </text>
        <text x="250" y="485" textAnchor="middle" fill="#4ecdc4" fontSize="12" fontWeight="600">
          {Object.keys(initiatorData)[3]?.replace(/_/g, ' ') || 'Dimension 4'}
        </text>
        <text x="60" y="365" textAnchor="end" fill="#4ecdc4" fontSize="12" fontWeight="600">
          {Object.keys(initiatorData)[4]?.replace(/_/g, ' ') || 'Dimension 5'}
        </text>
        <text x="60" y="145" textAnchor="end" fill="#4ecdc4" fontSize="12" fontWeight="600">
          {Object.keys(initiatorData)[5]?.replace(/_/g, ' ') || 'Dimension 6'}
        </text>

        <circle cx="250" cy="250" r="3" fill="#666"/>
      </svg>
    </div>
  );
}

function calculatePolygon(data: any): string {
  const center = 250;
  const maxR = 200;

  // Extract scores from core_dimensions object
  const scores = Object.values(data).map((dim: any) => dim?.score || 50);

  // Take first 6 dimensions (or pad with 50 if fewer)
  const axes = [...scores.slice(0, 6)];
  while (axes.length < 6) axes.push(50);

  const points = axes.map((val: any, i: number) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const r = (val / 100) * maxR;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  });

  return points.join(' ');
}
