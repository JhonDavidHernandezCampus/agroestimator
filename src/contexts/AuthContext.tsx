import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth.api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const buildUser = (session: Awaited<ReturnType<typeof authApi.login>>): User => ({
    id: session.auth.id,
    name: session.profile
      ? `${session.profile.firstName} ${session.profile.lastName}`.trim()
      : session.auth.name,
    email: session.profile?.email || session.auth.email,
    role: session.profile?.role || session.auth.role,
    token: session.auth.token,
  });

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const restoredSession = await authApi.restoreSession();
        if (isMounted && restoredSession) {
          setUser(buildUser(restoredSession));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const handleAuthExpired = () => {
      if (isMounted) {
        setUser(null);
        setIsLoading(false);
      }
    };

    window.addEventListener('agro:auth-expired', handleAuthExpired);
    void restoreSession();

    return () => {
      isMounted = false;
      window.removeEventListener('agro:auth-expired', handleAuthExpired);
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const session = await authApi.login(email, pass);
      const loggedInUser = buildUser(session);
      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
