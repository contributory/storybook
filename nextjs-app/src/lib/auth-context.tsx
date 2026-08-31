'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as db from '@/lib/db';

type User = db.User | null;

interface AuthContextType {
  user: User;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser: User }) {
  const [user, setUser] = useState<User>(initialUser);
  const [loading, setLoading] = useState(false);

  const refreshUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      setUser(data.user || null);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Periodically check for session updates
    const interval = setInterval(() => {
      if (user) {
        refreshUser();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
