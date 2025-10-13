# CollabCanvas MVP Plan (24 Hours)

## Project Goal
Build a real-time collaborative canvas with multiplayer features and **persistent shared state**. The MVP focuses on **proving the collaborative infrastructure works flawlessly** rather than building extensive features.

**Key Concept:** This is a **single shared canvas** that all users work on together. All work is automatically saved to Firestore in real-time. When any user leaves and returns (even days later), they see the exact same canvas with all objects from all users preserved.

---

## User Stories

### As a Canvas User
- I want to see a large canvas workspace so I can create designs without feeling constrained
- I want to pan and zoom smoothly so I can navigate the canvas efficiently
- I want to create basic shapes (rectangles, circles, text) so I can start building designs
- I want to move and manipulate objects so I can arrange my design
- I want to see other users' cursors with their names so I know who's working where
- I want to see changes from other users instantly so we can collaborate in real-time
- I want to know who else is currently online so I'm aware of active collaborators
- I want my work to persist when I refresh or reconnect so I don't lose progress

### As a Collaborating User
- I want my edits to sync to other users in under 100ms so collaboration feels seamless
- I want to see when someone joins or leaves the session so I'm aware of presence changes
- I want the canvas state to remain consistent even when users disconnect

### As a New User
- I want to create an account with a name so I can be identified in collaborative sessions
- I want to authenticate quickly so I can start working immediately

---

## Key Features Required for MVP

### 1. Canvas Workspace ✓
- Large canvas area (minimum 5000x5000px virtual space)
- Smooth pan functionality (click-and-drag or spacebar + drag)
- Zoom in/out with smooth transitions (mouse wheel or pinch)
- Visual viewport indicator (optional but helpful)

### 2. Basic Shape Creation ✓
- **Rectangle tool**: Click and drag to create
- **Circle tool**: Click and drag to create
- **Text tool**: Click to place, type to add content
- Each shape should have:
  - Solid fill color (color picker)
  - Unique ID for tracking
  - Position (x, y coordinates)
  - Dimensions (width, height for rectangle, radius for circle)

### 3. Object Manipulation ✓
- Click to select an object
- Drag to move selected object
- Visual selection indicator (border/highlight)
- **Transform handles for resize:**
  - Corner handles for proportional resize
  - Edge handles for width/height adjustment
  - Visual feedback during resize operation
  - Resize updates saved to Firestore immediately

### 4. Real-Time Synchronization ✓
- Broadcast all object creation events
- Broadcast all object movement events
- Broadcast all object resize events
- Sync happens in <100ms for object changes
- **Object locking for concurrent edits:**
  - First user to interact with an object (mousedown) gains temporary lock
  - Lock prevents other users from selecting/moving/resizing same object
  - Lock releases when user completes action (mouseup/touch end)
  - Visual indicator shows which user has locked an object
  - Prevents race conditions during simultaneous edits

### 5. Multiplayer Cursors ✓
- Show cursor position for all connected users
- Display user name label next to cursor
- Update cursor position in <50ms
- Unique color per user for easy identification

### 6. Presence Awareness ✓
- Display list of currently online users
- Show when users join/leave
- Active user count display
- User status indicators (active/idle)

### 7. User Authentication ✓
- Firebase Authentication (email/password or Google sign-in)
- User has persistent name/identifier
- Auth state managed by Firebase
- User ID stored with all canvas operations
- **Note:** Session management not needed for MVP (single shared canvas)

### 8. State Persistence ✓
- **All canvas state saved to Firestore in real-time**
- **Single shared canvas:** All users see and edit the same persistent canvas
- Every object creation is immediately written to Firestore
- Every object movement is immediately written to Firestore
- Every object resize is immediately written to Firestore
- Users can close browser and return to same canvas state (hours or days later)
- **When any user returns, canvas loads with ALL objects from ALL users**
- Canvas loads from Firestore on page load/refresh
- **Persistence strategy:**
  - Each shape stored as document in `canvasObjects` collection
  - Document structure: `{id, type, x, y, width, height, color, radius, text, fontSize, createdBy, createdAt, lastModifiedBy, lastModifiedAt, lockedBy, lockedAt}`
  - On app load: fetch all documents from `canvasObjects` collection
  - On real-time updates: listen to Firestore `onSnapshot()` for changes
- No data loss even if all users disconnect
- Work from multiple users persists indefinitely
- Handles reconnection gracefully with automatic state sync

### 9. Deployment ✓
- Publicly accessible URL via Firebase Hosting
- Support 5+ concurrent users
- Stable real-time connections via Firestore listeners
- Working authentication in production
- **Note:** No separate WebSocket server needed - Firestore handles real-time sync

---

## Tech Stack Recommendations

### Backend: Firebase + Firestore

**Selected Stack:**
- **Firestore**: Canvas state, objects, and user data
- **Firebase Realtime Database**: Cursor positions (faster updates than Firestore)
- **Firebase Auth**: User authentication
- **Firebase Hosting**: Application deployment

**Why Firebase:**
- Built-in real-time sync (no WebSocket server needed)
- Firestore listeners provide automatic updates
- Firebase Auth is simple and secure
- All-in-one deployment solution
- Great free tier for MVP

**Real-time Architecture:**
- Firestore's `onSnapshot()` listeners eliminate need for custom WebSocket server
- Automatic bi-directional sync
- Built-in offline support and reconnection handling

### Frontend: React + TypeScript + Konva.js

**Selected Stack:**
- **React 18** with TypeScript
- **Vite** with SWC for fast builds
- **Konva.js** for canvas rendering

**Why This Stack:**
- TypeScript provides type safety for complex canvas state
- Vite + SWC offers fastest development experience
- Konva.js handles canvas rendering and transformations efficiently
- React manages UI state and Firebase listeners

### Deployment: Firebase Hosting

**Single deployment solution:**
- Build React app with `npm run build`
- Deploy to Firebase Hosting with `firebase deploy`
- Automatic HTTPS and CDN
- No need for separate frontend hosting service

---

## MVP Tech Stack (Final)

**Frontend:**
```
React 18 + TypeScript
Vite with SWC
Konva.js for canvas rendering
```

**Backend:**
```
Firebase Firestore (canvas objects & state)
Firebase Realtime Database (cursor positions)
Firebase Auth (user authentication)
```

**Deployment:**
```
Firebase Hosting (single deployment solution)
```

**Why this stack:**
- Firebase Firestore's `onSnapshot()` eliminates need for custom WebSocket server
- TypeScript provides type safety for complex canvas state management
- Vite + SWC gives fastest development and build experience
- Konva.js handles 500+ objects with 60 FPS performance
- Firebase Hosting provides one-command deployment
- All Firebase services work together seamlessly

---

## What's NOT in MVP

### Excluded Features:
- ❌ Multiple canvas projects/rooms
- ❌ Undo/redo functionality
- ❌ Advanced shape styling (gradients, borders, shadows)
- ❌ Layer panel/management UI
- ❌ Copy/paste functionality
- ❌ Keyboard shortcuts
- ❌ Object grouping
- ❌ Alignment tools
- ❌ **Rotation (no rotation in MVP)**
- ❌ Export to image/PDF
- ❌ Comments or annotations
- ❌ Version history
- ❌ Permissions/access control
- ❌ AI agent (this is post-MVP)

### Simplifications Allowed:
- Single shared canvas (no separate documents/rooms)
- **All users work on the same persistent canvas**
- Basic color picker (no gradients)
- Simple text (no rich formatting)
- **Basic resize with transform handles (no advanced constraints)**
- **No rotation - move and resize only**
- No mobile optimization required
- Basic UI (focus on function over form)
- **All state immediately persisted to Firestore (no optimistic updates)**
- **No canvas versioning or history - just current state**

---

## Success Criteria Checklist

Before submitting MVP, verify:

- [ ] Two users can see each other's cursors moving in real-time
- [ ] Creating a shape appears instantly for all users
- [ ] Moving a shape updates for all users in <100ms
- [ ] Resizing a shape updates for all users in <100ms
- [ ] **Refreshing the page preserves all canvas objects**
- [ ] **Closing all browsers and reopening shows all previous work from all users**
- [ ] **User A creates objects → logs out → User B logs in → sees User A's objects**
- [ ] **User B adds objects → logs out → User A logs back in → sees all objects from both users**
- [ ] **Moving an object and refreshing shows the new position**
- [ ] **Resizing an object and refreshing shows the new size**
- [ ] **Canvas state persists indefinitely (test after hours/days)**
- [ ] User names appear next to cursors
- [ ] Online user list is accurate
- [ ] Authentication works (users have accounts)
- [ ] Canvas has smooth 60 FPS pan/zoom
- [ ] App is deployed and publicly accessible
- [ ] 2-3 users can work simultaneously without issues
- [ ] Object locking prevents simultaneous edits on same object

---

## Development Phases

### Phase 1: Foundation
- Set up React + TypeScript + Vite project with SWC
- Configure Firebase (Firestore, Realtime Database, Auth, Hosting)
- Build authentication flow (signup/login with Firebase Auth)
- Create basic project structure and routing

### Phase 2: Canvas Basics
- Implement Konva.js canvas with pan/zoom
- Add rectangle creation tool (with fixed or user-defined size)
- Add circle creation tool (with fixed or user-defined size)
- Add text creation tool
- Ensure smooth 60 FPS performance
- **Save all created shapes immediately to Firestore**

### Phase 3: Multiplayer Core & Persistence
- Set up Firestore collection for canvas objects with complete schema
- **Implement initial load: fetch all objects from Firestore on app start**
- Implement Firestore listeners with `onSnapshot()` for real-time updates
- Sync object creation across users
- Sync object movement across users
- **Write every change to Firestore immediately (no local-only state)**
- Implement object locking mechanism for concurrent moves
- Test synchronization with 2 browser windows
- **Test persistence: close all browsers, reopen, verify all objects remain**

### Phase 4: Cursors & Presence
- Implement cursor position broadcast using Realtime Database
- Display multiplayer cursors with user names
- Add presence detection (online users list)
- Handle user join/leave events
- Add unique colors per user

### Phase 5: Polish & Testing
- **Test complete persistence workflow:**
  - Create objects → close all browsers → reopen → verify all objects present
  - Move objects → refresh page → verify new positions persisted
  - Multiple users create objects → all disconnect → reconnect → verify all work saved
- Handle disconnects/reconnects gracefully
- Test object locking under concurrent moves
- Verify all objects sync correctly across users
- Fix any synchronization bugs
- Ensure Firestore writes are efficient (no unnecessary updates)

### Phase 6: Deployment & Verification
- Build production bundle
- Deploy to Firebase Hosting
- Test with 3-5 concurrent users
- Verify all success criteria met
- Prepare demo materials

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│      Frontend (React + TypeScript)      │
│  ┌─────────────────────────────────┐   │
│  │   Konva Canvas Component        │   │
│  │   - Shapes (Rect, Circle, Text) │   │
│  │   - Pan/Zoom Controls           │   │
│  │   - Selection/Move Logic        │   │
│  │   - NO resize functionality     │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Multiplayer Cursor Overlay     │   │
│  │  - Real-time cursor positions   │   │
│  │  - User name labels             │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │     Presence Sidebar            │   │
│  │     - Online users list         │   │
│  │     - Object lock indicators    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
       ↕ (onSnapshot listeners)
       ↕ (write on every change)
┌─────────────────────────────────────────┐
│          Firebase Backend               │
│  ┌─────────────────────────────────┐   │
│  │    Firestore Collection         │   │
│  │    - canvasObjects              │   │
│  │      {id, type, x, y, width,    │   │
│  │       height, radius, color,    │   │
│  │       text, fontSize,           │   │
│  │       createdBy, createdAt,     │   │
│  │       lastModifiedBy,           │   │
│  │       lastModifiedAt,           │   │
│  │       lockedBy, lockedAt}       │   │
│  │                                 │   │
│  │    - PERSISTENT STORAGE         │   │
│  │    - All changes written        │   │
│  │      immediately                │   │
│  │    - Loaded on app startup      │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Realtime Database              │   │
│  │    - cursorPositions/{userId}   │   │
│  │      {x, y, name, color}        │   │
│  │    - presence/{userId}          │   │
│  │      {online, lastSeen}         │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │      Firebase Auth              │   │
│  │      - Email/password or Google │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│         Firebase Hosting                │
│         - Single deployment command     │
│         - Automatic HTTPS & CDN         │
└─────────────────────────────────────────┘
```

**Key Architecture Notes:**
- No WebSocket server needed - Firestore's `onSnapshot()` provides real-time updates
- **Every shape change (create/move/resize) writes immediately to Firestore**
- **On app load: fetch entire `canvasObjects` collection to restore state**
- **Single shared canvas:** All users see and edit the same persistent canvas
- **All user work persists indefinitely in Firestore**
- Object locking stored in Firestore (`lockedBy` field with userId + timestamp)
- Cursor positions use Realtime Database for lower latency (<50ms)
- Canvas objects use Firestore for reliable persistence
- **No local-only state - Firestore is source of truth**
- **Users can return hours/days later and see all previous work**
- All services deployed together via Firebase

---

## Questions to Answer Before Starting

1. **Authentication method:**
   - Email/password or Google sign-in (or both)?
   - Recommendation: Start with email/password for simplicity

2. **Real-time cursor updates frequency:**
   - Throttle to 60fps (every ~16ms) to prevent excessive writes

3. **Object lock timeout:**
   - How long should a lock last if user doesn't release it?
   - Recommendation: 30 seconds with automatic release

4. **Cursor color assignment:**
   - Random colors or predefined palette?
   - Recommendation: Predefined palette of 10 distinct colors

5. **Object limit for testing:**
   - Test performance with 500+ objects as specified

6. **User display name:**
   - Allow users to set custom display name during signup?
   - Or use email prefix as default name?

---

## Next Steps

1. **Review this document** and confirm all decisions
2. **Set up Firebase project** (create new project at firebase.google.com)
3. **Initialize React + TypeScript + Vite project** with SWC
4. **Install dependencies:**
   - `firebase` for backend services
   - `react-konva` and `konva` for canvas
   - TypeScript types as needed
5. **Configure Firebase** in your project (Auth, Firestore, Realtime DB, Hosting)
6. **Create GitHub repository** with proper README
7. **Begin Phase 1** of development
8. **Test continuously** with multiple browser windows (simulate 2-3 users)
9. **Deploy early** to Firebase Hosting to catch deployment issues

Remember: **A simple, solid, multiplayer canvas beats a feature-rich app with broken collaboration.**

Focus on getting object locking right - this is your key differentiator for handling concurrent edits cleanly.