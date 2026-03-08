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
    // Set base URL for QR code (works in dev and prod)
    setBaseUrl(window.location.origin);

    const profileId = localStorage.getItem('mm_profile_id') || localStorage.getItem('mission_match_profile_id');

    if (!profileId) {
      router.push('/');
      return;
    }

    setMyProfileId(profileId);
    fetchProfile(profileId);
    fetchConnections(profileId);

    // Auto-refresh connections when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && profileId) {
        fetchConnections(profileId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchProfile = async (profileId: string) => {
    try {
      const response = await fetch(`/api/get-profile?id=${profileId}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setLoading(false);
    }
  };

  const fetchConnections = async (profileId: string) => {
    try {
      const response = await fetch(`/api/get-pending-connections?profileId=${profileId}`);
      if (!response.ok) return;
      const data = await response.json();
      setConnections(data.connections || []);
    } catch (err) {
      console.error('Error fetching connections:', err);
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
          <Button onClick={() => router.push('/')}>Go Home</Button>
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
          {connections.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {connections.length}
            </span>
          )}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/connect/${myProfileId}`)}
            className="w-full gap-1.5 border-border text-foreground hover:text-primary hover:border-primary/30 mt-2"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview My Profile
          </Button>
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
                .filter(conn => conn.otherParty && conn.otherParty.displayName)
                .map((conn) => (
                  <ConnectionCard
                    key={conn.handshakeId}
                    handshakeId={conn.handshakeId}
                    name={conn.otherParty!.displayName}
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
