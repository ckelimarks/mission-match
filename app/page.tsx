import Link from 'next/link';

export default function Home() {
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
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="relative mb-20 py-10 border-t-2 border-b-2 border-accent-orange text-center">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-forge-black px-3 text-xs font-bold tracking-widest text-accent-orange">
            PROTOCOL_v1.0
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold uppercase tracking-tight mb-3 text-shadow-lg">
            Mission Match
          </h1>
          <p className="text-text-secondary uppercase tracking-[0.3em] text-sm font-medium mb-8">
            Privacy-First AI Networking
          </p>

          {/* CTA Button */}
          <Link
            href="/create-profile"
            className="inline-block px-12 py-5 bg-gradient-to-r from-accent-orange to-red-600 text-white font-display font-bold text-lg uppercase tracking-widest transition-all hover:shadow-glow-orange hover:translate-y-[-2px]"
          >
            Create Your Profile →
          </Link>
        </header>

        {/* Build Status Section */}
        <div className="section" data-section="BUILD_STATUS">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wide mb-8 flex items-center gap-4">
            <span className="text-accent-cyan text-2xl">//</span>
            System Status
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3 pl-6 border-l-3 border-accent-cyan relative">
              <span className="absolute -left-2.5 text-accent-cyan font-bold">&gt;</span>
              <span className="text-accent-orange text-lg">✓</span>
              <span className="text-text-primary text-lg">Next.js 14 initialized</span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l-3 border-accent-cyan relative">
              <span className="absolute -left-2.5 text-accent-cyan font-bold">&gt;</span>
              <span className="text-accent-orange text-lg">✓</span>
              <span className="text-text-primary text-lg">Database schema with aspect model</span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l-3 border-accent-cyan relative">
              <span className="absolute -left-2.5 text-accent-cyan font-bold">&gt;</span>
              <span className="text-accent-orange text-lg">✓</span>
              <span className="text-text-primary text-lg">Cyberpunk design system</span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l-3 border-accent-cyan relative">
              <span className="absolute -left-2.5 text-accent-cyan font-bold">&gt;</span>
              <span className="text-accent-orange text-lg">✓</span>
              <span className="text-text-primary text-lg">Anthropic/Supabase integration</span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l-3 border-accent-cyan relative">
              <span className="absolute -left-2.5 text-accent-cyan font-bold">&gt;</span>
              <span className="text-accent-orange text-lg">✓</span>
              <span className="text-text-primary text-lg">Profile creation flow with AI extraction</span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l-3 border-grid-line relative opacity-50">
              <span className="absolute -left-2.5 text-text-dim font-bold">&gt;</span>
              <span className="text-text-dim text-lg">○</span>
              <span className="text-text-dim text-lg">QR code handshake flow (next)</span>
            </div>
          </div>
        </div>

        {/* Milestone Complete Section */}
        <div className="section" data-section="MILESTONE_1.1">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wide mb-6 flex items-center gap-4">
            <span className="text-accent-cyan text-2xl">//</span>
            Foundation Complete
          </h2>

          <div className="bg-forge-black border-l-4 border-accent-orange p-6 shadow-glow-orange">
            <p className="text-text-primary text-lg leading-relaxed">
              Core infrastructure deployed. Next phase: Profile creation with AI extraction from conversation history,
              aspect-level behavioral analysis, and two-stage consent flow.
            </p>
          </div>

          <div className="mt-8 flex gap-6 text-sm text-text-dim">
            <div className="flex items-center gap-2">
              <span className="text-accent-cyan">■</span>
              <span>Demo: March 9, 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent-cyan">■</span>
              <span>Track 3: Personal Data</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent-cyan">■</span>
              <span className="uppercase font-bold text-accent-orange">Active</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
