import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Badge
} from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';

// Scan type from our schema
type Scan = {
  id: string;
  userId: string;
  primaryUrl: string;
  competitors: string[];
  status: 'queued' | 'running' | 'complete' | 'failed';
  creditsUsed: number;
  scanType: 'single' | 'multi' | 'competitor';
  source: 'web' | 'api' | 'scheduled';
  createdAt: string;
};

export default function ScanDetailsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get scan ID from URL query parameter
  const params = new URLSearchParams(window.location.search);
  const scanId = params.get('id');
  
  // If no scan ID provided, redirect to the dashboard
  useEffect(() => {
    if (!scanId) {
      navigate('/dashboard');
      toast({
        title: 'Error',
        description: 'No scan ID provided',
        variant: 'destructive',
      });
    }
  }, [scanId, navigate, toast]);
  
  // Fetch scan details
  const { 
    data: scan, 
    isLoading,
    isError,
    error,
    refetch 
  } = useQuery<Scan>({
    queryKey: ['/api/scan', scanId],
    queryFn: async () => {
      if (!scanId) throw new Error('No scan ID provided');
      const res = await apiRequest('GET', `/api/scan/${scanId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch scan details');
      }
      return res.json();
    },
    enabled: !!scanId,
    refetchInterval: (data) => {
      // Auto-refresh every 5 seconds if scan is in progress
      return data?.status === 'queued' || data?.status === 'running' ? 5000 : false;
    },
  });
  
  // If error loading scan
  if (isError) {
    return (
      <div className="container max-w-5xl py-10">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/scans')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scans
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Scan</CardTitle>
            <CardDescription>
              There was an error loading the scan details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{(error as Error)?.message || 'Unknown error'}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Loading state
  if (isLoading || !scan) {
    return (
      <div className="container max-w-5xl py-10">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/scans')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scans
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h3 className="mt-4 text-lg font-semibold">Loading Scan Details...</h3>
        </div>
      </div>
    );
  }
  
  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };
  
  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'running': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'complete': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/scans')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Scans
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">
                Scan Details
                <Badge className={`ml-3 ${getStatusColor(scan.status)}`}>
                  {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                </Badge>
              </CardTitle>
              <CardDescription>
                Created on {formatDate(scan.createdAt)}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="domains">Domains</TabsTrigger>
              {(scan.status === 'complete' || scan.status === 'running') && (
                <TabsTrigger value="results">Results</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="overview" className="pt-4">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Scan Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Scan ID:</span>
                        <span className="text-sm font-mono">{scan.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Scan Type:</span>
                        <span className="text-sm capitalize">{scan.scanType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Status:</span>
                        <span className="text-sm capitalize">{scan.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Created:</span>
                        <span className="text-sm">{formatDate(scan.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Credit Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Credits Used:</span>
                        <span className="text-sm font-semibold">{scan.creditsUsed} credits</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Primary Domain:</span>
                        <span className="text-sm">1 credit</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Competitor Domains:</span>
                        <span className="text-sm">{scan.competitors.length} credits</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Primary Domain</h3>
                  <a 
                    href={scan.primaryUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center hover:underline"
                  >
                    {scan.primaryUrl}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
                
                {scan.competitors.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Competitor Domains</h3>
                      <ul className="space-y-1">
                        {scan.competitors.map((url, index) => (
                          <li key={index}>
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center hover:underline"
                            >
                              {url}
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="domains" className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Credit Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Primary</TableCell>
                    <TableCell>
                      <a 
                        href={scan.primaryUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center hover:underline"
                      >
                        {scan.primaryUrl}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>1 credit</TableCell>
                  </TableRow>
                  
                  {scan.competitors.map((url, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">Competitor {index + 1}</TableCell>
                      <TableCell>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center hover:underline"
                        >
                          {url}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>1 credit</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            
            {(scan.status === 'complete' || scan.status === 'running') && (
              <TabsContent value="results" className="pt-4">
                {scan.status === 'running' ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <h3 className="mt-4 text-lg font-semibold">Scan in progress...</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Results will be available once the scan completes.
                    </p>
                  </div>
                ) : (
                  <div className="bg-muted rounded-md p-6 text-center">
                    <h3 className="text-lg font-semibold">Scan Complete</h3>
                    <p className="text-sm text-muted-foreground mt-2 mb-4">
                      View the detailed report to see all scanner results and analysis.
                    </p>
                    <Button onClick={() => navigate(`/reports/${scanId}`)}>
                      View Detailed Report
                    </Button>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
        
        <CardFooter className="bg-muted/50 flex justify-between">
          <div className="text-sm text-muted-foreground">
            Scan ID: <span className="font-mono">{scan.id}</span>
          </div>
          {scan.status === 'failed' && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/scan-wizard?retry=${scan.primaryUrl}`)}>
              Retry Scan
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}