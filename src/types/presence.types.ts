export interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
  color: string;
  lastUpdated: number;
}

export interface UserPresence {
  userId: string;
  userName: string;
  color: string;
  online: boolean;
  lastSeen: number;
}

export interface PresenceState {
  users: UserPresence[];
  cursors: Record<string, CursorPosition>;
  loading: boolean;
}

