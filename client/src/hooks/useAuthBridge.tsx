import { useContext } from 'react';

// Import both contexts
import { AuthContext as NewAuthContext } from '../contexts/AuthContext';
import { AuthContext as LegacyAuthContext } from './useAuth';

/**
 * This bridge hook provides compatibility between the old and new auth systems
 * It attempts to use the new AuthContext from contexts/AuthContext.tsx first
 * If that's not available, it falls back to the legacy AuthContext from useAuth.tsx
 */
export function useAuth() {
  // Try to use the new auth context first
  const newAuth = useContext(NewAuthContext);
  const legacyAuth = useContext(LegacyAuthContext);
  
  // If new auth is available, use it
  if (newAuth) {
    return {
      user: newAuth.user,
      isLoading: newAuth.isLoading,
      isAuthenticated: newAuth.isAuthenticated,
      error: newAuth.error,
      loginMutation: newAuth.loginMutation,
      logoutMutation: newAuth.logoutMutation,
      registerMutation: newAuth.registerMutation
    };
  }
  
  // Otherwise, fall back to legacy auth
  if (legacyAuth) {
    return legacyAuth;
  }
  
  // If neither is available, throw an error
  throw new Error("useAuth must be used within an AuthProvider");
}

/**
 * For backward compatibility with the old session system
 * This hook is specifically for components still using the old useSession interface
 */
export function useSession() {
  // Try to use the new auth context first
  const newAuth = useContext(NewAuthContext);
  const legacyAuth = useContext(LegacyAuthContext);
  
  // If new auth is available, adapt it to the session interface
  if (newAuth) {
    return {
      user: newAuth.user,
      loading: newAuth.isLoading,
      isAuthenticated: newAuth.isAuthenticated,
      error: newAuth.error
    };
  }
  
  // Otherwise, adapt the legacy auth to the session interface
  if (legacyAuth) {
    return {
      user: legacyAuth.user,
      loading: legacyAuth.isLoading,
      isAuthenticated: !!legacyAuth.user,
      error: legacyAuth.error
    };
  }
  
  // If neither is available, throw an error
  throw new Error("useSession must be used within an AuthProvider");
}