# Task 7.6: Quick Testing Checklist

**Dev Server:** ✅ Running at http://localhost:5173

---

## 🚀 Quick Setup (2 minutes)

1. **Window 1:** Open http://localhost:5173 in Chrome
   - Sign in as testuser1@example.com (or create account)

2. **Window 2:** Open http://localhost:5173 in Chrome Incognito (Cmd+Shift+N)
   - Sign in as testuser2@example.com (or create account)

3. **Window 1:** Create a rectangle on the canvas

---

## ✅ Essential Tests (5 minutes)

### Test 1: Basic Locking ⭐ MUST PASS

**Window 1:** Click and hold rectangle
- [ ] Rectangle shows **teal outline** (you have lock)

**Window 2:** Try to click same rectangle
- [ ] Rectangle shows **red outline** (locked)
- [ ] Cannot drag it

**Window 1:** Release mouse
- [ ] Rectangle returns to normal

**Window 2:** Click rectangle again
- [ ] Now works! Can drag it ✅

---

### Test 2: Lock During Drag

**Window 1:** Start dragging a shape (don't release)
- [ ] Teal outline while dragging

**Window 2:** Try to grab same shape
- [ ] Red outline, cannot grab

**Window 1:** Complete drag (release)
- [ ] Lock released

**Window 2:** Try again
- [ ] Works now! ✅

---

### Test 3: Lock During Resize

**Window 1:** Select shape, drag resize handle
- [ ] Shape resizing

**Window 2:** Try to click same shape
- [ ] Red outline, cannot interact

**Window 1:** Release resize handle
- [ ] Lock released

**Window 2:** Try to resize
- [ ] Works now! ✅

---

## 🎯 Pass/Fail Decision

**✅ PASS if:**
- Test 1 works completely
- Test 2 works completely
- No console errors
- Visual indicators correct (teal vs red)

**❌ FAIL if:**
- Both users can drag same shape
- No visual indicators
- Console errors
- Locks don't release

---

## 📝 Quick Results

**Result:** [ ] PASS  [ ] FAIL

**Issues Found:**
```
(Write any problems here)


```

**Time Spent:** _______ minutes

---

## 🎉 After Testing

**If PASS:**
- Mark Task 7.6 complete ✅
- Ready for Tasks 7.7 & 7.8 (automated tests)

**If FAIL:**
- Document issues
- Let me know what broke
- I'll fix it

---

**Start here:** http://localhost:5173 🚀

