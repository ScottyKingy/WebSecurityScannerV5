import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '../lib/queryClient';
import { useSession } from './useSession';

export function useScanData(scanId: string) {
  const { userTier } = useSession();
  
  return useQuery({
    queryKey: ['/api/scan', scanId, 'results'],
    queryFn: getQueryFn(),
    enabled: Boolean(scanId),
    select: (data) => {
      // If there's no data or the API returns an error, return as is
      if (!data || data.error) {
        return data;
      }
      
      // Clone the data to avoid modifying the original cached data
      const processedData = { ...data };
      
      // Add preview results based on user tier
      if (userTier === 'lite' || userTier === 'anonymous') {
        // For lite tier, only show a limited set of results (first scanner only)
        processedData.previewResults = processedData.results.slice(0, 1);
      } else if (userTier === 'deep') {
        // For deep tier, show more results but not everything
        processedData.previewResults = processedData.results.slice(0, 3);
      } else {
        // For enterprise and ultimate tiers, show everything
        processedData.previewResults = processedData.results;
      }
      
      return processedData;
    }
  });
}