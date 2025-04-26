import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { DonutChart } from '@/components/charts/DonutChart';
import { useDevBar } from '@/hooks/useDevBar';
import { AskAIButton } from '@/components/report/AskAIButton';
import { DevModeModal } from '@/components/dev/DevModeModal';

export default function OverallScoreCard({ data, scanId, restricted = false }) {
  const { devMode } = useDevBar();
  const { score = 0, summary = "", details = "", percentile_contribution = 0 } = data;

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Overall AI Readiness</h2>
        <span className="badge bg-green-600 text-white px-2 py-1 rounded-full">{score}/100</span>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DonutChart value={score} label="Overall Readiness" />
        <div>
          <p className="text-muted-foreground mb-2">{restricted ? "Upgrade to see full details." : summary}</p>
          {!restricted && <p className="text-muted-foreground text-sm">{details}</p>}

          <p className="text-xs mt-4">Percentile Contribution: {(percentile_contribution * 100).toFixed(1)}%</p>

          <div className="flex gap-3 mt-4">
            {!restricted && <AskAIButton scanId={scanId} scannerKey="overall" />}
            {devMode && <DevModeModal scanId={scanId} scannerKey="overall" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}