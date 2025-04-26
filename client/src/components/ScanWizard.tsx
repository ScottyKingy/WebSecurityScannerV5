import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

// UI Components
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, HelpCircle, PlusCircle, MinusCircle } from 'lucide-react';

// Form validation schema
const scanFormSchema = z.object({
  targetUrl: z.string().url('Please enter a valid URL starting with http:// or https://'),
  competitors: z.array(
    z.string().url('Please enter a valid competitor URL')
  ).default([]),
});

type ScanFormValues = z.infer<typeof scanFormSchema>;

// Credit balance type
type CreditBalance = {
  userId: string;
  currentBalance: number;
  monthlyAllotment: number;
  rolloverEnabled: boolean;
  rolloverExpiry: string | null;
  updatedAt: string;
};

// Custom hook to get credit balance
function useCreditBalance() {
  return useQuery<CreditBalance>({
    queryKey: ['/api/credits/balance'],
    staleTime: 30000, // 30 seconds
  });
}

// Custom hook to get user tier
function useUserTier() {
  const { user } = useAuth();
  return user?.tier || 'lite';
}

export default function ScanWizard() {
  const [competitors, setCompetitors] = useState<string[]>([]);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Get URL parameter if provided
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get('url') ? decodeURIComponent(params.get('url') || '') : '';
  const retryParam = params.get('retry') ? decodeURIComponent(params.get('retry') || '') : '';
  
  // Get user info
  const { user } = useAuth();
  const userTier = useUserTier();
  
  // Get credit balance
  const { data: creditBalance, isLoading: isLoadingBalance } = useCreditBalance();
  
  // Check if competitor analysis is allowed
  const canAddCompetitors = ['deep', 'ultimate', 'enterprise'].includes(userTier);
  const canAddMultipleCompetitors = ['ultimate', 'enterprise'].includes(userTier);
  const maxCompetitors = userTier === 'enterprise' ? 10 : userTier === 'ultimate' ? 5 : 1;
  
  // Calculate total cost
  const baseCost = 1; // One credit for primary URL
  const competitorCost = competitors.length;
  const totalCost = baseCost + competitorCost;
  
  // Check if user has enough credits
  const hasEnoughCredits = !isLoadingBalance && creditBalance && 
    (creditBalance.currentBalance >= totalCost || userTier === 'enterprise');

  // Form setup
  const form = useForm<ScanFormValues>({
    resolver: zodResolver(scanFormSchema),
    defaultValues: {
      targetUrl: '',
      competitors: [],
    },
  });
  
  // Handle URL parameters on load
  useEffect(() => {
    // If URL or retry parameter is present, set it as the target URL
    if (urlParam || retryParam) {
      form.setValue('targetUrl', urlParam || retryParam);
    } else {
      // Try to get last scan from localStorage
      const lastScan = localStorage.getItem('lastScanTarget');
      if (lastScan) {
        form.setValue('targetUrl', lastScan);
      }
    }
  }, [form, urlParam, retryParam]);

  // Update competitors in form when array changes
  useEffect(() => {
    form.setValue('competitors', competitors);
  }, [competitors, form]);
  
  // Scan start mutation
  const startScanMutation = useMutation({
    mutationFn: async (data: ScanFormValues) => {
      const response = await apiRequest('POST', '/api/scan/start', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start scan');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Save last scan target to localStorage
      try {
        if (form.getValues('targetUrl')) {
          localStorage.setItem('lastScanTarget', form.getValues('targetUrl'));
        }
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }

      toast({
        title: 'Scan Started',
        description: `Scan queued successfully. ${data.creditsCharged} credits were charged.`,
      });
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/credits/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scan'] });
      
      // Redirect to scan details page
      navigate(`/scan-details?id=${data.scanId}`);
    },
    onError: (error: Error) => {
      if (error.message.includes('Insufficient credits')) {
        toast({
          title: 'Insufficient Credits',
          description: 'You do not have enough credits for this scan.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Scan Failed',
          description: error.message || 'An error occurred while starting the scan.',
          variant: 'destructive',
        });
      }
    },
  });
  
  // Add competitor field
  const addCompetitor = () => {
    if (competitors.length < maxCompetitors) {
      setCompetitors([...competitors, '']);
    }
  };
  
  // Remove competitor field
  const removeCompetitor = (index: number) => {
    const newCompetitors = [...competitors];
    newCompetitors.splice(index, 1);
    setCompetitors(newCompetitors);
  };
  
  // Update competitor value
  const updateCompetitor = (index: number, value: string) => {
    const newCompetitors = [...competitors];
    newCompetitors[index] = value;
    setCompetitors(newCompetitors);
  };
  
  // Form submission
  const onSubmit = (data: ScanFormValues) => {
    if (!hasEnoughCredits && userTier !== 'enterprise') {
      toast({
        title: 'Insufficient Credits',
        description: `You need ${totalCost} credits for this scan, but you only have ${creditBalance?.currentBalance || 0}.`,
        variant: 'destructive',
      });
      return;
    }
    
    startScanMutation.mutate(data);
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Website Scanner</CardTitle>
        <CardDescription>
          Analyze your website and see how it compares to competitors.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Target URL */}
            <FormField
              control={form.control}
              name="targetUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The main website you want to analyze.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Competitor URLs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Competitor URLs</FormLabel>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCompetitor}
                        disabled={!canAddCompetitors || competitors.length >= maxCompetitors}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Competitor
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!canAddCompetitors 
                        ? "Upgrade to 'Deep' tier or higher to add competitors" 
                        : competitors.length >= maxCompetitors
                          ? `Your tier allows a maximum of ${maxCompetitors} competitors`
                          : "Add a competitor website to compare"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {!canAddCompetitors && (
                <p className="text-sm text-muted-foreground">
                  Competitor analysis is available on the Deep tier and higher. Please upgrade your account to access this feature.
                </p>
              )}
              
              {canAddCompetitors && competitors.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add competitor websites to see how your site compares.
                </p>
              )}
              
              {competitors.map((competitor, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`https://competitor${index + 1}.com`}
                    value={competitor}
                    onChange={(e) => updateCompetitor(index, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCompetitor(index)}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {/* Credit Calculator */}
            <div className="bg-muted p-4 rounded-md">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium flex items-center">
                    Estimated Cost
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Each domain scanned costs 1 credit.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h4>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-mono">1 primary website + {competitorCost} competitors = {totalCost} credits</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium">Your Balance</div>
                  {isLoadingBalance ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                  ) : (
                    <div className="text-sm">
                      {userTier === 'enterprise' ? (
                        <span className="text-green-600">Unlimited</span>
                      ) : (
                        <span className={creditBalance && creditBalance.currentBalance < totalCost ? "text-red-500" : "text-green-600"}>
                          {creditBalance?.currentBalance || 0} credits
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/')}>
          Cancel
        </Button>
        
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={
            startScanMutation.isPending || 
            (!hasEnoughCredits && userTier !== 'enterprise')
          }
        >
          {startScanMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting Scan...
            </>
          ) : (
            'Start Scan'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}