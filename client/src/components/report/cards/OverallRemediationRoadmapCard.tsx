import { useState, useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { RemediationChart } from '@/components/charts/RemediationChart';
import { useDevBar } from '@/hooks/useDevBar';
import { DevModeModal } from '@/components/dev/DevModeModal';

export default function OverallRemediationRoadmapCard({ data, scanId, restricted = false }) {
  const { devMode } = useDevBar();
  const { roadmap = [] } = data || {};
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  
  // Function to handle issue click in the chart
  const handleIssueClick = (issueId: string) => {
    setSelectedIssueId(issueId);
    
    // Find the issue element in the DOM and scroll to it
    // This assumes IssueList has data-issue-id attributes
    setTimeout(() => {
      const issueElement = document.querySelector(`[data-issue-id="${issueId}"]`);
      if (issueElement) {
        issueElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Remediation Roadmap</h2>
        {restricted && (
          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            Limited preview
          </span>
        )}
      </CardHeader>
      <CardContent>
        {restricted ? (
          <div className="bg-muted p-6 rounded-md text-center text-muted-foreground">
            <p>Upgrade your plan to view the full remediation roadmap with impact vs. effort analysis.</p>
          </div>
        ) : (
          <>
            <div className="mb-2 text-xs text-muted-foreground">
              <p>This chart helps prioritize fixes based on their potential impact and implementation effort. Click on any item to highlight the issue in the Issues List.</p>
            </div>
            <RemediationChart 
              data={roadmap} 
              onIssueClick={handleIssueClick} 
            />
            <div className="flex justify-end mt-4">
              {devMode && <DevModeModal scanId={scanId} scannerKey="remediationRoadmap" />}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}