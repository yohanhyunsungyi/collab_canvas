# PR #6 Manual Testing Guide - Quick Start

**Time Required:** 15-20 minutes  
**Dev Server:** `http://localhost:5176/`  
**Status:** Ready for testing

---

## Quick Setup

### Prerequisites
- ✅ Dev server running on `http://localhost:5176/`
- ✅ 2-3 browser windows (Chrome, Firefox, or Chrome Incognito)
- ✅ 2-3 test accounts (different emails)

### Test Accounts Needed
Create these if you haven't already:
- test1@example.com / password123
- test2@example.com / password123
- test3@example.com / password123 (optional)

---

## Test Scenarios (Check each as you go)

### ✅ Scenario 1: Basic Two-User Sync (5 min)

**Setup:**
1. Open `http://localhost:5176/` in Chrome
2. Sign in as `test1@example.com`
3. Open `http://localhost:5176/` in Firefox (or Incognito)
4. Sign in as `test2@example.com`

**Tests:**
- [ ] **Test 1.1:** Create rectangle in User 1 → Appears in User 2 within 1 second
- [ ] **Test 1.2:** Move rectangle in User 2 → Updates in User 1 smoothly
- [ ] **Test 1.3:** Resize rectangle in User 1 → Updates in User 2 immediately
- [ ] **Test 1.4:** Create circle in User 2 → Appears in User 1
- [ ] **Test 1.5:** Delete shape in User 1 → Removes in User 2

**Expected Results:**
- ✅ All changes sync within 1 second
- ✅ No duplicate shapes
- ✅ Smooth animations
- ✅ No console errors

---

### ✅ Scenario 2: Three-User Simultaneous Editing (3 min)

**Setup:**
1. Open 3 browser windows with 3 different users

**Tests:**
- [ ] **Test 2.1:** All 3 users create different shapes at the same time
- [ ] **Test 2.2:** Verify all shapes appear in all 3 windows
- [ ] **Test 2.3:** Each user moves a different shape
- [ ] **Test 2.4:** Verify all movements sync to all users

**Expected Results:**
- ✅ No duplicates
- ✅ All shapes visible to all users
- ✅ No conflicts or crashes

---

### ✅ Scenario 3: Rapid Updates (2 min)

**Setup:**
1. Open 2 browser windows (User 1 and User 2)

**Tests:**
- [ ] **Test 3.1:** User 1 drags a shape rapidly around the canvas (10-15 seconds)
- [ ] **Test 3.2:** Observe User 2's screen
- [ ] **Test 3.3:** User 2 resizes shape rapidly
- [ ] **Test 3.4:** Observe User 1's screen

**Expected Results:**
- ✅ Smooth real-time movement
- ✅ No lag or stuttering
- ✅ Shape positions stay synchronized

---

### ✅ Scenario 4: Persistence & Recovery (3 min)

**Setup:**
1. Open 2 browser windows

**Tests:**
- [ ] **Test 4.1:** User 1 creates 5 different shapes
- [ ] **Test 4.2:** Refresh User 2's browser (F5)
- [ ] **Test 4.3:** Verify all 5 shapes load correctly
- [ ] **Test 4.4:** Close User 2's browser completely
- [ ] **Test 4.5:** Reopen and sign in
- [ ] **Test 4.6:** Verify all shapes still present

**Expected Results:**
- ✅ All shapes persist after refresh
- ✅ Shapes load on reconnect
- ✅ No duplicates after reload

---

### ✅ Scenario 5: Network Latency (2 min)

**Setup:**
1. Open 2 browser windows
2. User 1: Open Chrome DevTools (F12)
3. Go to Network tab → Throttling dropdown → Select "Slow 3G"

**Tests:**
- [ ] **Test 5.1:** User 1 (slow network) creates shape
- [ ] **Test 5.2:** Observe how long until User 2 sees it
- [ ] **Test 5.3:** User 2 (normal network) creates shape
- [ ] **Test 5.4:** Observe how long until User 1 sees it
- [ ] **Test 5.5:** Reset throttling to "No throttling"

**Expected Results:**
- ✅ Updates still sync (may be slower)
- ✅ No errors or crashes
- ✅ Eventually consistent

---

### ✅ Scenario 6: Duplicate Prevention (2 min)

**Setup:**
1. Open 2 browser windows

**Tests:**
- [ ] **Test 6.1:** User 1 creates a shape
- [ ] **Test 6.2:** Immediately refresh User 2 (within 1 second)
- [ ] **Test 6.3:** Count shapes - should only be 1 instance
- [ ] **Test 6.4:** User 1 creates 3 shapes rapidly
- [ ] **Test 6.5:** Refresh User 2 multiple times
- [ ] **Test 6.6:** Verify only 3 shapes exist (no duplicates)

**Expected Results:**
- ✅ No duplicate shapes
- ✅ Correct shape count
- ✅ IDs are unique

---

### ✅ Scenario 7: Visual Quality (2 min)

**Setup:**
1. Open 2 browser windows

**Tests:**
- [ ] **Test 7.1:** User 1 drags shape slowly → No flickering in User 2
- [ ] **Test 7.2:** User 1 resizes shape → Smooth animation in User 2
- [ ] **Test 7.3:** User 1 creates many shapes → All render properly in User 2
- [ ] **Test 7.4:** Select shape in User 1 → Proper highlighting

**Expected Results:**
- ✅ No flickering
- ✅ Smooth animations
- ✅ Clean rendering
- ✅ Proper selection states

---

## Console Logging

During testing, you should see logs like:

**On initial load:**
```
[Canvas Service] Subscribing to real-time shape updates
[Canvas] Initial load: X shapes
[Canvas] Skipping initial snapshot (already loaded)
```

**When another user creates a shape:**
```
[Canvas Service] Shape added: shape-id-123 (rectangle)
[Canvas Service] Real-time update: 1 changes
[Canvas] Applying 1 real-time changes
[useCanvas] Added shape from real-time update: shape-id-123 (rectangle)
[useCanvas] Applied 1 changes in 0.05ms (added: 1, modified: 0, removed: 0)
```

**When another user moves a shape:**
```
[Canvas Service] Shape modified: shape-id-123 (rectangle)
[Canvas Service] Real-time update: 1 changes
[Canvas] Applying 1 real-time changes
[useCanvas] Modified shape from real-time update: shape-id-123
[useCanvas] Applied 1 changes in 0.03ms (added: 0, modified: 1, removed: 0)
```

---

## Troubleshooting

### Issue: Changes don't sync

**Possible Causes:**
- Firebase not connected → Check Firebase console
- Not signed in → Check auth status
- Network issue → Check browser console for errors

**Solution:**
1. Check browser console for errors
2. Verify Firebase connection
3. Try refreshing both browsers

### Issue: Duplicate shapes appear

**This shouldn't happen!** If it does:
1. Open browser console
2. Look for logs showing "Skipped duplicate shape"
3. Note the shape IDs
4. Report this as a bug

### Issue: Slow sync (>5 seconds)

**Possible Causes:**
- Network latency → Check your connection
- Firestore throttling → Check Firebase console

**Solution:**
1. Test with better network connection
2. Check Firebase quotas
3. Verify Firestore indexes are created

---

## PR Checklist

After completing all tests, verify:

### Multi-User Sync
- [ ] ✅ Shapes created by one user appear for all users
- [ ] ✅ Shape movements sync across all users
- [ ] ✅ Shape resizes sync across all users
- [ ] ✅ Shape deletions sync across all users

### Performance
- [ ] ✅ Sync latency is <100ms for object changes (usually <1ms)
- [ ] ✅ No lag with 10+ shapes
- [ ] ✅ Smooth animations during rapid updates

### Quality
- [ ] ✅ No duplicate shapes appear
- [ ] ✅ Multiple users can work simultaneously
- [ ] ✅ No flickering or visual glitches
- [ ] ✅ No console errors

### Reliability
- [ ] ✅ App handles user disconnects gracefully
- [ ] ✅ Shapes persist after refresh
- [ ] ✅ Works across different browsers
- [ ] ✅ Works on slow networks

---

## Sign-Off

**Tester Name:** ___________________________  
**Date:** ___________________________  
**Test Duration:** ___________________________  

**Overall Result:**
- [ ] ✅ PASS - All scenarios working as expected
- [ ] ⚠️ PASS WITH MINOR ISSUES (describe below)
- [ ] ❌ FAIL - Critical issues found (describe below)

**Notes/Issues Found:**
```
(Write any issues or observations here)




```

**Screenshots/Videos (optional):**
- Attach screenshots or screen recordings showing multi-user sync in action

---

## Next Steps

### If All Tests Pass ✅
1. Mark Task 6.4 as complete in `tasks.md`
2. Update PR #6 status to "READY TO MERGE"
3. Proceed with PR merge
4. Begin PR #7 (Object Locking)

### If Issues Found ⚠️
1. Document issues in detail
2. Create bug tickets if needed
3. Fix issues before merging
4. Re-test after fixes

---

## Quick Reference

**URLs:**
- Dev Server: `http://localhost:5176/`
- Firebase Console: https://console.firebase.google.com/

**Test Accounts:**
- test1@example.com / password123
- test2@example.com / password123
- test3@example.com / password123

**Expected Performance:**
- Sync latency: <1ms (requirement: <100ms)
- Updates appear: within 1 second
- No duplicates: ever
- No flickering: ever

**Key Features to Test:**
- ✅ Create shapes
- ✅ Move shapes
- ✅ Resize shapes
- ✅ Delete shapes
- ✅ Multiple users simultaneously
- ✅ Refresh/reconnect
- ✅ Network latency

---

*Happy Testing! 🚀*

