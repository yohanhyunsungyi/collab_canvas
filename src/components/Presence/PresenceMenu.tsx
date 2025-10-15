import { useState, useRef, useEffect } from 'react';
import { usePresence } from '../../hooks/usePresence';
import { UserAvatar } from './UserAvatar';
import './PresenceSidebar.css';

export const PresenceMenu = () => {
  const { onlineUsers, loading } = usePresence();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const count = loading ? 0 : onlineUsers.length;
  const preview = onlineUsers.slice(0, 3);

  return (
    <div ref={containerRef} className="presence-menu">
      <button className="presence-button" onClick={() => setOpen((v) => !v)} title="Online users">
        <div className="presence-avatars">
          {preview.map((u, idx) => (
            <div key={u.userId} className="presence-avatar" style={{ zIndex: 10 - idx, marginLeft: idx === 0 ? 0 : -8 }}>
              <UserAvatar user={u} size="small" />
            </div>
          ))}
        </div>
        <span className="presence-count">{loading ? '…' : count}</span>
      </button>
      {open && (
        <div className="presence-dropdown">
          <div className="presence-dropdown__header">Active users ({count})</div>
          <ul className="presence-dropdown__list">
            {onlineUsers.map((u) => (
              <li key={u.userId} className="presence-dropdown__item">
                <UserAvatar user={u} size="small" />
                <span className="presence-dropdown__name">{u.userName}</span>
              </li>
            ))}
            {onlineUsers.length === 0 && (
              <li className="presence-dropdown__empty">No one online</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};


