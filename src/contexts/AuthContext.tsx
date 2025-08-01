'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useServerAuth } from '../hooks/useServerAuth';

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  showTimeoutWarning: boolean;
  extendSession: () => void;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: unknown }>;
  signIn: (email: string, password: string) => Promise<{ error?: unknown }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  
  // Use server-side authentication
  const { 
    getServerSession, 
    serverSignIn, 
    serverSignUp, 
    serverSignOut,
    loading: serverLoading 
  } = useServerAuth();

  // Session timeout handling (keeping this for compatibility)
  const WARNING_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
  const extendSession = () => {
    console.log('🔄 Session extended by user interaction');
    setShowTimeoutWarning(false);
  };

  // Load initial session (runs once on mount)
  useEffect(() => {
    let mounted = true;
    
    const loadServerSession = async () => {
      try {
        console.log('🔄 Loading server session...');
        const sessionData = await getServerSession();
        
        if (!mounted) return;
        
        if (sessionData?.user) {
          console.log('👤 Server session found:', sessionData.user.email);
          setUser({
            id: sessionData.user.id,
            email: sessionData.user.email || '',
            full_name: sessionData.user.user_metadata?.full_name || 'User',
            avatar_url: sessionData.user.user_metadata?.avatar_url
          });
        } else {
          console.log('🚫 No server session found');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error loading server session:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('🏁 Server session loading complete');
        }
      }
    };

    loadServerSession();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only run once on mount, getServerSession is stable

  // Session timeout warning (separate effect for user-dependent logic)
  useEffect(() => {
    if (!user) return;

    console.log('⚠️ Setting up session timeout warning for user:', user.email);
    const warningTimer = setTimeout(() => {
      setShowTimeoutWarning(true);
      console.log('⚠️ Session timeout warning shown');
    }, WARNING_TIME);

    return () => {
      clearTimeout(warningTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only user.id needed, WARNING_TIME is constant

  // Server-side sign up
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('🔐 Starting server-side signup...');
      const result = await serverSignUp(email, password, fullName);
      
      if (result.error) {
        console.error('❌ Server signup failed:', result.error);
        return { error: result.error };
      }

      console.log('✅ Server signup successful');
      
      // If user is immediately logged in (no email confirmation)
      if (result.session && result.user) {
        setUser({
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.full_name || fullName,
          avatar_url: result.user.avatar_url
        });
      }

      return { message: result.message };
    } catch (error) {
      console.error('💥 Unexpected signup error:', error);
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  // Server-side sign in
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting server-side signin...');
      const result = await serverSignIn(email, password);
      
      if (result.error) {
        console.error('❌ Server signin failed:', result.error);
        return { error: result.error };
      }

      console.log('✅ Server signin successful');
      
      if (result.user) {
        setUser({
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.full_name || 'User',
          avatar_url: result.user.avatar_url
        });
      }

      return {};
    } catch (error) {
      console.error('💥 Unexpected signin error:', error);
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  // Server-side sign out
  const signOut = async () => {
    try {
      console.log('🔐 Starting server-side signout...');
      await serverSignOut();
      setUser(null);
      setShowTimeoutWarning(false);
      console.log('✅ Server signout successful');
    } catch (error) {
      console.error('❌ Server signout error:', error);
      // Still clear local state even if server signout fails
      setUser(null);
      setShowTimeoutWarning(false);
    }
  };

  const value = {
    user,
    loading: loading || serverLoading,
    showTimeoutWarning,
    extendSession,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 