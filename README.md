# CollabCanvas

A real-time collaborative canvas application with multiplayer features and persistent shared state.

## Features

- **Real-time Collaboration**: Multiple users can work on the same canvas simultaneously
- **Persistent State**: All canvas objects are automatically saved to Firestore
- **Multiplayer Cursors**: See where other users are working with live cursor tracking
- **Basic Shapes**: Create rectangles, circles, and text objects
- **Object Manipulation**: Move and resize objects with visual transform handles
- **Object Locking**: Prevents concurrent editing conflicts with automatic locking
- **Presence Awareness**: See who's currently online and active
- **User Authentication**: Secure login with Firebase Authentication

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite with SWC
- **Canvas Rendering**: Konva.js
- **Backend**: Firebase (Firestore, Realtime Database, Authentication)
- **Deployment**: Firebase Hosting
- **Testing**: Vitest + React Testing Library

## Prerequisites

- Node.js 18+ and npm
- Firebase account
- Firebase CLI installed globally (`npm install -g firebase-tools`)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd 01_CollabCanvas
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

Create a `.env.local` file in the project root with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Firebase Console Setup

In your Firebase Console, enable the following:

1. **Authentication**: Enable Email/Password sign-in method
2. **Firestore Database**: Create database in production or test mode
3. **Realtime Database**: Create database in test mode
4. **Hosting**: Enable Firebase Hosting (optional for deployment)

### 5. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests (coming soon)

## Deployment

### Deploy to Firebase Hosting

1. Build the application:
```bash
npm run build
```

2. Login to Firebase:
```bash
firebase login
```

3. Deploy to Firebase Hosting:
```bash
firebase deploy
```

Your app will be deployed to `https://<your-project-id>.web.app`

## Project Structure

```
src/
├── components/        # React components
│   ├── Auth/         # Authentication components
│   ├── Canvas/       # Canvas and shape components
│   ├── Presence/     # User presence components
│   └── UI/           # Reusable UI components
├── hooks/            # Custom React hooks
├── services/         # Firebase service layer
│   └── firebase.ts   # Firebase configuration
├── types/            # TypeScript type definitions
│   ├── user.types.ts
│   ├── canvas.types.ts
│   └── presence.types.ts
├── utils/            # Utility functions
├── App.tsx           # Main app component
└── main.tsx          # App entry point
```

## Architecture

- **Single Shared Canvas**: All users collaborate on one persistent canvas
- **Firestore**: Stores all canvas objects permanently
- **Realtime Database**: Handles cursor positions and presence data
- **Real-time Sync**: Firestore `onSnapshot()` listeners provide instant updates
- **Object Locking**: Prevents race conditions during concurrent edits

## Development Status

This project is currently in active development. See `tasks.md` for detailed task breakdown and progress.

## License

MIT
