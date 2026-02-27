# Mission Match Setup Guide

## Quick Start Checklist

- [x] Next.js project initialized
- [x] Design system implemented (cyberpunk style)
- [x] Profile creation flow built
- [ ] Supabase credentials configured
- [ ] Anthropic API key configured
- [ ] Database schema deployed

## 1. Get Supabase Credentials

1. Go to https://supabase.com and create a new project
2. Wait for the database to initialize (~2 minutes)
3. Go to **Project Settings** → **API**
4. Copy:
   - **Project URL** (looks like `https://xxx.supabase.co`)
   - **anon/public key** (the long string under "Project API keys")

## 2. Deploy Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Open `/database/schema.sql` in this project
3. Copy the entire contents and paste into the SQL Editor
4. Click **Run** to execute the schema
5. Verify tables were created: Go to **Table Editor** and you should see `profiles`, `handshakes`, and `analyses`

## 3. Get Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign in or create an account
3. Go to **API Keys** in the left sidebar
4. Click **Create Key**
5. Name it "Mission Match" and copy the key (starts with `sk-ant-`)

## 4. Configure Environment Variables

Create `.env.local` in the `web/` directory:

```bash
# Copy from .env.local.example
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 5. Test the Profile Creation Flow

1. Make sure the dev server is running: `npm run dev`
2. Go to http://localhost:3000
3. Click **"Create Your Profile →"**
4. Upload the test conversation file (see `test-conversation.txt` in this directory)
5. Click **"Analyze & Create Profile"**
6. Wait ~10-20 seconds for Claude to analyze
7. You should see your extracted profile with aspect scores!

## 6. Troubleshooting

### "Failed to save profile to database"
- Check that your Supabase credentials are correct in `.env.local`
- Verify the database schema was deployed successfully
- Check Supabase logs in the dashboard

### "Failed to extract profile"
- Check that your Anthropic API key is correct
- Verify you have credits in your Anthropic account
- Check the server console for detailed error messages

### Profile extraction takes too long
- This is normal! Claude analyzes all 6 aspect axes with evidence
- First extraction can take 15-20 seconds
- Subsequent extractions are usually faster

## What's Built So Far

### ✅ Milestone 1.1: Foundation
- Next.js 14 with TypeScript
- Cyberpunk design system (animated gradients, orange/cyan colors)
- Database schema with aspect model
- Supabase + Anthropic integration

### ✅ Milestone 1.2: Profile Creation
- File upload interface
- Claude extraction with aspect-level analysis
- Profile strength calculation (1-5)
- Profile display with all aspects
- "Boost Profile" prompt for low-strength profiles

### 🚧 Next: Milestone 2.1: QR Code Handshake
- Generate QR code for profile sharing
- Scan QR code to initiate handshake
- Create handshake record in database

## File Structure Created

```
web/
├── app/
│   ├── page.tsx                    # Homepage with CTA
│   ├── create-profile/
│   │   └── page.tsx                # Upload conversation history
│   ├── profile/[id]/
│   │   └── page.tsx                # View profile (server component)
│   └── api/
│       └── extract-profile/
│           └── route.ts            # Claude extraction endpoint
├── components/
│   └── ProfileView.tsx             # Profile display component
├── lib/
│   ├── anthropic.ts                # Claude API with extraction prompt
│   ├── deviceId.ts                 # Device ID auth
│   └── supabase.ts                 # Supabase client
├── types/
│   ├── index.ts                    # TypeScript types
│   └── database.ts                 # Supabase types
└── database/
    ├── schema.sql                  # Complete DB schema
    └── README.md                   # DB setup guide
```

## Testing Tips

1. **Use real conversation data**: Export your actual Claude/ChatGPT conversations for best results
2. **Test with varying data quality**: Try shallow conversations (< 500 chars) to see the "Boost Profile" flow
3. **Check aspect confidence levels**: High confidence = strong evidence, Low = limited data
4. **Verify proof points**: Make sure extracted proof points match your actual achievements

## Demo Preparation

For the March 9, 2026 demo:
1. Have a rich conversation history ready (~5000+ characters)
2. Pre-create your profile so extraction is instant during demo
3. Test the full flow multiple times
4. Prepare 2-3 profiles for handshake demonstration (coming in next milestone)
