# INFRA.md — Mission Match

> **SECURITY:** Never log actual secret values. Use variable NAMES only.

## Deployment
- **Hosting:** Vercel
- **URL:** https://mission-match.vercel.app (production)
- **Deploy method:** Auto-deploy on push to `main` branch
- **Repo:** https://github.com/ckelimarks/mission-match

### Repository Structure
**IMPORTANT:** The `web/` directory is a separate git repository nested inside the parent `hackathon/mission-match` directory.
- **Parent directory** (`hackathon/mission-match/`) → Points to `https://github.com/ckelimarks/agent-chat.git`
- **This directory** (`hackathon/mission-match/web/`) → Points to `https://github.com/ckelimarks/mission-match.git` (Vercel deploys from here)

To push and trigger deployment, you must be in the `web/` directory, not the parent.

## Database
- **Provider:** Supabase
- **Connection:** Service role key bypasses RLS for API routes
- **Local setup:** No — env vars only exist on Vercel
- **Schema location:** No migration files in repo; schema managed via Supabase dashboard
- **Pending migrations:** None tracked in repo

### Tables
| Table | Purpose |
|-------|---------|
| `profiles` | User collaboration profiles (hook, working_style, collaboration_fit, proof_points, etc.) |
| `handshakes` | Connection requests between two profiles |
| `analyses` | AI-generated Stage 1/2 collaboration analysis |
| `prioritizations` | User responses to prioritization questions (Quick Pick / Point Allocation) |

### Prioritizations Table Schema
```sql
CREATE TABLE prioritizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  handshake_id UUID NOT NULL REFERENCES handshakes(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('quick-pick', 'point-allocation', 'forced-choice')),
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(handshake_id, profile_id)
);
```

**Quick Pick Format:**
```json
{
  "0": "Building a product together",
  "1": "Technical co-founder (build together)",
  "2": "Nights & weekends sprint (10-20 hrs/wk)",
  "3": "Ship a real product to users"
}
```

**Point Allocation Format:**
```json
{
  "q0-o0": 5,  // Building a product: 5 points
  "q0-o1": 3,  // Running experiments: 3 points
  "q0-o2": 2,  // Strategic advising: 2 points
  ...
}
```

### Handshake Status Constraint
Database only allows these status values:
- `pending`
- `awaiting_consent`
- `approved`
- `declined`

## Environment Variables

### Required (All in Vercel Dashboard)
| Variable | Purpose | Local? |
|----------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (server-side) | No |
| `ANTHROPIC_API_KEY` | Claude API for analysis | No |

### Local Development
- **Status:** Not configured — no `.env.local` file
- **Impact:** Must test on Vercel; local `npm run dev` will fail on API routes
- **Workaround:** Push to main → auto-deploy → test on production

## Monitoring
- **Logs:** Vercel Dashboard → Functions → Logs
- **Evals:** None
- **Error tracking:** None (console.log only)

## Current State (March 3, 2026)

| Feature | Status | Notes |
|---------|--------|-------|
| Profile creation | ✅ Working | JSON repair handles ChatGPT malformed output |
| QR code generation | ✅ Working | Links to `/connect/[profileId]` |
| Two-phone QR scan | ✅ Working | Person B lands on connect page |
| Quick Connect (existing profile) | ✅ Working | Checks both localStorage keys |
| Connections query | ✅ Working | Uses separate queries (not `.or()`) |
| Stage 1 analysis | ✅ Working | Uses DELETE+INSERT for RLS workaround |
| Stage 2 consent | ✅ Working | Manual SQL UPDATE for handshakes (RLS blocks programmatic UPDATE) |
| Stage 2 display | ✅ Working | Travis Bonnet header, contact cards, deep dive profiles |
| Prioritization | ✅ Working | Quick Pick + Point Allocation with alignment analysis |

## Gotchas

### 1. ChatGPT Outputs Invalid JSON
ChatGPT often returns JSON with missing opening quotes:
```json
"impact": Built functional...  // Missing opening quote
```
**Solution:** `repairJson()` function in `app/api/save-profile/route.ts` fixes smart quotes, em-dashes, and missing quotes.

### 2. localStorage Key Mismatch
Old code used `mission_match_profile_id`, new code uses `mm_profile_id`.
**Solution:** Check both keys for backward compatibility:
```typescript
localStorage.getItem('mm_profile_id') || localStorage.getItem('mission_match_profile_id')
```

### 3. Supabase `.or()` Doesn't Work
The `.or()` filter syntax fails silently and returns 0 results.
**Solution:** Use two separate `.eq()` queries and combine results:
```typescript
const { data: asInitiator } = await supabase.from('handshakes').eq('initiator_id', id);
const { data: asRecipient } = await supabase.from('handshakes').eq('recipient_id', id);
const all = [...(asInitiator || []), ...(asRecipient || [])];
```

### 4. Fire-and-Forget Analysis Fails Silently
`create-handshake` triggers `analyze-stage1` as fire-and-forget fetch.
If it fails, the UI shows "Analyzing..." forever.
**Solution:** Added "Retry Analysis" button to manually trigger with error display.

### 5. No Local Testing
Without local env vars, you cannot run the app locally with working APIs.
**Workaround:** Push to GitHub → Vercel auto-deploys → Test on production.

### 6. Anthropic Client Lazy Init
`lib/anthropic.ts` uses lazy initialization. If `ANTHROPIC_API_KEY` is missing, it throws at runtime, not build time.

### 7. Profile Column Mapping (Schema Mismatch)
New rich profile format is mapped to existing DB columns to avoid migrations:

| New Field | Stored In Column |
|-----------|------------------|
| `hook` | `role` |
| `working_style` | `role_aspects` (JSONB) |
| `collaboration_fit` | `collaboration_aspects` (JSONB) |
| `intellectual_signature` | `shipping_aspects` (JSONB) |
| `contact` | `communication_aspects` (JSONB) |
| `profile_confidence` | `decision_aspects.profile_confidence` |

**When querying:** Select actual column names, not the new field names.

### 8. RLS Blocks UPDATE Even With Service Key
Supabase RLS silently blocks UPDATE operations on analyses table.
**Solution:** Use DELETE existing record + INSERT new one:
```typescript
// DELETE first
await supabase.from('analyses').delete().eq('id', existingId);
// Then INSERT
await supabase.from('analyses').insert({ ... });
```

### 9. Analyses Table Schema
The `analyses` table only has basic columns. Extra analysis fields are packed into `overlap` JSONB:

```typescript
// What we store in overlap column:
{
  items: [...],              // The actual overlap items
  working_style_preview: [], // Working style compatibility
  hook_alignment: "..."      // Mission alignment text
}
```

**Frontend must handle both formats:** Old (overlap is array) vs new (overlap is object with items).

### 10. Query Completed Analyses First
Multiple analysis records may exist for the same handshake. Always filter by status:
```typescript
// Prioritize completed analyses
const { data: analysis } = await supabase
  .from('analyses')
  .select('*')
  .eq('handshake_id', handshakeId)
  .eq('analysis_status', 'completed')
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

### 11. Vercel Caches Supabase JS Client Responses
Vercel aggressively caches `fetch()` responses at the edge, including those made by Supabase JS client. This causes stale data to be returned even after database updates.

**Symptoms:**
- API returns old data after DB updates
- Consent status stuck at `false` even after granting
- Connections list shows deleted handshakes

**Solution:** Use direct REST API with explicit cache-busting instead of Supabase JS client:
```typescript
const response = await fetch(
  `${supabaseUrl}/rest/v1/handshakes?id=eq.${id}&select=*`,
  {
    cache: 'no-store',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
  }
);
```

**Also add route-level config:**
```typescript
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
```

**Helper available:** `lib/supabase-rest.ts` provides `supabaseRest()` with built-in cache-busting.

## Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Home page with profile creation + connections |
| `app/connect/[profileId]/page.tsx` | QR scan landing page for Person B |
| `app/handshake-result/[id]/page.tsx` | Stage 1/2 analysis display |
| `app/api/save-profile/route.ts` | Profile creation with JSON repair |
| `app/api/create-handshake/route.ts` | Creates handshake + triggers analysis |
| `app/api/get-pending-connections/route.ts` | Fetches user's connections |
| `app/api/analyze-stage1/route.ts` | Claude-powered collaboration analysis |
| `app/api/grant-consent/route.ts` | Stage 2 consent granting (RLS blocking on handshakes) |
| `app/api/get-handshake/route.ts` | Fetch handshake with cache-busting |
| `app/api/save-prioritization/route.ts` | Save user's prioritization answers |
| `app/api/get-prioritization/route.ts` | Fetch both users' answers + alignment |
| `lib/anthropic.ts` | Anthropic client (lazy init) |
| `lib/supabase.ts` | Supabase client (lazy init) |
| `lib/supabase-rest.ts` | REST API helper with cache-busting (use this for reads) |
| `types/index.ts` | TypeScript types for profiles, handshakes, analyses |

## Plan Reference
See `/Users/christopherk.marks/.claude/plans/woolly-dreaming-eagle.md` for implementation phases.

---
*Last updated: March 9, 2026 — Added Gotcha #11 (Vercel caching fix)*
