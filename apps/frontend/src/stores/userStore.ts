import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name?: string;
}

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'flowdyno-user',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
