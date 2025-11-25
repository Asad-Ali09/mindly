import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect } from 'react';
import { authApi } from '@/api';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
  googleClassroomConnected?: boolean;
}

interface AuthState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Token state (kept for quick access check)
  token: string | null;
  setToken: (token: string | null) => void;
  
  // Authentication status
  isAuthenticated: boolean;
  
  // Google Classroom connection status
  googleClassroomConnected: boolean;
  setGoogleClassroomConnected: (connected: boolean) => void;
  
  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  
  // Hydration state
  isHydrated: boolean;
  setIsHydrated: (hydrated: boolean) => void;
}

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  googleClassroomConnected: false,
  isLoading: false,
  isHydrated: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // User actions
      setUser: (user: User | null) => 
        set({ 
          user, 
          isAuthenticated: !!user,
          googleClassroomConnected: user?.googleClassroomConnected || false,
        }),
      
      // Token actions
      setToken: (token: string | null) => {
        set({ token });
        // Sync with localStorage through authApi
        if (token) {
          authApi.setToken(token);
        }
      },
      
      // Google Classroom connection actions
      setGoogleClassroomConnected: (connected: boolean) => 
        set({ googleClassroomConnected: connected }),
      
      // Loading actions
      setIsLoading: (loading: boolean) => set({ isLoading: loading }),
      
      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          
          if (response.success) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              googleClassroomConnected: response.data.user.googleClassroomConnected || false,
              isLoading: false,
            });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      // Signup action
      signup: async (name: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.signup({ name, email, password });
          
          if (response.success) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              googleClassroomConnected: false,
              isLoading: false,
            });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      // Logout action
      logout: () => {
        authApi.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          googleClassroomConnected: false,
        });
      },
      
      // Fetch current user
      fetchCurrentUser: async () => {
        const token = get().token;
        
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }
        
        set({ isLoading: true });
        try {
          const response = await authApi.getCurrentUser();
          
          if (response.success) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              googleClassroomConnected: response.data.user.googleClassroomConnected || false,
              isLoading: false,
            });
          }
        } catch (error) {
          // Token might be invalid or expired
          console.error('Failed to fetch current user:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            googleClassroomConnected: false,
            isLoading: false,
          });
          authApi.logout();
        }
      },
      
      // Hydration
      setIsHydrated: (hydrated: boolean) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        googleClassroomConnected: state.googleClassroomConnected,
      }),
      onRehydrateStorage: () => (state) => {
        // Sync token with authApi after rehydration
        if (state?.token) {
          authApi.setToken(state.token);
        }
        state?.setIsHydrated(true);
      },
    }
  )
);

/**
 * Custom hook to handle hydration state
 * Use this to prevent hydration mismatches in SSR
 */
export const useAuthStoreHydration = () => {
  const [hydrated, setHydrated] = useState(false);
  
  useEffect(() => {
    // Wait for zustand to hydrate from localStorage
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  return hydrated;
};

/**
 * Hook to check authentication status with hydration safety
 */
export const useAuth = () => {
  const hydrated = useAuthStoreHydration();
  const { 
    user, 
    isAuthenticated, 
    googleClassroomConnected,
    isLoading, 
    login, 
    signup, 
    logout, 
    fetchCurrentUser,
    setGoogleClassroomConnected,
  } = useAuthStore();
  
  return {
    user,
    isAuthenticated: hydrated ? isAuthenticated : false,
    googleClassroomConnected,
    isLoading,
    isHydrated: hydrated,
    login,
    signup,
    logout,
    fetchCurrentUser,
    setGoogleClassroomConnected,
  };
};
