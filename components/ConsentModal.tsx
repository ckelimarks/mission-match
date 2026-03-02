'use client';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: () => void;
  otherPersonName?: string;
}

export default function ConsentModal({ isOpen, onClose, onConsent, otherPersonName }: ConsentModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-accent-cyan flex items-center justify-center rounded font-bold text-black text-xl">
              MM
            </div>
            <h2 className="text-xl font-bold text-black">
              Allow Mission Match to access your collaboration profile?
            </h2>
          </div>
          <p className="text-gray-600 text-sm">
            Mission Match is requesting permission to share your full profile with{' '}
            <strong>{otherPersonName || 'this person'}</strong>
          </p>
        </div>

        {/* Permissions List */}
        <div className="p-6">
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Mission Match will be able to:
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="text-accent-cyan mt-0.5">✓</div>
              <div className="text-sm text-gray-700">
                Share your profile with other consenting users
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-accent-cyan mt-0.5">✓</div>
              <div className="text-sm text-gray-700">
                Generate collaboration fit analysis with aspect-level insights
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-accent-cyan mt-0.5">✓</div>
              <div className="text-sm text-gray-700">
                Create powerful questions for first conversations
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-accent-cyan mt-0.5">✓</div>
              <div className="text-sm text-gray-700">
                Show contact information to mutual matches
              </div>
            </div>
          </div>

          {/* Privacy Footer */}
          <div className="mt-6 p-4 bg-gray-50 rounded text-xs text-gray-600">
            By clicking Allow, both parties must consent to share profiles. You can revoke access at any time.
            Your profile remains portable and exportable.
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConsent}
            className="flex-1 px-4 py-3 bg-accent-cyan text-black font-semibold rounded hover:opacity-90 transition-opacity"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
