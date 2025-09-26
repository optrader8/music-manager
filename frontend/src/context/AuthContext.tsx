import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { authService } from '../services/authService';
import { getAuthToken, setAuthToken } from '../services/apiClient';
import type { ApiError, AuthContextValue, AuthCredentials, AuthSession, AuthUser } from '../types';

const STORAGE_KEY = 'music-manager::auth-session';

interface StoredSession {
  token: string;
  user: AuthUser;
}

function readStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return null;
    }
    return JSON.parse(rawValue) as StoredSession;
  } catch (storageError) {
    console.warn('Failed to parse stored auth session', storageError);
    return null;
  }
}

function writeStoredSession(session: StoredSession | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

const defaultValue: AuthContextValue = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  signIn: async () => {
    throw new Error('AuthProvider not initialized');
  },
  signOut: async () => {
    throw new Error('AuthProvider not initialized');
  },
  refreshSession: async () => {
    throw new Error('AuthProvider not initialized');
  },
};

const AuthContext = createContext<AuthContextValue>(defaultValue);

export function AuthProvider({ children }: PropsWithChildren): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    writeStoredSession(null);
  }, []);

  useEffect(() => {
    let isActive = true;

    const initialize = async () => {
      const stored = readStoredSession();
      const storedToken = stored?.token ?? getAuthToken();

      if (storedToken) {
        setAuthToken(storedToken);
        setToken(storedToken);
      }

      if (stored?.user) {
        setUser(stored.user);
      }

      try {
        if (storedToken) {
          const currentUser = await authService.fetchCurrentUser();
          if (isActive) {
            setUser(currentUser);
            writeStoredSession({ token: storedToken, user: currentUser });
          }
        }
      } catch (fetchError) {
        if (isActive) {
          setError(fetchError as ApiError);
          clearSession();
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      isActive = false;
    };
  }, [clearSession]);

  const handleSignIn = useCallback(
    async (credentials: AuthCredentials): Promise<AuthSession> => {
      setIsLoading(true);
      setError(null);
      try {
        const session = await authService.signIn(credentials);
        setUser(session.user);
        setToken(session.token);
        setAuthToken(session.token);
        writeStoredSession(session);
        return session;
      } catch (authError) {
        const apiError = authError as ApiError;
        setError(apiError);
        clearSession();
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [clearSession]
  );

  const handleSignOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.signOut();
    } catch (signOutError) {
      const apiError = signOutError as ApiError;
      if (!apiError.isNetworkError) {
        setError(apiError);
        throw apiError;
      }
    } finally {
      clearSession();
      setIsLoading(false);
    }
  }, [clearSession]);

  const refreshSession = useCallback(async () => {
    if (!token) {
      clearSession();
      return null;
    }

    try {
      const currentUser = await authService.fetchCurrentUser();
      setUser(currentUser);
      writeStoredSession({ token, user: currentUser });
      return currentUser;
    } catch (refreshError) {
      const apiError = refreshError as ApiError;
      setError(apiError);
      clearSession();
      return null;
    }
  }, [clearSession, token]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      error,
      signIn: handleSignIn,
      signOut: handleSignOut,
      refreshSession,
    };
  }, [error, handleSignIn, handleSignOut, isLoading, refreshSession, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
