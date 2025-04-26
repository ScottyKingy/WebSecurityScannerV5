import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useScanData } from '@/hooks/useScanData';
import { CardRenderer } from '@/components/report/CardRenderer';
import { RestrictedBanner } from '@/components/report/RestrictedBanner';
import { SkeletonReportLayout } from '@/components/ui/Skeletons';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Download, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReportPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Extract scanId from the URL path
  const [scanId, setScanId] = useState<string>('');
  
  useEffect(() => {
    // Path format is /reports/{scanId}
    const match = location.match(/^\/reports\/([^/]+)/);
    if (match) {
      setScanId(match[1]);
    } else {
      navigate('/scans');
      toast({
        title: 'Error',
        description: 'Invalid report URL',
        variant: 'destructive',
      });
    }
  }, [location, navigate, toast]);
  
  const { data, isLoading, error, refetch } = useScanData(scanId);
  const { user, isLoading: authLoading } = useAuth();

  if (isLoading || authLoading) return <SkeletonReportLayout />;
  
  if (error) {
    return (
      <ErrorBanner 
        message="Scan failed to load" 
        description={error instanceof Error ? error.message : "There was a problem loading the scan report."}
        backLink="/scans"
        backText="Back to Scans"
        retry={() => refetch()}
      />
    );
  }
  
  if (!data) {
    return (
      <ErrorBanner 
        message="Report not found" 
        description="The requested scan report was not found."
        backLink="/scans"
        backText="Back to Scans"
      />
    );
  }

  // Determine if the user should see restricted content
  // A user sees restricted content if they are not logged in or are on the lite tier
  const isRestricted = !user || user?.tier === 'lite';

  return (
    <div className="container max-w-5xl py-10">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/scans')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Scans
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={isRestricted}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" disabled={isRestricted}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Readiness Report</h1>
        <p className="text-muted-foreground mt-2">
          Scan ID: <span className="font-mono">{scanId}</span>
        </p>
      </div>
      
      {isRestricted && <RestrictedBanner />}
      
      <div className="mb-6">
        <div className="bg-muted/50 rounded-lg p-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium">Overall Score</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{data.results[0]?.score || 0}</span>
              <span className="text-muted-foreground">/100</span>
            </div>
          </div>
          
          <Button variant="secondary" disabled={isRestricted}>
            View Detailed Analysis
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <CardRenderer 
        results={isRestricted ? (data.previewResults || []) : (data.results || [])} 
        scanId={scanId} 
        restricted={isRestricted} 
      />
      
      {isRestricted && data.results.length > (data.previewResults?.length || 0) && (
        <div className="mt-6 border border-dashed rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium mb-2">
            {data.results.length - (data.previewResults?.length || 0)} more scanners available
          </h3>
          <p className="text-muted-foreground mb-4">
            Upgrade your plan to access all scan results and features.
          </p>
          <Button>Upgrade Now</Button>
        </div>
      )}
    </div>
  );
}