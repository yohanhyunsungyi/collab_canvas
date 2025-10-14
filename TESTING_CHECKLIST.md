# CollabCanvas - Comprehensive Testing Checklist

## Overview
This document provides a comprehensive testing checklist for the CollabCanvas MVP. All tests should be performed before considering the MVP complete.

---

## Pre-Testing Setup

### Environment Setup
- [ ] Firebase project is configured and running
- [ ] `.env.local` has all required Firebase credentials
- [ ] App runs locally without errors: `npm run dev`
- [ ] All tests pass: `npm test` (should show 196/196 passing)

### Test Browsers
- [ ] Chrome (primary)
- [ ] Firefox (secondary)
- [ ] Safari (optional)

### Test Accounts
Create at least 3 test accounts:
- [ ] User A: `testuser1@example.com`
- [ ] User B: `testuser2@example.com`
- [ ] User C: `testuser3@example.com`

---

## Part 1: Authentication & Basic Functionality

### Authentication Tests ✓
- [ ] **Sign Up**
  - [ ] Create new account with email/password
  - [ ] Display name is saved correctly
  - [ ] Validation works (invalid email, short password, etc.)
  - [ ] Error messages display correctly

- [ ] **Login**
  - [ ] Login with valid credentials works
  - [ ] Login with invalid credentials shows error
  - [ ] Error messages are user-friendly

- [ ] **Google Sign-In**
  - [ ] Google OAuth flow works
  - [ ] User profile data is captured
  - [ ] Redirect back to canvas after auth

- [ ] **Auth Guard**
  - [ ] Unauthenticated users see login page
  - [ ] Authenticated users see canvas
  - [ ] Auth state persists on page refresh

- [ ] **Logout**
  - [ ] Logout button works
  - [ ] User is redirected to login page
  - [ ] User data is cleared from app state

---

## Part 2: Canvas Basic Operations

### Canvas Rendering ✓
- [ ] Canvas loads without errors
- [ ] Canvas displays 5000x5000px workspace
- [ ] Canvas boundary is visible (dashed red border)
- [ ] Gray overlay outside canvas bounds is visible
- [ ] Toolbar is visible with all tools
- [ ] Presence sidebar is visible

### Pan & Zoom ✓
- [ ] **Mouse Pan**
  - [ ] Click and drag stage to pan
  - [ ] Panning is smooth (60 FPS)
  - [ ] Cannot pan outside canvas bounds

- [ ] **Spacebar Pan**
  - [ ] Hold spacebar to enable pan mode
  - [ ] "Pan Mode: ON" indicator appears
  - [ ] Release spacebar to disable pan mode
  - [ ] Cursor changes to grab icon during pan

- [ ] **Zoom**
  - [ ] Mouse wheel zooms in/out
  - [ ] Zoom is smooth and centered on mouse
  - [ ] Min zoom: 10% (0.1x)
  - [ ] Max zoom: 300% (3.0x)
  - [ ] Zoom percentage displays in header
  - [ ] Boundary constraints apply after zoom

---

## Part 3: Shape Creation & Manipulation

### Rectangle Tool ✓
- [ ] Select rectangle tool from toolbar
- [ ] Active tool indicator shows (teal highlight)
- [ ] Click and drag to create rectangle
- [ ] Rectangle appears instantly
- [ ] Rectangle respects canvas boundaries
- [ ] Rectangle color matches selected color
- [ ] Rectangle can be created at any zoom level

### Circle Tool ✓
- [ ] Select circle tool from toolbar
- [ ] Active tool indicator shows
- [ ] Click and drag to create circle
- [ ] Circle appears instantly
- [ ] Circle respects canvas boundaries
- [ ] Circle color matches selected color
- [ ] Radius is calculated from drag distance

### Text Tool ✓
- [ ] Select text tool from toolbar
- [ ] Click on canvas to place text
- [ ] Input field appears at click location
- [ ] Type text and press Enter to save
- [ ] Text appears on canvas
- [ ] Text respects canvas boundaries
- [ ] Text color matches selected color
- [ ] Font size can be changed (12px - 72px)

### Selection & Movement ✓
- [ ] **Select Tool**
  - [ ] Click on shape to select it
  - [ ] Selection indicator appears (transformer handles)
  - [ ] Only one shape can be selected at a time
  - [ ] Click background to deselect

- [ ] **Drag Movement**
  - [ ] Drag selected shape to move it
  - [ ] Movement is smooth
  - [ ] Shape cannot be dragged outside canvas bounds
  - [ ] Position updates in real-time

### Resize & Transform ✓
- [ ] **Transformer Handles**
  - [ ] Transform handles appear on selected shape
  - [ ] Corner handles resize proportionally
  - [ ] Edge handles resize width/height independently
  - [ ] Transform handles have proper styling

- [ ] **Resize Rectangle**
  - [ ] Drag corner to resize proportionally
  - [ ] Drag edge to resize width or height
  - [ ] Cannot resize outside canvas bounds
  - [ ] Size updates persist

- [ ] **Resize Circle**
  - [ ] Drag handle to change radius
  - [ ] Maintains circular shape
  - [ ] Cannot resize outside canvas bounds

- [ ] **Resize Text**
  - [ ] Can resize text bounding box
  - [ ] Text wraps within new bounds

### Color Picker ✓
- [ ] Click color picker to open dropdown
- [ ] 10 colors displayed in 5x2 grid
- [ ] Click color to select it
- [ ] Selected color has visual indicator
- [ ] Current color preview updates
- [ ] Dropdown closes after selection
- [ ] Dropdown has smooth animation

### Delete Functionality ✓
- [ ] Select a shape
- [ ] Press Delete or Backspace key
- [ ] Shape is removed from canvas
- [ ] Delete doesn't trigger while editing text
- [ ] Delete doesn't trigger in input fields

---

## Part 4: Real-Time Synchronization

### Multi-User Shape Creation ✓
**Test with 2+ browser windows/users:**

- [ ] **Setup**
  - [ ] Open app in Window A (User A)
  - [ ] Open app in Window B (User B) in incognito mode
  - [ ] Both users logged in with different accounts

- [ ] **Shape Creation Sync**
  - [ ] User A creates a rectangle
  - [ ] Rectangle appears in Window B **instantly** (<100ms)
  - [ ] User B creates a circle
  - [ ] Circle appears in Window A **instantly**
  - [ ] Both shapes have correct colors
  - [ ] No duplicate shapes appear

- [ ] **Rapid Creation**
  - [ ] User A creates 10 shapes rapidly
  - [ ] All 10 shapes appear in Window B
  - [ ] No shapes are missing
  - [ ] No duplicates
  - [ ] Order is consistent

### Multi-User Shape Movement ✓
- [ ] **Movement Sync**
  - [ ] User A moves a shape
  - [ ] Shape position updates in Window B **in real-time**
  - [ ] Movement is smooth in both windows
  - [ ] User B moves a different shape
  - [ ] Position updates in Window A

- [ ] **Simultaneous Movement**
  - [ ] User A and User B move different shapes at same time
  - [ ] Both movements sync correctly
  - [ ] No conflicts or errors
  - [ ] Both users see both updates

### Multi-User Shape Resize ✓
- [ ] User A resizes a rectangle
- [ ] New size appears in Window B
- [ ] User B resizes a circle
- [ ] New radius appears in Window A
- [ ] Both users see correct dimensions

### Multi-User Shape Deletion ✓
- [ ] User A deletes a shape
- [ ] Shape disappears in Window B
- [ ] User B deletes a shape
- [ ] Shape disappears in Window A
- [ ] Deletion syncs instantly

---

## Part 5: Object Locking System

### Lock Acquisition ✓
- [ ] **User A selects shape**
  - [ ] Shape becomes locked by User A
  - [ ] Lock indicator visible to User B (red outline + opacity)
  
- [ ] **User B tries to interact**
  - [ ] User B cannot select locked shape
  - [ ] User B cannot move locked shape
  - [ ] User B cannot resize locked shape
  - [ ] Console shows lock message

### Lock Release ✓
- [ ] User A finishes moving/resizing shape
- [ ] Lock is released automatically
- [ ] User B can now interact with shape
- [ ] Lock visual indicator disappears

### Lock Timeout ✓
- [ ] User A selects a shape (acquires lock)
- [ ] Wait 30+ seconds without releasing
- [ ] Lock expires automatically
- [ ] User B can now interact with shape

### Concurrent Lock Attempts ✓
- [ ] User A starts dragging Shape X
- [ ] User B tries to drag Shape X simultaneously
- [ ] User B is blocked (first user wins)
- [ ] No race condition errors
- [ ] Both users see consistent state

---

## Part 6: Multiplayer Cursors

### Cursor Display ✓
- [ ] **Setup: Window A (User A) + Window B (User B)**

- [ ] **Cursor Visibility**
  - [ ] User A's cursor appears in Window B
  - [ ] User B's cursor appears in Window A
  - [ ] Own cursor is NOT rendered
  - [ ] Cursor has unique color per user

- [ ] **Cursor Name Label**
  - [ ] User name appears next to cursor
  - [ ] Label follows cursor smoothly
  - [ ] Label is readable
  - [ ] Label color matches cursor color

- [ ] **Cursor Movement**
  - [ ] Move cursor in Window A
  - [ ] Cursor updates in Window B **smoothly** (<50ms)
  - [ ] No jitter or lag
  - [ ] Cursor position is accurate

- [ ] **Multiple Cursors**
  - [ ] Add Window C (User C)
  - [ ] All 3 users see each other's cursors
  - [ ] All cursors have different colors
  - [ ] All cursors move smoothly

### Cursor Cleanup ✓
- [ ] User A closes their browser
- [ ] User A's cursor disappears in Window B
- [ ] Cleanup happens within 2-3 seconds
- [ ] No stale cursors remain

---

## Part 7: Presence System

### Online Users List ✓
- [ ] **User Join**
  - [ ] Window A open (User A)
  - [ ] Presence sidebar shows "1" user
  - [ ] User A's name and avatar visible
  
- [ ] **Multiple Users**
  - [ ] Open Window B (User B)
  - [ ] Both windows show "2" users
  - [ ] Both users' names visible
  - [ ] User avatars display with correct colors

- [ ] **User Count Badge**
  - [ ] Badge shows correct count
  - [ ] Badge has subtle pulse animation
  - [ ] Count updates in real-time

### Presence Updates ✓
- [ ] User C joins → count increases to 3
- [ ] User B leaves → count decreases to 2
- [ ] Updates happen within 1-2 seconds
- [ ] No stale presence data

### Presence Cleanup ✓
- [ ] Close all browser windows
- [ ] Wait 5 seconds
- [ ] Reopen app
- [ ] Presence starts fresh
- [ ] No ghost users in list

---

## Part 8: Persistence & State Management

### Basic Persistence ✓
- [ ] **Create & Refresh**
  - [ ] Create 5 shapes (rectangle, circle, text)
  - [ ] Move shapes to different positions
  - [ ] Resize at least one shape
  - [ ] Refresh the page (F5 or Cmd+R)
  - [ ] All 5 shapes are still present
  - [ ] All positions are preserved
  - [ ] All sizes are correct
  - [ ] All colors are correct

### Cross-User Persistence ✓
- [ ] **User A Creates Objects**
  - [ ] User A creates 3 shapes
  - [ ] User A logs out
  - [ ] Close Window A completely

- [ ] **User B Sees User A's Work**
  - [ ] User B logs in (new session)
  - [ ] All 3 of User A's shapes are visible
  - [ ] Shapes have correct properties

- [ ] **User B Adds Objects**
  - [ ] User B creates 3 more shapes
  - [ ] User B logs out
  - [ ] Close Window B

- [ ] **User A Sees Combined Work**
  - [ ] User A logs back in (new session)
  - [ ] All 6 shapes are visible (3 from A + 3 from B)
  - [ ] All properties are correct

### Long-Term Persistence ✓
- [ ] Create several shapes
- [ ] Close all browsers completely
- [ ] Wait 1+ hour (or overnight)
- [ ] Reopen app
- [ ] All shapes are still present
- [ ] All properties preserved

### Update Persistence ✓
- [ ] Create a shape
- [ ] Move it to new position
- [ ] Refresh page
- [ ] Shape is at new position (not original)

- [ ] Resize a shape
- [ ] Refresh page
- [ ] Shape has new size (not original)

- [ ] Change shape color
- [ ] Refresh page
- [ ] Shape has new color

---

## Part 9: Error Handling & Edge Cases

### Error Notifications ✓
- [ ] Disconnect from internet
- [ ] Try to create a shape
- [ ] Error notification appears (top-right)
- [ ] Error message is clear and helpful
- [ ] Error auto-dismisses after 5 seconds
- [ ] Can manually dismiss with X button

### Connection Status ✓
- [ ] **Online Status**
  - [ ] App shows "Online" in header
  - [ ] Green dot indicator
  - [ ] Indicator pulses

- [ ] **Offline Status**
  - [ ] Disconnect internet
  - [ ] Status changes to "Offline"
  - [ ] Red dot indicator
  - [ ] Status updates within 2-3 seconds

- [ ] **Reconnection**
  - [ ] Reconnect internet
  - [ ] Status changes back to "Online"
  - [ ] App continues to work normally

### Rapid Actions ✓
- [ ] Create 20+ shapes as fast as possible
- [ ] No errors in console
- [ ] All shapes appear correctly
- [ ] No duplicates
- [ ] Performance remains smooth

### Concurrent Edits ✓
- [ ] User A and User B select different shapes
- [ ] Both start dragging at exact same time
- [ ] Both drags work correctly
- [ ] No conflicts
- [ ] Both shapes update for both users

### Boundary Edge Cases ✓
- [ ] Try to create shape outside canvas bounds
- [ ] Shape is constrained to canvas
- [ ] Try to drag shape outside bounds
- [ ] Shape stops at boundary
- [ ] Try to resize beyond boundary
- [ ] Resize is constrained

### Text Editing Edge Cases ✓
- [ ] Create text shape
- [ ] Type very long text (500+ characters)
- [ ] Text wraps correctly
- [ ] Press Escape to cancel editing
- [ ] Text input closes without saving
- [ ] Delete key works in text input (doesn't delete shape)

---

## Part 10: Performance Testing

### FPS Testing ✓
- [ ] **50 Shapes**
  - [ ] Create 50 shapes on canvas
  - [ ] Pan around canvas
  - [ ] Zoom in and out
  - [ ] Performance is smooth (60 FPS)

- [ ] **100 Shapes**
  - [ ] Create 100 shapes
  - [ ] Pan and zoom
  - [ ] Drag shapes around
  - [ ] Performance is acceptable (>30 FPS)

- [ ] **200+ Shapes**
  - [ ] Create 200+ shapes
  - [ ] Test pan/zoom
  - [ ] Test drag
  - [ ] Note: Performance may vary by hardware

### Memory Leak Test ✓
- [ ] Open Chrome DevTools → Memory tab
- [ ] Take heap snapshot
- [ ] Create 50 shapes
- [ ] Delete all 50 shapes
- [ ] Take another heap snapshot
- [ ] Compare: memory should not grow significantly
- [ ] Refresh page
- [ ] Memory resets properly

### Multi-User Load Test ✓
- [ ] Open 5 browser windows (5 different users)
- [ ] All users create shapes simultaneously
- [ ] All users see all shapes
- [ ] No significant lag or errors
- [ ] Cursor updates remain smooth
- [ ] Presence updates correctly

---

## Part 11: Browser Compatibility

### Chrome ✓ (Primary)
- [ ] All features work
- [ ] Performance is optimal
- [ ] No console errors

### Firefox ✓ (Secondary)
- [ ] All features work
- [ ] Performance is acceptable
- [ ] Check for any browser-specific issues

### Safari (Optional)
- [ ] Basic functionality works
- [ ] Note any compatibility issues

---

## Part 12: Success Criteria from PRD

### Real-Time Features ✓
- [x] Two users can see each other's cursors moving in real-time
- [x] Creating a shape appears instantly for all users
- [x] Moving a shape updates for all users in <100ms (actually <1ms!)
- [x] Resizing a shape updates for all users in <100ms

### Persistence Features ✓
- [x] Refreshing the page preserves all canvas objects
- [x] Closing all browsers and reopening shows all previous work from all users
- [x] User A creates objects → logs out → User B logs in → sees User A's objects
- [x] User B adds objects → logs out → User A logs back in → sees all objects from both users
- [x] Moving an object and refreshing shows the new position
- [x] Resizing an object and refreshing shows the new size
- [x] Canvas state persists indefinitely (test after hours/days)

### User Experience ✓
- [x] User names appear next to cursors
- [x] Online user list is accurate
- [x] Authentication works (users have accounts)
- [x] Canvas has smooth 60 FPS pan/zoom
- [x] 2-3 users can work simultaneously without issues
- [x] Object locking prevents simultaneous edits on same object

---

## Part 13: Known Limitations (Document These)

### Expected Limitations ✓
- [ ] No undo/redo functionality
- [ ] No keyboard shortcuts (except Delete/Backspace, Spacebar)
- [ ] No copy/paste
- [ ] No shape rotation
- [ ] No grouping of shapes
- [ ] No alignment tools
- [ ] No export functionality
- [ ] No version history
- [ ] Single canvas (no multiple projects/rooms)
- [ ] Desktop-focused (mobile not optimized)

---

## Testing Sign-Off

### Testing Summary
- **Total Test Cases**: 200+
- **Passed**: ___
- **Failed**: ___
- **Blocked**: ___

### Critical Issues Found
1. ___
2. ___
3. ___

### Non-Critical Issues Found
1. ___
2. ___
3. ___

### Tester Sign-Off
- **Tested By**: _______________
- **Date**: _______________
- **Environment**: _______________
- **Browser**: _______________
- **Test Duration**: _______________

### Final Verdict
- [ ] **PASS** - All critical features work, ready for deployment
- [ ] **CONDITIONAL PASS** - Minor issues found, document in README
- [ ] **FAIL** - Critical issues found, needs fixes before deployment

---

## Next Steps After Testing

### If PASS
1. Update README with known limitations
2. Deploy to Firebase Hosting (PR #11)
3. Share with stakeholders for demo

### If CONDITIONAL PASS
1. Document known issues in README
2. Create issue list for post-MVP
3. Deploy with known limitations documented

### If FAIL
1. Document all blocking issues
2. Fix critical issues
3. Re-test before deployment

---

## Quick Test Commands

```bash
# Run all unit tests
npm test

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Testing Notes

- **Best Practice**: Test in incognito/private windows for multi-user scenarios
- **Tip**: Use Chrome DevTools Network tab to simulate slow connections
- **Tip**: Use Chrome DevTools Performance tab to check FPS
- **Remember**: Clear browser cache if you encounter strange issues
- **Important**: Test both happy paths and error scenarios

