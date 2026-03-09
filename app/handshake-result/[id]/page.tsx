'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, Unlock, CheckCircle, Home, Wifi, WifiOff } from 'lucide-react';
import type { Handshake, Analysis } from '@/types';
import { Button } from '@/components/ui/button';
import CompatibilityRing from '@/components/CompatibilityRing';
import AspectCard from '@/components/AspectCard';
import TrustBadge from '@/components/TrustBadge';
import RadarChart from '@/components/RadarChart';

interface ProfileData {
  id: string;
  created_at?: string;
  display_name?: string | null;
  role?: string | null;
  mission?: string | null;
  hook?: string;
  proof_points?: any[];
  working_style?: any;
  role_aspects?: any;
  collaboration_aspects?: any;
  communication_aspects?: any;
  shipping_aspects?: any;
  decision_aspects?: any;
  energy_aspects?: any;
}

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'polling';

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
  const [consenting, setConsenting] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHandshake = useCallback(async () => {
    try {
      const profileId = myProfileId || localStorage.getItem('mm_profile_id') || localStorage.getItem('mission_match_profile_id');
      const response = await fetch(`/api/get-handshake?id=${handshakeId}&requesterId=${profileId || ''}&t=${Date.now()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch handshake');
      }
      const data = await response.json();
      setHandshake(data.handshake);
      setAnalysis(data.analysis);

      // Use embedded profiles from get-handshake (visibility-scoped)
      if (data.initiatorProfile) setInitiatorProfile(data.initiatorProfile);
      if (data.recipientProfile) setRecipientProfile(data.recipientProfile);

      // Fallback: fetch profiles separately if not embedded (backward compat)
      if (data.handshake && !data.initiatorProfile) {
        await fetchProfiles(data.handshake.initiator_id, data.handshake.recipient_id);
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }, [handshakeId, myProfileId]);

  const fetchProfiles = async (initiatorId: string, recipientId: string) => {
    try {
      const profileId = myProfileId || localStorage.getItem('mm_profile_id') || localStorage.getItem('mission_match_profile_id');
      const [initRes, recRes] = await Promise.all([
        fetch(`/api/get-profile?id=${initiatorId}&handshakeId=${handshakeId}&requesterId=${profileId || ''}`),
        fetch(`/api/get-profile?id=${recipientId}&handshakeId=${handshakeId}&requesterId=${profileId || ''}`),
      ]);

      if (initRes.ok) {
        const initData = await initRes.json();
        setInitiatorProfile(initData.profile || initData);
      }

      if (recRes.ok) {
        const recData = await recRes.json();
        setRecipientProfile(recData.profile || recData);
      }
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
    }
  };

  // Start fallback polling (10s interval)
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    setConnectionState('polling');
    pollIntervalRef.current = setInterval(() => fetchHandshake(), 10000);
  }, [fetchHandshake]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // SSE connection
  useEffect(() => {
    const profileId = localStorage.getItem('mm_profile_id') || localStorage.getItem('mission_match_profile_id');
    setMyProfileId(profileId);

    // Initial fetch
    fetchHandshake();

    // Set up SSE
    const connectSSE = () => {
      setConnectionState('connecting');
      const url = `/api/handshake-events?handshakeId=${handshakeId}&requesterId=${profileId || ''}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener('connected', () => {
        setConnectionState('connected');
        stopPolling();
      });

      es.addEventListener('analysis_complete', () => {
        fetchHandshake();
      });

      es.addEventListener('consent_update', () => {
        fetchHandshake();
      });

      es.addEventListener('handshake_update', () => {
        fetchHandshake();
      });

      es.onerror = () => {
        setConnectionState('reconnecting');
        es.close();
        eventSourceRef.current = null;

        // Fall back to polling after SSE failure
        startPolling();

        // Try to reconnect SSE after 30 seconds
        setTimeout(() => {
          if (!eventSourceRef.current) {
            connectSSE();
          }
        }, 30000);
      };
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      stopPolling();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConsent = async () => {
    if (!myProfileId) return;

    setConsenting(true);
    try {
      const response = await fetch('/api/grant-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handshakeId, profileId: myProfileId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to grant consent');

      console.log('✅ Consent granted, refreshing...');

      // Re-fetch instead of hard reload — SSE will also push the update
      await fetchHandshake();
      setConsenting(false);
    } catch (err) {
      console.error('Consent error:', err);
      setError(err instanceof Error ? err.message : 'Failed to grant consent');
      setConsenting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading handshake...</p>
        </div>
      </div>
    );
  }

  if (error || !handshake) {
    return (
      <div className="min-h-screen px-6 py-16 max-w-md mx-auto">
        <div className="card-surface p-6">
          <div className="text-destructive font-bold uppercase text-sm mb-2">Error</div>
          <p className="text-foreground mb-4">{error || 'Handshake not found'}</p>
          <Button onClick={() => router.push('/profile')} className="w-full">
            Go to My Profile
          </Button>
        </div>
      </div>
    );
  }

  // If no profile ID in localStorage, prompt user to identify themselves
  if (!myProfileId && handshake) {
    const initiatorName = initiatorProfile?.display_name || initiatorProfile?.role?.split(',')[0] || 'Initiator';
    const recipientName = recipientProfile?.display_name || recipientProfile?.role?.split(',')[0] || 'Recipient';

    return (
      <div className="min-h-screen px-6 py-16 max-w-md mx-auto">
        <div className="card-surface p-6">
          <div className="text-yellow-500 font-bold uppercase text-sm mb-2">Identity Required</div>
          <p className="text-foreground mb-4">
            You&apos;re viewing this handshake but we can&apos;t tell who you are. Please identify yourself:
          </p>
          <div className="space-y-2">
            {initiatorProfile && (
              <Button
                onClick={() => {
                  localStorage.setItem('mm_profile_id', handshake.initiator_id);
                  localStorage.setItem('mission_match_profile_id', handshake.initiator_id);
                  window.location.reload();
                }}
                className="w-full"
                variant="outline"
              >
                I&apos;m {initiatorName}
              </Button>
            )}
            {recipientProfile && (
              <Button
                onClick={() => {
                  localStorage.setItem('mm_profile_id', handshake.recipient_id);
                  localStorage.setItem('mission_match_profile_id', handshake.recipient_id);
                  window.location.reload();
                }}
                className="w-full"
                variant="outline"
              >
                I&apos;m {recipientName}
              </Button>
            )}
            <Button
              onClick={() => router.push('/create-profile')}
              className="w-full"
            >
              Create New Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Analysis is optional - page can render without it (shows loading state)

  const isInitiator = handshake.initiator_id === myProfileId;
  const hasConsented = isInitiator ? handshake.initiator_consented : handshake.recipient_consented;
  // Check consent flags directly since RLS blocks status updates
  const mutualConsent = handshake.initiator_consented && handshake.recipient_consented;
  const stage = mutualConsent ? 2 : 1;

  const myProfile = isInitiator ? initiatorProfile : recipientProfile;
  const otherProfile = isInitiator ? recipientProfile : initiatorProfile;

  const getDisplayName = (profile: ProfileData | null) => {
    if (!profile) return 'Anonymous';
    return profile.display_name || profile.communication_aspects?.name || profile.role?.split('.')[0] || 'User';
  };

  const getWorkingStyle = (profile: ProfileData | null) => {
    if (!profile) return null;
    return profile.working_style || profile.role_aspects || null;
  };

  const getHookAlignment = () => {
    if (analysis?.hook_alignment) return analysis.hook_alignment;
    if (analysis?.overlap && !Array.isArray(analysis.overlap) && 'hook_alignment' in analysis.overlap) {
      return (analysis.overlap as any).hook_alignment || null;
    }
    return null;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  const compatibilityScore = 85; // TODO: Get from analysis or calculate

  // Extract aspects for Stage 2
  const getAspects = (profile: ProfileData | null) => {
    if (!profile) return [];

    const aspects = [];
    if (profile.communication_aspects) {
      aspects.push({ title: 'Communication', data: profile.communication_aspects });
    }
    if (profile.role_aspects || profile.working_style) {
      aspects.push({ title: 'Working Style', data: profile.role_aspects || profile.working_style });
    }
    if (profile.collaboration_aspects) {
      aspects.push({ title: 'Collaboration', data: profile.collaboration_aspects });
    }
    if (profile.shipping_aspects) {
      aspects.push({ title: 'Shipping', data: profile.shipping_aspects });
    }
    return aspects;
  };

  const myName = getDisplayName(myProfile);
  const otherName = getDisplayName(otherProfile);
  const otherAspects = getAspects(otherProfile);
  const myWorkingStyle = getWorkingStyle(myProfile);
  const otherWorkingStyle = getWorkingStyle(otherProfile);
  const hookAlignment = getHookAlignment();

  // Prepare radar chart data if available - map from actual profile structure
  const hasRadarData = myProfile?.communication_aspects && otherProfile?.communication_aspects;
  const radarData = hasRadarData ? {
    personA: {
      'Sync/Async': myProfile?.communication_aspects?.sync_vs_async?.score || 50,
      'Ship/Polish': myProfile?.shipping_aspects?.polish_tolerance?.score || 50,
      'Solo/Team': myProfile?.role_aspects?.individual_vs_multiplier?.score || 50,
      'Build/Strategy': myProfile?.role_aspects?.creative_vs_executor?.score || 50,
    },
    personB: {
      'Sync/Async': otherProfile?.communication_aspects?.sync_vs_async?.score || 50,
      'Ship/Polish': otherProfile?.shipping_aspects?.polish_tolerance?.score || 50,
      'Solo/Team': otherProfile?.role_aspects?.individual_vs_multiplier?.score || 50,
      'Build/Strategy': otherProfile?.role_aspects?.creative_vs_executor?.score || 50,
    }
  } : null;

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="flex items-center gap-3 p-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <span className="text-sm font-medium text-muted-foreground">Handshake Result</span>
        {/* Connection state indicator */}
        <span className="flex items-center gap-1" title={`Connection: ${connectionState}`}>
          {connectionState === 'connected' ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : connectionState === 'polling' ? (
            <WifiOff className="w-3 h-3 text-yellow-500" />
          ) : (
            <Wifi className="w-3 h-3 text-muted-foreground animate-pulse" />
          )}
        </span>
        <span
          className={`ml-auto text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full ${
            stage === 2 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
          }`}
        >
          Stage {stage}
        </span>
        <button
          onClick={() => router.push('/profile')}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="My Profile"
        >
          <Home className="w-4 h-4 text-muted-foreground" />
        </button>
      </header>

      <div className="px-6 max-w-sm mx-auto space-y-6">
        {/* Participants */}
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <span className="text-sm font-bold text-foreground">
                {getInitials(myName)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 truncate max-w-[80px]">
              {myName.split(' ')[0]}
            </p>
          </div>

          <CompatibilityRing score={compatibilityScore} size={100} />

          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <span className="text-sm font-bold text-foreground">
                {getInitials(otherName)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 truncate max-w-[80px]">
              {otherName.split(' ')[0]}
            </p>
          </div>
        </div>

        {/* Stage 1 Analysis */}
        {analysis?.analysis_status === 'pending' ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Analyzing compatibility...</p>
          </div>
        ) : (
          <motion.div className="space-y-4" layout>
            {/* Hook Alignment */}
            {hookAlignment && (
              <div className="card-surface p-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                  Mission Alignment
                </h3>
                <p className="text-sm text-foreground leading-relaxed">
                  {hookAlignment}
                </p>
              </div>
            )}

            {/* Conversation Starters */}
            {analysis?.conversation_starters && analysis.conversation_starters.length > 0 && (
              <div className="card-surface p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                  Conversation Starters
                </h3>
                <ul className="space-y-2">
                  {analysis.conversation_starters.map((starter, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-2 text-sm text-foreground"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <span>{starter}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* Radar Chart (Unique Gem) */}
            {radarData && stage === 2 && (
              <div className="card-surface p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                  Working Style Comparison
                </h3>
                <div className="flex justify-center">
                  <RadarChart
                    personA={radarData.personA}
                    personB={radarData.personB}
                    size={250}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Consent / Stage 2 */}
        <AnimatePresence mode="wait">
          {stage === 1 && !hasConsented && (
            <motion.div
              key="consent"
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Lock className="w-3.5 h-3.5" />
                <span>Full profiles are locked until both parties consent</span>
              </div>
              <Button
                onClick={handleConsent}
                disabled={consenting}
                className="w-full h-12 text-base font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Unlock className="w-4 h-4" />
                {consenting ? 'Granting...' : 'Grant Consent'}
              </Button>
            </motion.div>
          )}

          {hasConsented && !mutualConsent && (
            <motion.div
              key="waiting"
              className="text-center py-8 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Waiting for mutual consent...</p>
              <p className="text-xs text-primary font-mono animate-pulse">
                You&apos;ve consented. Waiting for {otherName.split(' ')[0]}...
              </p>
            </motion.div>
          )}

          {stage === 2 && (
            <motion.div
              key="stage2"
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 justify-center py-2">
                <Unlock className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Full Profiles Unlocked
                </span>
              </div>

              <h3 className="text-lg font-bold text-foreground">{otherName}</h3>

              {otherAspects.map((aspect, idx) => (
                <AspectCard
                  key={idx}
                  title={aspect.title}
                  aspects={aspect.data}
                />
              ))}

              {/* Contact Info — show real data from profile if available */}
              {otherProfile?.communication_aspects?.contact && (
                <div className="card-surface p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                    Contact Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    {otherProfile.communication_aspects.contact.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-16">Email:</span>
                        <a href={`mailto:${otherProfile.communication_aspects.contact.email}`} className="text-primary hover:underline">
                          {otherProfile.communication_aspects.contact.email}
                        </a>
                      </div>
                    )}
                    {otherProfile.communication_aspects.contact.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-16">Phone:</span>
                        <a href={`tel:${otherProfile.communication_aspects.contact.phone}`} className="text-foreground hover:text-primary">
                          {otherProfile.communication_aspects.contact.phone}
                        </a>
                      </div>
                    )}
                    {otherProfile.communication_aspects.contact.twitter && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-16">Twitter:</span>
                        <span className="text-primary">{otherProfile.communication_aspects.contact.twitter}</span>
                      </div>
                    )}
                    {otherProfile.communication_aspects.contact.linkedin && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-16">LinkedIn:</span>
                        <span className="text-primary">{otherProfile.communication_aspects.contact.linkedin}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Friction Warnings */}
              {analysis?.friction_warnings && analysis.friction_warnings.length > 0 && (
                <div className="card-surface p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-destructive">
                    Potential Friction Points
                  </h3>
                  <ul className="space-y-2">
                    {analysis.friction_warnings.map((warning, i) => (
                      <li key={i} className="text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-destructive mt-0.5">⚠</span>
                          <div>
                            <p className="text-foreground">{warning.description}</p>
                            {warning.mitigation && (
                              <p className="text-muted-foreground text-xs mt-1">
                                💡 {warning.mitigation}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trust Badge */}
              <TrustBadge
                model="claude-sonnet-4-5-20250929"
                extractedAt={otherProfile?.created_at || new Date().toISOString()}
                humanReviewed={false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
