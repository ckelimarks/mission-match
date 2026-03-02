'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ClaimPage() {
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
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 min-h-screen">
        {/* Header */}
        <header className="relative mb-16 py-10 border-t-2 border-b-2 border-accent-orange text-center">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-forge-black px-3 text-xs font-bold tracking-widest text-accent-orange">
            PROFILE_RECOVERY
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight mb-3">
            Claim Your Profile
          </h1>
          <p className="text-text-secondary uppercase tracking-[0.3em] text-sm font-medium">
            Scan or Upload Your Recovery QR
          </p>
        </header>

        {/* Idle / Upload State */}
        {(status === 'idle' || status === 'error') && (
          <div className="space-y-8">
            {/* Upload QR Section */}
            <div className="section" data-section="UPLOAD_QR">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
                <span className="text-accent-cyan text-xl">//</span>
                Upload Your Claim QR
              </h2>

              <div
                className="border-2 border-dashed border-grid-line hover:border-accent-cyan p-12 text-center cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-6xl mb-4">📷</div>
                <p className="text-text-primary text-lg mb-2">
                  Click to upload your Claim QR screenshot
                </p>
                <p className="text-text-secondary text-sm">
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
            <div className="section" data-section="MANUAL_ENTRY">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
                <span className="text-accent-cyan text-xl">//</span>
                Or Enter Token Manually
              </h2>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste your claim token here..."
                  className="w-full bg-forge-black border-2 border-grid-line p-4 text-text-primary font-mono text-sm focus:border-accent-cyan focus:outline-none transition-colors"
                />

                <button
                  type="submit"
                  disabled={!manualToken.trim()}
                  className="w-full py-4 bg-gradient-to-r from-accent-orange to-red-600 text-white font-display font-bold uppercase tracking-widest transition-all hover:shadow-glow-orange disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify Token
                </button>
              </form>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-forge-black border-l-4 border-red-500 p-6">
                <div className="text-red-400 font-bold uppercase text-sm mb-2">Error</div>
                <p className="text-text-primary">{error}</p>
              </div>
            )}

            {/* Help Text */}
            <div className="section" data-section="HELP">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-4 flex items-center gap-4">
                <span className="text-accent-cyan text-xl">//</span>
                How to Find Your Claim QR
              </h2>

              <div className="space-y-3 text-text-secondary">
                <p>Your Claim QR is shown on your profile page after you create it.</p>
                <p>Look for the section labeled "Your Recovery QR" - this is different from your Share QR.</p>
                <p>If you saved a screenshot of this QR, upload it here to reclaim your profile on this device.</p>
              </div>
            </div>
          </div>
        )}

        {/* Verifying State */}
        {status === 'verifying' && (
          <div className="section" data-section="VERIFYING">
            <div className="text-center py-16">
              <div className="text-accent-cyan text-6xl mb-6 animate-spin">⟳</div>
              <h2 className="font-display text-3xl font-bold uppercase mb-4">
                Verifying Token
              </h2>
              <p className="text-text-secondary">
                Checking your claim token...
              </p>
            </div>
          </div>
        )}

        {/* Confirming State */}
        {status === 'confirming' && profileInfo && (
          <div className="section" data-section="CONFIRMING">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
              <span className="text-accent-cyan text-xl">//</span>
              Confirm Profile Claim
            </h2>

            <div className="bg-forge-black border-2 border-accent-cyan p-6 mb-8 shadow-glow-cyan">
              <div className="text-accent-cyan font-bold uppercase text-sm mb-4">
                Profile Found
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-accent-orange font-bold uppercase text-xs mb-1">Name</div>
                  <div className="text-text-primary text-lg">{profileInfo.displayName || 'Not set'}</div>
                </div>
                <div>
                  <div className="text-accent-orange font-bold uppercase text-xs mb-1">Role</div>
                  <div className="text-text-primary text-lg">{profileInfo.role || 'Not set'}</div>
                </div>
                <div>
                  <div className="text-accent-orange font-bold uppercase text-xs mb-1">Mission</div>
                  <div className="text-text-primary">{profileInfo.mission || 'Not set'}</div>
                </div>
              </div>
            </div>

            <div className="bg-forge-black border-l-4 border-accent-orange p-4 mb-8">
              <div className="text-accent-orange font-bold uppercase text-sm mb-2">Warning</div>
              <p className="text-text-primary">
                Claiming this profile will transfer ownership to this device. The previous device will lose access.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStatus('idle');
                  setProfileInfo(null);
                  setManualToken('');
                }}
                className="flex-1 py-4 bg-grid-line text-text-primary font-display font-bold uppercase tracking-widest hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={claimProfile}
                className="flex-1 py-4 bg-gradient-to-r from-accent-orange to-red-600 text-white font-display font-bold uppercase tracking-widest transition-all hover:shadow-glow-orange"
              >
                Claim Profile
              </button>
            </div>
          </div>
        )}

        {/* Claiming State */}
        {status === 'claiming' && (
          <div className="section" data-section="CLAIMING">
            <div className="text-center py-16">
              <div className="text-accent-orange text-6xl mb-6 animate-spin">⟳</div>
              <h2 className="font-display text-3xl font-bold uppercase mb-4">
                Claiming Profile
              </h2>
              <p className="text-text-secondary">
                Transferring ownership to this device...
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="section" data-section="SUCCESS">
            <div className="text-center py-16">
              <div className="text-accent-cyan text-6xl mb-6">✓</div>
              <h2 className="font-display text-3xl font-bold uppercase mb-4">
                Profile Claimed!
              </h2>
              <p className="text-text-secondary mb-4">
                Redirecting to your profile...
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
