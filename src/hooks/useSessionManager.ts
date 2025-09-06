import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SessionManagerConfig {
  checkInterval?: number; // in milliseconds
  cleanupInterval?: number; // in milliseconds
  maxRetries?: number;
}

const DEFAULT_CONFIG: Required<SessionManagerConfig> = {
  checkInterval: 60000, // Check every minute
  cleanupInterval: 172800000, // Cleanup every 2 days
  maxRetries: 3
};

export const useSessionManager = (config: SessionManagerConfig = {}) => {
  const { session, signOut } = useAuth();
  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);

  // Validate current session token
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      if (!session?.access_token) {
        return false;
      }

      // Check if token is expired
      const tokenPayload = JSON.parse(atob(session.access_token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (tokenPayload.exp && tokenPayload.exp < currentTime) {
        console.warn('Session token expired, cleaning up...');
        return false;
      }

      // Verify with Supabase
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.warn('Session validation failed:', error?.message);
        return false;
      }

      retryCountRef.current = 0; // Reset retry count on success
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }, [session]);

  // Clean expired sessions from browser storage
  const cleanupExpiredSessions = useCallback(async () => {
    try {
      // Clean localStorage
      const storageKeys = Object.keys(localStorage);
      const authKeys = storageKeys.filter(key => 
        key.includes('supabase') || 
        key.includes('auth') || 
        key.includes('session') ||
        key.includes('token')
      );

      for (const key of authKeys) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            
            // Check if it's an auth-related item with expiration
            if (parsed.expires_at || parsed.exp) {
              const expirationTime = parsed.expires_at || parsed.exp;
              const currentTime = Math.floor(Date.now() / 1000);
              
              if (expirationTime < currentTime) {
                localStorage.removeItem(key);
                console.log(`Cleaned expired session data: ${key}`);
              }
            }
          }
        } catch (parseError) {
          // If we can't parse it, it might be corrupted - remove it if it's auth-related
          if (key.includes('supabase.auth.token')) {
            localStorage.removeItem(key);
            console.log(`Cleaned corrupted session data: ${key}`);
          }
        }
      }

      // Clean sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage);
      const sessionAuthKeys = sessionStorageKeys.filter(key => 
        key.includes('supabase') || 
        key.includes('auth') || 
        key.includes('session')
      );

      for (const key of sessionAuthKeys) {
        try {
          const item = sessionStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            
            if (parsed.expires_at || parsed.exp) {
              const expirationTime = parsed.expires_at || parsed.exp;
              const currentTime = Math.floor(Date.now() / 1000);
              
              if (expirationTime < currentTime) {
                sessionStorage.removeItem(key);
                console.log(`Cleaned expired session storage: ${key}`);
              }
            }
          }
        } catch (parseError) {
          // Clean corrupted session storage items
          sessionStorage.removeItem(key);
          console.log(`Cleaned corrupted session storage: ${key}`);
        }
      }
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }, []);

  // Perform session check and cleanup if needed
  const performSessionCheck = useCallback(async () => {
    if (!session) {
      await cleanupExpiredSessions();
      return;
    }

    const isValid = await validateSession();
    
    if (!isValid) {
      retryCountRef.current++;
      
      if (retryCountRef.current >= configRef.current.maxRetries) {
        console.warn('Max session validation retries reached, signing out...');
        await cleanupExpiredSessions();
        await signOut();
        retryCountRef.current = 0;
      }
    }
  }, [session, validateSession, cleanupExpiredSessions, signOut]);

  // Start periodic session validation
  useEffect(() => {
    if (session) {
      checkIntervalRef.current = setInterval(
        performSessionCheck,
        configRef.current.checkInterval
      );
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [session, performSessionCheck]);

  // Start periodic cleanup
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(
      cleanupExpiredSessions,
      configRef.current.cleanupInterval
    );

    // Run initial cleanup
    cleanupExpiredSessions();

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [cleanupExpiredSessions]);

  // Handle visibility change to check session when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session) {
        performSessionCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, performSessionCheck]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);

  return {
    validateSession,
    cleanupExpiredSessions,
    isActive: !!checkIntervalRef.current
  };
};