// Auth state: tokens live in localStorage, the current user is recovered
// from the access token claims plus the members endpoint.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  api,
  clearTokens,
  getRefreshToken,
  getAccessToken,
  storeTokens,
  type ApiError,
} from '../api/client';
import type { Member, Role, TokenPair } from '../api/types';

export interface CurrentUser {
  id: string;
  role: Role;
  fullName: string;
}

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AccessClaims {
  sub: string;
  role: Role;
}

function decodeClaims(token: string): AccessClaims | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as AccessClaims;
  } catch {
    return null;
  }
}

async function loadUser(): Promise<CurrentUser | null> {
  const token = getAccessToken();
  if (!token) return null;
  const claims = decodeClaims(token);
  if (!claims) return null;
  try {
    const member = await api.get<Member>(`/members/${claims.sub}`);
    return { id: claims.sub, role: member.role, fullName: member.full_name };
  } catch (err) {
    // The members endpoint may reject a fresh token mid-rotation; fall back
    // to the claims so the session still works.
    if ((err as ApiError).status === 401) return null;
    return { id: claims.sub, role: claims.role, fullName: '' };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const acceptTokens = useCallback(async (tokens: TokenPair) => {
    storeTokens(tokens);
    setUser(await loadUser());
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await api.post<TokenPair>('/auth/login', {
        email,
        password,
      });
      await acceptTokens(tokens);
    },
    [acceptTokens],
  );

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      const tokens = await api.post<TokenPair>('/auth/register', {
        email,
        password,
        full_name: fullName,
      });
      await acceptTokens(tokens);
    },
    [acceptTokens],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', { refresh_token: getRefreshToken() });
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
