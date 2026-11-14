import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import axios from 'axios';
import api from '../services/api';
import {
  clearSessionToken,
  loadSessionToken,
  saveSessionToken,
} from '../services/storage';

interface AuthContextValue {
  /** True after a stored token is accepted by the backend or a session is created. */
  authenticated: boolean;
  /** True after the initial secure-storage hydration and best-effort validation. */
  ready: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  authenticated: false,
  ready: false,
  signIn: async () => undefined,
  signOut: async () => undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  // Restore the session and reject tokens that the backend explicitly invalidates.
  // A temporary network failure does not erase a valid locally stored session.
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const token = await loadSessionToken();
        if (!mounted) return;

        if (token) {
          api.setToken(token);
          try {
            await api.getMe();
            if (mounted) setAuthenticated(true);
          } catch (error) {
            const status = axios.isAxiosError(error)
              ? error.response?.status
              : undefined;

            if ([401, 403, 404].includes(status ?? 0)) {
              api.setToken(null);
              await clearSessionToken();
              if (mounted) setAuthenticated(false);
            } else if (mounted) {
              // Keep the session available during a transient backend outage.
              setAuthenticated(true);
            }
          }
        }
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (token: string) => {
    api.setToken(token);
    try {
      await saveSessionToken(token);
      setAuthenticated(true);
    } catch (error) {
      api.setToken(null);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      api.setToken(null);
      await clearSessionToken();
      setAuthenticated(false);
    }
  }, []);

  const value = useMemo(
    () => ({ authenticated, ready, signIn, signOut }),
    [authenticated, ready, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
