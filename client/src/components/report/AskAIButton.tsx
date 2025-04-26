import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AskAIButtonProps {
  scanId: string;
  scannerKey: string;
}

export function AskAIButton({ scanId, scannerKey }: AskAIButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!question.trim()) return;
    
    setIsLoading(true);
    setAnswer('');
    
    try {
      const response = await apiRequest('POST', `/api/ai-answer`, {
        scanId,
        scannerKey,
        question: question.trim()
      });
      
      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get an answer. Please try again.',
        variant: 'destructive',
      });
      console.error('Error asking AI:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="h-8">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          <span>Ask AI</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ask AI About This Scan</DialogTitle>
          <DialogDescription>
            Ask for clarification on scan results or recommendations for {scannerKey}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Examples: How can I improve my SEO score? What accessibility issues need attention first?"
            className="min-h-[100px]"
          />
          
          {answer && (
            <div className="bg-secondary/50 p-4 rounded-md">
              <p className="text-sm whitespace-pre-wrap">{answer}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button type="submit" disabled={isLoading || !question.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}