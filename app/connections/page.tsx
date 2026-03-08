'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Users } from 'lucide-react';
import ConnectionCard from '@/components/ConnectionCard';

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

export default function ConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  useEffect(() => {
    const profileId = localStorage.getItem('mm_profile_id') || localStorage.getItem('mission_match_profile_id');

    if (!profileId) {
      router.push('/');
      return;
    }

    setMyProfileId(profileId);
    fetchConnections(profileId);
  }, []);

  const fetchConnections = async (profileId: string) => {
    try {
      const response = await fetch(`/api/get-pending-connections?profileId=${profileId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }
      const data = await response.json();
      setConnections(data.connections || []);
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading connections...</p>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            Connections
          </span>
        </div>
      </header>

      <div className="px-6 max-w-2xl mx-auto">
        {/* Debug Info */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg text-xs font-mono space-y-2">
          <div><span className="text-primary">Profile ID:</span> {myProfileId}</div>
          <div><span className="text-primary">Count:</span> {connections.length}</div>
          <div><span className="text-primary">Filtered Count:</span> {connections.filter(conn => conn.otherParty).length}</div>
          {connections.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-primary">Raw Data</summary>
              <pre className="mt-2 text-[10px] overflow-auto max-h-48">
                {JSON.stringify(connections, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {connections.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-bold text-foreground mb-2">No Connections Yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Share your QR code to start connecting
            </p>
            <button
              onClick={() => router.push('/profile')}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Profile
            </button>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              All Connections ({connections.length})
            </h2>
            {connections
              .filter(conn => conn.otherParty)
              .map((conn, index) => {
                const displayName = conn.otherParty!.displayName || conn.otherParty!.role?.split(',')[0]?.trim() || 'Unknown';

                // Temporary debug: show simple text instead of card
                return (
                  <div key={conn.handshakeId} className="p-4 bg-muted rounded-lg mb-2">
                    <div className="text-sm font-bold text-foreground">#{index + 1}: {displayName}</div>
                    <div className="text-xs text-muted-foreground">{conn.otherParty!.role}</div>
                    <div className="text-xs text-primary mt-1">Status: {conn.status}</div>
                    <button
                      onClick={() => router.push(`/handshake-result/${conn.handshakeId}`)}
                      className="mt-2 px-3 py-1 bg-primary text-primary-foreground text-xs rounded"
                    >
                      View Handshake
                    </button>
                  </div>
                );
              })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
