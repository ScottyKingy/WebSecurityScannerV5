import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

interface HistoryDataPoint {
  scanDate: string;
  overallScore: number;
  [key: string]: any; // Allow for other scanner scores
}

interface LineChartProps {
  data?: HistoryDataPoint[];
}

export function LineChart({ data = [] }: LineChartProps) {
  // If no data provided, use placeholder data
  const chartData = data.length > 0 ? data : [
    { scanDate: 'No Data', overallScore: 0 }
  ];

  // Format date for X-axis
  const formatDate = (date: string) => {
    if (date === 'No Data') return date;
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return date;
    }
  };

  // Calculate score trend (% change from first to last scan)
  const calculateScoreTrend = (): { value: number; label: string } => {
    if (data.length < 2) return { value: 0, label: 'N/A' };
    
    const firstScore = data[0].overallScore;
    const lastScore = data[data.length - 1].overallScore;
    const change = ((lastScore - firstScore) / firstScore) * 100;
    
    return { 
      value: change,
      label: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
    };
  };

  const trend = calculateScoreTrend();

  return (
    <div className="w-full">
      {trend.value !== 0 && (
        <div className="mb-2 text-right">
          <span className="text-sm font-medium mr-1">Trend:</span>
          <span className={`text-sm font-bold ${trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-600' : ''}`}>
            {trend.label}
          </span>
        </div>
      )}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="scanDate" 
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis 
              domain={[0, 100]} 
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value) => [`${value}`, 'Score']}
              labelFormatter={formatDate}
              contentStyle={{
                backgroundColor: '#fff',
                border: 'none',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="overallScore"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 1 }}
              activeDot={{ r: 6, stroke: '#4f46e5', strokeWidth: 1 }}
              name="Overall Score"
              isAnimationActive={true}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}