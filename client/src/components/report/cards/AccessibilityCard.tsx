import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  Code, 
  Eye, 
  HelpCircle, 
  XCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AccessibilityCardProps {
  data: any;
  scanId: string;
  scannerKey: string;
  restricted?: boolean;
  promptLog?: any;
}

export default function AccessibilityCard({ 
  data, 
  scanId, 
  scannerKey,
  restricted = false,
  promptLog
}: AccessibilityCardProps) {
  const { toast } = useToast();
  const [showDevInfo, setShowDevInfo] = useState(false);
  
  // Function to handle "Ask AI" button click
  const handleAskAI = () => {
    if (restricted) {
      toast({
        title: "Feature Restricted",
        description: "Upgrade your plan to access AI assistance."
      });
      return;
    }
    
    toast({
      title: "AI Assistant",
      description: "The AI assistant would be triggered here in the full version.",
    });
  };
  
  // Get severity counts for the progress bars
  const getSeverityCounts = () => {
    if (!data || !data.issues) return { critical: 0, high: 0, medium: 0, low: 0 };
    
    return data.issues.reduce((counts: any, issue: any) => {
      counts[issue.severity] = (counts[issue.severity] || 0) + 1;
      return counts;
    }, { critical: 0, high: 0, medium: 0, low: 0 });
  };
  
  const severityCounts = getSeverityCounts();
  const totalIssues = data?.issues?.length || 0;
  
  // Function to get color based on severity
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Function to get icon based on severity
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low': return <HelpCircle className="h-5 w-5 text-blue-500" />;
      default: return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
  };
  
  return (
    <Card className={restricted ? "opacity-90" : ""}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              Accessibility
              <Badge variant="outline" className="text-xs font-normal">
                Score: {data?.score || 0}/100
              </Badge>
            </CardTitle>
            <CardDescription>
              {data?.summary || "Accessibility evaluation results"}
            </CardDescription>
          </div>
          
          {/* Dev Mode Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowDevInfo(!showDevInfo)}
            title="Toggle Developer Info"
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {showDevInfo ? (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4 overflow-auto max-h-[500px]">
            <Tabs defaultValue="output">
              <TabsList>
                <TabsTrigger value="output">Output JSON</TabsTrigger>
                <TabsTrigger value="prompt">Prompt Log</TabsTrigger>
              </TabsList>
              
              <TabsContent value="output">
                <pre className="text-xs overflow-auto p-2">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </TabsContent>
              
              <TabsContent value="prompt">
                <pre className="text-xs overflow-auto p-2">
                  {JSON.stringify(promptLog, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Issue Summary</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Critical ({severityCounts.critical})</span>
                    <span>{Math.round((severityCounts.critical / Math.max(totalIssues, 1)) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(severityCounts.critical / Math.max(totalIssues, 1)) * 100} 
                    className={`h-2 ${getSeverityColor('critical')}`} 
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>High ({severityCounts.high})</span>
                    <span>{Math.round((severityCounts.high / Math.max(totalIssues, 1)) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(severityCounts.high / Math.max(totalIssues, 1)) * 100} 
                    className={`h-2 ${getSeverityColor('high')}`} 
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Medium ({severityCounts.medium})</span>
                    <span>{Math.round((severityCounts.medium / Math.max(totalIssues, 1)) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(severityCounts.medium / Math.max(totalIssues, 1)) * 100} 
                    className={`h-2 ${getSeverityColor('medium')}`} 
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Low ({severityCounts.low})</span>
                    <span>{Math.round((severityCounts.low / Math.max(totalIssues, 1)) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(severityCounts.low / Math.max(totalIssues, 1)) * 100} 
                    className={`h-2 ${getSeverityColor('low')}`} 
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-3">Top Issues</h3>
              <div className="space-y-3">
                {data?.issues?.slice(0, 3).map((issue: any, index: number) => (
                  <div key={issue.id || index} className="border rounded-md p-3">
                    <div className="flex gap-3 items-start">
                      {getSeverityIcon(issue.severity)}
                      <div>
                        <h4 className="text-sm font-medium">{issue.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                        {!restricted && (
                          <details className="mt-2">
                            <summary className="text-sm cursor-pointer flex items-center hover:text-primary">
                              Recommendation <ChevronDown className="h-3 w-3 ml-1" />
                            </summary>
                            <p className="text-sm mt-2 pl-5">{issue.recommendation}</p>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Show overlay for restricted mode */}
                {restricted && data?.issues?.length > 0 && (
                  <div className="mt-4 rounded-md border border-dashed p-4 text-center">
                    <Eye className="mx-auto h-6 w-6 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Upgrade to see all {data.issues.length} issues and recommendations
                    </p>
                  </div>
                )}
                
                {(!data?.issues || data.issues.length === 0) && (
                  <div className="text-center p-4 border border-dashed rounded-md">
                    <p className="text-sm text-muted-foreground">No accessibility issues found.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="border-t bg-muted/30 gap-2 justify-end">
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => setShowDevInfo(!showDevInfo)}
        >
          <Code className="h-4 w-4 mr-2" />
          {showDevInfo ? 'Hide Details' : 'View Details'}
        </Button>
        
        <Button 
          variant="outline"
          size="sm"
          onClick={handleAskAI}
          disabled={restricted}
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Ask AI
        </Button>
      </CardFooter>
    </Card>
  );
}