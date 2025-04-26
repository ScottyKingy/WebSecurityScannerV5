import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { RadarChart } from '@/components/charts/RadarChart';
import { RecommendationList } from '@/components/report/RecommendationList';
import { useDevBar } from '@/hooks/useDevBar';
import { AskAIButton } from '@/components/report/AskAIButton';
import { DevModeModal } from '@/components/dev/DevModeModal';

export default function ContentQualityCard({ data, scanId, restricted = false }) {
  const { devMode } = useDevBar();
  const { score = 0, summary = "", remediation_plan = [], charts = {} } = data;

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Content Quality</h2>
        <span className="badge bg-blue-500 text-white px-2 py-1 rounded-full">{score}/100</span>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RadarChart data={charts.data} />
        <div>
          <p className="text-muted-foreground mb-3">{restricted ? "Upgrade to view full content insights." : summary}</p>
          {!restricted && <RecommendationList items={remediation_plan} />}
          <div className="flex gap-2 mt-4">
            {!restricted && <AskAIButton scanId={scanId} scannerKey="contentQuality" />}
            {devMode && <DevModeModal scanId={scanId} scannerKey="contentQuality" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}