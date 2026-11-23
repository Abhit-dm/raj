import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'DRIVER' | 'FLEET_OWNER';

export type SessionUser = {
  id: string;
  email: string | null;
  phone: string | null;
  role: Role;
  language: string;
};

export type SessionProfile = {
  id: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  registrationId?: string;
  mobileNumber: string;
  verificationStatus: string;
  registrationType?: string;
  vehicleTypes?: string[];
};

export type Session = { accessToken: string; refreshToken: string; user: SessionUser; profile: SessionProfile | null };

type AuthState = {
  user: SessionUser | null;
  profile: SessionProfile | null;
  isAuthenticated: boolean;
  setSession: (s: Session) => void;
  setProfile: (p: Partial<SessionProfile>) => void;
  logout: () => void;
};

export const homePathFor = (role?: string) => (role === 'FLEET_OWNER' ? '/fleet' : '/driver');

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      setSession: ({ accessToken, refreshToken, user, profile }) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, profile, isAuthenticated: true });
      },
      setProfile: (p) => set((s) => (s.profile ? { profile: { ...s.profile, ...p } } : s)),
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, profile: null, isAuthenticated: false });
      },
    }),
    { name: 'rw-session' },
  ),
);
