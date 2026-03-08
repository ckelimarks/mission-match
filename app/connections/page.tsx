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
      // Add cache-busting timestamp
      const response = await fetch(`/api/get-pending-connections?profileId=${profileId}&t=${Date.now()}`);
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
        {/* Status Summary */}
        <div className="mb-6 grid grid-cols-3 gap-2">
          <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-400">
              {connections.filter(c => !c.myConsent).length}
            </div>
            <div className="text-[10px] text-red-400 uppercase font-semibold">Need Your Consent</div>
          </div>
          <div className="p-3 bg-yellow-500/10 border border-yellow-500 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {connections.filter(c => c.myConsent && !c.theirConsent).length}
            </div>
            <div className="text-[10px] text-yellow-400 uppercase font-semibold">Waiting for Them</div>
          </div>
          <div className="p-3 bg-green-500/10 border border-green-500 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">
              {connections.filter(c => c.myConsent && c.theirConsent).length}
            </div>
            <div className="text-[10px] text-green-400 uppercase font-semibold">Connected</div>
          </div>
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
              .sort((a, b) => {
                // Sort by priority: needs your consent first, then waiting for them, then approved
                const getPriority = (conn: Connection) => {
                  if (!conn.myConsent) return 0; // URGENT: needs your action
                  if (!conn.theirConsent) return 1; // Waiting for them
                  return 2; // Approved
                };
                return getPriority(a) - getPriority(b);
              })
              .map((conn, index) => {
                const displayName = conn.otherParty!.displayName || conn.otherParty!.role?.split(',')[0]?.trim() || 'Unknown';

                // Determine consent status
                const needsMyConsent = !conn.myConsent;
                const needsTheirConsent = conn.myConsent && !conn.theirConsent;
                const mutualConsent = conn.myConsent && conn.theirConsent;

                let statusBadge = '';
                let statusColor = '';
                if (needsMyConsent) {
                  statusBadge = '⚠️ NEEDS YOUR CONSENT';
                  statusColor = 'bg-red-500/20 text-red-400 border border-red-500';
                } else if (needsTheirConsent) {
                  statusBadge = '⏳ Waiting for them';
                  statusColor = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500';
                } else if (mutualConsent) {
                  statusBadge = '✅ Connected';
                  statusColor = 'bg-green-500/20 text-green-400 border border-green-500';
                }

                return (
                  <div key={conn.handshakeId} className={`p-4 rounded-lg mb-2 ${needsMyConsent ? 'bg-red-500/10 border-2 border-red-500' : 'bg-muted'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-bold text-foreground">{displayName}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{conn.otherParty!.role}</div>
                      </div>
                    </div>
                    <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded mb-2 inline-block ${statusColor}`}>
                      {statusBadge}
                    </div>
                    <button
                      onClick={() => router.push(`/handshake-result/${conn.handshakeId}`)}
                      className={`w-full px-3 py-2 text-xs rounded font-semibold ${
                        needsMyConsent
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      {needsMyConsent ? '⚠️ Grant Consent Now' : 'View Handshake'}
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
