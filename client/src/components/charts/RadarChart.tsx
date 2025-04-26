import { 
  RadarChart as RechartsRadarChart, 
  PolarGrid, 
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface RadarChartProps {
  data?: Array<{
    subject: string;
    value: number;
    fullMark?: number;
  }>;
}

export function RadarChart({ data = [] }: RadarChartProps) {
  // Default placeholder data if none provided
  const chartData = data.length > 0 ? data : [
    { subject: 'Readability', value: 0, fullMark: 100 },
    { subject: 'Tone', value: 0, fullMark: 100 },
    { subject: 'Structure', value: 0, fullMark: 100 },
    { subject: 'Clarity', value: 0, fullMark: 100 },
    { subject: 'Engagement', value: 0, fullMark: 100 },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fontSize: 10, fill: '#9ca3af' }}
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
          <Radar 
            name="Content Quality" 
            dataKey="value" 
            stroke="#3b82f6" 
            fill="#3b82f6" 
            fillOpacity={0.5} 
            isAnimationActive={true}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}