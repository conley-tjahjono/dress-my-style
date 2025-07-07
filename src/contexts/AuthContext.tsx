'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
// @ts-expect-error - Supabase client type issue in demo mode
import { supabase } from '../lib/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// @ts-expect-error - Suppress all supabase type issues
const typedSupabase = supabase as any;

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Session timeout settings (30 minutes of inactivity)
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  const WARNING_TIME = 5 * 60 * 1000; // 5 minutes warning before logout
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [showTimeoutWarning, setShowTimeoutWarning] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    const getSession = async () => {
      try {
        console.log('🔄 Getting initial session...');
        const { data: { session } } = await typedSupabase.auth.getSession();
        console.log('📋 Session data:', session ? 'Session exists' : 'No session');
        
        if (!mounted) return;
        
        if (session?.user) {
          console.log('👤 User found in session:', session.user.email);
          
          // Get user profile from our custom users table
          const { data: profile, error: profileError } = await typedSupabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          console.log('📝 Profile fetch result:', { profile, profileError });

          // If profile doesn't exist, create it
          if (profileError && profileError.code === 'PGRST116') {
            console.log('🆕 Creating missing user profile...');
            const { error: insertError } = await typedSupabase
              .from('users')
              .insert([{
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || 'User'
              }]);

            if (insertError) {
              console.error('❌ Failed to create user profile:', insertError);
            } else {
              console.log('✅ User profile created successfully');
            }
          }

          if (mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: profile?.full_name || session.user.user_metadata?.full_name || 'User',
              avatar_url: profile?.avatar_url
            });
            console.log('✅ User set in context');
          }
        } else {
          console.log('🚫 No user in session');
          if (mounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ Error getting session:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('🏁 Initial session loading complete');
        }
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = typedSupabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('🔐 Auth state changed:', event, 'mounted:', mounted);
        
        if (!mounted) return;
        
        if (session?.user) {
          console.log('👤 User in auth change:', session.user.email);
          
          // Get user profile from our custom users table
          const { data: profile, error: profileError } = await typedSupabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          console.log('📝 Profile in auth change:', { profile, profileError });

          // If profile doesn't exist, create it
          if (profileError && profileError.code === 'PGRST116') {
            console.log('🆕 Creating user profile in auth change...');
            const { error: insertError } = await typedSupabase
              .from('users')
              .insert([{
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || 'User'
              }]);

            if (insertError) {
              console.error('❌ Failed to create user profile in auth change:', insertError);
            } else {
              console.log('✅ User profile created in auth change');
            }
          }

          if (mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: profile?.full_name || session.user.user_metadata?.full_name || 'User',
              avatar_url: profile?.avatar_url
            });
            console.log('✅ User updated in auth change');
          }
        } else {
          console.log('🚫 No user in auth change, setting to null');
          if (mounted) {
            setUser(null);
          }
        }
        
        // Only set loading to false after we've handled the auth change
        if (mounted) {
          setLoading(false);
          console.log('🏁 Auth change loading complete');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Track user activity and auto-logout on inactivity
  useEffect(() => {
    if (!user) return;

    // Activity tracking function
    const updateActivity = () => {
      setLastActivity(Date.now());
      setShowTimeoutWarning(false); // Reset warning on activity
      console.log('🔄 User activity detected, updating last activity time');
    };

    // Events that indicate user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Check for inactivity every minute
    const checkInactivity = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      console.log('⏰ Checking user activity - Time since last activity:', Math.round(timeSinceLastActivity / 1000 / 60), 'minutes');
      
      // Show warning 5 minutes before logout
      if (timeSinceLastActivity > (SESSION_TIMEOUT - WARNING_TIME) && !showTimeoutWarning) {
        console.log('⚠️ Showing session timeout warning');
        setShowTimeoutWarning(true);
      }
      
      // Logout user after timeout
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        console.log('🚪 Session expired due to inactivity, logging out user');
        signOut();
      }
    }, 60000); // Check every minute

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      clearInterval(checkInactivity);
    };
  }, [user, lastActivity, SESSION_TIMEOUT]);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('📝 Starting signup process...');
      const { data, error } = await typedSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;

      console.log('✅ Supabase auth signup successful');
      
      // Note: User profile will be created automatically when the auth state changes
      // or when the user confirms their email (if email confirmation is enabled)

      return { error: null };
    } catch (error) {
      console.error('❌ Signup error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await typedSupabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Signin error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await typedSupabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setShowTimeoutWarning(false);
    } catch (error) {
      console.error('Signout error:', error);
    }
  };

  const extendSession = () => {
    console.log('🔄 Session extended by user action');
    setLastActivity(Date.now());
    setShowTimeoutWarning(false);
  };

  const value: AuthContextType = {
    user,
    loading,
    showTimeoutWarning,
    extendSession,
    signUp,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 