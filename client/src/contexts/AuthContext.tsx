import { createContext, ReactNode, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient
} from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types
export type User = {
  id: string;
  email: string;
  role: string;
  tier: string;
  createdAt: string;
  lastLogin?: string;
  isVerified: boolean;
  creditsBalance?: {
    amount: number;
    updatedAt: string;
  };
};

export type LoginData = {
  email: string;
  password: string;
};

export type RegisterData = {
  email: string;
  password: string;
  confirmPassword: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  accessToken: string | null;
  loginMutation: UseMutationResult<AuthResponse, Error, LoginData>;
  registerMutation: UseMutationResult<AuthResponse, Error, RegisterData>;
  logoutMutation: UseMutationResult<{ message: string }, Error, void>;
  refreshMutation: UseMutationResult<RefreshResponse, Error, void>;
};

// Create context
export const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('accessToken')
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem('refreshToken')
  );

  // Get user data
  const {
    data: user,
    error,
    isLoading,
    isSuccess
  } = useQuery<User | null, Error>({
    queryKey: ['/api/auth/me'],
    enabled: !!accessToken,
    retry: 1,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json() as AuthResponse;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      queryClient.setQueryData(['/api/auth/me'], data.user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.email}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      return await res.json() as AuthResponse;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      queryClient.setQueryData(['/api/auth/me'], data.user);
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout", { refreshToken });
      return await res.json() as { message: string };
    },
    onSuccess: () => {
      clearTokens();
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Refresh token mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!refreshToken) throw new Error("No refresh token available");
      
      const res = await apiRequest("POST", "/api/auth/refresh", { refreshToken });
      return await res.json() as RefreshResponse;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
    },
    onError: () => {
      clearTokens();
      queryClient.setQueryData(['/api/auth/me'], null);
    },
  });

  // Helper functions for token management
  function setTokens(access: string, refresh: string) {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    setAccessToken(access);
    setRefreshToken(refresh);
  }

  function clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setRefreshToken(null);
  }

  // Setup axios interceptor for token refresh
  useEffect(() => {
    // Add interceptor for request
    const requestInterceptor = (config: RequestInit) => {
      if (accessToken) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${accessToken}`
        };
      }
      return config;
    };

    // Hook into fetch to add authorization header
    const originalFetch = window.fetch;
    window.fetch = async (url, config) => {
      // Only intercept API requests
      if (typeof url === 'string' && url.startsWith('/api')) {
        const newConfig = config ? { ...config } : {};
        
        // Add authorization header
        if (accessToken) {
          newConfig.headers = {
            ...newConfig.headers,
            'Authorization': `Bearer ${accessToken}`
          };
        }
        
        try {
          const response = await originalFetch(url, newConfig);
          
          // Handle 401 Unauthorized
          if (response.status === 401 && refreshToken) {
            try {
              // Try to refresh the token
              const refreshResult = await refreshMutation.mutateAsync();
              
              // Retry original request with new token
              newConfig.headers = {
                ...newConfig.headers,
                'Authorization': `Bearer ${refreshResult.accessToken}`
              };
              
              return originalFetch(url, newConfig);
            } catch (refreshError) {
              // If refresh fails, logout
              clearTokens();
              return response;
            }
          }
          
          return response;
        } catch (error) {
          throw error;
        }
      }
      
      // Pass through non-API requests unchanged
      return originalFetch(url, config);
    };

    return () => {
      // Restore original fetch when component unmounts
      window.fetch = originalFetch;
    };
  }, [accessToken, refreshToken, refreshMutation]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        accessToken,
        loginMutation,
        logoutMutation,
        registerMutation,
        refreshMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
