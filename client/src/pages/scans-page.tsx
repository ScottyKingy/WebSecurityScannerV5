import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

// UI Components
import { 
  Card, 
  CardContent, 
  CardDescription, 
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
import { Separator } from '@/components/ui/separator';
import { Loader2, PlusCircle, RefreshCw, ArrowUpRight } from 'lucide-react';

// Scan type
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

export default function ScansPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Fetch user scans
  const { 
    data: scans = [], 
    isLoading, 
    isError,
    error,
    refetch
  } = useQuery<Scan[]>({
    queryKey: ['/api/scan'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/scan');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch scans');
      }
      return res.json();
    },
    staleTime: 1000 * 60, // 1 minute
  });
  
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
  
  // Error state
  if (isError) {
    return (
      <div className="container max-w-6xl py-10">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Scans</CardTitle>
            <CardDescription>
              There was an error loading your scan history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{(error as Error)?.message || 'Unknown error'}</p>
            <Button 
              className="mt-4" 
              onClick={() => refetch()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Your Scans</h1>
          <p className="text-muted-foreground">View and manage your website scans</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={() => navigate('/scan-wizard')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Scan
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Scan History</CardTitle>
          <CardDescription>
            {scans.length > 0 
              ? `You have ${scans.length} scan${scans.length === 1 ? '' : 's'} in your history`
              : 'No scans found in your history'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <h3 className="mt-4 text-lg font-semibold">Loading Scans...</h3>
            </div>
          ) : scans.length === 0 ? (
            <div className="bg-muted/50 rounded-md p-10 text-center">
              <h3 className="text-lg font-semibold">No Scans Found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Start your first scan to analyze a website.
              </p>
              <Button 
                className="mt-4" 
                onClick={() => navigate('/scan-wizard')}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                New Scan
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target URL</TableHead>
                  <TableHead>Scan Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.map((scan) => (
                  <TableRow key={scan.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell 
                      className="font-medium"
                      onClick={() => navigate(`/scan-details?id=${scan.id}`)}
                    >
                      {new URL(scan.primaryUrl).hostname}
                    </TableCell>
                    <TableCell 
                      className="capitalize"
                      onClick={() => navigate(`/scan-details?id=${scan.id}`)}
                    >
                      {scan.scanType}
                      {scan.competitors.length > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({scan.competitors.length} competitor{scan.competitors.length === 1 ? '' : 's'})
                        </span>
                      )}
                    </TableCell>
                    <TableCell onClick={() => navigate(`/scan-details?id=${scan.id}`)}>
                      <Badge className={getStatusColor(scan.status)}>
                        {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={() => navigate(`/scan-details?id=${scan.id}`)}>
                      {scan.creditsUsed} credit{scan.creditsUsed === 1 ? '' : 's'}
                    </TableCell>
                    <TableCell onClick={() => navigate(`/scan-details?id=${scan.id}`)}>
                      {formatDate(scan.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/scan-details?id=${scan.id}`)}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}