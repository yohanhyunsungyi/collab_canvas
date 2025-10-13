import { useAuth } from '../../hooks/useAuth';
import './CanvasPlaceholder.css';

/**
 * Temporary placeholder for Canvas component
 * Will be replaced with actual Canvas in PR #3
 */
export const CanvasPlaceholder = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="canvas-placeholder">
      <header className="canvas-header">
        <h1>CollabCanvas</h1>
        <div className="user-info">
          <span className="user-name">👋 {user?.displayName}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>
      
      <main className="canvas-main">
        <div className="placeholder-content">
          <h2>🎨 Canvas Coming Soon</h2>
          <p>Authentication is working! ✅</p>
          <p>Canvas will be implemented in PR #3</p>
          <div className="user-details">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Display Name:</strong> {user?.displayName}</p>
            <p><strong>User Color:</strong> <span style={{ color: user?.color }}>{user?.color}</span></p>
          </div>
        </div>
      </main>
    </div>
  );
};

