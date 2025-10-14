# PR #7 - Task 7.6: Manual Testing Guide for Object Locking

**Time Required:** 15-20 minutes  
**Goal:** Verify object locking works correctly with multiple users

---

## 🚀 Quick Start

### 1. Start Development Server

```bash
npm run dev
```

Server should start at: `http://localhost:5173`

### 2. Open Test Windows

**Option A: Multiple Browsers**
- Window 1: Chrome (normal)
- Window 2: Firefox or Safari

**Option B: Incognito Windows**
- Window 1: Chrome (normal)
- Window 2: Chrome (Incognito) - Cmd+Shift+N

**Option C: Chrome Profiles** (Recommended)
- Window 1: Regular profile
- Window 2: Guest/Incognito mode

### 3. Create Test Accounts (if needed)

If you don't have test accounts:
- testuser1@example.com / password123
- testuser2@example.com / password123

Sign up through the UI if they don't exist yet.

---

## ✅ Test Scenarios

### Scenario 1: Basic Lock Acquisition ⭐ MOST IMPORTANT

**Setup:**
1. Window 1: Sign in as User A
2. Window 2: Sign in as User B
3. Create a rectangle in Window 1

**Test Steps:**
1. **Window 1:** Click and hold the rectangle (mousedown, don't release)
   - Expected: Rectangle shows **teal outline** (you have lock)
   
2. **Window 2:** Try to click the same rectangle
   - Expected: Rectangle shows **red outline** (locked by other user)
   - Expected: Cannot drag (shape doesn't move)
   - Expected: Console log: "Cannot interact - shape is locked by [userId]"

3. **Window 1:** Release mouse (mouseup)
   - Expected: Rectangle returns to normal (no outline)

4. **Window 2:** Now try to click the rectangle again
   - Expected: Can now interact with it ✅
   - Expected: Shows teal outline when you grab it

**✅ Pass Criteria:**
- [ ] User A can lock shape by clicking
- [ ] User B sees red outline on locked shape
- [ ] User B cannot drag locked shape
- [ ] Lock releases when User A releases mouse
- [ ] User B can interact after lock released

---

### Scenario 2: Lock During Drag

**Test Steps:**
1. **Window 1:** Click and drag a shape (start dragging)
   - Expected: Teal outline, shape is dragging
   
2. **Window 2:** While Window 1 is still dragging, try to click same shape
   - Expected: Red outline, cannot interact
   
3. **Window 1:** Complete the drag (release mouse)
   - Expected: Shape position updates
   - Expected: Lock released

4. **Window 2:** Try to drag the shape
   - Expected: Can now drag it ✅

**✅ Pass Criteria:**
- [ ] Lock acquired on drag start
- [ ] Other user blocked during drag
- [ ] Lock released on drag end
- [ ] Position updates sync correctly

---

### Scenario 3: Lock During Resize/Transform

**Test Steps:**
1. **Window 1:** Select a shape (click it)
   - Expected: Teal outline + resize handles appear

2. **Window 1:** Click and drag a resize handle (start resizing)
   - Expected: Shape is resizing

3. **Window 2:** Try to click the same shape while it's being resized
   - Expected: Red outline, cannot interact

4. **Window 1:** Release resize handle (complete transform)
   - Expected: New size saved
   - Expected: Lock released

5. **Window 2:** Try to select and resize the shape
   - Expected: Can now resize it ✅

**✅ Pass Criteria:**
- [ ] Lock acquired during transform
- [ ] Other user blocked during transform
- [ ] Lock released on transform end
- [ ] Size updates sync correctly

---

### Scenario 4: Lock Timeout (30 seconds) ⏱️

**Test Steps:**
1. **Window 1:** Click and hold a shape
   - Expected: Shape locked (teal outline)

2. **Window 1:** Close the browser tab/window (simulate crash)
   - Shape remains locked in Firestore

3. **Window 2:** Try to interact with the shape immediately
   - Expected: Red outline, cannot interact (still locked)

4. **Wait 30 seconds** ⏰

5. **Window 2:** Try to interact with the shape again
   - Expected: Can now interact (lock expired) ✅
   - Expected: Teal outline (new lock acquired)

**✅ Pass Criteria:**
- [ ] Lock persists after user disconnects
- [ ] Lock blocks interaction for <30 seconds
- [ ] Lock expires after 30 seconds
- [ ] New user can acquire expired lock

---

### Scenario 5: Rapid Concurrent Clicks (Race Condition)

**Test Steps:**
1. **Setup:** Both windows open, viewing same shape

2. **Both users:** Click the same shape at EXACTLY the same time
   - Expected: One user gets lock (teal), other sees red
   - Expected: No errors in console
   - Expected: Only one lock exists in Firestore

3. Verify which user "won" the race
   - Winner: Can drag the shape
   - Loser: Cannot drag, sees red outline

**✅ Pass Criteria:**
- [ ] Only one user gets lock (first-write-wins)
- [ ] No console errors
- [ ] No duplicate locks
- [ ] Clear winner and loser

---

### Scenario 6: Multiple Shapes, Different Users

**Test Steps:**
1. Create 3 shapes: Rectangle, Circle, Text

2. **Window 1:** Lock and drag Rectangle
3. **Window 2:** Lock and drag Circle (simultaneously)
   - Expected: Both work independently ✅
   
4. **Window 1:** Try to interact with Circle while Window 2 is dragging
   - Expected: Blocked (red outline)

5. **Window 2:** Try to interact with Rectangle while Window 1 is dragging
   - Expected: Blocked (red outline)

6. Both users release their shapes
   - Expected: All locks released

**✅ Pass Criteria:**
- [ ] Multiple locks work simultaneously
- [ ] Locks are shape-specific (not global)
- [ ] Cannot interact with other user's locked shape
- [ ] Can interact with unlocked shapes

---

### Scenario 7: Real-Time Lock Updates

**Test Steps:**
1. **Window 2:** Watch a shape (don't interact)

2. **Window 1:** Click and hold the shape
   - **Window 2 Expected:** Shape changes to red outline in <1 second
   
3. **Window 1:** Release the shape
   - **Window 2 Expected:** Red outline disappears in <1 second

4. Verify real-time sync is working

**✅ Pass Criteria:**
- [ ] Lock status updates appear quickly (<1-2 seconds)
- [ ] Red outline appears when locked by other user
- [ ] Red outline disappears when lock released
- [ ] No flickering or visual glitches

---

## 🔍 What to Look For

### Console Logs

**Good logs (expected):**
```
[Canvas Service] Lock acquired on shape shape-123 by user-abc
[Canvas] Lock acquired on shape shape-123
[Shape] Cannot interact - shape shape-123 is locked by user-abc
[Canvas Service] Lock released on shape shape-123
[Canvas] Lock released on shape shape-123
```

**Bad logs (problems):**
```
❌ Error: Failed to acquire lock
❌ Error: Failed to release lock
❌ Permission denied (Firestore rules issue)
❌ Uncaught exception
```

### Visual Feedback

**Correct visuals:**
- ✅ Teal outline (#00bcd4) = You have the lock
- ✅ Red outline (#ff5722) = Someone else has the lock
- ✅ No outline = Shape is available
- ✅ 70% opacity when locked by others

**Incorrect visuals:**
- ❌ No outline on locked shapes
- ❌ Wrong colors
- ❌ Flickering outlines
- ❌ Shapes disappearing

### Interaction Behavior

**Correct behavior:**
- ✅ Locked shapes don't drag when clicked
- ✅ Transformer doesn't attach to locked shapes
- ✅ Cursor changes on locked shapes
- ✅ Smooth lock acquisition/release

**Incorrect behavior:**
- ❌ Can drag locked shapes
- ❌ Multiple users can drag same shape
- ❌ Locks don't release
- ❌ Locks release too early

---

## 🐛 Common Issues & Solutions

### Issue 1: Lock doesn't release after drag

**Symptoms:** Shape stays locked (red) forever

**Possible causes:**
- dragEnd handler not firing
- Lock release function not called
- Firestore write failed

**Debug:**
1. Check console for error messages
2. Open Firestore console, check `canvasObjects` collection
3. Manually set `lockedBy: null` and `lockedAt: null`

---

### Issue 2: Both users can drag same shape

**Symptoms:** No locking behavior at all

**Possible causes:**
- Lock handlers not connected
- Real-time sync not working
- Lock check bypassed

**Debug:**
1. Check console for lock acquisition logs
2. Verify Firestore rules allow writes
3. Check network tab for Firestore requests

---

### Issue 3: Lock timeout not working

**Symptoms:** Lock never expires after 30 seconds

**Possible causes:**
- `isLockExpired()` not called
- Timeout constant wrong
- Time comparison logic error

**Debug:**
1. Check current time: `Date.now()`
2. Check `lockedAt` timestamp in Firestore
3. Calculate difference: `Date.now() - lockedAt`
4. Should be > 30000 (30 seconds in ms)

---

### Issue 4: Visual indicators not showing

**Symptoms:** No red outline on locked shapes

**Possible causes:**
- CSS not applied
- `isLockedByOther` logic wrong
- Real-time updates not propagating

**Debug:**
1. Check shape props in React DevTools
2. Verify `lockedBy` and `currentUserId` values
3. Check `isLockedByOther` calculation

---

## ✅ Final Checklist

### Core Functionality
- [ ] Lock acquired on mousedown
- [ ] Lock acquired on drag start
- [ ] Lock released on drag end
- [ ] Lock released on transform end
- [ ] Lock expires after 30 seconds

### Visual Feedback
- [ ] Teal outline for your locked shapes
- [ ] Red outline for others' locked shapes
- [ ] 70% opacity for locked shapes
- [ ] No flickering or glitches

### Interaction Blocking
- [ ] Cannot drag locked shapes
- [ ] Cannot resize locked shapes
- [ ] Cannot select locked shapes (functionally)
- [ ] Console feedback when blocked

### Real-Time Sync
- [ ] Lock status updates in <2 seconds
- [ ] Works across different browsers
- [ ] Works in incognito mode
- [ ] Multiple shapes can be locked independently

### Edge Cases
- [ ] Race conditions handled (first-write-wins)
- [ ] Lock timeout works after 30 seconds
- [ ] Disconnected users don't block forever
- [ ] Multiple concurrent operations work

---

## 📝 Test Results Form

**Tester:** ___________________________  
**Date:** ___________________________  
**Time Spent:** ___________________________  

**Overall Result:**
- [ ] ✅ **PASS** - All scenarios working perfectly
- [ ] ⚠️ **PASS WITH ISSUES** - Minor issues found (describe below)
- [ ] ❌ **FAIL** - Critical issues found (describe below)

**Issues Found:**
```
(Describe any problems, unexpected behavior, or bugs)




```

**Notes:**
```
(Any observations, suggestions, or comments)




```

---

## 🎯 Success Criteria

**Minimum for PASS:**
- ✅ Scenario 1 works (basic lock acquisition)
- ✅ Scenario 2 works (lock during drag)
- ✅ No console errors during normal use
- ✅ Visual indicators show correctly
- ✅ Locks release properly

**Bonus (nice to have):**
- ✅ Scenario 4 works (30-second timeout)
- ✅ Scenario 5 works (race conditions)
- ✅ No visual glitches
- ✅ Smooth user experience

---

## 🚀 After Testing

**If all tests pass:**
1. Mark Task 7.6 complete in `tasks.md`
2. Proceed to Task 7.7 (Unit Tests)

**If issues found:**
1. Document issues clearly
2. Report to developer
3. Fix issues before proceeding

---

## 💡 Tips

1. **Open Console:** Keep browser console open (F12) to see logs
2. **Side by Side:** Arrange windows side-by-side for easy comparison
3. **Network Tab:** Check Firestore requests if sync seems slow
4. **Firestore Console:** Monitor `canvasObjects` collection in real-time
5. **Refresh:** If something seems stuck, refresh both windows

---

**Ready to test!** Open `http://localhost:5173` in 2 windows and start with Scenario 1. 🚀

