import React, { useState } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis,
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface RemediationItem {
  id: string;
  title: string;
  effort: number; // 1-10 scale
  impact: number; // 1-10 scale
  priority: number; // Used for bubble size
  category: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border rounded-md shadow-md text-sm">
        <p className="font-medium">{data.title}</p>
        <div className="grid grid-cols-2 gap-x-4 mt-2">
          <div>
            <p className="text-muted-foreground">Impact:</p>
            <p className="font-medium">{data.impact}/10</p>
          </div>
          <div>
            <p className="text-muted-foreground">Effort:</p>
            <p className="font-medium">{data.effort}/10</p>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-muted-foreground">Priority:</p>
          <p className="font-medium">{data.priority}/10</p>
        </div>
        <div className="mt-2">
          <p className="text-muted-foreground">Category:</p>
          <p className="font-medium">{data.category}</p>
        </div>
      </div>
    );
  }
  return null;
};

interface RemediationChartProps {
  data?: RemediationItem[];
  onIssueClick?: (issueId: string) => void;
}

export function RemediationChart({ data = [], onIssueClick }: RemediationChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // If no data provided, use placeholder
  const chartData = data.length > 0 ? data : [];

  // Group data by category
  const categoryData = React.useMemo(() => {
    const categories: Record<string, RemediationItem[]> = {};
    chartData.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });
    return categories;
  }, [chartData]);

  // Define color mapping for categories
  const categoryColors: Record<string, string> = {
    'Accessibility': '#f97316', // orange-500
    'Performance': '#8b5cf6', // violet-500 
    'SEO': '#2563eb', // blue-600
    'Security': '#dc2626', // red-600
    'Content': '#16a34a', // green-600
    'Other': '#6b7280', // gray-500
  };

  const handleClick = (data: RemediationItem) => {
    if (onIssueClick) {
      onIssueClick(data.id);
    }
  };

  return (
    <div className="h-96 w-full">
      {chartData.length === 0 ? (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          No remediation data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 70, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              type="number" 
              dataKey="effort" 
              name="Effort" 
              domain={[0, 10]} 
              label={{ 
                value: 'Effort (lower is easier)', 
                position: 'bottom',
                offset: 10,
                fill: '#6b7280',
                fontSize: 12
              }}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              type="number" 
              dataKey="impact" 
              name="Impact" 
              domain={[0, 10]} 
              label={{ 
                value: 'Impact (higher is better)', 
                angle: -90, 
                position: 'left',
                offset: 10,
                fill: '#6b7280',
                fontSize: 12 
              }}
              tick={{ fontSize: 12 }}
            />
            <ZAxis 
              type="number" 
              dataKey="priority" 
              range={[40, 160]} 
              name="Priority" 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
            
            {Object.entries(categoryData).map(([category, items]) => (
              <Scatter
                key={category}
                name={category}
                data={items}
                fill={categoryColors[category] || '#6b7280'}
                isAnimationActive={true}
                onClick={handleClick}
                cursor="pointer"
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}