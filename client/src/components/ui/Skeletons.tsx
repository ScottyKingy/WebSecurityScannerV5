import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonReportLayout() {
  return (
    <div className="container py-10 max-w-5xl">
      <div className="mb-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-48 mt-2" />
      </div>
      
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <Skeleton className="h-8 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
        <div className="flex gap-4 mt-4">
          <Skeleton className="h-24 w-24 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-32" />
      </CardFooter>
    </Card>
  );
}

export function LoadingIndicator() {
  return (
    <div className="flex flex-col items-center justify-center p-10">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}