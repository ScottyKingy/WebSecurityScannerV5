import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, BrainCircuit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface AskAIButtonProps {
  scanId: string;
  scannerKey: string;
}

export function AskAIButton({ scanId, scannerKey }: AskAIButtonProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast({
        title: 'Please enter a question',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    setAnswer('');
    
    try {
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanId,
          scannerKey,
          question,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }
      
      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error('Error asking AI:', error);
      toast({
        title: 'Error',
        description: 'Failed to get a response. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BrainCircuit size={16} />
          Ask AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ask AI about this report</DialogTitle>
          <DialogDescription>
            Ask a question about the scan results and our AI will provide insights.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="E.g., What are the key issues affecting my score?"
            className="min-h-[80px]"
            disabled={loading}
          />
          
          <Button type="submit" disabled={loading || !question.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Thinking...
              </>
            ) : (
              'Ask Question'
            )}
          </Button>
        </form>
        
        {answer && (
          <div className="mt-4 p-4 bg-muted rounded-md overflow-auto max-h-[300px]">
            <h4 className="text-sm font-medium mb-2">AI Response:</h4>
            <div className="text-sm whitespace-pre-wrap">{answer}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}