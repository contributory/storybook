'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as db from '@/lib/db';

type User = db.User | null;

interface AuthContextType {
  user: User;
  loading: boolean;
  refreshUser: () => Promise<void>;
  openAuthModal: (type?: 'login' | 'register') => void;
  toggleLike: (targetType: string, targetId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser: User }) {
  const [user, setUser] = useState<User>(initialUser);
  const [loading, setLoading] = useState(false);

  const refreshUser = useCallback(async () => {
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
  }, []);

  const openAuthModal = useCallback((type: 'login' | 'register' = 'login') => {
    // Create and show auth modal
    const modal = document.getElementById('authModal');
    const typeInput = document.getElementById('authType') as HTMLInputElement;
    const title = document.getElementById('modalTitle');
    const nameGroup = document.getElementById('displayNameGroup');
    const prompt = document.getElementById('switchAuthPrompt');
    const switchBtn = document.getElementById('switchAuthBtn');
    const errDiv = document.getElementById('authError');

    if (!modal || !typeInput || !title) return;

    errDiv?.classList.add('hidden');
    typeInput.value = type;

    if (type === 'login') {
      title.innerText = 'Đăng nhập';
      nameGroup?.classList.add('hidden');
      prompt!.innerText = 'Chưa có tài khoản?';
      switchBtn!.innerText = 'Đăng ký';
    } else {
      title.innerText = 'Đăng ký';
      nameGroup?.classList.remove('hidden');
      prompt!.innerText = 'Đã có tài khoản?';
      switchBtn!.innerText = 'Đăng nhập';
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      modal.querySelector('div')?.classList.remove('scale-95');
    }, 10);
  }, []);

  const toggleLike = useCallback(async (targetType: string, targetId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: targetType, target_id: targetId })
      });
      const data = await res.json();
      if (data.success) {
        // Update UI - find and update the like button
        const buttons = document.querySelectorAll(`button[onclick*="${targetId}"]`);
        buttons.forEach(btn => {
          const icon = btn.querySelector('i');
          const text = btn.querySelector('span');
          if (icon && text) {
            if (data.liked) {
              icon.classList.remove('fa-regular');
              icon.classList.add('fa-solid', 'text-red-500');
            } else {
              icon.classList.remove('fa-solid', 'text-red-500');
              icon.classList.add('fa-regular');
            }
            text.innerText = `${data.count} thích`;
          }
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, [user, openAuthModal]);

  useEffect(() => {
    // Periodically check for session updates
    const interval = setInterval(() => {
      if (user) {
        refreshUser();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [user, refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, openAuthModal, toggleLike }}>
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
