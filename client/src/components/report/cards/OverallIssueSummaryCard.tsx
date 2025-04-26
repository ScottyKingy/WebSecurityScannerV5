import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { IssueList } from '@/components/report/IssueList';
import { useDevBar } from '@/hooks/useDevBar';
import { DevModeModal } from '@/components/dev/DevModeModal';

export default function OverallIssueSummaryCard({ data, scanId, restricted = false }) {
  const { devMode } = useDevBar();
  const { issues = [] } = data || {};

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Overall Issues Summary</h2>
        {restricted && (
          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            Upgrade to see full issues list
          </span>
        )}
      </CardHeader>
      <CardContent>
        {restricted ? (
          <div className="bg-muted p-6 rounded-md text-center text-muted-foreground">
            <p>Upgrade your plan to view the full issues summary and remediation details.</p>
          </div>
        ) : (
          <>
            <IssueList issues={issues} maxHeight="400px" />
            <div className="flex justify-end mt-4">
              {devMode && <DevModeModal scanId={scanId} scannerKey="overallIssues" />}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}