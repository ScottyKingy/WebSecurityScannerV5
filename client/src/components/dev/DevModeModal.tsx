import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code } from 'lucide-react';

interface DevModeModalProps {
  scanId: string;
  scannerKey: string;
  promptLog?: any;
}

export function DevModeModal({ scanId, scannerKey, promptLog }: DevModeModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Code className="h-4 w-4 mr-1" />
          <span>Dev</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Developer Mode: {scannerKey}</DialogTitle>
          <DialogDescription>
            Technical details for scan ID: {scanId}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="raw" className="h-full overflow-hidden flex flex-col">
          <TabsList>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-auto">
            <TabsContent value="raw" className="h-full">
              <pre className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs h-full overflow-auto">
                {JSON.stringify(promptLog || {}, null, 2)}
              </pre>
            </TabsContent>
            
            <TabsContent value="prompt" className="h-full">
              <pre className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs h-full overflow-auto">
                {promptLog?.prompt || 'Prompt not available'}
              </pre>
            </TabsContent>
            
            <TabsContent value="response" className="h-full">
              <pre className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs h-full overflow-auto">
                {promptLog?.response || 'Response not available'}
              </pre>
            </TabsContent>
            
            <TabsContent value="metrics" className="h-full">
              <div className="space-y-2 p-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted p-2 rounded-md">
                    <h3 className="text-sm font-medium">Tokens Used</h3>
                    <p className="text-2xl font-bold">{promptLog?.tokens_used || 'N/A'}</p>
                  </div>
                  <div className="bg-muted p-2 rounded-md">
                    <h3 className="text-sm font-medium">Processing Time</h3>
                    <p className="text-2xl font-bold">{promptLog?.processing_time ? `${promptLog.processing_time}ms` : 'N/A'}</p>
                  </div>
                </div>
                
                <h3 className="text-sm font-medium mt-4">Model Parameters</h3>
                <pre className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs overflow-auto">
                  {JSON.stringify(promptLog?.model_params || {}, null, 2)}
                </pre>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}