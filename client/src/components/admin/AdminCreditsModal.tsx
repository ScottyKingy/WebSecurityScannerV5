import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';

interface AdminCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userEmail: string | null;
  onComplete: () => void;
}

export function AdminCreditsModal({
  open,
  onOpenChange,
  userId,
  userEmail,
  onComplete,
}: AdminCreditsModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'grant' | 'deduct'>('grant');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      // Initialize form
      setAmount('');
      setNote('');
      setActiveTab('grant');
    }
  }, [open]);

  // Get user credit balance
  const { 
    data: creditData, 
    isLoading: loadingCredits,
    error: creditError,
    refetch: refetchCredits
  } = useQuery({
    queryKey: ['/api/admin/users', userId, 'credits'],
    queryFn: async () => {
      if (!userId) return null;
      const res = await apiRequest('GET', `/api/admin/users/${userId}/credits`);
      return await res.json();
    },
    enabled: !!userId && open,
  });

  // Grant credits mutation
  const grantCreditsMutation = useMutation({
    mutationFn: async (data: { amount: number; note: string }) => {
      if (!userId) throw new Error('No user selected');
      
      const res = await apiRequest('POST', `/api/admin/users/${userId}/credits/grant`, {
        amount: data.amount,
        note: data.note
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to grant credits');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Credits Granted',
        description: `Successfully granted ${amount} credits to user.`,
      });
      
      // Reset form and refetch data
      setAmount('');
      setNote('');
      refetchCredits();
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: 'Operation Failed',
        description: error.message || 'Failed to grant credits.',
        variant: 'destructive',
      });
    },
  });

  // Deduct credits mutation
  const deductCreditsMutation = useMutation({
    mutationFn: async (data: { amount: number; note: string }) => {
      if (!userId) throw new Error('No user selected');
      
      const res = await apiRequest('POST', `/api/admin/users/${userId}/credits/deduct`, {
        amount: data.amount,
        note: data.note
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to deduct credits');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Credits Deducted',
        description: `Successfully deducted ${amount} credits from user.`,
      });
      
      // Reset form and refetch data
      setAmount('');
      setNote('');
      refetchCredits();
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: 'Operation Failed',
        description: error.message || 'Failed to deduct credits.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid positive number.',
        variant: 'destructive',
      });
      return;
    }
    
    if (activeTab === 'grant') {
      grantCreditsMutation.mutate({ amount: numAmount, note });
    } else {
      deductCreditsMutation.mutate({ amount: numAmount, note });
    }
  };

  // Format credit balance for display
  const formatBalance = () => {
    if (loadingCredits) return 'Loading...';
    if (creditError) return 'Error loading balance';
    if (!creditData) return '0';
    
    return creditData.currentBalance.toString();
  };

  // Determine if the user has unlimited credits
  const hasUnlimitedCredits = creditData?.isEnterprise;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage User Credits</DialogTitle>
          <DialogDescription>
            {userEmail ? `Adjust credit balance for ${userEmail}` : 'Loading user information...'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-between py-2">
          <div className="text-sm text-muted-foreground">Current Balance:</div>
          <div className="flex items-center">
            {hasUnlimitedCredits ? (
              <Badge className="bg-purple-600 text-white">Unlimited</Badge>
            ) : (
              <Badge variant="outline" className="font-mono text-lg">{formatBalance()}</Badge>
            )}
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'grant' | 'deduct')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grant" className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4" />
                <span>Grant Credits</span>
              </TabsTrigger>
              <TabsTrigger value="deduct" className="flex items-center gap-2">
                <ArrowDown className="h-4 w-4" />
                <span>Deduct Credits</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="grant" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="grant-amount">Amount to Grant</Label>
                <Input
                  id="grant-amount"
                  placeholder="Enter amount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="grant-note">Note (Optional)</Label>
                <Textarea
                  id="grant-note"
                  placeholder="Reason for granting credits"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="deduct" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="deduct-amount">Amount to Deduct</Label>
                <Input
                  id="deduct-amount"
                  placeholder="Enter amount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deduct-note">Note (Optional)</Label>
                <Textarea
                  id="deduct-note"
                  placeholder="Reason for deducting credits"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={grantCreditsMutation.isPending || deductCreditsMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!amount || grantCreditsMutation.isPending || deductCreditsMutation.isPending}
            >
              {(grantCreditsMutation.isPending || deductCreditsMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {activeTab === 'grant' ? 'Grant Credits' : 'Deduct Credits'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}