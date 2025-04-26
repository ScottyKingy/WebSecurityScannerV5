import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DonutChartProps {
  score: number;
  size?: number;
  thickness?: number;
  colors?: {
    primary: string;
    background: string;
  };
}

export function DonutChart({ 
  score = 0, 
  size = 140, 
  thickness = 15,
  colors = { 
    primary: '#4f46e5', // indigo-600
    background: '#e5e7eb' // gray-200
  }
}: DonutChartProps) {
  // Clamp score between 0 and 100
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  // Data for the chart
  const data = [
    { name: 'Score', value: normalizedScore },
    { name: 'Remaining', value: 100 - normalizedScore }
  ];

  // Format for the center text
  const scoreText = `${normalizedScore}`;

  return (
    <div style={{ width: size, height: size }} className="mx-auto relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size / 2 - thickness}
            outerRadius={size / 2}
            startAngle={90}
            endAngle={-270}
            paddingAngle={0}
            dataKey="value"
            isAnimationActive={true}
            animationDuration={800}
          >
            <Cell key="score" fill={colors.primary} />
            <Cell key="remaining" fill={colors.background} />
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Score']}
            contentStyle={{
              backgroundColor: '#fff',
              border: 'none',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div 
        className="absolute inset-0 flex items-center justify-center flex-col"
        style={{ pointerEvents: 'none' }}
      >
        <span className="text-3xl font-bold">{scoreText}</span>
        <span className="text-xs text-muted-foreground">out of 100</span>
      </div>
    </div>
  );
}