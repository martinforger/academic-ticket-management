import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  setProfile: (profile: Profile) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  error: null,
  setProfile: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedUserId = React.useRef<string | null>(null);
  const isFetchingRef = React.useRef<boolean>(false);

  useEffect(() => {
    console.log("AuthContext: MOUNTED");

    let mounted = true;

    // Listen for auth changes - this also handles the initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log("AuthContext: Auth state changed", event, session?.user?.id);
      
      const currentUser = session?.user ?? null;
      setSession(session);
      setUser(currentUser);
      
      if (currentUser) {
         // Avoid double fetching
         if (lastFetchedUserId.current !== currentUser.id || event === 'SIGNED_IN') {
            // After F5, give Vite a small window to finish loading resources
            // before hitting the DB to avoid browser request queueing/timeouts
            const delay = event === 'INITIAL_SESSION' ? 500 : 0;
            setTimeout(() => {
              if (mounted) fetchProfile(currentUser.id, currentUser.email);
            }, delay);
         }
      } else {
        setProfile(null);
        lastFetchedUserId.current = null;
        setLoading(false);
      }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, userEmail?: string, retryCount = 0) => {
    // If we've already successfully fetched this user or are currently fetching, skip
    if (retryCount === 0) {
      if (profile && profile.id === userId) {
        setLoading(false);
        return;
      }
      if (isFetchingRef.current && lastFetchedUserId.current === userId) {
        return;
      }
    }

    try {
      isFetchingRef.current = true;
      if (retryCount === 0) setError(null);
      console.log(`AuthContext: fetchProfile START (Attempt ${retryCount + 1})`, userId);
      lastFetchedUserId.current = userId;
      
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT_DB')), 12000)
      );

      const result: any = await Promise.race([queryPromise, timeoutPromise]);
      const { data: profileData, error: dbError } = result;

      if (dbError) throw dbError;
      
      if (!profileData) {
        if (retryCount < 1) {
          console.log("AuthContext: Profile missing, retrying...");
          setTimeout(() => fetchProfile(userId, userEmail, retryCount + 1), 1000);
          return;
        }
        
        console.warn("User profile not found in DB. using fallback.");
        const fallbackProfile: Profile = {
          id: userId,
          email: userEmail || 'unknown',
          role: 'sin_asignar',
          initials: (userEmail || '??').substring(0,2).toUpperCase(),
          full_name: 'Usuario'
        };
        setProfile(fallbackProfile);
      } else {
        console.log("AuthContext: Profile found", profileData.id);
        setProfile(profileData as Profile);
      }
      setLoading(false);
    } catch (err: any) {
      console.error('AuthContext: Error in fetchProfile:', err);
      if (retryCount < 1) {
          setTimeout(() => fetchProfile(userId, userEmail, retryCount + 1), 1500);
          return;
      }
      setError(err.message === 'TIMEOUT_DB' ? 'Error de conexión con la base de datos' : 'Error al cargar perfil');
      setLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, error, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
