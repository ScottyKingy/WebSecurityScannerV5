import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Recommendation {
  title: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface RecommendationListProps {
  items: Recommendation[];
}

export function RecommendationList({ items = [] }: RecommendationListProps) {
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});

  // If no items provided, return a message
  if (!items || items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No recommendations available.
      </div>
    );
  }

  const toggleItem = (index: number) => {
    setOpenItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
      {items.map((item, index) => (
        <Collapsible
          key={index}
          open={openItems[index]}
          onOpenChange={() => toggleItem(index)}
          className="border rounded-md"
        >
          <CollapsibleTrigger className="flex justify-between items-center w-full p-2 text-sm text-left">
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(item.priority)}`}
              >
                {item.priority || 'Info'}
              </span>
              <span>{item.title}</span>
            </div>
            {openItems[index] ? (
              <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="p-2 text-xs text-muted-foreground border-t">
            {item.description || 'No additional details available.'}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}