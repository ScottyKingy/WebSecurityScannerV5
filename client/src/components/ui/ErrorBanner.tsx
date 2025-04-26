import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface ErrorBannerProps {
  message: string;
  description?: string;
  backLink?: string;
  backText?: string;
  retry?: () => void;
}

export function ErrorBanner({ 
  message, 
  description, 
  backLink = '/dashboard', 
  backText = 'Back to Dashboard',
  retry 
}: ErrorBannerProps) {
  const [, navigate] = useLocation();
  
  return (
    <div className="container max-w-5xl py-10">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>{message}</AlertTitle>
        {description && <AlertDescription>{description}</AlertDescription>}
      </Alert>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(backLink)}>
          {backText}
        </Button>
        
        {retry && (
          <Button onClick={retry}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}