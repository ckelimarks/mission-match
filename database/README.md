# Database Setup

## Quick Start

1. Create a new Supabase project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Copy the contents of `schema.sql` and run it
4. Copy your project URL and anon key to `.env.local`

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

## Schema Overview

### Tables

**profiles** - User collaboration profiles
- Stores basic profile info (role, mission, looking_for)
- Proof points with evidence validation
- Aspect-level behavioral data (6 axes with 2-4 aspects each)
- Profile strength score (1-5) based on conversation data richness

**handshakes** - Connection requests between users
- Two-stage consent flow (Stage 1: overlap, Stage 2: full profiles)
- Mutual consent token generated atomically via `generate_consent_token()` function
- Status tracking: pending → awaiting_consent → approved/declined

**analyses** - AI-generated collaboration insights
- Stage 1: Anonymized overlap analysis (public)
- Stage 2: Full aspect-level analysis with pairing risks (private)
- Async completion tracking with polling pattern

### Row Level Security (RLS)

All tables have RLS enabled. Access control:

- **Profiles**: Public read for basic fields, full access for owner (via device_id)
- **Handshakes**: Participants can read/update their handshakes
- **Analyses**: Stage 1 public, Stage 2 only for handshake participants

Device ID is passed via `x-device-id` header for RLS policy enforcement.

### Functions

**update_updated_at()** - Trigger function to auto-update timestamps

**generate_consent_token(handshake_uuid)** - Atomic mutual consent token generation
- Prevents race conditions when both users consent simultaneously
- Returns UUID token or NULL if conditions not met

## Testing the Schema

Run test queries in Supabase SQL Editor:

```sql
-- Create test profile
INSERT INTO profiles (device_id, display_name, role, mission)
VALUES (uuid_generate_v4(), 'Test User', 'Builder', 'Testing the system')
RETURNING *;

-- View all profiles
SELECT id, display_name, role, profile_strength, created_at FROM profiles;
```

## Aspect Model Structure

Each aspect axis is stored as JSONB with this structure:

```json
{
  "aspect_name": {
    "score": 75,
    "confidence": "high",
    "proof": "Quote from conversation showing this aspect"
  }
}
```

Example for shipping_aspects:

```json
{
  "idea_generation": {"score": 90, "confidence": "high", "proof": "I prototype 2-3 new ideas every week"},
  "completion_drive": {"score": 40, "confidence": "medium", "proof": "I tend to move to new ideas before finishing"},
  "iteration_speed": {"score": 85, "confidence": "high", "proof": "Ship rough, iterate based on feedback"},
  "polish_tolerance": {"score": 30, "confidence": "high", "proof": "Perfectionism slows me down"}
}
```

## Migrations

Schema changes should be added as new migration files:

1. Create `migrations/001_initial_schema.sql` (this file)
2. Future changes: `migrations/002_add_feature.sql`
3. Run in order in Supabase SQL Editor
