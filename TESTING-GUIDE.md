# Mission Match: Simple Testing Guide
**Date:** March 6, 2026

## ✅ RECENT FIXES

### Extraction Prompt Fixed
- **Issue:** Claude tried to build a website instead of returning JSON
- **Fix:** Made prompt much more explicit with "CRITICAL: Return ONLY valid JSON"
- **Status:** ✅ FIXED - Prompt now starts with clear directive

---

## 🧪 EASY TEST METHOD (No Phone Needed)

### Option A: Test Locally (Recommended)

1. **Open in browser:** http://localhost:3000
2. **Create Profile 1:**
   - Click "Extract from Claude/ChatGPT"
   - Paste this test JSON (or use the new simplified extraction prompt):
```json
{
  "display_name": "Alex Chen",
  "hook": "Building AI tools for team collaboration. Former PM at a YC startup.",
  "working_style": {
    "vibe": "Fast-moving builder who ships MVPs and iterates based on user feedback.",
    "core_dimensions": {
      "speed_vs_craft": {
        "score": 85,
        "confidence": "high",
        "proof": "Shipped 3 prototypes in one month"
      },
      "structure_vs_exploration": {
        "score": 40,
        "confidence": "medium",
        "proof": "Prefer experimenting over detailed planning"
      }
    },
    "distinctive_edges": {}
  },
  "collaboration_fit": {
    "looking_for": "Technical co-founder who can build scalable backends",
    "works_best_with": "Engineers who move fast",
    "struggles_with": "Slow decision-making",
    "brings": "Product vision and user research"
  },
  "proof_points": [
    {
      "name": "Startup MVP",
      "description": "Built SaaS product used by 50 companies",
      "impact": "50 paying customers in 3 months",
      "reveals": "Can validate and ship quickly"
    }
  ]
}
```
3. **Click Submit** - You should get a profile ID
4. **View Profile** - Should show your profile with QR codes

### Option B: Use Test Profiles Already Created

I already created 2 test profiles for you:
- Profile 1: `d799c52b-00cf-4fad-befd-a98316f52aa6`
- Profile 2: `1319d40a-8400-4f50-87ac-542ea20da098`

**View them:**
- http://localhost:3000/profile/d799c52b-00cf-4fad-befd-a98316f52aa6
- http://localhost:3000/profile/1319d40a-8400-4f50-87ac-542ea20da098

**View the handshake analysis:**
- http://localhost:3000/handshake-result/664d46d7-78ad-4a47-a698-221a435f43ee

---

## 🎯 SIMPLIFIED EXTRACTION FLOW (NEW!)

**The extraction prompt is now MUCH simpler and more explicit:**

1. **Click "Extract from Claude/ChatGPT"** on any profile creation page
2. **Copy the prompt** (it now says "CRITICAL: Return ONLY valid JSON...")
3. **Paste into Claude.ai** - Claude will now return ONLY JSON, no code/explanation
4. **Copy the JSON** and paste it back into Mission Match
5. **Submit** - Done!

**Key improvements:**
- ✅ Prompt explicitly says "Do not build a website"
- ✅ Much shorter and clearer
- ✅ Removes information overload
- ✅ Valid JSON format shown clearly

---

## 📱 MOBILE TESTING (For Demo)

### Debug Mobile "Failed Error":

**Common causes:**
1. **Network timeout** - Anthropic API takes ~18s for analysis
2. **CORS issue** - Check browser dev tools on phone
3. **Supabase connection** - Verify mobile network can reach Supabase
4. **JSON parsing** - Mobile Safari sometimes stricter about JSON format

**Testing steps:**

1. **Deploy to Vercel first** (not just localhost)
2. **Open on phone:** https://mission-match.vercel.app
3. **Use Safari Developer Mode** to see console errors:
   - Settings → Safari → Advanced → Web Inspector
   - Connect phone to Mac, open Safari → Develop → [Your iPhone]
4. **Try simplified test JSON** (paste JSON directly, skip AI extraction)
5. **Check Network tab** for failed requests

### Quick Debug:
```bash
# Check if Vercel is up
curl https://mission-match.vercel.app

# Check API endpoint
curl https://mission-match.vercel.app/api/get-profile?profileId=d799c52b-00cf-4fad-befd-a98316f52aa6
```

---

## 🎯 RECOMMENDED DEMO FLOW

**For Demo Day (March 9), use this simplified approach:**

### Option 1: Pre-Created Profiles (SAFEST)
1. **Show Profile 1** → http://localhost:3000/profile/d799c52b-00cf-4fad-befd-a98316f52aa6
2. **Show Handshake Result** → http://localhost:3000/handshake-result/664d46d7-78ad-4a47-a698-221a435f43ee
3. **Show "View as JSON"** - Data portability proof
4. **Done!**

### Option 2: Live Creation (If You Want to Demo Extraction)
1. **Open Mission Match** homepage
2. **Click "Extract from Claude/ChatGPT"**
3. **Show the NEW simplified prompt** (mention it's explicit about JSON-only)
4. **Copy prompt → Open Claude.ai in new tab**
5. **Paste and get instant JSON response**
6. **Copy JSON → Paste back → Submit**
7. **Show generated profile with QR codes**

**Recommendation:** Use Option 1 for time constraints, Option 2 to show the AI extraction magic.

---

## 📊 WHAT'S READY FOR JUDGES

✅ **Core Flow Working:**
- Profile creation (manual JSON or AI extraction)
- QR code generation and sharing
- Handshake creation between two profiles
- Stage 1 AI analysis (~18s, high quality)
- Modern, professional visual style (all 4 pages)

✅ **Track 3 Requirements (Data Portability):**
- View as JSON button
- Copy JSON to clipboard
- Download JSON file
- All profile data exportable

✅ **UX Improvements:**
- Simplified extraction prompt (no more "Claude builds a website" issue)
- Clear, explicit instructions
- Reduced information overload

⚠️ **Known Issue:**
- Mobile testing shows "failed error" - recommend testing on desktop/laptop for demo

