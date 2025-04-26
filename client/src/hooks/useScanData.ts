import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useScanData(scanId: string) {
  return useQuery({
    queryKey: ["scan", scanId, "results"],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/scan/${scanId}/results`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Scan fetch failed");
      }
      
      const results = await res.json();
      
      // Format the response to match the expected structure
      return {
        scanId,
        isPreview: false, // This will be controlled by user tier on the backend
        results,
        previewResults: results.slice(0, Math.min(2, results.length)) // For preview mode, only show a subset
      };
    },
    enabled: Boolean(scanId)
  });
}