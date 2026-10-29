import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthState, User } from '../types/auth';
import { ApiError } from '../services/api';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/authService';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthState['status']>('loading');

  const refresh = useCallback(async (): Promise<User | null> => {
    try {
      const data = await getCurrentUser();
      setUser(data.user);
      setStatus('authenticated');
      return data.user;
    } catch (error) {
      // A 401 simply means the visitor is logged out. Any other failure also
      // leaves the public weather experience usable.
      if (!(error instanceof ApiError) || error.status !== 0) {
        setUser(null);
      }
      setStatus('guest');
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginUser(email, password);
    setUser(data.user);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await registerUser(name, email, password);
    setUser(data.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setStatus('guest');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout, refresh }),
    [user, status, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider.');
  return context;
}
