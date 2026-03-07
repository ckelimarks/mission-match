'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, Upload, Key, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function ClaimPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<'idle' | 'verifying' | 'confirming' | 'claiming' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [profileInfo, setProfileInfo] = useState<{
    profileId: string;
    displayName: string | null;
    role: string | null;
    mission: string | null;
  } | null>(null);
  const [manualToken, setManualToken] = useState('');

  // Check for token in URL on mount
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyToken(token);
    }
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    setStatus('verifying');
    setError(null);

    try {
      const response = await fetch(`/api/claim?token=${encodeURIComponent(token)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid claim token');
      }

      setProfileInfo({
        profileId: data.profileId,
        displayName: data.displayName,
        role: data.role,
        mission: data.mission,
      });
      setManualToken(token);
      setStatus('confirming');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify token');
      setStatus('error');
    }
  };

  const claimProfile = async () => {
    if (!manualToken) return;

    setStatus('claiming');
    setError(null);

    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: manualToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim profile');
      }

      // Save to localStorage
      localStorage.setItem('mission_match_profile_id', data.profileId);
      localStorage.setItem('mission_match_device_id', data.deviceId);

      setStatus('success');

      // Redirect to profile after a brief moment
      setTimeout(() => {
        router.push(`/profile/${data.profileId}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim profile');
      setStatus('error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('verifying');
    setError(null);

    try {
      // Create image from file
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = async () => {
        if (!ctx) {
          setError('Canvas not supported');
          setStatus('error');
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Dynamically import jsQR (if available) or fall back to URL extraction
        try {
          // Try to extract URL from image using pattern matching
          // This is a fallback - ideally jsQR would be installed
          const extractedUrl = await extractQRFromImage(imageData);

          if (extractedUrl) {
            const url = new URL(extractedUrl);
            const token = url.searchParams.get('token');

            if (token) {
              verifyToken(token);
            } else {
              throw new Error('No claim token found in QR code');
            }
          } else {
            throw new Error('Could not read QR code. Try entering the token manually.');
          }
        } catch (err) {
          setError('Could not read QR code. Please enter your claim token manually below.');
          setStatus('idle');
        }
      };

      img.onerror = () => {
        setError('Failed to load image');
        setStatus('error');
      };

      img.src = URL.createObjectURL(file);
    } catch (err) {
      setError('Failed to process image');
      setStatus('error');
    }
  };

  // Attempt to decode QR using jsQR if available
  const extractQRFromImage = async (imageData: ImageData): Promise<string | null> => {
    try {
      // Dynamic import of jsQR
      const jsQR = (await import('jsqr')).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      return code?.data || null;
    } catch {
      // jsQR not installed - return null
      return null;
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      verifyToken(manualToken.trim());
    }
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
        <span className="text-sm font-medium text-muted-foreground">Claim Profile</span>
        <button
          onClick={() => router.push('/')}
          className="ml-auto p-2 rounded-lg hover:bg-muted transition-colors"
          title="Home"
        >
          <Home className="w-5 h-5 text-muted-foreground" />
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 pb-8 max-w-sm mx-auto w-full">
        {/* Page Title */}
        <motion.div
          className="text-center space-y-2 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Key className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-foreground">
            Claim Your Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload your recovery QR or enter token
          </p>
        </motion.div>

        {/* Idle / Upload State */}
        {(status === 'idle' || status === 'error') && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Upload QR Section */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Upload Recovery QR
              </h2>

              <div
                className="card-surface border-2 border-dashed hover:border-primary/50 p-10 text-center cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-foreground mb-1">
                  Click to upload your Claim QR screenshot
                </p>
                <p className="text-xs text-muted-foreground">
                  Or drag and drop an image file
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Manual Entry Section */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Or Enter Token Manually
              </h2>

              <form onSubmit={handleManualSubmit} className="space-y-3">
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste your claim token here..."
                  className="w-full card-surface p-3 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow rounded-md"
                />

                <Button
                  type="submit"
                  disabled={!manualToken.trim()}
                  className="w-full"
                >
                  Verify Token
                </Button>
              </form>
            </div>

            {/* Error Display */}
            {error && (
              <div className="card-surface border-l-4 border-destructive p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <div className="text-destructive font-semibold text-sm">Error</div>
                </div>
                <p className="text-foreground text-sm">{error}</p>
              </div>
            )}

            {/* Help Text */}
            <div className="space-y-3 pt-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                How to Find Your Claim QR
              </h2>

              <div className="card-surface p-4 space-y-2 text-xs text-muted-foreground leading-relaxed">
                <p>Your Claim QR is shown on your profile page after you create it.</p>
                <p>Look for the section labeled "Your Recovery QR" - this is different from your Share QR.</p>
                <p>If you saved a screenshot of this QR, upload it here to reclaim your profile on this device.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Verifying State */}
        {status === 'verifying' && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              Verifying Token
            </h2>
            <p className="text-sm text-muted-foreground">
              Checking your claim token...
            </p>
          </motion.div>
        )}

        {/* Confirming State */}
        {status === 'confirming' && profileInfo && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Confirm Profile Claim
            </h2>

            <div className="card-surface p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <div className="text-primary font-semibold text-sm">Profile Found</div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Name</div>
                  <div className="text-foreground font-medium">{profileInfo.displayName || 'Not set'}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Role</div>
                  <div className="text-foreground font-medium">{profileInfo.role || 'Not set'}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Mission</div>
                  <div className="text-foreground text-sm">{profileInfo.mission || 'Not set'}</div>
                </div>
              </div>
            </div>

            <div className="card-surface border-l-4 border-amber-500 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <div className="text-amber-500 font-semibold text-sm">Warning</div>
              </div>
              <p className="text-foreground text-xs leading-relaxed">
                Claiming this profile will transfer ownership to this device. The previous device will lose access.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStatus('idle');
                  setProfileInfo(null);
                  setManualToken('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={claimProfile}
                className="flex-1"
              >
                Claim Profile
              </Button>
            </div>
          </motion.div>
        )}

        {/* Claiming State */}
        {status === 'claiming' && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              Claiming Profile
            </h2>
            <p className="text-sm text-muted-foreground">
              Transferring ownership to this device...
            </p>
          </motion.div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Profile Claimed!
            </h2>
            <p className="text-sm text-muted-foreground">
              Redirecting to your profile...
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <ClaimPageContent />
    </Suspense>
  );
}
