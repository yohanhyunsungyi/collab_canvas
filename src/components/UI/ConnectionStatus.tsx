import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import './ConnectionStatus.css';

/**
 * Connection status indicator component
 * Shows online/offline status in the header
 */
export const ConnectionStatus = () => {
  const { isConnected, isChecking } = useConnectionStatus();

  if (isChecking) {
    return (
      <div className="connection-status connection-status-checking">
        <span className="status-dot status-dot-checking"></span>
        <span className="status-text">Checking...</span>
      </div>
    );
  }

  return (
    <div className={`connection-status ${isConnected ? 'connection-status-online' : 'connection-status-offline'}`}>
      <span className={`status-dot ${isConnected ? 'status-dot-online' : 'status-dot-offline'}`}></span>
      <span className="status-text">{isConnected ? 'Online' : 'Offline'}</span>
    </div>
  );
};

