'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Connection = {
  handshakeId: string;
  isInitiator: boolean;
  status: string;
  myConsent: boolean;
  theirConsent: boolean;
  createdAt: string;
  updatedAt: string;
  otherParty: {
    id: string;
    displayName: string | null;
    role: string | null;
    mission: string | null;
  } | null;
};

interface PendingConnectionsProps {
  profileId: string;
}

export default function PendingConnections({ profileId }: PendingConnectionsProps) {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
    // Poll every 10 seconds for new connections
    const interval = setInterval(fetchConnections, 10000);
    return () => clearInterval(interval);
  }, [profileId]);

  const fetchConnections = async () => {
    try {
      const response = await fetch(`/api/get-pending-connections?profileId=${profileId}`);
      if (!response.ok) throw new Error('Failed to fetch connections');
      const data = await response.json();
      setConnections(data.connections || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections');
      setLoading(false);
    }
  };

  const getStatusLabel = (conn: Connection) => {
    if (conn.myConsent && conn.theirConsent) {
      return { text: 'FULL ACCESS', color: 'text-accent-cyan', bg: 'bg-accent-cyan' };
    }
    if (conn.theirConsent && !conn.myConsent) {
      return { text: 'AWAITING YOUR CONSENT', color: 'text-accent-orange', bg: 'bg-accent-orange' };
    }
    if (conn.myConsent && !conn.theirConsent) {
      return { text: 'AWAITING THEIR CONSENT', color: 'text-text-dim', bg: 'bg-grid-line' };
    }
    // Stage 1 only - no consent yet from either party
    return { text: 'STAGE 1', color: 'text-accent-cyan', bg: 'bg-accent-cyan/20' };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="section mb-8" data-section="CONNECTIONS">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
          <span className="text-accent-cyan text-xl">//</span>
          My Connections
        </h2>
        <div className="text-text-dim animate-pulse">Loading connections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section mb-8" data-section="CONNECTIONS">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
          <span className="text-accent-cyan text-xl">//</span>
          My Connections
        </h2>
        <div className="bg-forge-black border-l-4 border-red-500 p-4">
          <div className="text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  // Separate new connections (where user is initiator and hasn't seen yet) from others
  const newConnections = connections.filter(c => c.isInitiator && !c.myConsent && !c.theirConsent);
  const activeConnections = connections.filter(c => c.myConsent || c.theirConsent);
  const allConnections = [...newConnections, ...activeConnections];

  return (
    <div className="section mb-8" data-section="CONNECTIONS">
      <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
        <span className="text-accent-cyan text-xl">//</span>
        My Connections
        {newConnections.length > 0 && (
          <span className="ml-auto px-3 py-1 bg-accent-orange text-white text-xs font-bold uppercase rounded-full animate-pulse">
            {newConnections.length} NEW
          </span>
        )}
      </h2>

      {allConnections.length === 0 ? (
        <div className="bg-forge-black border-l-4 border-grid-line p-6">
          <div className="text-text-dim uppercase text-sm font-bold mb-2">No Connections Yet</div>
          <p className="text-text-secondary">
            Share your QR code with someone to start a collaboration handshake.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allConnections.map((conn) => {
            const status = getStatusLabel(conn);
            const isNew = conn.isInitiator && !conn.myConsent && !conn.theirConsent;
            const displayName = conn.otherParty?.displayName || conn.otherParty?.role || 'Unknown';

            return (
              <div
                key={conn.handshakeId}
                onClick={() => router.push(`/handshake-result/${conn.handshakeId}`)}
                className={`bg-forge-black border-l-4 p-4 cursor-pointer transition-all hover:shadow-glow-cyan ${
                  isNew ? 'border-accent-orange' : 'border-accent-cyan'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-text-primary font-bold truncate">
                        {displayName}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-bold uppercase ${status.bg} ${status.color === 'text-accent-cyan' ? 'text-black' : status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    {conn.otherParty?.role && conn.otherParty.displayName && (
                      <div className="text-text-secondary text-sm truncate">
                        {conn.otherParty.role}
                      </div>
                    )}
                  </div>
                  <div className="text-text-dim text-xs uppercase shrink-0">
                    {formatTime(conn.createdAt)}
                  </div>
                </div>

                {isNew && (
                  <div className="mt-3 pt-3 border-t border-grid-line">
                    <div className="text-accent-orange text-sm font-bold uppercase">
                      Someone scanned your QR! Tap to see match.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
