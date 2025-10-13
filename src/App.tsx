import { useState } from 'react';
import { Login } from './components/Auth/Login';
import { Signup } from './components/Auth/Signup';
import { AuthGuard } from './components/Auth/AuthGuard';
import { CanvasPlaceholder } from './components/Canvas/CanvasPlaceholder';
import './App.css';

function App() {
  const [showSignup, setShowSignup] = useState(false);

  return (
    <AuthGuard
      fallback={
        showSignup ? (
          <Signup onSwitchToLogin={() => setShowSignup(false)} />
        ) : (
          <Login onSwitchToSignup={() => setShowSignup(true)} />
        )
      }
    >
      <CanvasPlaceholder />
    </AuthGuard>
  );
}

export default App;
