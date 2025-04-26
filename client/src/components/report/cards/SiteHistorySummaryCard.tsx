import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { LineChart } from '@/components/charts/LineChart';
import { useDevBar } from '@/hooks/useDevBar';
import { DevModeModal } from '@/components/dev/DevModeModal';

export default function SiteHistorySummaryCard({ data, scanId, restricted = false }) {
  const { devMode } = useDevBar();
  const { history = [] } = data || {};

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Historical Performance</h2>
        {restricted && (
          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            Limited preview
          </span>
        )}
      </CardHeader>
      <CardContent>
        {restricted ? (
          <div className="bg-muted p-6 rounded-md text-center text-muted-foreground">
            <p>Upgrade your plan to view the full historical performance data and track improvements over time.</p>
          </div>
        ) : (
          <>
            <div className="mb-2 text-xs text-muted-foreground">
              <p>Track your website's performance and improvement over time. Each point represents a scan.</p>
            </div>
            <LineChart data={history} />
            <div className="flex justify-end mt-4">
              {devMode && <DevModeModal scanId={scanId} scannerKey="siteHistory" />}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}