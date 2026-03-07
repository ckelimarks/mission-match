'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Scan, Shield, Handshake, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user already has a profile, redirect to /profile
    const profileId = localStorage.getItem('mm_profile_id') || localStorage.getItem('mission_match_profile_id');
    if (profileId) {
      router.push('/profile');
    }
  }, [router]);

  const steps = [
    { icon: Scan, title: 'Scan', desc: 'Scan a QR code at any event' },
    { icon: Sparkles, title: 'Analyze', desc: 'AI reveals your professional overlap' },
    { icon: Handshake, title: 'Connect', desc: 'Mutual consent unlocks full profiles' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <span className="text-lg font-bold tracking-tight text-foreground">
          Mission<span className="text-primary">Match</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/create-profile')}
          className="text-muted-foreground hover:text-foreground"
        >
          Sign In
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <motion.div
          className="text-center max-w-sm mx-auto space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-medium text-primary tracking-wide">
              Evidence-based profiles
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight leading-[1.1] text-foreground">
            Know who you're{' '}
            <span className="text-gradient">really</span>{' '}
            meeting
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed">
            AI-extracted profiles from real conversations.
            Not resumes. Not personality tests.
            <span className="text-foreground font-medium"> Verifiable evidence.</span>
          </p>

          <Button
            onClick={() => router.push('/create-profile')}
            className="w-full h-12 text-base font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* How it works */}
        <motion.div
          className="w-full max-w-sm mx-auto mt-16 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground text-center">
            How it works
          </h2>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="flex items-center gap-4 card-surface p-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">{step.title}</span>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trust footer */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-mono text-primary">Claude Sonnet 4.5</span> · Human-reviewed · Timestamped
          </p>
        </motion.div>
      </main>
    </div>
  );
}
