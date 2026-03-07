'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, User, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 p-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <span className="text-sm font-medium text-muted-foreground">Handshake</span>
        <button
          onClick={() => router.push('/')}
          className="ml-auto p-2 rounded-lg hover:bg-muted transition-colors"
          title="Home"
        >
          <Home className="w-5 h-5 text-muted-foreground" />
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 pb-8 max-w-sm mx-auto w-full">
        {status === 'loading' && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              Initiating Handshake
            </h2>
            <p className="text-sm text-muted-foreground">
              Connecting profiles...
            </p>
          </motion.div>
        )}

        {status === 'no-profile' && (
          <motion.div
            className="w-full space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-foreground mb-3">
                Create Your Profile First
              </h2>
            </div>

            <div className="card-surface p-5 space-y-3">
              <p className="text-sm text-foreground leading-relaxed">
                Before you can connect with others, you need to create your own collaboration profile.
              </p>
              <p className="text-xs text-muted-foreground">
                It only takes 60 seconds - just answer a few questions with your AI assistant.
              </p>
            </div>

            <Button
              onClick={goToCreateProfile}
              className="w-full h-12 text-base font-semibold"
            >
              Create Profile
            </Button>
          </motion.div>
        )}

        {status === 'creating' && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              Creating Handshake
            </h2>
            <p className="text-sm text-muted-foreground">
              Analyzing collaboration potential...
            </p>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            className="w-full space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-3">
                Error
              </h2>
            </div>

            <div className="card-surface border-l-4 border-destructive p-4">
              <p className="text-foreground text-sm">{error}</p>
            </div>

            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              Go Home
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
