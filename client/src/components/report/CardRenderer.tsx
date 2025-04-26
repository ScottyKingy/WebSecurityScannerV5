import React, { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Fallback card for when a specific scanner card component is not found
export function FallbackCard({ scannerKey, restricted = false }: { scannerKey: string, restricted?: boolean }) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg capitalize">
          {scannerKey.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-4 rounded-md text-center">
          <p className="text-sm text-muted-foreground">
            {restricted 
              ? "This content is not available in preview mode." 
              : "Scanner results display not available."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading card while dynamic imports are in progress
export function LoadingCard() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="h-6 w-48 bg-muted animate-pulse rounded-md" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

// The main CardRenderer component that dynamically loads scanner card components
export function CardRenderer({ 
  results, 
  scanId, 
  restricted = false 
}: { 
  results: any[], 
  scanId: string, 
  restricted?: boolean 
}) {
  if (!results || results.length === 0) {
    return (
      <div className="bg-muted p-6 rounded-md text-center mb-6">
        <p className="text-muted-foreground">No scan results available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {results.map((result) => {
        const scannerKey = result.scannerKey;
        const CardComponent = React.lazy(() => {
          // Try to import the specific card component
          /* @vite-ignore */
          return import(`./cards/${toCardName(scannerKey)}Card`)
            .then(module => ({ default: module.default }))
            .catch(() => ({ default: () => <FallbackCard scannerKey={scannerKey} restricted={restricted} /> }));
        });

        return (
          <Suspense key={scannerKey} fallback={<LoadingCard />}>
            <CardComponent 
              data={result.outputJson}
              scanId={scanId}
              restricted={restricted}
              scannerKey={scannerKey}
              promptLog={result.promptLog}
            />
          </Suspense>
        );
      })}
    </div>
  );
}

// Helper function to convert scanner key to component name
function toCardName(scannerKey: string): string {
  return scannerKey.charAt(0).toUpperCase() + scannerKey.slice(1);
}