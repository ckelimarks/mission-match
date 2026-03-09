'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { Copy, Download, Users, ArrowRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConnectionCard from '@/components/ConnectionCard';
import { toast } from 'sonner';

interface Profile {
  id: string;
  display_name: string | null;
  role: string | null;
  mission: string | null;
}

interface Connection {
  handshakeId: string;
  otherParty: {
    id: string;
    displayName: string;
    role: string;
    mission?: string;
  } | null;
  status: 'pending' | 'approved';
  isInitiator: boolean;
  myConsent: boolean;
  theirConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MyProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    console.log('[INIT] Profile page useEffect started');
    // Set base URL for QR code (works in dev and prod)
    setBaseUrl(window.location.origin);

    const profileId = localStorage.getItem('mm_profile_id') || localStorage.getItem('mission_match_profile_id');
    console.log('[INIT] Got profileId from localStorage:', profileId ? profileId.slice(0, 8) + '...' : 'NONE');

    if (!profileId) {
      console.log('[INIT] No profileId, redirecting to /');
      router.push('/');
      return;
    }

    setMyProfileId(profileId);
    console.log('[INIT] Starting initial fetch...');
    fetchProfile(profileId);
    fetchConnections(profileId);

    const refreshConnections = () => {
      if (profileId) {
        fetchConnections(profileId);
      }
    };

    // Safari is inconsistent about firing visibilitychange when navigating back.
    const handleVisibilityChange = () => {
      if (!document.hidden) refreshConnections();
    };
    const handlePageShow = () => refreshConnections();
    const handleFocus = () => refreshConnections();
    const interval = window.setInterval(refreshConnections, 5000);
    console.log('[INIT] Polling interval set (every 5s)');

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleFocus);

    return () => {
      console.log('[CLEANUP] Clearing polling interval');
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchProfile = async (profileId: string) => {
    console.log('[PROFILE] Fetching profile:', profileId);
    try {
      // Pass requesterId to get full profile (own profile)
      const response = await fetch(`/api/get-profile?id=${profileId}&requesterId=${profileId}`);
      console.log('[PROFILE] Response status:', response.status);
      if (response.status === 404) {
        // Profile no longer exists in DB - clear stale localStorage and redirect
        console.log('[PROFILE] Profile not found in DB, clearing localStorage');
        localStorage.removeItem('mm_profile_id');
        localStorage.removeItem('mission_match_profile_id');
        toast.error('Profile not found. Please create a new one.');
        router.push('/');
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      console.log('[PROFILE] Got profile data:', data?.display_name || 'no name');
      setProfile(data);
      setLoading(false);
    } catch (err) {
      console.error('[PROFILE] Error fetching profile:', err);
      setLoading(false);
    }
  };

  const fetchConnections = async (profileId: string) => {
    console.log('[POLL] Fetching connections for:', profileId.slice(0, 8) + '...');
    try {
      const response = await fetch(`/api/get-pending-connections?profileId=${profileId}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      console.log('[POLL] Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch connections: ${response.status}`);
      }
      const data = await response.json();
      console.log('[POLL] Got', data.connections?.length || 0, 'connections');
      if (data.debug) {
        console.log('[POLL] Debug info:', JSON.stringify(data.debug));
      }
      setConnections(data.connections || []);
    } catch (err) {
      console.error('[POLL] Error fetching connections:', err);
    }
  };

  const handleCopy = () => {
    if (!myProfileId) return;
    const url = `${window.location.origin}/connect/${myProfileId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  const handleDownloadQR = () => {
    const svg = document.querySelector('.qr-container svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 200;
    canvas.height = 200;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `mission-match-qr-${myProfileId?.slice(0, 8)}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
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

  if (!profile || !myProfileId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-4">No Profile Found</h2>
          <Button onClick={() => router.push('/')} className="mb-3">Go Home</Button>
          <button
            onClick={() => {
              localStorage.removeItem('mm_profile_id');
              localStorage.removeItem('mission_match_profile_id');
              toast.success('Local storage cleared');
              router.push('/');
            }}
            className="block w-full text-xs text-muted-foreground hover:text-red-500"
          >
            Clear local storage & start fresh
          </button>
        </div>
      </div>
    );
  }

  const shareUrl = baseUrl ? `${baseUrl}/connect/${myProfileId}` : '';
  const displayName = profile.display_name || 'My Profile';
  const role = profile.role || 'Builder';
  const hook = profile.mission || 'Evidence-based profile extracted from AI conversations';

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <img src="/mm2-logo.png" alt="Mission Match" className="w-8 h-8" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            Mission<span className="text-primary">Match</span>
          </span>
        </div>
        <button
          onClick={() => router.push('/connections')}
          className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          title="View connections"
        >
          <Users className="w-5 h-5 text-muted-foreground" />
          {(() => {
            const needsConsent = connections.filter(c => !c.myConsent).length;
            const total = connections.length;
            if (needsConsent > 0) {
              return (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {needsConsent}
                </span>
              );
            } else if (total > 0) {
              return (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {total}
                </span>
              );
            }
            return null;
          })()}
        </button>
      </header>

      <div className="px-6 space-y-8 max-w-sm mx-auto">
        {/* QR Code */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="qr-container bg-foreground p-4 rounded-2xl glow-primary">
            {shareUrl ? (
              <QRCode
                value={shareUrl}
                size={160}
                bgColor="hsl(216, 33%, 91%)"
                fgColor="hsl(222, 47%, 7%)"
                level="M"
              />
            ) : (
              <div className="w-40 h-40 bg-muted animate-pulse rounded" />
            )}
          </div>
          <p className="mt-3 text-xs font-mono text-muted-foreground break-all">{shareUrl}</p>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex-1 gap-1.5 border-border text-foreground hover:text-primary hover:border-primary/30"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadQR}
              className="flex-1 gap-1.5 border-border text-foreground hover:text-primary hover:border-primary/30"
            >
              <Download className="w-3.5 h-3.5" />
              Download QR
            </Button>
          </div>
          {/* Removed: Preview button routed to /connect which is for initiating handshakes, not preview */}
          {/* TODO: Add proper read-only preview route */}
        </motion.div>

        {/* Profile Info */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-foreground">
              {displayName}
            </h1>
            <p className="text-sm font-medium text-primary mt-1">{role}</p>
          </div>

          {profile.mission && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
                Mission
              </h2>
              <p className="text-sm text-foreground leading-relaxed">{hook}</p>
            </div>
          )}
        </motion.div>

        {/* Debug Panel */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            {showDebug ? '▼' : '▶'} Debug Info
          </button>
          {showDebug && (
            <div className="card-surface p-4 space-y-2 text-xs font-mono">
              <div>
                <span className="text-primary">Profile ID:</span>
                <div className="text-foreground break-all">{myProfileId}</div>
              </div>
              <div>
                <span className="text-primary">Connections Count:</span>
                <div className="text-foreground">{connections.length}</div>
              </div>
              <div>
                <span className="text-primary">Connections Data:</span>
                <pre className="text-foreground overflow-auto max-h-64 text-[10px] mt-1">
                  {JSON.stringify(connections, null, 2)}
                </pre>
              </div>
              <button
                onClick={() => myProfileId && fetchConnections(myProfileId)}
                className="w-full py-2 px-3 bg-primary text-primary-foreground rounded text-xs"
              >
                Refresh Connections
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('mm_profile_id');
                  localStorage.removeItem('mission_match_profile_id');
                  toast.success('Local storage cleared');
                  router.push('/');
                }}
                className="w-full py-2 px-3 bg-orange-600 text-white rounded text-xs mt-2"
              >
                Clear Local Storage
              </button>
              <button
                onClick={async () => {
                  if (!myProfileId) return;
                  const confirmation = window.prompt(
                    'This will permanently delete your profile and all associated data. This cannot be undone.\n\nType "delete" to confirm:'
                  );
                  if (confirmation?.toLowerCase() !== 'delete') {
                    if (confirmation !== null) {
                      toast.error('You must type "delete" to confirm');
                    }
                    return;
                  }

                  try {
                    const res = await fetch(`/api/delete-profile?profileId=${myProfileId}`, {
                      method: 'DELETE',
                    });
                    if (!res.ok) throw new Error('Failed to delete');

                    localStorage.removeItem('mm_profile_id');
                    localStorage.removeItem('mission_match_profile_id');
                    toast.success('Profile permanently deleted');
                    router.push('/');
                  } catch (err) {
                    console.error('Delete failed:', err);
                    toast.error('Failed to delete profile');
                  }
                }}
                className="w-full py-2 px-3 bg-red-700 text-white rounded text-xs mt-2 font-semibold"
              >
                Delete My Data Permanently
              </button>
            </div>
          )}
        </motion.div>

        {/* Connections */}
        {connections.length > 0 && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Recent Connections
              </h2>
              <button
                onClick={() => router.push('/connections')}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {connections.slice(0, 3)
                .filter(conn => conn.otherParty)
                .map((conn) => (
                  <ConnectionCard
                    key={conn.handshakeId}
                    handshakeId={conn.handshakeId}
                    name={conn.otherParty!.displayName || conn.otherParty!.role?.split(',')[0] || 'Unknown'}
                    role={conn.otherParty!.role || 'Builder'}
                    status={conn.status}
                    createdAt={conn.createdAt}
                  />
                ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
