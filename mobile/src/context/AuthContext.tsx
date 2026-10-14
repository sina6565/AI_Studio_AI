import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import api from '../services/api';

interface AuthContextValue {
  authenticated: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  authenticated: false,
  signIn: () => undefined,
  signOut: async () => undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(api.isAuthenticated());

  const signIn = useCallback(() => setAuthenticated(true), []);

  const signOut = useCallback(async () => {
    await api.logout();
    setAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ authenticated, signIn, signOut }),
    [authenticated, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
