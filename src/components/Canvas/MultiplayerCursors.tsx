import type { CursorPosition } from '../../types/presence.types';
import type { Viewport } from '../../types/canvas.types';
import './MultiplayerCursors.css';

interface MultiplayerCursorsProps {
  cursors: Record<string, CursorPosition>;
  viewport: Viewport;
}

/**
 * Component to render multiplayer cursors overlay
 * Shows cursor positions and names of all connected users (except self)
 */
export const MultiplayerCursors = ({ cursors, viewport }: MultiplayerCursorsProps) => {
  return (
    <div className="multiplayer-cursors">
      {Object.entries(cursors).map(([userId, cursor]) => {
        // Transform canvas coordinates to screen coordinates
        const screenX = cursor.x * viewport.scale + viewport.x;
        const screenY = cursor.y * viewport.scale + viewport.y;

        return (
          <div
            key={userId}
            className="cursor"
            style={{
              left: `${screenX}px`,
              top: `${screenY}px`,
            }}
          >
            <svg
              className="cursor-pointer"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.5 3.21V20.79L12.5 13.79L15.5 20.79L17.5 20.29L14.5 13.29L21.5 11.29L5.5 3.21Z"
                fill={cursor.color}
              />
            </svg>
            <div
              className="cursor-label"
              style={{ 
                backgroundColor: cursor.color,
              }}
            >
              {cursor.userName}
            </div>
          </div>
        );
      })}
    </div>
  );
};

