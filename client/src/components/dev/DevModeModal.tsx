import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Code } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface DevModeModalProps {
  scanId: string;
  scannerKey: string;
}

export function DevModeModal({ scanId, scannerKey }: DevModeModalProps) {
  const [open, setOpen] = useState(false);
  const [promptData, setPromptData] = useState<any>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDevData = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/scan/${scanId}/dev-data?scanner=${scannerKey}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dev data');
      }
      
      const data = await response.json();
      setPromptData(data.prompt || null);
      setResponseData(data.response || null);
    } catch (error) {
      console.error('Error fetching dev data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch development data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when the modal opens
  useEffect(() => {
    if (open) {
      fetchDevData();
    }
  }, [open]);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100">
          <Code size={16} />
          Dev
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Development Mode</DialogTitle>
          <DialogDescription>
            View the raw prompt and response data for scanner: <code>{scannerKey}</code>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <Tabs defaultValue="prompt" className="h-full flex flex-col">
              <TabsList className="mb-4">
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
              </TabsList>
              
              <TabsContent value="prompt" className="flex-1 overflow-auto">
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-auto text-xs h-[400px]">
                  {promptData ? JSON.stringify(promptData, null, 2) : 'No prompt data available'}
                </pre>
              </TabsContent>
              
              <TabsContent value="response" className="flex-1 overflow-auto">
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-auto text-xs h-[400px]">
                  {responseData ? JSON.stringify(responseData, null, 2) : 'No response data available'}
                </pre>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}