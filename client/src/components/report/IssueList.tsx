import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Issue {
  id: string;
  title: string;
  description?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  scanner: string;
}

interface IssueSeverityGroup {
  severity: Issue['severity'];
  issues: Issue[];
  color: string;
}

interface IssueListProps {
  issues: Issue[];
  maxHeight?: string;
}

export function IssueList({ issues = [], maxHeight = '300px' }: IssueListProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // Group issues by severity
  const groupBySeverity = (): IssueSeverityGroup[] => {
    const groups: Record<string, Issue[]> = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
    
    // Group the issues
    issues.forEach(issue => {
      if (groups[issue.severity]) {
        groups[issue.severity].push(issue);
      } else {
        groups.low.push(issue); // Default to low if severity not recognized
      }
    });
    
    // Create the result array with colors
    return [
      { severity: 'critical', issues: groups.critical, color: 'text-red-600 bg-red-100 border-red-200' },
      { severity: 'high', issues: groups.high, color: 'text-orange-600 bg-orange-100 border-orange-200' },
      { severity: 'medium', issues: groups.medium, color: 'text-yellow-600 bg-yellow-100 border-yellow-200' },
      { severity: 'low', issues: groups.low, color: 'text-green-600 bg-green-100 border-green-200' }
    ].filter(group => group.issues.length > 0); // Only include groups with issues
  };
  
  const issueGroups = groupBySeverity();
  
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // If no issues, show a message
  if (issues.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No issues found. Great job!
      </div>
    );
  }
  
  return (
    <ScrollArea className={`w-full max-h-[${maxHeight}]`}>
      <Accordion type="multiple" className="w-full">
        {issueGroups.map((group) => (
          <AccordionItem key={group.severity} value={group.severity}>
            <AccordionTrigger className="px-3 hover:no-underline hover:bg-muted/50">
              <div className="flex justify-between w-full items-center">
                <span className="capitalize">{group.severity} Issues</span>
                <Badge 
                  variant="outline" 
                  className={group.color}
                >
                  {group.issues.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 p-2">
                {group.issues.map((issue) => (
                  <div 
                    key={issue.id} 
                    className="border rounded-md p-3 text-sm"
                    onClick={() => toggleExpand(issue.id)}
                  >
                    <div className="flex justify-between items-start cursor-pointer">
                      <div>
                        <div className="font-medium">{issue.title}</div>
                        {expandedItems[issue.id] && issue.description && (
                          <div className="mt-2 text-muted-foreground text-xs">
                            {issue.description}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {issue.scanner}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  );
}