# My Profile - Next Improvements

**Date:** March 4, 2026
**Status:** Notes from today's session

---

## Completed Today ✅

1. **Fixed API bug** - `get-profile` now returns unwrapped data
2. **Redesigned Major Projects** - Portfolio-style cards with metric badges
3. **Redesigned Profile Header** - Travis-style left-aligned, condensed layout
4. **Moved Proof Points First** - "Validated Output" before working style

---

## Next Session TODO

### 1. Move "Copy Profile Link" Button
**Current:** Button is under the descriptors in main content
**Desired:** Move directly under QR code (better UX)

```
[QR Code]
/connect/abc123...
[📋 Copy Link]
```

### 2. Add "Download as JSON" Button
**Purpose:** Data portability - let users download their full profile as JSON
**Placement:** Near Copy Link button or in actions section
**Behavior:**
```javascript
const downloadJSON = () => {
  const blob = new Blob([JSON.stringify(myFullProfile, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mission-match-profile-${myProfileId.slice(0,8)}.json`;
  a.click();
};
```

**Why:** Aligns with "own your data" mission - true data portability

### 3. Condense Proof Projects
**Current:** Full-width cards with lots of padding
**Desired:** Tighter spacing, smaller cards, more scannable

Ideas:
- Reduce padding (32px → 24px)
- Smaller fonts
- Maybe 2-column grid on wider screens?
- Tighter metric badge spacing

### 3. Add Top Skills Section
**Desired:** 3 top skills, scannable, easy to read

**Placement:** After descriptors, before Major Projects?

**Visual Style:** Similar to descriptor tags but maybe:
- Different color (purple/blue instead of teal?)
- "⚡ Top Skills" header
- Extract from `working_style.distinctive_edges` or new field

**Example:**
```
⚡ Top Skills
[Systems Thinking] [Rapid Prototyping] [AI Integration]
```

**Data source options:**
- Add `top_skills: []` to extraction prompt
- Extract from `working_style.distinctive_edges` (top 3 by score)
- Parse from `working_style.vibe` differently

---

## Design Goals

- **Scannable** - Easy to skim in 10 seconds
- **Portfolio-first** - Proof before personality
- **Condensed** - No wasted space
- **Professional** - Something you'd send to investors

---

## Current Structure (After Today)

```
[Header]
  - Name (left)
  - Title (left)
  - Hook with quote styling
  - Descriptor tags (3 from vibe)
  - QR code (top right)
  - Copy Link button (needs to move)

[Major Projects]
  - Project cards with metrics
  - Strategic role sections

[Connections]
  - Incoming connections list

[How I Work]
  - Core dimensions with bars

[Collaboration Fit]
  - Looking for, works best with, watch points
```

---

## Questions for Tomorrow

1. **Top Skills data source** - Add to extraction prompt or derive from existing?
2. **Projects condensing** - Grid layout or just tighter single column?
3. **Button placement** - Just move under QR or rethink actions entirely?

---

**Overall feedback:** Really good progress. Header feels way better. Projects look professional. Just need to tighten up and add skills for scannability.
