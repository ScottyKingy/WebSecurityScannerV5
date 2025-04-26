import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { DonutChart } from '@/components/charts/DonutChart';
import { useDevBar } from '@/hooks/useDevBar';
import { AskAIButton } from '@/components/report/AskAIButton';
import { DevModeModal } from '@/components/dev/DevModeModal';

export default function OverallScoreCard({ data, scanId, restricted = false }) {
  const { devMode } = useDevBar();
  const { 
    score = 0, 
    summary = "", 
    scan_date = new Date().toLocaleDateString(), 
    improvement_actions = [],
    site_type = "Unknown"
  } = data;

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Overall Website Score</h2>
          <p className="text-muted-foreground text-sm">Scan date: {scan_date}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-muted-foreground">Site type: {site_type}</span>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col items-center justify-center">
          <DonutChart score={score} />
          <div className="mt-2 text-center">
            <p className="text-sm font-medium">
              {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Needs Improvement'}
            </p>
          </div>
        </div>
        <div>
          <p className="text-muted-foreground mb-3">{restricted ? "Upgrade to view the full website analysis." : summary}</p>
          
          {!restricted && improvement_actions && improvement_actions.length > 0 && (
            <div className="mt-2">
              <h3 className="text-sm font-medium mb-2">Top Priorities:</h3>
              <ul className="space-y-1">
                {improvement_actions.slice(0, 3).map((action, idx) => (
                  <li key={idx} className="text-xs flex">
                    <span className="inline-block w-4 text-center font-bold">{idx + 1}.</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            {!restricted && <AskAIButton scanId={scanId} scannerKey="overall" />}
            {devMode && <DevModeModal scanId={scanId} scannerKey="overall" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}