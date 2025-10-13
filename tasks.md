# CollabCanvas - Task List & PR Breakdown

## Project File Structure Overview

```
collab-canvas/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Login.test.tsx
│   │   │   ├── Signup.tsx
│   │   │   ├── Signup.test.tsx
│   │   │   ├── AuthGuard.tsx
│   │   │   └── AuthGuard.test.tsx
│   │   ├── Canvas/
│   │   │   ├── Canvas.tsx
│   │   │   ├── Canvas.test.tsx
│   │   │   ├── CanvasToolbar.tsx
│   │   │   ├── Shape.tsx
│   │   │   ├── Shape.test.tsx
│   │   │   ├── MultiplayerCursors.tsx
│   │   │   └── MultiplayerCursors.test.tsx
│   │   ├── Presence/
│   │   │   ├── PresenceSidebar.tsx
│   │   │   ├── PresenceSidebar.test.tsx
│   │   │   └── UserAvatar.tsx
│   │   └── UI/
│   │       ├── ColorPicker.tsx
│   │       └── Button.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAuth.test.ts
│   │   ├── useCanvas.ts
│   │   ├── useCanvas.test.ts
│   │   ├── usePresence.ts
│   │   ├── usePresence.test.ts
│   │   ├── useCursors.ts
│   │   └── useCursors.test.ts
│   ├── services/
│   │   ├── firebase.ts
│   │   ├── auth.service.ts
│   │   ├── auth.service.test.ts
│   │   ├── canvas.service.ts
│   │   ├── canvas.service.test.ts
│   │   ├── presence.service.ts
│   │   ├── presence.service.test.ts
│   │   ├── cursor.service.ts
│   │   └── cursor.service.test.ts
│   ├── types/
│   │   ├── canvas.types.ts
│   │   ├── user.types.ts
│   │   └── presence.types.ts
│   ├── utils/
│   │   ├── colors.ts
│   │   ├── colors.test.ts
│   │   └── validation.ts
│   ├── __tests__/
│   │   ├── integration/
│   │   │   ├── auth-flow.test.tsx
│   │   │   ├── canvas-collaboration.test.tsx
│   │   │   ├── shape-persistence.test.tsx
│   │   │   ├── object-locking.test.tsx
│   │   │   └── multiplayer-sync.test.tsx
│   │   └── setup/
│   │       ├── test-utils.tsx
│   │       └── firebase-mock.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── vitest.config.ts
├── .env.test
├── .env.local
├── .gitignore
├── firebase.json
├── .firebaserc
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## PR #1: Project Setup & Firebase Configuration

**Branch:** `feature/project-setup`

**Goal:** Initialize React + TypeScript + Vite project with Firebase integration

### Tasks:

- [x] **1.1: Initialize Vite Project**
  - Run `npm create vite@latest collab-canvas -- --template react-swc-ts`
  - Install base dependencies
  - **Files Created:**
    - `package.json`
    - `vite.config.ts`
    - `tsconfig.json`
    - `src/main.tsx`
    - `src/App.tsx`
    - `src/vite-env.d.ts`
    - `index.html`

- [x] **1.2: Install Dependencies**
  - Run `npm install firebase react-konva konva`
  - Run `npm install -D @types/node`
  - Run `npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
  - **Files Updated:**
    - `package.json`

- [x] **1.3: Create Firebase Project**
  - Go to firebase.google.com and create new project
  - Enable Authentication (Email/Password)
  - Create Firestore Database
  - Create Realtime Database
  - Set up Firebase Hosting
  - Copy Firebase config credentials

- [x] **1.4: Configure Firebase in Project**
  - Create `.env.local` with Firebase credentials
  - Create `src/services/firebase.ts`
  - Initialize Firebase app, auth, firestore, and realtime database
  - **Files Created:**
    - `.env.local` (add to .gitignore)
    - `src/services/firebase.ts`
  - **Files Updated:**
    - `.gitignore`

- [x] **1.5: Create Type Definitions**
  - Create `src/types/user.types.ts`
  - Create `src/types/canvas.types.ts`
  - Create `src/types/presence.types.ts`
  - **Files Created:**
    - `src/types/user.types.ts`
    - `src/types/canvas.types.ts`
    - `src/types/presence.types.ts`

- [x] **1.6: Setup Firebase Hosting Config**
  - Run `firebase init hosting`
  - Configure for single-page app
  - **Files Created:**
    - `firebase.json`
    - `.firebaserc`

- [x] **1.7: Create Basic README**
  - Document setup instructions
  - List environment variables needed
  - Add deployment instructions
  - **Files Created:**
    - `README.md`

- [x] **1.8: Setup Testing Infrastructure**
  - Create `vitest.config.ts` for test configuration
  - Create `src/__tests__/setup/test-utils.tsx` for test utilities
  - Create `src/__tests__/setup/firebase-mock.ts` for Firebase mocks
  - Create `.env.test` for test environment variables
  - Add test scripts to package.json
  - **Files Created:**
    - `vitest.config.ts`
    - `src/__tests__/setup/test-utils.tsx`
    - `src/__tests__/setup/firebase-mock.ts`
    - `.env.test`
  - **Files Updated:**
    - `package.json`

**PR Checklist Before Merge:**
- [x] Project builds without errors (`npm run build`)
- [x] Firebase connection works (test import in App.tsx)
- [x] Environment variables documented
- [x] .gitignore includes .env.local

---

## PR #2: Authentication System

**Branch:** `feature/authentication`

**Goal:** Implement user signup, login, and auth state management

### Tasks:

- [x] **2.1: Create Auth Service**
  - Implement signup function
  - Implement login function
  - Implement logout function
  - Implement auth state observer
  - **Files Created:**
    - `src/services/auth.service.ts`
    - `src/utils/colors.ts`

- [x] **2.2: Create Auth Hook**
  - Create `useAuth` hook for auth state management
  - Handle loading states
  - Handle errors
  - **Files Created:**
    - `src/hooks/useAuth.ts`

- [x] **2.3: Create Login Component**
  - Email and password inputs
  - Form validation
  - Error display
  - Link to signup
  - **Files Created:**
    - `src/components/Auth/Login.tsx`
    - `src/components/Auth/Auth.css`

- [x] **2.4: Create Signup Component**
  - Email, password, and display name inputs
  - Form validation
  - Error display
  - Link to login
  - **Files Created:**
    - `src/components/Auth/Signup.tsx`

- [x] **2.5: Create AuthGuard Component**
  - Protect routes that require authentication
  - Redirect to login if not authenticated
  - Show loading state
  - **Files Created:**
    - `src/components/Auth/AuthGuard.tsx`

- [x] **2.6: Create Basic UI Components**
  - Create reusable Button component
  - Create basic form styling
  - **Files Created:**
    - `src/components/UI/Button.tsx`
    - `src/components/UI/Button.css`

- [x] **2.7: Update App.tsx with Auth Flow**
  - Add routing logic (login/signup vs canvas)
  - Integrate AuthGuard
  - Test auth flow
  - **Files Created:**
    - `src/components/Canvas/CanvasPlaceholder.tsx`
    - `src/components/Canvas/CanvasPlaceholder.css`
  - **Files Updated:**
    - `src/App.tsx`
    - `src/App.css`

- [x] **2.8: Unit Tests for Auth Service**
  - Test signup function with valid credentials
  - Test signup with invalid/duplicate email
  - Test login function with valid credentials
  - Test login with invalid credentials
  - Test Google login function
  - Test logout function
  - Test auth state observer
  - **Files Created:**
    - `src/services/auth.service.test.ts`
  - **Files Updated:**
    - `src/__tests__/setup/firebase-mock.ts`

- [x] **2.9: Unit Tests for Auth Hook**
  - Test useAuth returns correct initial state
  - Test loading states during auth operations
  - Test error handling
  - Test successful login updates state
  - Test Google login
  - Test logout functionality
  - Test clearError function
  - Test unsubscribe on unmount
  - **Files Created:**
    - `src/hooks/useAuth.test.ts`

- [x] **2.10: Component Tests for Auth UI**
  - Test Login component renders correctly
  - Test Signup component renders correctly
  - Test AuthGuard shows loading/fallback/children
  - **Files Created:**
    - `src/components/Auth/Login.test.tsx`
    - `src/components/Auth/Signup.test.tsx`
    - `src/components/Auth/AuthGuard.test.tsx`

- [x] **2.11: Integration Test - Auth Flow**
  - Test basic App rendering with auth
  - Test login page when not authenticated
  - Test canvas when authenticated
  - **Files Created:**
    - `src/__tests__/integration/auth-flow.test.tsx`

**PR Checklist Before Merge:**
- [x] Users can sign up with email/password
- [x] Users can log in (email + Google)
- [x] Users can log out
- [x] Auth state persists on refresh
- [x] Error messages display correctly
- [x] Loading states work properly
- [x] All unit tests pass (`npm run test`)
- [x] Integration test for auth flow passes
- [x] Google social login implemented

---

## PR #3: Basic Canvas Setup

**Branch:** `feature/canvas-setup`

**Goal:** Create canvas workspace with pan/zoom functionality

### Tasks:

- [ ] **3.1: Create Canvas Component**
  - Initialize Konva Stage and Layer
  - Set up canvas dimensions (5000x5000)
  - Add viewport state management
  - **Files Created:**
    - `src/components/Canvas/Canvas.tsx`

- [ ] **3.2: Implement Pan Functionality**
  - Add drag functionality to stage
  - Implement spacebar + drag alternative
  - Add boundary constraints (optional)
  - **Files Updated:**
    - `src/components/Canvas/Canvas.tsx`

- [ ] **3.3: Implement Zoom Functionality**
  - Add mouse wheel zoom
  - Implement zoom constraints (min/max)
  - Zoom toward mouse position
  - **Files Updated:**
    - `src/components/Canvas/Canvas.tsx`

- [ ] **3.4: Create Canvas Toolbar**
  - Tool selection buttons (rectangle, circle, text, select)
  - Color picker integration
  - Active tool indicator
  - **Files Created:**
    - `src/components/Canvas/CanvasToolbar.tsx`
    - `src/components/UI/ColorPicker.tsx`

- [ ] **3.5: Create Canvas Hook**
  - Manage canvas state (objects, selected object, active tool)
  - Handle tool switching
  - Manage viewport state
  - **Files Created:**
    - `src/hooks/useCanvas.ts`

- [ ] **3.6: Create Color Utility**
  - Predefined color palette
  - Random color generator for users
  - **Files Created:**
    - `src/utils/colors.ts`

- [ ] **3.7: Integrate Canvas into App**
  - Add canvas to authenticated route
  - Test pan/zoom performance
  - Verify 60 FPS performance
  - **Files Updated:**
    - `src/App.tsx`

- [ ] **3.8: Unit Tests for Color Utility**
  - Test predefined color palette returns valid colors
  - Test random color generator produces hex colors
  - Test color assignment logic
  - **Files Created:**
    - `src/utils/colors.test.ts`

- [ ] **3.9: Component Tests for Canvas**
  - Test Canvas component renders Konva Stage
  - Test pan functionality works
  - Test zoom functionality works
  - Test tool switching updates state
  - **Files Created:**
    - `src/components/Canvas/Canvas.test.tsx`

**PR Checklist Before Merge:**
- [ ] Canvas renders with correct dimensions
- [ ] Pan works smoothly (click-drag and spacebar-drag)
- [ ] Zoom works smoothly (mouse wheel)
- [ ] Toolbar displays and switches tools
- [ ] Performance is 60 FPS during pan/zoom
- [ ] No console errors
- [ ] Color utility tests pass
- [ ] Canvas component tests pass

---

## PR #4: Shape Creation (No Persistence)

**Branch:** `feature/shape-creation`

**Goal:** Create rectangles, circles, and text locally (no Firestore yet)

### Tasks:

- [ ] **4.1: Create Shape Component**
  - Generic Shape component for Konva
  - Support rectangle, circle, text types
  - Handle selection state styling
  - **Files Created:**
    - `src/components/Canvas/Shape.tsx`

- [ ] **4.2: Implement Rectangle Creation**
  - Click and drag to create rectangle
  - Set dimensions based on drag distance
  - Apply selected color
  - Add to local canvas state
  - **Files Updated:**
    - `src/components/Canvas/Canvas.tsx`
    - `src/hooks/useCanvas.ts`

- [ ] **4.3: Implement Circle Creation**
  - Click and drag to create circle
  - Calculate radius based on drag distance
  - Apply selected color
  - Add to local canvas state
  - **Files Updated:**
    - `src/components/Canvas/Canvas.tsx`
    - `src/hooks/useCanvas.ts`

- [ ] **4.4: Implement Text Creation**
  - Click to place text
  - Show input field for text entry
  - Apply selected color
  - Set font size
  - Add to local canvas state
  - **Files Updated:**
    - `src/components/Canvas/Canvas.tsx`
    - `src/hooks/useCanvas.ts`

- [ ] **4.5: Implement Shape Selection**
  - Click shape to select
  - Show selection border/highlight
  - Deselect on background click
  - **Files Updated:**
    - `src/components/Canvas/Canvas.tsx`
    - `src/components/Canvas/Shape.tsx`
    - `src/hooks/useCanvas.ts`

- [ ] **4.6: Implement Shape Movement**
  - Drag selected shape to move
  - Update shape position in state
  - Smooth movement (no lag)
  - **Files Updated:**
    - `src/components/Canvas/Shape.tsx`
    - `src/hooks/useCanvas.ts`

- [ ] **4.7: Implement Shape Resize**
  - Add Konva Transformer for resize handles
  - Corner handles for proportional resize
  - Edge handles for width/height adjustment
  - Update shape dimensions in state
  - Visual feedback during resize
  - **Files Updated:**
    - `src/components/Canvas/Shape.tsx`
    - `src/components/Canvas/Canvas.tsx`
    - `src/hooks/useCanvas.ts`

- [ ] **4.8: Unit Tests for Canvas Hook**
  - Test adding shapes to canvas state
  - Test shape selection logic
  - Test shape movement updates state
  - Test shape resize updates state
  - Test tool switching
  - **Files Updated:**
    - `src/hooks/useCanvas.test.ts`

- [ ] **4.9: Component Tests for Shape**
  - Test Shape component renders different types correctly
  - Test shape responds to selection
  - Test shape can be dragged
  - Test shape can be resized with handles
  - Test shape styling based on selection state
  - **Files Created:**
    - `src/components/Canvas/Shape.test.tsx`

**PR Checklist Before Merge:**
- [ ] Can create rectangles by click-drag
- [ ] Can create circles by click-drag
- [ ] Can create text by clicking and typing
- [ ] Can select shapes by clicking
- [ ] Can move shapes by dragging
- [ ] Can resize shapes using transform handles
- [ ] Corner handles resize proportionally
- [ ] Edge handles resize width/height independently
- [ ] All shapes render correctly with colors
- [ ] Performance remains 60 FPS with 50+ shapes
- [ ] Canvas hook tests pass
- [ ] Shape component tests pass

---

## PR #5: Firestore Integration & Persistence

**Branch:** `feature/firestore-persistence`

**Goal:** Save all shapes to Firestore and load on app start. Implement **persistent shared canvas** where all users' work is saved permanently and loads for everyone.

### Tasks:

- [ ] **5.1: Create Canvas Service**
  - Function to create shape in Firestore
  - Function to update shape in Firestore (position AND size)
  - Function to delete shape in Firestore
  - Function to fetch all shapes
  - Function to subscribe to shape changes
  - **Files Created:**
    - `src/services/canvas.service.ts`

- [ ] **5.2: Setup Firestore Collection Structure**
  - Create `canvasObjects` collection
  - Define document schema with all fields
  - Add Firestore indexes if needed
  - **Files Updated:**
    - `src/services/canvas.service.ts`

- [ ] **5.3: Implement Shape Creation Persistence**
  - On shape creation, immediately write to Firestore
  - Add createdBy, createdAt fields
  - Generate unique shape IDs
  - **Files Updated:**
    - `src/hooks/useCanvas.ts`
    - `src/services/canvas.service.ts`

- [ ] **5.4: Implement Shape Movement Persistence**
  - On shape move, update Firestore document
  - Add lastModifiedBy, lastModifiedAt fields
  - Throttle updates to prevent excessive writes (optional)
  - **Files Updated:**
    - `src/hooks/useCanvas.ts`
    - `src/components/Canvas/Shape.tsx`
    - `src/services/canvas.service.ts`

- [ ] **5.4b: Implement Shape Resize Persistence**
  - On shape resize, update Firestore document with new dimensions
  - Update width/height or radius fields
  - Add lastModifiedBy, lastModifiedAt fields
  - Throttle updates to prevent excessive writes (optional)
  - **Files Updated:**
    - `src/hooks/useCanvas.ts`
    - `src/components/Canvas/Shape.tsx`
    - `src/services/canvas.service.ts`

- [ ] **5.5: Implement Initial Load from Firestore**
  - On app load, fetch all shapes from Firestore (from ALL users)
  - Render all shapes on canvas
  - Handle loading state
  - **This creates the shared persistent canvas experience**
  - **Files Updated:**
    - `src/hooks/useCanvas.ts`
    - `src/components/Canvas/Canvas.tsx`

- [ ] **5.6: Test Persistence and Shared Canvas**
  - Create shapes → refresh page → verify shapes persist
  - Move shapes → refresh page → verify positions persist
  - Resize shapes → refresh page → verify sizes persist
  - Close browser → reopen → verify all data persists
  - **User A creates shapes → logs out → User B logs in → verify User B sees User A's shapes**
  - **User B adds shapes → logs out → User A logs back in → verify User A sees all shapes from both users**
  - **User A resizes shapes → User B sees updated sizes**
  - **Leave canvas idle for extended time → return → verify all work still there**
  - **Testing only, no file changes**

- [ ] **5.7: Unit Tests for Canvas Service**
  - Test createShape writes to Firestore correctly
  - Test updateShape updates document (position and size)
  - Test deleteShape removes document
  - Test fetchAllShapes retrieves all documents
  - Mock Firestore operations
  - **Files Created:**
    - `src/services/canvas.service.test.ts`

- [ ] **5.8: Integration Test - Shape Persistence**
  - Test shape creation persists to Firestore
  - Test shape movement updates Firestore
  - Test app loads shapes from Firestore on mount
  - Test persistence across browser refresh
  - **Test shared canvas: Mock User A creates shapes, Mock User B should see them**
  - **Test all users see the same persistent canvas state**
  - **Files Created:**
    - `src/__tests__/integration/shape-persistence.test.tsx`

**PR Checklist Before Merge:**
- [ ] Shapes save to Firestore on creation
- [ ] Shape positions save to Firestore on move
- [ ] Shape sizes save to Firestore on resize
- [ ] App loads all shapes from Firestore on startup
- [ ] Refresh preserves all shapes, positions, and sizes
- [ ] Closing and reopening browser preserves work
- [ ] **Different users see the same shared canvas**
- [ ] **User A's work persists for User B to see**
- [ ] **Resized shapes persist correctly**
- [ ] **Canvas state persists across extended time periods**
- [ ] No duplicate shapes created
- [ ] Canvas service unit tests pass
- [ ] Shape persistence integration test passes

---

## PR #6: Real-Time Synchronization

**Branch:** `feature/realtime-sync`

**Goal:** Multi-user shape synchronization using Firestore listeners

### Tasks:

- [ ] **6.1: Setup Firestore Listener**
  - Subscribe to `canvasObjects` collection with `onSnapshot()`
  - Handle added documents
  - Handle modified documents
  - Handle removed documents
  - **Files Updated:**
    - `src/services/canvas.service.ts`
    - `src/hooks/useCanvas.ts`

- [ ] **6.2: Handle Real-Time Shape Creation**
  - When another user creates shape, add to local canvas
  - Prevent duplicate rendering
  - Verify shape appears instantly (<100ms)
  - **Files Updated:**
    - `src/hooks/useCanvas.ts`

- [ ] **6.3: Handle Real-Time Shape Updates**
  - When another user moves shape, update local canvas
  - When another user resizes shape, update local canvas
  - Smooth position and size updates
  - Verify updates appear quickly (<100ms)
  - **Files Updated:**
    - `src/hooks/useCanvas.ts`

- [ ] **6.4: Test Multi-User Sync**
  - Open 2 browser windows
  - Create shapes in window 1 → verify appear in window 2
  - Move shapes in window 2 → verify updates in window 1
  - Resize shapes in window 1 → verify updates in window 2
  - Test with 3+ simultaneous users
  - **Testing only, no file changes**

- [ ] **6.5: Integration Test - Multiplayer Sync**
  - Test real-time shape creation syncs across mock users
  - Test real-time shape movement syncs across mock users
  - Test real-time shape resize syncs across mock users
  - Test sync latency is acceptable
  - Test no duplicate shapes appear
  - Test handling of simultaneous edits
  - **Files Created:**
    - `src/__tests__/integration/multiplayer-sync.test.tsx`

**PR Checklist Before Merge:**
- [ ] Shapes created by one user appear for all users
- [ ] Shape movements sync across all users
- [ ] Shape resizes sync across all users
- [ ] Sync latency is <100ms for object changes
- [ ] No duplicate shapes appear
- [ ] Multiple users can work simultaneously
- [ ] App handles user disconnects gracefully
- [ ] Multiplayer sync integration test passes

---

## PR #7: Object Locking System

**Branch:** `feature/object-locking`

**Goal:** Prevent race conditions when multiple users interact with same object

### Tasks:

- [ ] **7.1: Add Lock Fields to Firestore Schema**
  - Add `lockedBy` field (userId or null)
  - Add `lockedAt` field (timestamp)
  - Update type definitions
  - **Files Updated:**
    - `src/types/canvas.types.ts`
    - `src/services/canvas.service.ts`

- [ ] **7.2: Implement Lock Acquisition**
  - On mousedown on shape, attempt to acquire lock
  - Write userId to `lockedBy` field
  - Check if lock is available before acquiring
  - **Files Created:**
    - `src/utils/locking.ts` (optional helper)
  - **Files Updated:**
    - `src/components/Canvas/Shape.tsx`
    - `src/services/canvas.service.ts`

- [ ] **7.3: Implement Lock Release**
  - On mouseup, release lock (set `lockedBy` to null)
  - On drag end, release lock
  - Handle automatic timeout (30 seconds)
  - **Files Updated:**
    - `src/components/Canvas/Shape.tsx`
    - `src/services/canvas.service.ts`

- [ ] **7.4: Implement Lock Visual Indicator**
  - Show visual indicator when object is locked by another user
  - Display which user has locked the object
  - Disable interaction for locked objects
  - **Files Updated:**
    - `src/components/Canvas/Shape.tsx`

- [ ] **7.5: Prevent Interaction with Locked Objects**
  - Block selection of locked objects
  - Block movement of locked objects
  - Block resize of locked objects
  - Show feedback when user tries to interact with locked object
  - **Files Updated:**
    - `src/components/Canvas/Shape.tsx`
    - `src/hooks/useCanvas.ts`

- [ ] **7.6: Test Lock System**
  - Open 2 windows, try to move same object simultaneously
  - Verify first user gets lock
  - Verify second user cannot interact until lock released
  - Test lock timeout after 30 seconds
  - **Testing only, no file changes**

- [ ] **7.7: Unit Tests for Locking Logic**
  - Test lock acquisition sets lockedBy field
  - Test lock release clears lockedBy field
  - Test lock timeout after 30 seconds
  - Test lock validation before interaction
  - **Files Created:**
    - `src/utils/locking.test.ts` (if locking.ts was created)

- [ ] **7.8: Integration Test - Object Locking**
  - Test first user acquires lock successfully
  - Test second user blocked from interacting with locked object
  - Test lock releases on mouseup
  - Test lock timeout mechanism
  - Test visual indicators for locked objects
  - **Files Created:**
    - `src/__tests__/integration/object-locking.test.tsx`

**PR Checklist Before Merge:**
- [ ] First user to interact with object acquires lock
- [ ] Other users cannot select/move/resize locked objects
- [ ] Visual indicator shows which user has lock
- [ ] Lock releases on mouseup/drag end/resize end
- [ ] Lock auto-releases after 30 seconds
- [ ] No race conditions during simultaneous interactions
- [ ] Locking logic unit tests pass (if applicable)
- [ ] Object locking integration test passes

---

## PR #8: Multiplayer Cursors

**Branch:** `feature/multiplayer-cursors`

**Goal:** Show real-time cursor positions for all connected users

### Tasks:

- [ ] **8.1: Create Cursor Service**
  - Function to update cursor position in Realtime DB
  - Function to subscribe to all cursor positions
  - Throttle updates to 60fps (every ~16ms)
  - **Files Created:**
    - `src/services/cursor.service.ts`

- [ ] **8.2: Create Cursor Hook**
  - Track own cursor position
  - Subscribe to other users' cursors
  - Update Realtime DB on mouse move
  - Clean up on unmount
  - **Files Created:**
    - `src/hooks/useCursors.ts`

- [ ] **8.3: Create MultiplayerCursors Component**
  - Render cursor for each connected user
  - Display user name label next to cursor
  - Assign unique color to each user
  - Position cursors relative to canvas viewport
  - **Files Created:**
    - `src/components/Canvas/MultiplayerCursors.tsx`

- [ ] **8.4: Integrate Cursors into Canvas**
  - Track mouse position on canvas
  - Convert mouse position to canvas coordinates
  - Update cursor position in Realtime DB
  - Render MultiplayerCursors component
  - **Files Updated:**
    - `src/components/Canvas/Canvas.tsx`
    - `src/hooks/useCanvas.ts`

- [ ] **8.5: Test Cursor Sync**
  - Open 2 windows, move mouse
  - Verify cursor appears in other window
  - Verify latency is <50ms
  - Test with 3-5 simultaneous users
  - **Testing only, no file changes**

- [ ] **8.6: Unit Tests for Cursor Service**
  - Test updateCursorPosition writes to Realtime DB
  - Test cursor position data structure is correct
  - Test throttling mechanism (if implemented)
  - Mock Realtime DB operations
  - **Files Created:**
    - `src/services/cursor.service.test.ts`

- [ ] **8.7: Unit Tests for Cursor Hook**
  - Test useCursors subscribes to cursor positions
  - Test cursor updates trigger state changes
  - Test cleanup on unmount
  - **Files Created:**
    - `src/hooks/useCursors.test.ts`

- [ ] **8.8: Component Tests for MultiplayerCursors**
  - Test renders cursor for each user
  - Test displays user names correctly
  - Test applies unique colors per user
  - Test cursor positioning is correct
  - **Files Created:**
    - `src/components/Canvas/MultiplayerCursors.test.tsx`

**PR Checklist Before Merge:**
- [ ] Cursors show for all connected users
- [ ] User names display next to cursors
- [ ] Each user has unique cursor color
- [ ] Cursor positions sync in <50ms
- [ ] Cursors move smoothly (no jitter)
- [ ] Own cursor is not rendered (only others)
- [ ] Cursor service unit tests pass
- [ ] Cursor hook unit tests pass
- [ ] MultiplayerCursors component tests pass

---

## PR #9: Presence System

**Branch:** `feature/presence`

**Goal:** Show which users are currently online and editing

### Tasks:

- [ ] **9.1: Create Presence Service**
  - Function to mark user as online
  - Function to mark user as offline
  - Function to subscribe to all online users
  - Use Realtime DB's onDisconnect() for cleanup
  - **Files Created:**
    - `src/services/presence.service.ts`

- [ ] **9.2: Create Presence Hook**
  - Set user online on mount
  - Set user offline on unmount
  - Subscribe to online users list
  - Handle connection state changes
  - **Files Created:**
    - `src/hooks/usePresence.ts`

- [ ] **9.3: Create UserAvatar Component**
  - Display user initial or icon
  - Show user color
  - Show online status indicator
  - **Files Created:**
    - `src/components/Presence/UserAvatar.tsx`

- [ ] **9.4: Create PresenceSidebar Component**
  - List all online users
  - Show user count
  - Display user avatars
  - Show who's editing (optional)
  - **Files Created:**
    - `src/components/Presence/PresenceSidebar.tsx`

- [ ] **9.5: Integrate Presence into App**
  - Add PresenceSidebar to Canvas layout
  - Initialize presence on login
  - Clean up presence on logout
  - **Files Updated:**
    - `src/components/Canvas/Canvas.tsx`
    - `src/App.tsx`

- [ ] **9.6: Test Presence**
  - Open 2 windows, verify both users show as online
  - Close one window, verify user removed from list
  - Test with 5+ simultaneous users
  - **Testing only, no file changes**

- [ ] **9.7: Unit Tests for Presence Service**
  - Test setUserOnline writes to Realtime DB
  - Test setUserOffline clears presence data
  - Test onDisconnect() hook works correctly
  - Mock Realtime DB operations
  - **Files Created:**
    - `src/services/presence.service.test.ts`

- [ ] **9.8: Unit Tests for Presence Hook**
  - Test usePresence sets user online on mount
  - Test usePresence subscribes to online users
  - Test cleanup sets user offline on unmount
  - **Files Created:**
    - `src/hooks/usePresence.test.ts`

- [ ] **9.9: Component Tests for Presence Sidebar**
  - Test renders list of online users
  - Test displays correct user count
  - Test user avatars render correctly
  - Test updates when users join/leave
  - **Files Created:**
    - `src/components/Presence/PresenceSidebar.test.tsx`

**PR Checklist Before Merge:**
- [ ] Online users list is accurate
- [ ] Users appear when they join
- [ ] Users disappear when they leave
- [ ] User count is correct
- [ ] Presence updates in real-time
- [ ] No stale user data after disconnect
- [ ] Presence service unit tests pass
- [ ] Presence hook unit tests pass
- [ ] PresenceSidebar component tests pass

---

## PR #10: Polish & Final Testing

**Branch:** `feature/polish`

**Goal:** Final UI polish, bug fixes, and comprehensive testing

### Tasks:

- [ ] **10.1: Add Loading States**
  - Show loading spinner on app load
  - Show loading during authentication
  - Show loading while fetching canvas objects
  - **Files Updated:**
    - `src/components/Canvas/Canvas.tsx`
    - `src/components/Auth/Login.tsx`
    - `src/components/Auth/Signup.tsx`

- [ ] **10.2: Add Error Handling**
  - Display error messages for failed operations
  - Handle Firestore errors gracefully
  - Show connection status
  - **Files Updated:**
    - `src/hooks/useCanvas.ts`
    - `src/hooks/useAuth.ts`
    - `src/hooks/useCursors.ts`

- [ ] **10.3: Improve Visual Design**
  - Add consistent styling across components
  - Improve toolbar appearance
  - Add hover states to buttons
  - Polish selection indicators
  - **Files Updated:**
    - `src/components/Canvas/CanvasToolbar.tsx`
    - `src/components/Canvas/Shape.tsx`
    - `src/components/UI/Button.tsx`
    - Add global CSS file if needed

- [ ] **10.4: Add Delete Functionality**
  - Add delete key handler
  - Remove from Firestore
  - Sync deletion across users
  - **Files Updated:**
    - `src/hooks/useCanvas.ts`
    - `src/services/canvas.service.ts`

- [ ] **10.5: Optimize Performance**
  - Verify 60 FPS with 500+ objects
  - Optimize Firestore queries
  - Throttle cursor updates if needed
  - Check for memory leaks
  - **Files Updated:** (various optimizations)

- [ ] **10.6: Comprehensive Testing Checklist**
  - Test all success criteria from PRD
  - Test with 5+ simultaneous users
  - Test edge cases (rapid creation, disconnect/reconnect)
  - Verify all persistence scenarios
  - **Testing only, no file changes**

- [ ] **10.7: Update README**
  - Add feature documentation
  - Add screenshots/GIFs
  - Document known limitations
  - Add troubleshooting section
  - **Files Updated:**
    - `README.md`

- [ ] **10.8: Integration Test - Complete Collaboration Flow**
  - Test complete workflow: login → create shapes → move shapes → resize shapes → sync across users
  - Test object locking during collaboration
  - Test presence awareness
  - Test cursor synchronization
  - Test persistence across sessions
  - **Files Created:**
    - `src/__tests__/integration/canvas-collaboration.test.tsx`

- [ ] **10.9: Run Full Test Suite**
  - Run all unit tests: `npm run test`
  - Run all integration tests
  - Verify test coverage is adequate
  - Fix any failing tests
  - **Testing only, review test output**

**PR Checklist Before Merge:**
- [ ] All MVP success criteria met
- [ ] No console errors or warnings
- [ ] Performance is 60 FPS with 500+ objects
- [ ] 5+ users can work simultaneously
- [ ] All persistence scenarios work correctly
- [ ] UI is polished and intuitive
- [ ] README is comprehensive
- [ ] All unit tests pass (100% of test suite)
- [ ] All integration tests pass
- [ ] Complete collaboration integration test passes
- [ ] Test coverage meets minimum standards

---

## PR #11: Deployment

**Branch:** `feature/deployment`

**Goal:** Deploy to Firebase Hosting and verify production

### Tasks:

- [ ] **11.1: Build Production Bundle**
  - Run `npm run build`
  - Verify build completes without errors
  - Test production build locally
  - **Files Updated:**
    - `dist/` folder created

- [ ] **11.2: Configure Firebase Hosting**
  - Update `firebase.json` with correct build folder
  - Configure redirects for SPA
  - Set up caching rules
  - **Files Updated:**
    - `firebase.json`

- [ ] **11.3: Deploy to Firebase**
  - Run `firebase deploy`
  - Verify deployment succeeds
  - Get public URL
  - **No file changes**

- [ ] **11.4: Test Production App**
  - Test authentication in production
  - Test canvas creation and sync
  - Test with multiple users
  - Verify all features work
  - **Testing only, no file changes**

- [ ] **11.5: Setup Environment Variables in Production**
  - Ensure Firebase config is correct
  - Verify environment variables load properly
  - **No file changes (env vars in Firebase Hosting)**

- [ ] **11.6: Final Production Checklist**
  - HTTPS working
  - Authentication working
  - Real-time sync working
  - 5+ users can connect
  - No console errors
  - **Testing only, no file changes**

- [ ] **11.7: Create Demo Video**
  - Record 3-5 minute demo
  - Show all MVP features
  - Demonstrate multi-user collaboration
  - Explain architecture briefly
  - **No file changes**

**PR Checklist Before Merge:**
- [ ] App is deployed and publicly accessible
- [ ] Production URL works
- [ ] All features work in production
- [ ] 5+ users can connect simultaneously
- [ ] Performance is good in production
- [ ] Demo video is ready
- [ ] All tests pass before deployment
- [ ] No test failures in CI/CD (if configured)

---

## Summary

**Total PRs:** 11

**Estimated Timeline:**
- PR #1-2: 4-6 hours (Setup + Auth) + 2-3 hours testing
- PR #3-4: 4-6 hours (Canvas + Shapes) + 1-2 hours testing
- PR #5-6: 4-6 hours (Persistence + Sync) + 2-3 hours testing
- PR #7-9: 6-8 hours (Locking + Cursors + Presence) + 2-3 hours testing
- PR #10-11: 2-4 hours (Polish + Deploy) + 1-2 hours testing

**Total: ~28-40 hours (including testing)**

**Critical Path:**
Setup → Auth → Canvas → Shapes → Persistence → Sync → Locking → Cursors → Presence → Polish → Deploy

**Testing Strategy:**
- **Unit Tests:** Test individual functions, services, and hooks in isolation
- **Component Tests:** Test React components render and behave correctly
- **Integration Tests:** Test complete workflows across multiple components/services
- Test each PR independently before merging
- Always test with 2+ browser windows for multiplayer features
- Test persistence after each PR that touches Firestore
- Run full test suite before each PR merge
- Final comprehensive manual test before deployment

**Test Coverage Goals:**
- Services: 80%+ coverage (critical business logic)
- Hooks: 70%+ coverage
- Components: 60%+ coverage (focus on logic, not just rendering)
- Integration tests: Cover all major user workflows

**Key Testing Files Created:**
1. **Test Setup (PR #1):**
   - `vitest.config.ts` - Test runner configuration
   - `src/__tests__/setup/test-utils.tsx` - Reusable test utilities
   - `src/__tests__/setup/firebase-mock.ts` - Firebase mocking utilities
   - `.env.test` - Test environment variables

2. **Unit Tests (PRs #2-9):**
   - `src/services/*.test.ts` - All service layer tests
   - `src/hooks/*.test.ts` - All custom hook tests
   - `src/components/**/*.test.tsx` - Component tests
   - `src/utils/*.test.ts` - Utility function tests

3. **Integration Tests (PRs #2, #5-7, #10):**
   - `src/__tests__/integration/auth-flow.test.tsx` - Complete auth flow
   - `src/__tests__/integration/shape-persistence.test.tsx` - Shape CRUD + persistence
   - `src/__tests__/integration/multiplayer-sync.test.tsx` - Multi-user synchronization
   - `src/__tests__/integration/object-locking.test.tsx` - Concurrent edit handling
   - `src/__tests__/integration/canvas-collaboration.test.tsx` - End-to-end collaboration

**Testing Commands:**
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

**When to Write Tests:**

**MUST test (high priority):**
- ✅ Authentication service (signup, login, logout)
- ✅ Canvas service (create, update, delete shapes)
- ✅ Object locking logic (prevent race conditions)
- ✅ Presence service (online/offline detection)
- ✅ Cursor service (position updates)
- ✅ Integration tests for complete workflows

**SHOULD test (medium priority):**
- ✅ Custom hooks (useAuth, useCanvas, usePresence, useCursors)
- ✅ Utility functions (colors, validation)
- ✅ Critical components (AuthGuard, Shape, Canvas)

**CAN skip (lower priority for MVP):**
- ❌ Simple UI components (Button, ColorPicker)
- ❌ Styling and layout components
- ❌ Toolbar component (unless complex logic)

**Testing Best Practices:**
1. Write tests as you build each feature (not after)
2. Test behavior, not implementation details
3. Use descriptive test names: "should update shape position when dragged"
4. Mock Firebase services to avoid real database calls in tests
5. Keep tests fast (unit tests should run in <5 seconds total)
6. Use integration tests sparingly (only for critical workflows)
7. Don't aim for 100% coverage - focus on critical paths
8. Test edge cases and error scenarios
9. Manual testing still required for UI/UX and performance