'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function HandshakePage() {
  const router = useRouter();
  const params = useParams();
  const scannedProfileId = params.id as string;

  const [status, setStatus] = useState<'loading' | 'no-profile' | 'creating' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initiateHandshake();
  }, []);

  const initiateHandshake = async () => {
    try {
      // Check if user has a profile
      const myProfileId = localStorage.getItem('mission_match_profile_id');
      const deviceId = localStorage.getItem('mission_match_device_id');

      if (!myProfileId || !deviceId) {
        // User doesn't have a profile yet
        setStatus('no-profile');
        return;
      }

      // Create handshake
      setStatus('creating');

      const response = await fetch('/api/create-handshake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        body: JSON.stringify({
          initiatorId: myProfileId,
          recipientId: scannedProfileId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create handshake');
      }

      const data = await response.json();

      // Redirect to handshake results
      router.push(`/handshake-result/${data.handshakeId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('error');
    }
  };

  const goToCreateProfile = () => {
    // Store the intended handshake for after profile creation
    localStorage.setItem('pending_handshake', scannedProfileId);
    router.push('/create-profile');
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
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 min-h-screen flex items-center justify-center">
        <div className="w-full">
          {status === 'loading' && (
            <div className="section" data-section="LOADING">
              <div className="text-center">
                <div className="text-accent-cyan text-6xl mb-6 animate-spin">⟳</div>
                <h2 className="font-display text-3xl font-bold uppercase mb-4">
                  Initiating Handshake
                </h2>
                <p className="text-text-secondary">
                  Connecting profiles...
                </p>
              </div>
            </div>
          )}

          {status === 'no-profile' && (
            <div className="section" data-section="NO_PROFILE">
              <h2 className="font-display text-3xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
                <span className="text-accent-orange text-2xl">//</span>
                Create Your Profile First
              </h2>

              <div className="mb-8">
                <p className="text-text-primary text-lg mb-4">
                  Before you can connect with others, you need to create your own collaboration profile.
                </p>
                <p className="text-text-secondary">
                  It only takes 60 seconds - just answer a few questions with your AI assistant.
                </p>
              </div>

              <button
                onClick={goToCreateProfile}
                className="w-full py-6 bg-gradient-to-r from-accent-orange to-red-600 text-white font-display font-bold text-lg uppercase tracking-widest transition-all hover:shadow-glow-orange hover:translate-y-[-2px]"
              >
                Create Profile →
              </button>
            </div>
          )}

          {status === 'creating' && (
            <div className="section" data-section="CREATING">
              <div className="text-center">
                <div className="text-accent-orange text-6xl mb-6 animate-spin">⟳</div>
                <h2 className="font-display text-3xl font-bold uppercase mb-4">
                  Creating Handshake
                </h2>
                <p className="text-text-secondary">
                  Analyzing collaboration potential...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="section" data-section="ERROR">
              <h2 className="font-display text-3xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
                <span className="text-red-500 text-2xl">//</span>
                Error
              </h2>

              <div className="bg-forge-black border-l-4 border-red-500 p-6 mb-6">
                <p className="text-text-primary">{error}</p>
              </div>

              <button
                onClick={() => router.push('/')}
                className="w-full py-4 bg-grid-line text-text-primary font-display font-bold uppercase tracking-widest hover:bg-accent-cyan hover:text-black transition-colors"
              >
                Go Home
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
