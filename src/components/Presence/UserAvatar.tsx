import type { UserPresence } from '../../types/presence.types';
import './UserAvatar.css';

interface UserAvatarProps {
  user: UserPresence;
  size?: 'small' | 'medium' | 'large';
}

export const UserAvatar = ({ user, size = 'medium' }: UserAvatarProps) => {
  // Get first letter of user name
  const initial = user.userName.charAt(0).toUpperCase();

  return (
    <div className={`user-avatar user-avatar--${size}`}>
      <div
        className="user-avatar__circle"
        style={{ backgroundColor: user.color }}
        title={user.userName}
      >
        <span className="user-avatar__initial">{initial}</span>
      </div>
      {user.online && (
        <div className="user-avatar__status-indicator" title="Online" />
      )}
    </div>
  );
};

