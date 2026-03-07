# Mission Match - Web Application

**Trust infrastructure for the agent economy.**

AI archaeologist for your mind. Extract collaboration profiles from your Claude/ChatGPT conversations, create cryptographic proof of provenance, and build portable reputation as your agent completes successful handshakes.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase and Anthropic credentials

# Run development server
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
web/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes (to be built)
│   ├── globals.css        # Neo-brutalist design system
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components (to be built)
├── database/
│   ├── schema.sql        # Complete Supabase schema with RLS
│   └── README.md         # Database setup instructions
├── lib/
│   ├── anthropic.ts      # Claude API client with extraction prompts
│   ├── deviceId.ts       # Device ID auth utilities
│   └── supabase.ts       # Supabase client configuration
├── types/
│   ├── index.ts          # TypeScript type definitions
│   └── database.ts       # Supabase generated types
└── public/               # Static assets
```

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS with neo-brutalist custom design system
- **Database**: PostgreSQL via Supabase with Row Level Security
- **AI**: Claude Sonnet 4.5 via Anthropic SDK
- **Auth**: Device ID in localStorage (stateless, no passwords)
- **QR Codes**: qrcode library for handshake flow

## Design System

### Brand Colors
- **Acid Yellow**: #d4ff00 (highlights, CTAs)
- **Punch Pink**: #ff3366 (alerts, accents)
- **Black/White**: High contrast base

### Typography
- **Display**: Syne (headings, UI labels)
- **Mono**: IBM Plex Mono (data, code-like elements)

### Neo-brutalist Components

Available CSS classes:
- `.neo-border` - Black border with black shadow
- `.neo-border-pink` - Black border with pink shadow
- `.neo-border-yellow` - Black border with yellow shadow
- `.neo-button` - Interactive button with hover/active states

Tailwind utilities:
- `shadow-neo`, `shadow-neo-sm`, `shadow-neo-lg`
- `shadow-neo-pink`, `shadow-neo-yellow`
- `border-neo` (3px)

## Database Setup

1. Create a Supabase project at https://supabase.com
2. Run `database/schema.sql` in the SQL Editor
3. Copy your project URL and anon key to `.env.local`

See `database/README.md` for detailed setup instructions.

## Aspect Model

Mission Match uses a hierarchical behavioral model instead of simple personality traits:

### 6 Core Axes

1. **Role Archetype** - Creative vs Executor, Generalist vs Specialist, Individual vs Multiplier
2. **Shipping Cadence** - Idea Generation, Completion Drive, Iteration Speed, Polish Tolerance
3. **Communication Style** - Sync vs Async, Structure vs Chaos, Directness
4. **Decision Making** - Data-driven vs Intuition, Speed vs Deliberation
5. **Energy Pattern** - Sprint vs Marathon, Parallel vs Serial
6. **Collaboration History** - Successful/Challenging Patterns with Evidence

Each aspect is scored 0-100 with confidence level (low/medium/high) and proof quotes from conversation history.

### Profile Strength (1-5)

- **5**: Rich conversation history with detailed projects
- **4**: Good evidence with multiple examples
- **3**: Moderate evidence, some patterns visible
- **2**: Limited data, basic profile only
- **1**: Very shallow, minimal information

Users with low profile strength see a "Boost Your Profile" prompt to strengthen their data through a structured conversation with Claude.

## Development Roadmap

### ✅ Milestone 1.1: Project Setup (COMPLETE)
- Next.js 14 initialized
- Database schema with aspect model
- Neo-brutalist design system
- Anthropic/Supabase integration
- TypeScript types

### Next: Milestone 1.2: Profile Creation
- File upload for conversation history
- Claude extraction with aspect analysis
- Profile strength calculation
- Manual profile boost flow

### Upcoming Milestones
- QR code handshake flow
- Stage 1 overlap analysis
- Stage 2 full analysis with aspect mismatches
- Mobile-first responsive design

See `../Build-Plan-Final.md` for complete milestone breakdown.

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=        # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Your Supabase anon/public key

# Anthropic
ANTHROPIC_API_KEY=               # Your Anthropic API key (server-side only)

# App
NEXT_PUBLIC_APP_URL=             # http://localhost:3000 (or production URL)
```

## Key Innovations

1. **Two-Stage Consent**: Anonymized overlap first, full profiles only after mutual consent
2. **Aspect-Level Matching**: Behavioral analysis, not just personality scores
3. **Evidence-Based**: Every claim validated with proof points from conversation history
4. **Human API Pattern**: GET /api/human/{id}/public and /api/human/{id}/full
5. **Facilitates Not Filters**: Show conversation starters, never rank/judge people

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Demo

**Date**: March 9, 2026
**Track**: 3 - Personal Data, Personal Value
**Hackathon**: Data Portability Hackathon

## Resources

- [Architecture](../Architecture-Final.md)
- [Build Plan](../Build-Plan-Final.md)
- [Aspect Model Design](../Aspect-Model-Design.md)
- [PRD](../Mission-Match-PRD-v2.md)
