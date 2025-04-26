import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export function useSession() {
  const auth = useContext(AuthContext);
  
  if (!auth) {
    throw new Error("useSession must be used within an AuthProvider");
  }
  
  const { user, isLoading, isAuthenticated } = auth;
  
  return {
    user,
    loading: isLoading,
    isAuthenticated,
    userTier: user?.tier || 'anonymous'
  };
}