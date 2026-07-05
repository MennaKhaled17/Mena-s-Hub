import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
  import { UserType } from '../types';
  import type { User, Language } from '../types';
  // If the generated types for services aren't available in some setups,
  // ignore the TS module-not-found error for this import so the app can build.
  // @ts-ignore
  import * as authService from '../services/auth';
  // If the generated types for services aren't available in some setups,
  // ignore the TS module-not-found error for this import so the app can build.
  // @ts-ignore
  import * as db from '../services/db';

  // ── Small localStorage helpers kept only for UI prefs (language) ──────────
  // NOTE: these are intentionally NOT used for app data anymore — every piece
  // of real data (users, reports, homework, videos, …) now lives in Supabase.
  export function loadData<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }
  export function saveData<T>(key: string, value: T): void {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }

  export type PendingUser = db.Profile;
export type VideoRequest = db.VideoRequest;

  interface AppContextValue {
    // Auth / current user
    currentUser: User | null;
    authLoading: boolean;
    login: (
      email: string,
      password: string,
      name?: string,
      requestedRole?: UserType,
      parentOfStudentEmail?: string
    ) => Promise<authService.LoginResult>;
    logout: () => Promise<void>;

    // i18n
    language: Language;
    setLanguage: (l: Language) => void;
    isRTL: boolean;
    t: (en: string, ar: string) => string;

    // Pending approvals (admin)
    pendingUsers: PendingUser[];
    approveUser: (id: string, role: UserType, parentOfStudentEmail?: string) => Promise<void>;
    rejectUser: (id: string) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;

    // Video access requests
    videoRequests: db.VideoRequest[];
    requestVideoAccess: (studentId: string, videoId: string) => Promise<void>;
    approveVideoRequest: (id: string) => Promise<void>;
    rejectVideoRequest: (id: string) => Promise<void>;
    hasVideoAccess: (videoId: string) => boolean;
  }

  const AppContext = createContext<AppContextValue | undefined>(undefined);

  export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [language, setLanguageState] = useState<Language>(() => loadData<Language>('mh_language', 'en'));
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [videoRequests, setVideoRequests] = useState<db.VideoRequest[]>([]);

    const isRTL = language === 'ar';
    const t = useCallback((en: string, ar: string) => (language === 'ar' ? ar : en), [language]);

    const setLanguage = (l: Language) => {
      setLanguageState(l);
      saveData('mh_language', l);
    };

    // ── Bootstrap session + keep it live across tabs / token refresh ──────
    useEffect(() => {
      let active = true;
      authService.getCurrentUser().then((user: User | null) => {
  if (active) { setCurrentUser(user); setAuthLoading(false); }
});
const unsubscribe = authService.onAuthStateChange((user: User | null) => {
  if (active) setCurrentUser(user);
});
    }, []);

    // ── Live pending-approvals + video-requests (realtime) ─────────────────
    useEffect(() => db.subscribePendingUsers(setPendingUsers), []);
    useEffect(() => db.subscribeVideoRequests(setVideoRequests), []);

    const login = async (
      email: string,
      password: string,
      name?: string,
      requestedRole: UserType = UserType.Student,
      parentOfStudentEmail?: string
    ) => {
      const result = await authService.login(email, password, name, requestedRole, parentOfStudentEmail);
      if (result === true) {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      }
      return result;
    };

    const logout = async () => {
      await authService.logout();
      setCurrentUser(null);
    };

    const approveUser = async (id: string, role: UserType, parentOfStudentEmail?: string) => {
      await db.approveUser(id, role, parentOfStudentEmail);
    };
    const rejectUser = async (id: string) => { await db.rejectUser(id); };
    const deleteUser = async (id: string) => { await db.deleteUser(id); };

    const requestVideoAccess = async (studentId: string, videoId: string) => {
      await db.requestVideoAccess(studentId, videoId);
    };
    const approveVideoRequest = async (id: string) => { await db.setVideoRequestStatus(id, 'approved'); };
    const rejectVideoRequest  = async (id: string) => { await db.setVideoRequestStatus(id, 'rejected'); };
    const hasVideoAccess = (videoId: string): boolean => {
      if (!currentUser) return false;
      if (currentUser.type !== UserType.Student) return true;
      return videoRequests.some(r => r.videoId === videoId && r.studentId === currentUser.id && r.status === 'approved');
    };

    return (
      <AppContext.Provider value={{
        currentUser, authLoading, login, logout,
        language, setLanguage, isRTL, t,
        pendingUsers, approveUser, rejectUser, deleteUser,
        videoRequests, requestVideoAccess, approveVideoRequest, rejectVideoRequest, hasVideoAccess,
      }}>
        {children}
      </AppContext.Provider>
    );
  };

  export const useApp = (): AppContextValue => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
  };