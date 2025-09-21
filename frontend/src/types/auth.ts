import type { ApiError } from './api';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  avatarUrl?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (credentials: AuthCredentials) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<AuthUser | null>;
  error: ApiError | null;
}
