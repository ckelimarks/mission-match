# INFRA.md — Mission Match

> **SECURITY:** Never log actual secret values. Use variable NAMES only.

## Deployment
- **Hosting:** Vercel
- **URL:** https://mission-match.vercel.app (production)
- **Deploy method:** Auto-deploy on push to `main` branch
- **Repo:** https://github.com/ckelimarks/mission-match

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
| Stage 1 analysis | ⚠️ Stuck | Likely `ANTHROPIC_API_KEY` not set in Vercel |
| Stage 2 consent | ❌ Not built | Phase 6 in plan |
| Prioritization | 🎭 Mock only | Can stay mock for demo |

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
| `lib/anthropic.ts` | Anthropic client (lazy init) |
| `lib/supabase.ts` | Supabase client (lazy init) |
| `types/index.ts` | TypeScript types for profiles, handshakes, analyses |

## Plan Reference
See `/Users/christopherk.marks/.claude/plans/woolly-dreaming-eagle.md` for implementation phases.

---
*Last updated: March 3, 2026 by hackathon agent*
