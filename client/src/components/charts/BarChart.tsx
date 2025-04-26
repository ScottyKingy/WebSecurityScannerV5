import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BarChartProps {
  data?: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
}

export function BarChart({ data = [] }: BarChartProps) {
  // If no data provided, use placeholder data
  const chartData = data.length > 0 ? data : [
    { name: 'No Data', value: 0, color: '#d1d5db' }
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={chartData}
          margin={{
            top: 20,
            right: 20,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: 'none',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value) => [`${value}%`, 'Score']}
          />
          <Bar 
            dataKey="value" 
            radius={[4, 4, 0, 0]}
            // Use different color for each bar if specified
            fill="#4f46e5" // Default color (indigo-600)
            // Use custom fill color if provided in data
            isAnimationActive={true}
          >
            {chartData.map((entry, index) => (
              <Bar 
                key={`bar-${index}`}
                dataKey="value"
                fill={entry.color || '#4f46e5'}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}