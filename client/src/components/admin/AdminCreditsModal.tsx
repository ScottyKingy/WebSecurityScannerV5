import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus } from "lucide-react";

interface AdminCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userEmail: string | null;
  onComplete: () => void;
}

const TRANSACTION_TYPES = [
  { value: 'admin_grant', label: 'Admin Grant' },
  { value: 'admin_deduction', label: 'Admin Deduction' },
  { value: 'bonus', label: 'Bonus Credits' },
  { value: 'compensation', label: 'Compensation' },
  { value: 'refund', label: 'Refund' }
];

export function AdminCreditsModal({ 
  open, 
  onOpenChange, 
  userId, 
  userEmail,
  onComplete 
}: AdminCreditsModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(10);
  const [type, setType] = useState<string>('admin_grant');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchCurrentBalance();
    } else {
      // Reset form when closing
      setAmount(10);
      setType('admin_grant');
      setNote('');
      setCurrentBalance(null);
    }
  }, [open, userId]);

  const fetchCurrentBalance = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const response = await apiRequest('GET', `/api/admin/users/${userId}/credits`);
      const data = await response.json();
      
      if (response.ok) {
        setCurrentBalance(data.currentBalance);
      } else {
        throw new Error(data.message || 'Failed to fetch credit balance');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch current credit balance',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!userId || !amount || !type) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Determine if this is adding or removing credits
      const isDeduction = type === 'admin_deduction';
      const creditsAction = isDeduction ? 'deduct' : 'grant';
      const apiPath = `/api/admin/users/${userId}/credits/${creditsAction}`;
      
      const response = await apiRequest('POST', apiPath, {
        amount: Math.abs(amount),
        type,
        note: note || undefined
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `${isDeduction ? 'Deducted' : 'Granted'} ${Math.abs(amount)} credits to ${userEmail}`,
        });
        onComplete();
        onOpenChange(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${isDeduction ? 'deduct' : 'grant'} credits`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDeductionType = type === 'admin_deduction';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage User Credits</DialogTitle>
          <DialogDescription>
            {userEmail ? `Adjust credit balance for ${userEmail}` : 'Loading user...'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {currentBalance !== null && (
            <div className="bg-muted p-3 rounded-md mb-2">
              <span className="font-medium">Current Balance:</span> {currentBalance} credits
            </div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="transaction-type" className="col-span-4">
              Transaction Type
            </Label>
            <Select
              value={type}
              onValueChange={setType}
            >
              <SelectTrigger className="col-span-4">
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_TYPES.map((transactionType) => (
                  <SelectItem key={transactionType.value} value={transactionType.value}>
                    {transactionType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="col-span-4">
              Amount
            </Label>
            <div className="col-span-4 relative">
              {isDeductionType ? (
                <Minus className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              ) : (
                <Plus className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              )}
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={1}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="note" className="col-span-4">
              Note (Optional)
            </Label>
            <Textarea
              id="note"
              placeholder="Add a note for this transaction"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="col-span-4"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isLoading || !userId}
            variant={isDeductionType ? "destructive" : "default"}
          >
            {isSubmitting 
              ? 'Processing...' 
              : isDeductionType 
                ? `Deduct ${amount} Credits` 
                : `Grant ${amount} Credits`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}