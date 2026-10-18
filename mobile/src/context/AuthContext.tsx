import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '../services/api';
import {
  clearSessionToken,
  loadSessionToken,
  saveSessionToken,
} from '../services/storage';

interface AuthContextValue {
  /** True once a stored token has been found and validated into the API client. */
  authenticated: boolean;
  /** True after the initial secure-storage hydration completes. */
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

  // Restore a previously stored session from the platform keychain on startup.
  useEffect(() => {
    let mounted = true;

    (async () => {
      const token = await loadSessionToken();
      if (!mounted) {
        return;
      }
      if (token) {
        api.setToken(token);
        setAuthenticated(true);
      }
      setReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (token: string) => {
    api.setToken(token);
    await saveSessionToken(token);
    setAuthenticated(true);
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
