export interface User {
  id: string;
  email: string;
  displayName: string;
  color: string; // Unique color for multiplayer cursor
  createdAt: number;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface SignupData {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

