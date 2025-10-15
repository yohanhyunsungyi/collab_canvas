# CollabCanvas

A real-time collaborative canvas application where multiple users can draw, create shapes, and see each other's work instantly. Built with React, TypeScript, Firebase, and Konva.js.

<div align="center">

**[Live Demo](https://gauntlet-collabcanvas-7d9d7.web.app)** • **[Documentation](#documentation)** • **[Report Bug](#troubleshooting)**

</div>

---

## 🎯 Overview

CollabCanvas is a **single shared canvas** where all users collaborate in real-time. Every shape, movement, and edit is automatically saved to Firebase Firestore, ensuring that all work persists indefinitely. Whether you're working with 2 users or 20, everyone sees the same canvas state with instant synchronization.

**Key Highlights:**
- ⚡ **Real-time sync** - See changes from other users in <100ms
- 💾 **Persistent state** - All work automatically saves and persists forever
- 👥 **Multiplayer cursors** - See where everyone is working with live cursor tracking
- 🔒 **Object locking** - Prevents editing conflicts automatically
- 🎨 **Simple tools** - Rectangles, circles, and text with color picker
- 🖱️ **Smooth navigation** - Pan and zoom with 60 FPS performance

---

## ✨ Features

### Core Functionality

#### 🎨 Canvas Tools
- **Rectangle Tool** - Click and drag to create rectangles
- **Circle Tool** - Click and drag to create circles  
- **Text Tool** - Click to place text, type to edit
- **Selection Tool** - Click shapes to select and manipulate
- **Color Picker** - 10 preset colors for shapes
- **Pan Mode** - Hold spacebar and drag to pan around canvas
- **Zoom** - Mouse wheel to zoom in/out (10% - 300%)

#### 🤝 Real-Time Collaboration
- **Instant Sync** - All changes appear for other users in real-time (<100ms)
- **Multiplayer Cursors** - See other users' cursor positions with name labels
- **Object Locking** - Automatic locking prevents simultaneous edits on same object
- **Presence Awareness** - See who's online with live user list in sidebar
- **Cursor Cleanup** - Disconnected users' cursors automatically disappear

#### 💾 Persistence & State
- **Auto-Save** - Every action automatically saves to Firestore
- **Cross-Session Persistence** - Refresh or close browser, work is still there
- **Cross-User Persistence** - All users see all work from all other users
- **Indefinite Storage** - Canvas state persists forever (tested hours/days)
- **Position & Size Persistence** - Moved or resized objects stay that way

#### 🔐 Authentication
- **Email/Password Sign-up** - Create account with display name
- **Email/Password Login** - Secure authentication
- **Google Sign-In** - Quick OAuth login
- **Auth Guard** - Protected canvas access
- **User Profiles** - Display names shown in cursors and presence list

#### 🎯 User Experience
- **Smooth 60 FPS** - Tested with 200+ shapes on canvas
- **Canvas Boundaries** - Visual boundaries prevent objects going out of bounds
- **Transform Handles** - Visual resize handles on selected shapes
- **Keyboard Shortcuts** - Delete/Backspace to remove, Spacebar for pan mode
- **Error Notifications** - Friendly error messages with auto-dismiss
- **Connection Status** - Real-time online/offline indicator in header
- **Loading States** - Visual spinners for all async operations

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Firebase Account** - Create at [firebase.google.com](https://firebase.google.com)
- **Firebase CLI** - Install globally: `npm install -g firebase-tools`

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd 01_CollabCanvas
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**

   Create a `.env.local` file in the project root:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

   **Get your Firebase credentials:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project → Project Settings → General
   - Scroll to "Your apps" → Select Web app → Copy config values

4. **Firebase Console Setup**

   Enable these services in your Firebase Console:

   - **Authentication** 
     - Go to Authentication → Sign-in method
     - Enable "Email/Password"
     - Enable "Google" (optional)

   - **Firestore Database**
     - Go to Firestore Database → Create database
     - Start in production mode (rules are configured)

   - **Realtime Database**
     - Go to Realtime Database → Create database
     - Start in test mode

   - **Deploy Firestore Rules** (Important!)
     ```bash
     firebase deploy --only firestore:rules
     firebase deploy --only database:rules
     ```

5. **Run the development server**
```bash
npm run dev
```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📖 Usage Guide

### First Time Setup

1. **Create an Account**
   - Click "Sign Up" on the login page
   - Enter email, password, and display name
   - Your display name will be shown to other users

2. **Start Creating**
   - Select a tool from the toolbar (Rectangle, Circle, or Text)
   - Choose a color from the color picker
   - Click and drag on the canvas to create shapes

### Canvas Navigation

- **Pan**: Hold `Spacebar` and drag, OR click and drag the canvas
- **Zoom**: Use mouse wheel to zoom in/out
- **Boundaries**: Canvas is 5000x5000px with visual red dashed border

### Shape Manipulation

- **Select**: Click the selection tool (pointer icon), then click a shape
- **Move**: Drag a selected shape to move it
- **Resize**: Drag the corner/edge handles on a selected shape
- **Delete**: Select a shape and press `Delete` or `Backspace`
- **Change Color**: Select color picker, then create new shapes in that color

### Collaboration

- **See Others' Cursors**: Other users' cursors appear with their names
- **Real-time Updates**: Watch shapes appear and move as others work
- **Object Locking**: When someone edits a shape, it's locked (red outline)
- **Online Users**: Check the sidebar to see who's currently online

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Spacebar` | Enable pan mode (hold and drag) |
| `Delete` / `Backspace` | Delete selected shape |
| Mouse wheel | Zoom in/out |

---

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool with SWC
- **Konva.js** - Canvas rendering library
- **React Konva** - React bindings for Konva

### Backend
- **Firebase Firestore** - Persistent storage for canvas objects
- **Firebase Realtime Database** - Ephemeral data (cursors, presence)
- **Firebase Authentication** - User authentication
- **Firebase Hosting** - Production deployment

### Testing
- **Vitest** - Unit test runner
- **React Testing Library** - Component testing
- **Happy DOM** - DOM simulation for tests

### Code Quality
- **ESLint** - Linting
- **TypeScript** - Static type checking

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Current Test Status:** ✅ 196/196 tests passing

### Test Coverage
- Unit tests for all hooks, services, and components
- Integration tests for auth flow, multiplayer sync, object locking
- Real-time shape creation, updates, and persistence tests

### Manual Testing
See **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** for comprehensive manual testing guide with 200+ test cases.

---

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── Auth/            # Login, Signup, AuthGuard
│   ├── Canvas/          # Canvas, Shape, Toolbar, Cursors, Placeholder
│   ├── Presence/        # PresenceSidebar, UserAvatar
│   └── UI/              # Button, ColorPicker, ErrorNotification, ConnectionStatus
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication state
│   ├── useCanvas.ts     # Canvas state and operations
│   ├── useCursors.ts    # Multiplayer cursor tracking
│   ├── usePresence.ts   # User presence awareness
│   └── useConnectionStatus.ts # Firebase connection status
├── services/            # Firebase service layer
│   ├── firebase.ts      # Firebase configuration
│   ├── auth.service.ts  # Authentication operations
│   ├── canvas.service.ts # Canvas CRUD operations
│   ├── cursor.service.ts # Cursor position updates
│   └── presence.service.ts # Presence tracking
├── types/               # TypeScript type definitions
│   ├── user.types.ts
│   ├── canvas.types.ts
│   └── presence.types.ts
├── utils/               # Utility functions
│   ├── boundaries.ts    # Canvas boundary constraints
│   └── colors.ts        # Color utilities
├── App.tsx              # Main app component
└── main.tsx             # App entry point
```

---

## 🚢 Deployment

### Deploy to Firebase Hosting

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting** (first time only)
   ```bash
   firebase init hosting
   # Select your Firebase project
   # Public directory: dist
   # Single-page app: Yes
   # Setup automatic builds: No
   ```

4. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

   Your app will be live at: `https://<your-project-id>.web.app`

5. **Deploy Firestore & Database Rules** (if changed)
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only database:rules
   ```

---

## 🎨 Design System

The app uses a consistent design system with CSS variables:

- **Colors**: Primary brand colors, status colors (success, error, warning)
- **Spacing**: 5-point scale (xs, sm, md, lg, xl)
- **Border Radius**: 4 standard sizes + full circle
- **Shadows**: 4 depth levels
- **Transitions**: 3 speed presets (fast, base, slow)

See **[src/index.css](./src/index.css)** for all CSS variables.

---

## ⚠️ Known Limitations

This is an MVP focused on proving collaborative infrastructure. The following features are intentionally not included:

### Not Implemented (By Design)
- ❌ No undo/redo functionality
- ❌ No keyboard shortcuts (except Delete/Backspace, Spacebar)
- ❌ No copy/paste
- ❌ No shape rotation
- ❌ No grouping of shapes
- ❌ No alignment tools (align left, center, etc.)
- ❌ No export functionality (PNG, SVG, etc.)
- ❌ No version history
- ❌ No multiple canvases/rooms (single shared canvas only)
- ❌ No mobile optimization (desktop-focused)
- ❌ No drawing tools (pen, brush, etc.)
- ❌ No layers or z-index management
- ❌ No image uploads
- ❌ No shape styles (borders, shadows, gradients)
- ❌ No grid or snap-to-grid

### Performance Notes
- **Tested with 200+ shapes** on canvas - smooth 60 FPS on modern hardware
- **Performance is hardware-dependent** - GPU matters for Konva rendering
- **500+ shapes** may impact performance on lower-end devices
- **Recommended**: Test with your target hardware

### Browser Support
- ✅ **Chrome** - Fully supported (primary)
- ✅ **Firefox** - Fully supported
- ⚠️ **Safari** - Basic functionality works (not extensively tested)
- ❌ **Mobile browsers** - Not optimized for mobile

---

## 🐛 Troubleshooting

### App Won't Start

**Problem:** `npm run dev` fails or shows errors

**Solutions:**
1. Ensure Node.js 18+ is installed: `node --version`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Check that `.env.local` exists with all Firebase credentials
4. Clear Vite cache: `rm -rf node_modules/.vite`

---

### Firebase Connection Errors

**Problem:** "Failed to load canvas objects" or "Connection status: Offline"

**Solutions:**
1. **Check Firebase credentials** - Verify `.env.local` has correct values
2. **Check Firebase Console** - Ensure Firestore and Realtime Database are created
3. **Deploy security rules**:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only database:rules
   ```
4. **Check Firebase status** - Visit [Firebase Status Dashboard](https://status.firebase.google.com)
5. **Check browser console** - Look for specific error messages

---

### Authentication Issues

**Problem:** Can't login or signup, "Auth domain not authorized"

**Solutions:**
1. **Add authorized domain in Firebase Console**:
   - Go to Authentication → Settings → Authorized domains
   - Add `localhost` for development
   - Add your deployment domain for production

2. **Check .env.local** - Ensure `VITE_FIREBASE_AUTH_DOMAIN` is correct

3. **Clear browser cache and cookies** - Old auth tokens may be cached

4. **Disable browser extensions** - Ad blockers may interfere with auth

---

### Shapes Not Syncing

**Problem:** Creating shapes but other users don't see them

**Solutions:**
1. **Check Firestore rules** - Ensure rules allow read/write:
   ```bash
   firebase deploy --only firestore:rules
   ```
2. **Check browser console** - Look for permission denied errors
3. **Verify both users are authenticated** - Shapes only sync for logged-in users
4. **Check connection status** - Header should show "Online" with green dot
5. **Refresh both browsers** - Force reconnection to Firebase

---

### Cursors Not Showing

**Problem:** Can't see other users' cursors

**Solutions:**
1. **Check Realtime Database** - Ensure it's created in Firebase Console
2. **Deploy database rules**:
   ```bash
   firebase deploy --only database:rules
   ```
3. **Check that users have different accounts** - Own cursor is not shown
4. **Check browser console** - Look for Realtime Database errors
5. **Check if users are in same session** - All users should be on same canvas

---

### Performance Issues

**Problem:** Slow rendering, low FPS, laggy interactions

**Solutions:**
1. **Check shape count** - Performance degrades with 200+ shapes
2. **Close other browser tabs** - Free up GPU memory
3. **Check hardware acceleration**:
   - Chrome: Settings → Advanced → System → Hardware acceleration (ON)
4. **Update graphics drivers** - Konva uses GPU for rendering
5. **Test on different browser** - Compare Chrome vs Firefox performance
6. **Reduce zoom level** - Zooming in can impact performance

---

### Object Locking Issues

**Problem:** Can't edit shapes, or shapes stay locked

**Solutions:**
1. **Wait for lock timeout** - Locks auto-expire after 30 seconds
2. **Check if another user is editing** - Red outline indicates locked shape
3. **Refresh the page** - Force clear any stale locks
4. **Check browser console** - Look for lock acquisition errors

---

### Deployment Issues

**Problem:** `firebase deploy` fails or app doesn't work after deployment

**Solutions:**
1. **Build first**: `npm run build` - Ensure build succeeds
2. **Check dist folder** - Should exist with index.html and assets
3. **Verify Firebase project**: `firebase use --add` - Select correct project
4. **Check firebase.json** - Ensure it points to `dist` directory
5. **Add environment variables** - Set them in Firebase Hosting settings (if needed)
6. **Check deployment domain** - Add to Firebase Auth authorized domains

---

### Common Error Messages

| Error | Solution |
|-------|----------|
| `Permission denied` | Deploy Firestore/Database rules |
| `Auth domain not authorized` | Add domain to Firebase Console → Authentication → Settings |
| `Network request failed` | Check internet connection and Firebase status |
| `Failed to load canvas objects` | Check Firestore rules and credentials |
| `User not authenticated` | Login again, clear browser cache |

---

## 📚 Documentation

- **[PRD.md](./PRD.md)** - Product Requirements Document with user stories and success criteria
- **[architecture.md](./architecture.md)** - Technical architecture and design decisions
- **[tasks.md](./tasks.md)** - Detailed task breakdown and development progress (11 PRs)
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Comprehensive manual testing guide (200+ tests)
- **[PERFORMANCE_TEST.md](./PERFORMANCE_TEST.md)** - Performance testing guide

---

## 🤝 Contributing

This is an MVP project. Future enhancements could include:
- Undo/redo functionality
- Copy/paste operations
- Shape rotation and advanced transforms
- Drawing tools (pen, brush)
- Image uploads
- Export to PNG/SVG
- Multiple canvas rooms
- Mobile optimization
- Version history
- Collaborative text editing

---

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIzaSyC...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | `my-app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `my-app-12345` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `my-app.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123456789:web:abc123` |

---

## 🧰 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 5173) |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |
| `npm test` | Run all tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

---

## 📊 Performance Benchmarks

- **Shape Creation**: < 50ms
- **Shape Update Sync**: < 100ms (typically 10-20ms)
- **Cursor Update Frequency**: 60fps (16ms throttle)
- **Firestore Write**: < 100ms
- **Firestore Read (onSnapshot)**: < 50ms
- **Canvas Rendering**: 60 FPS with 200+ shapes
- **Memory Usage**: ~150MB with 100 shapes
- **Network Usage**: ~5KB per shape creation

---

## 🔒 Security

- **Authentication required** for all canvas operations
- **Firestore security rules** enforce user authentication
- **No server-side code** - fully client-side app
- **Firebase handles** all security and authorization
- **User data** stored securely in Firebase

### Security Rules

See `firestore.rules` and `database.rules.json` for current security configuration.

**Important**: Never commit `.env.local` with real credentials to version control!

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details

---

## 🙏 Acknowledgments

- [React](https://react.dev/) - UI framework
- [Firebase](https://firebase.google.com/) - Backend infrastructure
- [Konva.js](https://konvajs.org/) - Canvas rendering
- [Vite](https://vitejs.dev/) - Build tool
- [Vitest](https://vitest.dev/) - Testing framework

---

## 📞 Support

If you encounter issues not covered in the troubleshooting section:

1. Check the [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) for test scenarios
2. Review [architecture.md](./architecture.md) for technical details
3. Check browser console for error messages
4. Verify Firebase Console for service status

---

<div align="center">

**Built with ❤️ using React, TypeScript, and Firebase**

[⬆ Back to Top](#collabcanvas)

</div>
