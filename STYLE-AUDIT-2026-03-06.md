# Mission Match: Visual Style Audit
**Date:** March 6, 2026

## 🎨 PROBLEM: Two Competing Style Systems

### OLD "Cyberpunk/Forge" Style
**Colors:**
- `--forge-black`: #0d0d0d
- `--accent-orange`: #ff6b35  
- `--accent-cyan`: #00d4ff

**Typography:**
- Font: JetBrains Mono (monospace)

**Visual Elements:**
- Gradient spheres (animated blobs)
- Grid overlay pattern
- Noise texture overlay
- Blueprint-style sections with corner brackets

**Pages Using This:**
- ✅ ProfileView component (components/ProfileView.tsx)
- ✅ /handshake/[id] page
- ✅ /connect/[profileId] page  
- ⚠️ /handshake-result/[id] page (MIXED)

---

### NEW "Mission Match" Style  
**Colors:**
- `--mm-cyan`: #4ecdc4 (lighter cyan)
- `--mm-red`: #ff6b6b
- `--mm-purple`: #8338ec
- `--mm-bg-dark`: #0a0a0f

**Typography:**
- Font: DM Sans (sans-serif, cleaner)

**Visual Elements:**
- Cleaner gradients
- More modern, less "hacker" aesthetic
- Floating orbs (cyan/red)

**Pages Using This:**
- ✅ /demo page (full DM Sans)
- ⚠️ /handshake-result/[id] page (MIXED)
- ⚠️ Homepage (has floating orbs, but unclear)

---

## 🔍 SPECIFIC ISSUES FOUND

### 1. Profile Page = OLD Cyberpunk Style
**File:** components/ProfileView.tsx
- Uses: `forge-black`, `accent-cyan`, `accent-orange`
- Uses: `gradient-background`, `gradient-sphere`, `grid-overlay`  
- Uses: JetBrains Mono font
- Has: Animated gradient blobs, noise texture, grid lines

### 2. Handshake Result Page = MIXED Styles
**File:** app/handshake-result/[id]/page.tsx
- Uses BOTH `mm-cyan` AND `accent-cyan`
- Inconsistent color usage

### 3. Homepage = Unclear
**File:** app/page.tsx
- Component doesn't define explicit styles
- Relies on globals.css
- Need to verify what actually renders

---

## 🎯 RECOMMENDATION

**Option A: Modernize Everything to NEW Style** (Recommended)
- Update ProfileView to use mm-cyan, mm-red colors
- Remove cyberpunk aesthetics (grid overlay, noise)
- Switch to DM Sans font globally
- Keep cleaner, more professional look

**Option B: Keep Cyberpunk Style Consistently**
- Update /demo page to match old style
- Fix handshake-result to use only old colors
- Commit to the tech/hacker aesthetic

**Option C: Hybrid Approach**
- Homepage/Demo = Clean modern style (for judges)
- Profile pages = Cyberpunk style (for users)
- Clear visual separation of "public" vs "internal" areas

---

## 🚀 QUICK FIX (Recommended)

Update ProfileView.tsx to use NEW style:
1. Replace `accent-cyan` → `mm-cyan`
2. Replace `accent-orange` → `mm-red`
3. Remove gradient-sphere animations (too busy)
4. Keep grid overlay (subtle, works with both)
5. Switch font to DM Sans

**Time:** 20-30 minutes
**Impact:** Consistent, professional look across all pages

