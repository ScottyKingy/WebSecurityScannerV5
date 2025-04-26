import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSession } from '@/hooks/useSession';
import { useLocation } from 'wouter';

export function RestrictedBanner() {
  const { user, userTier } = useSession();
  const [, navigate] = useLocation();
  
  return (
    <Alert className="mb-6 bg-amber-50 text-amber-900 border-amber-200">
      <AlertTriangle className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-800 font-semibold flex items-center gap-2">
        Preview Mode
        <span className="text-xs font-normal py-0.5 px-2 bg-amber-100 rounded-full border border-amber-200">
          {userTier === 'anonymous' ? 'Not Logged In' : `${userTier.charAt(0).toUpperCase() + userTier.slice(1)} Tier`}
        </span>
      </AlertTitle>
      <AlertDescription className="text-amber-700 mt-1">
        {!user ? (
          <>
            <p className="mb-2">You're viewing this report in guest mode with limited access.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button variant="secondary" size="sm" onClick={() => navigate('/auth')}>
                Log In
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-2">
              Your current plan ({userTier.charAt(0).toUpperCase() + userTier.slice(1)} Tier) 
              provides limited access to scan results. Upgrade your plan to unlock full scan reports,
              including competitor analysis and detailed insights.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button variant="secondary" size="sm">
                Upgrade Plan
              </Button>
            </div>
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}