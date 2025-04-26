import { useAuth } from './useAuth';

export function useSession() {
  const { user, isLoading } = useAuth();
  
  return {
    user,
    loading: isLoading,
    isAuthenticated: Boolean(user),
    userTier: user?.tier || 'anonymous'
  };
}