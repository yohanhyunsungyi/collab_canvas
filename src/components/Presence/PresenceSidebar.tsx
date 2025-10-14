import { usePresence } from '../../hooks/usePresence';
import { UserAvatar } from './UserAvatar';
import './PresenceSidebar.css';

export const PresenceSidebar = () => {
  const { onlineUsers, loading } = usePresence();

  return (
    <div className="presence-sidebar">
      <div className="presence-sidebar__header">
        <h3 className="presence-sidebar__title">Online Users</h3>
        <span className="presence-sidebar__count">
          {loading ? '...' : onlineUsers.length}
        </span>
      </div>

      <div className="presence-sidebar__content">
        {loading ? (
          <div className="presence-sidebar__loading">
            <div className="spinner" />
            <p>Loading users...</p>
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="presence-sidebar__empty">
            <p>No other users online</p>
          </div>
        ) : (
          <ul className="presence-sidebar__list">
            {onlineUsers.map((user) => (
              <li key={user.userId} className="presence-sidebar__item">
                <UserAvatar user={user} size="medium" />
                <div className="presence-sidebar__user-info">
                  <span className="presence-sidebar__user-name">
                    {user.userName}
                  </span>
                  <span className="presence-sidebar__user-status">
                    Active now
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

