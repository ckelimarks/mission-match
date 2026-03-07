'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Shield, Trophy, Rocket, Mic, Package, Home, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const highlightIcons: Record<string, typeof Trophy> = {
  Shipped: Rocket,
  Won: Trophy,
  Built: Package,
  "Spoke at": Mic,
};

type PublicProfile = {
  id: string;
  display_name: string | null;
  role: string | null;
  mission: string | null;
  looking_for: string | null;
  proof_points?: Array<{
    name: string;
    description: string;
    impact?: string;
    reveals?: string;
  }>;
};

export default function ConnectPage() {
  const params = useParams();
  const router = useRouter();
  const targetProfileId = params.profileId as string;

  const [targetProfile, setTargetProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initiating, setInitiating] = useState(false);

  useEffect(() => {
    fetchTargetProfile();
  }, []);

  const fetchTargetProfile = async () => {
    try {
      const response = await fetch(`/api/get-profile?profileId=${targetProfileId}`);
      if (!response.ok) throw new Error('Profile not found');
      const data = await response.json();
      setTargetProfile(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setLoading(false);
    }
  };

  const handleInitiate = async () => {
    setInitiating(true);

    try {
      // Check if user has existing profile
      const myProfileId = localStorage.getItem('mm_profile_id') || localStorage.getItem('mission_match_profile_id');

      if (!myProfileId) {
        // Redirect to create profile first
        router.push(`/create-profile?connect=${targetProfileId}`);
        return;
      }

      // Create handshake
      const handshakeResponse = await fetch('/api/create-handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiatorId: myProfileId,
          recipientId: targetProfileId,
        }),
      });

      if (!handshakeResponse.ok) {
        const errorData = await handshakeResponse.json();
        throw new Error(errorData.error || 'Failed to create handshake');
      }

      const handshakeData = await handshakeResponse.json();
      router.push(`/handshake-result/${handshakeData.handshakeId}`);
    } catch (err) {
      console.error('Initiate error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate handshake');
      setInitiating(false);
    }
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

  if (error || !targetProfile) {
    return (
      <div className="min-h-screen px-6 py-16 max-w-md mx-auto">
        <div className="card-surface p-6">
          <div className="text-destructive font-bold uppercase text-sm mb-2">Error</div>
          <p className="text-foreground mb-4">{error || 'Profile not found'}</p>
          <Button onClick={() => router.push('/')} className="w-full">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const displayName = targetProfile.display_name || 'Someone';
  const hook = targetProfile.mission || targetProfile.role;
  const highlights = targetProfile.proof_points?.slice(0, 3) || [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 p-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <span className="text-sm font-medium text-muted-foreground">Connect</span>
        <button
          onClick={() => router.push('/')}
          className="ml-auto p-2 rounded-lg hover:bg-muted transition-colors"
          title="My Profile"
        >
          <Home className="w-5 h-5 text-muted-foreground" />
        </button>
      </header>

      <main className="flex-1 flex flex-col px-6 pb-8 pt-4">
        <motion.div
          className="w-full max-w-sm mx-auto space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Avatar + Identity */}
          <div className="flex flex-col items-center space-y-3 text-center">
            <motion.div
              className="w-20 h-20 rounded-full bg-muted flex items-center justify-center glow-border"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <span className="text-2xl font-bold text-foreground">
                {displayName.split(" ").map(n => n[0]).join("")}
              </span>
            </motion.div>
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tight text-foreground">
                {displayName}
              </h1>
              {targetProfile.role && (
                <p className="text-sm text-primary mt-1">{targetProfile.role}</p>
              )}
            </div>
          </div>

          {/* Hook */}
          {hook && (
            <div className="card-surface p-4">
              <p className="text-sm text-foreground leading-relaxed italic">
                "{hook}"
              </p>
            </div>
          )}

          {/* Highlights / Proof */}
          {highlights.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Track Record
              </h2>
              <div className="space-y-2">
                {highlights.map((h, i) => {
                  const Icon = highlightIcons[h.name?.split(' ')[0]] || Rocket;
                  return (
                    <motion.div
                      key={i}
                      className="card-surface p-3 flex items-start gap-3"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                          {h.name}
                        </span>
                        <p className="text-sm text-foreground leading-snug">{h.description}</p>
                        {h.impact && (
                          <p className="text-xs text-muted-foreground mt-1">{h.impact}</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* What happens */}
          <div className="space-y-2 pt-2">
            <div className="flex items-start gap-3 text-sm">
              <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span className="text-muted-foreground">
                AI analyzes your compatibility from evidence-based profiles
              </span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span className="text-muted-foreground">
                Full profiles unlock only with mutual consent
              </span>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={handleInitiate}
            disabled={initiating}
            className="w-full h-12 text-base font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {initiating ? 'Initiating...' : (
              <>
                Initiate Handshake
                <Zap className="w-4 h-4" />
              </>
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">
            Profile ID: <span className="font-mono">{targetProfileId}</span>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
