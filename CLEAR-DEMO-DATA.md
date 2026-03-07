# Clear Demo Data

If you're still seeing the Stage 2 demo screen auto-load, you need to clear the old demo data from your browser.

## Quick Fix (2 options)

### Option 1: Browser Console
1. Open browser console (F12 or Cmd+Option+I)
2. Paste this and hit Enter:
```javascript
localStorage.removeItem('mm_consent');
location.reload();
```

### Option 2: Manual
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Find "Local Storage" → `http://localhost:3000`
4. Delete the `mm_consent` key
5. Refresh the page

## What This Does
The old demo stored a consent flag that auto-navigated to the "Stage 2" demo screen. This clears that flag so you start fresh on the home page.

## Verification
After clearing, you should see:
- Homepage loads by default ✅
- Navigation shows only "Home" (and "My Profile" if you have one) ✅
- No auto-redirect to demo screens ✅
