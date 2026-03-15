// src/lib/store/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import api from '../api';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,

      setUser: (user) => set({ user }),
      setToken: (accessToken) => {
        set({ accessToken });
        if (accessToken) Cookies.set('accessToken', accessToken, { expires: 1 / 96 });
        else Cookies.remove('accessToken');
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          get().setToken(data.accessToken);
          set({ user: data.user });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', { name, email, password });
          get().setToken(data.accessToken);
          set({ user: data.user });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch {}
        get().setToken(null);
        set({ user: null });
        if (typeof window !== 'undefined') window.location.href = '/';
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data });
        } catch {
          get().setToken(null);
          set({ user: null });
        }
      },
    }),
    {
      name: 'devlearn-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
    }
  )
);
