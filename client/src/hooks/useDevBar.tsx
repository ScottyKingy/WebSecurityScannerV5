import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from './useAuth';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

// Context for Dev Bar visibility
type DevBarContextType = {
  isVisible: boolean;
  toggleVisibility: () => void;
};

const DevBarContext = createContext<DevBarContextType | null>(null);

function DevBarPanel({ toggleVisibility }: { toggleVisibility: () => void }) {
  const { user, refetch } = useAuth();
  const [selectedTier, setSelectedTier] = useState(user?.tier || 'lite');
  const [creditAmount, setCreditAmount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Handle tier change
  const handleTierChange = async (value: string) => {
    setIsLoading(true);
    try {
      // Update user tier via admin API
      await apiRequest('PUT', `/api/admin/users/${user?.id}/tier`, { tier: value });
      setSelectedTier(value);
      
      // Refetch user data to update the UI
      await refetch();
      
      toast({
        title: 'User tier updated',
        description: `Changed to ${value.toUpperCase()} tier`,
      });
    } catch (error) {
      toast({
        title: 'Failed to update tier',
        description: 'An error occurred while updating the tier',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding credits
  const handleAddCredits = async () => {
    if (creditAmount <= 0) return;
    setIsLoading(true);
    
    try {
      await apiRequest('POST', `/api/admin/users/${user?.id}/credits`, { 
        amount: creditAmount,
        type: 'admin_grant'
      });
      
      // Invalidate credits balance query
      queryClient.invalidateQueries({ queryKey: ['/api/credits/balance'] });
      
      toast({
        title: 'Credits added',
        description: `Added ${creditAmount} credits to account`,
      });
    } catch (error) {
      toast({
        title: 'Failed to add credits',
        description: 'An error occurred while adding credits',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle removing credits
  const handleRemoveCredits = async () => {
    if (creditAmount <= 0) return;
    setIsLoading(true);
    
    try {
      await apiRequest('POST', `/api/admin/users/${user?.id}/deduct-credits`, { 
        amount: creditAmount,
        type: 'admin_deduction'
      });
      
      // Invalidate credits balance query
      queryClient.invalidateQueries({ queryKey: ['/api/credits/balance'] });
      
      toast({
        title: 'Credits removed',
        description: `Removed ${creditAmount} credits from account`,
      });
    } catch (error) {
      toast({
        title: 'Failed to remove credits',
        description: 'An error occurred while removing credits',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-yellow-100 border-b border-yellow-300 p-2 z-50 fixed top-0 left-0 w-full">
      <Card className="bg-white border-yellow-400">
        <CardContent className="pt-4 pb-4 flex items-center flex-wrap gap-4">
          <div className="flex-none">
            <p className="text-sm font-bold bg-red-100 border border-red-300 rounded-md px-2 py-1">
              DEV MODE
            </p>
          </div>
          
          <div className="flex-grow-0">
            <p className="text-xs text-muted-foreground">
              User: <span className="font-semibold">{user?.email}</span> | 
              Role: <span className="font-semibold">{user?.role}</span>
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Tier Selector */}
            <div className="flex-none">
              <Select
                value={selectedTier}
                onValueChange={handleTierChange}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Select Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>User Tiers</SelectLabel>
                    <SelectItem value="anonymous">Anonymous</SelectItem>
                    <SelectItem value="lite">Lite</SelectItem>
                    <SelectItem value="deep">Deep</SelectItem>
                    <SelectItem value="ultimate">Ultimate</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Credit Adjuster */}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                className="w-20 h-8 text-xs"
                min="1"
              />
              <Button 
                size="sm" 
                variant="outline"
                className="h-8 text-xs bg-green-100 border-green-300 hover:bg-green-200"
                onClick={handleAddCredits}
                disabled={isLoading}
              >
                Add
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="h-8 text-xs bg-red-100 border-red-300 hover:bg-red-200"
                onClick={handleRemoveCredits}
                disabled={isLoading}
              >
                Remove
              </Button>
            </div>

            <Button 
              size="sm" 
              variant="ghost"
              className="h-8 text-xs"
              onClick={toggleVisibility}
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DevBarProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();
  const [isDevEnvironment, setIsDevEnvironment] = useState(false);

  useEffect(() => {
    // Check if we're in a development environment (replit)
    const isDev = window.location.hostname.includes('replit');
    setIsDevEnvironment(isDev);
    
    // Listen for keyboard shortcut (Ctrl+Shift+D)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Only show the dev bar if in development environment and user is admin
  const isMasterAdmin = user?.role === 'admin' && 
    (user.email === 'admin@admin.com' || user.email === 'admin@example.com');
  const shouldShowDevBar = isDevEnvironment && isMasterAdmin;

  const toggleVisibility = () => {
    setIsVisible(prev => !prev);
  };

  return (
    <DevBarContext.Provider value={{ isVisible, toggleVisibility }}>
      {children}
      {shouldShowDevBar && isVisible && <DevBarPanel toggleVisibility={toggleVisibility} />}
      {shouldShowDevBar && (
        <button
          onClick={toggleVisibility}
          className={`fixed bottom-4 right-4 z-50 p-2 rounded-full shadow-lg border ${
            isVisible ? 'bg-red-500 text-white border-red-600' : 'bg-yellow-100 text-gray-800 border-yellow-300'
          }`}
          title="Toggle Developer Tools"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>
      )}
    </DevBarContext.Provider>
  );
}

export function useDevBar() {
  const context = useContext(DevBarContext);
  if (!context) {
    throw new Error('useDevBar must be used within a DevBarProvider');
  }
  return context;
}