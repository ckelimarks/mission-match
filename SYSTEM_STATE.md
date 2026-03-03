# System State

**Last Updated:** 2026-03-03

## What's Currently Running
- Next.js dev server on port 3000 (if started)

## DON'T REBUILD
- Schema types in `types/index.ts` - supports both new and legacy formats
- API routes: save-profile, get-profile, get-pending-connections, create-handshake, grant-consent
- Homepage at `/` with create-profile flow, profile view, connections list
- Connect page at `/connect/[profileId]` with rich extraction prompt

## To Verify State
```bash
# Check TypeScript compiles
npx tsc --noEmit

# Check production build
npx next build

# Run dev server
npm run dev
```

## Current Work Context

### Plan Progress (Demo Day: March 9)
- [x] Phase 1: Schema update - types/index.ts has new profile schema
- [x] Phase 2: Create Profile flow - homepage has JSON paste flow
- [x] Phase 3: My Profile - wired to real API, real QR, real connections
- [x] Phase 4: B's Connect Experience - updated prompt, localStorage keys
- [ ] Phase 5: Stage 1 Analysis - needs API update for new profile fields
- [ ] Phase 6: Stage 2 + Consent - needs full implementation
- [ ] Phase 7: Prioritization - can stay mock
- [ ] Phase 8: Polish + Vercel deploy

### localStorage Keys (Unified)
- `mm_profile_id` - User's profile UUID
- `mm_device_id` - Device identifier
- `mm_consent` - Consent state (legacy demo)

### API Endpoints
- `POST /api/save-profile` - Create profile from JSON
- `GET /api/get-profile?profileId=X` - Fetch profile
- `GET /api/get-pending-connections?profileId=X` - Get incoming connections
- `POST /api/create-handshake` - Create handshake between two profiles
- `POST /api/grant-consent` - Grant Stage 2 consent
- `GET /api/get-handshake?id=X` - Get handshake + analysis

### Next Steps
1. Update analyze-stage1 API to use new profile fields (hook, working_style, etc.)
2. Wire Stage 1 display to show new data
3. Test two-phone flow end-to-end
