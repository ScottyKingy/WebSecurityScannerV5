import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { BarChart } from '@/components/charts/BarChart';
import { useDevBar } from '@/hooks/useDevBar';
import { AskAIButton } from '@/components/report/AskAIButton';
import { DevModeModal } from '@/components/dev/DevModeModal';

export default function SEODiscoverabilityCard({ data, scanId, restricted = false }) {
  const { devMode } = useDevBar();
  const { score = 0, summary = "", issues = [], charts = {} } = data;

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">SEO Readiness</h2>
        <span className="badge bg-indigo-600 text-white px-2 py-1 rounded-full">{score}/100</span>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BarChart data={charts.data} />
        <div>
          <p className="text-muted-foreground mb-3">{restricted ? "Upgrade to unlock full SEO scan results." : summary}</p>
          {!restricted && issues.map((issue, idx) => (
            <div key={idx} className="text-xs mb-2">• {issue.title}</div>
          ))}
          <div className="flex gap-2 mt-4">
            {!restricted && <AskAIButton scanId={scanId} scannerKey="seoDiscoverability" />}
            {devMode && <DevModeModal scanId={scanId} scannerKey="seoDiscoverability" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}