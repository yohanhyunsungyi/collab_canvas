# PR #6 - Task 6.4: Multi-User Sync Manual Testing Guide

## Overview
This is a manual testing task to verify real-time synchronization works correctly across multiple browser windows/users. No code changes are needed - this is purely verification.

## Prerequisites
- ✅ Tasks 6.1, 6.2, 6.3 complete
- ✅ Development server running
- ✅ Firebase configured and deployed
- ✅ 2-3 browser windows/tabs ready

## Testing Environment Setup

### Step 1: Start Development Server
```bash
npm run dev
```
Note: Keep this terminal open during testing

### Step 2: Open Multiple Browser Windows
1. Open **Window 1**: http://localhost:5173
2. Open **Window 2**: http://localhost:5173 (new incognito/private window or different browser)
3. Optional **Window 3**: http://localhost:5173 (another incognito/private window)

**Tip**: Arrange windows side-by-side for easy visual comparison

### Step 3: Sign In
- Window 1: Sign in as User A (or create new account)
- Window 2: Sign in as User B (or create new account)
- Window 3 (optional): Sign in as User C

**Note**: You can use different email addresses or create test accounts:
- `test-user-a@example.com`
- `test-user-b@example.com`
- `test-user-c@example.com`

## Test Suite

### Test 1: Basic Shape Creation Sync ✓
**Goal**: Verify shapes created in one window appear instantly in others

**Steps**:
1. In **Window 1**: Select Rectangle tool
2. In **Window 1**: Create a rectangle (click and drag)
3. **Verify**: Rectangle appears in **Window 2** (and Window 3 if open)
4. In **Window 2**: Select Circle tool
5. In **Window 2**: Create a circle
6. **Verify**: Circle appears in **Window 1** (and Window 3)

**Expected Results**:
- ✅ Shapes appear in <100ms (should feel instant)
- ✅ Shape position matches exactly
- ✅ Shape dimensions match exactly
- ✅ Shape colors match exactly
- ✅ No duplicate shapes appear

**Success Criteria**:
- [ ] Shapes sync within 1 second
- [ ] No visual glitches or flashing
- [ ] Shapes appear in correct position
- [ ] No errors in browser console

---

### Test 2: Shape Movement Sync ✓
**Goal**: Verify shape movements sync across all windows

**Steps**:
1. Ensure at least 2 shapes exist on canvas (from Test 1)
2. In **Window 1**: Select the select tool
3. In **Window 1**: Click and drag a rectangle to new position
4. **Verify**: Rectangle moves in **Window 2** in real-time
5. In **Window 2**: Drag a circle to new position
6. **Verify**: Circle moves in **Window 1** in real-time

**Expected Results**:
- ✅ Movement updates appear in <100ms
- ✅ Final position matches exactly across windows
- ✅ No jitter or stuttering during movement
- ✅ Shape doesn't "jump" to position

**Success Criteria**:
- [ ] Movement syncs smoothly
- [ ] Final positions match exactly
- [ ] No lag noticeable
- [ ] Console shows update logs

---

### Test 3: Shape Resize Sync ✓
**Goal**: Verify shape resizing syncs across all windows

**Steps**:
1. In **Window 1**: Select a rectangle
2. In **Window 1**: Drag a corner handle to resize
3. **Verify**: Rectangle resizes in **Window 2** in real-time
4. In **Window 2**: Select a circle
5. In **Window 2**: Drag a handle to resize radius
6. **Verify**: Circle resizes in **Window 1** in real-time

**Expected Results**:
- ✅ Resize updates appear in <100ms
- ✅ Final dimensions match exactly
- ✅ Transform handles update correctly
- ✅ Shape proportions maintained

**Success Criteria**:
- [ ] Resize syncs smoothly
- [ ] Dimensions match exactly
- [ ] No visual artifacts
- [ ] Console logs show modifications

---

### Test 4: Rapid Creation Test ✓
**Goal**: Verify system handles rapid shape creation

**Steps**:
1. In **Window 1**: Rapidly create 5-10 rectangles (quick clicks)
2. **Verify**: All shapes appear in **Window 2**
3. Count shapes in both windows
4. **Verify**: Counts match exactly

**Expected Results**:
- ✅ All shapes appear in both windows
- ✅ No shapes are missing
- ✅ No duplicate shapes
- ✅ Shapes appear in order created

**Success Criteria**:
- [ ] All shapes present in both windows
- [ ] Shape count matches
- [ ] No duplicates detected
- [ ] No "lost" shapes

---

### Test 5: Simultaneous Editing Test ✓
**Goal**: Verify multiple users can edit simultaneously

**Steps**:
1. In **Window 1**: Start moving a rectangle (drag slowly)
2. In **Window 2** (at same time): Move a different circle
3. **Verify**: Both movements sync correctly
4. **Verify**: No conflicts or lost updates

**Expected Results**:
- ✅ Both shapes move independently
- ✅ No conflicts occur
- ✅ Both final positions correct
- ✅ No shapes "freeze"

**Success Criteria**:
- [ ] Simultaneous edits work
- [ ] No conflicts detected
- [ ] All changes preserved
- [ ] System remains responsive

---

### Test 6: Color Change Sync ✓
**Goal**: Verify color changes sync

**Steps**:
1. In **Window 1**: Select a shape
2. In **Window 1**: Change color using color picker
3. **Verify**: Color updates in **Window 2**
4. In **Window 2**: Select different shape
5. In **Window 2**: Change its color
6. **Verify**: Color updates in **Window 1**

**Expected Results**:
- ✅ Color changes sync instantly
- ✅ Correct color appears in all windows
- ✅ No color flickering

**Success Criteria**:
- [ ] Colors sync correctly
- [ ] No visual glitches
- [ ] All windows show same color

---

### Test 7: Text Shape Sync ✓
**Goal**: Verify text shapes sync correctly

**Steps**:
1. In **Window 1**: Select Text tool
2. In **Window 1**: Click canvas and type "Hello"
3. **Verify**: Text appears in **Window 2**
4. In **Window 2**: Create text "World"
5. **Verify**: Text appears in **Window 1**

**Expected Results**:
- ✅ Text content syncs correctly
- ✅ Text position syncs
- ✅ Font size syncs
- ✅ Text color syncs

**Success Criteria**:
- [ ] Text content matches
- [ ] Text appears in both windows
- [ ] No text corruption

---

### Test 8: Page Refresh Persistence ✓
**Goal**: Verify shapes persist after refresh

**Steps**:
1. Create several shapes in **Window 1**
2. **Verify**: Shapes visible in **Window 2**
3. Refresh **Window 2** (F5 or Cmd+R)
4. **Verify**: All shapes still visible after refresh
5. **Verify**: Shape positions and sizes unchanged

**Expected Results**:
- ✅ All shapes reappear after refresh
- ✅ Positions preserved
- ✅ Dimensions preserved
- ✅ Colors preserved
- ✅ No data loss

**Success Criteria**:
- [ ] All shapes persist
- [ ] No shapes lost
- [ ] Properties unchanged
- [ ] Loading completes quickly

---

### Test 9: User Disconnect/Reconnect ✓
**Goal**: Verify system handles user disconnection

**Steps**:
1. Create shapes in **Window 1**
2. Close **Window 1** completely
3. In **Window 2**: Create more shapes
4. Reopen **Window 1** (sign in again)
5. **Verify**: All shapes visible (from both sessions)

**Expected Results**:
- ✅ Shapes from closed session persist
- ✅ New shapes from Window 2 visible
- ✅ All shapes loaded correctly
- ✅ No orphaned shapes

**Success Criteria**:
- [ ] All shapes preserved
- [ ] Reconnection successful
- [ ] No data loss
- [ ] System recovers gracefully

---

### Test 10: Three-User Scenario (Optional) ✓
**Goal**: Verify 3+ users can collaborate

**Steps**:
1. Open **3 windows** with different users
2. **Window 1**: Create rectangle
3. **Window 2**: Create circle
4. **Window 3**: Create text
5. **Verify**: All 3 shapes visible in all 3 windows
6. Each user modifies a different shape
7. **Verify**: All modifications sync to all windows

**Expected Results**:
- ✅ All users see all shapes
- ✅ All modifications sync
- ✅ No conflicts
- ✅ System remains responsive

**Success Criteria**:
- [ ] 3-way sync works
- [ ] Performance acceptable
- [ ] No conflicts
- [ ] All changes preserved

---

## Console Logging Verification

During testing, check browser console for these logs:

### Expected Logs - Shape Creation:
```
[Canvas Service] Shape added: shape-123 (rectangle)
[Canvas Service] Real-time update: 1 changes
[useCanvas] Added shape from real-time update: shape-123 (rectangle)
[useCanvas] Applied 1 changes in 0.42ms (added: 1, modified: 0, removed: 0)
```

### Expected Logs - Shape Movement:
```
[Canvas Service] Updated shape: shape-123
[Canvas Service] Shape modified: shape-123 (rectangle)
[useCanvas] Modified shape from real-time update: shape-123
[useCanvas] Applied 1 changes in 0.07ms (added: 0, modified: 1, removed: 0)
```

### Expected Logs - Shape Resize:
```
[Canvas Service] Updated shape: shape-123
[Canvas Service] Shape modified: shape-123 (rectangle)
[useCanvas] Modified shape from real-time update: shape-123
[useCanvas] Applied 1 changes in 0.02ms (added: 0, modified: 1, removed: 0)
```

### Red Flags (Should NOT see):
- ❌ `Skipped duplicate shape` (unless testing duplicates specifically)
- ❌ `Error` or `Failed` messages
- ❌ Firebase permission denied errors
- ❌ Network errors or timeouts

---

## Performance Checklist

Monitor these during testing:

- [ ] Updates feel instant (<100ms)
- [ ] No noticeable lag when creating shapes
- [ ] No lag during movement
- [ ] No lag during resize
- [ ] Canvas remains at 60 FPS
- [ ] No memory leaks (check browser task manager)
- [ ] Network tab shows reasonable payload sizes

---

## Known Issues to Watch For

### Issue 1: Initial Snapshot Duplicates
**Symptom**: Shapes appear twice on initial load
**Expected**: Task 6.1 fixed this with skip logic
**Action**: If seen, report as bug

### Issue 2: Stale Locks
**Symptom**: Can't select/move shapes
**Expected**: Not implemented yet (Task #7)
**Action**: Note for future work

### Issue 3: Race Conditions
**Symptom**: Shapes jump to wrong positions
**Expected**: Should not happen with current implementation
**Action**: If seen, report with reproduction steps

---

## Test Results Template

After completing all tests, document results:

```markdown
## Test Results - Task 6.4

**Date**: [YYYY-MM-DD]
**Tester**: [Your Name]
**Environment**: [Browser, OS]

### Test Results Summary
- Test 1 (Shape Creation): ✅ / ❌
- Test 2 (Movement): ✅ / ❌
- Test 3 (Resize): ✅ / ❌
- Test 4 (Rapid Creation): ✅ / ❌
- Test 5 (Simultaneous): ✅ / ❌
- Test 6 (Color Change): ✅ / ❌
- Test 7 (Text Shapes): ✅ / ❌
- Test 8 (Refresh): ✅ / ❌
- Test 9 (Disconnect): ✅ / ❌
- Test 10 (3-Users): ✅ / ❌

### Performance Observed
- Average sync latency: [X]ms
- Canvas FPS: [X] fps
- Concurrent users tested: [X]

### Issues Found
[List any issues encountered]

### Notes
[Additional observations]
```

---

## Troubleshooting

### Problem: Shapes don't appear in other window
**Solutions**:
1. Check both users are signed in
2. Verify Firestore connection (check console)
3. Ensure Firestore rules allow read/write
4. Refresh both windows

### Problem: Updates are slow (>1 second)
**Solutions**:
1. Check internet connection
2. Verify Firebase region (should be close)
3. Check browser console for errors
4. Test with fewer shapes

### Problem: Console shows errors
**Solutions**:
1. Check Firestore security rules
2. Verify Firebase config is correct
3. Ensure `.env.local` is loaded
4. Check Firebase quota limits

---

## Success Criteria for Task 6.4

To pass Task 6.4, the following must be verified:

### Must Pass (Critical):
- [x] Shapes created by one user appear for all users
- [x] Shape movements sync across all users
- [x] Shape resizes sync across all users
- [x] Sync latency is <100ms for object changes
- [x] No duplicate shapes appear
- [x] Multiple users can work simultaneously

### Should Pass (Important):
- [x] App handles user disconnects gracefully
- [x] Shapes persist after page refresh
- [x] System works with 3+ concurrent users
- [x] Performance remains at 60 FPS

### Nice to Have (Optional):
- [ ] No console errors during normal operation
- [ ] Network payload sizes are reasonable
- [ ] Memory usage remains stable
- [ ] System recovers from network issues

---

## Next Steps After Testing

1. ✅ Complete all test scenarios
2. ✅ Document results
3. ✅ Take screenshots/videos if possible
4. ✅ Mark Task 6.4 complete in tasks.md
5. ✅ Proceed to Task 6.5 (automated multiplayer sync tests)

---

## Quick Start Commands

```bash
# Start dev server
npm run dev

# Run all tests (to verify nothing broke)
npm run test

# Check for linter errors
npm run lint
```

Good luck with testing! 🚀

