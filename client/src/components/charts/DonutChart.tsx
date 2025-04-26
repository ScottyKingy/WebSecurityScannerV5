import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DonutChartProps {
  value: number;
  label: string;
  size?: number;
}

export function DonutChart({ value, label, size = 150 }: DonutChartProps) {
  const [chartData, setChartData] = useState([
    { name: 'Value', value: 0 },
    { name: 'Remaining', value: 100 }
  ]);
  
  // Normalize value to be between 0 and 100
  const normalizedValue = Math.max(0, Math.min(100, value));
  
  useEffect(() => {
    // Animate the chart when value changes
    setChartData([
      { name: 'Value', value: normalizedValue },
      { name: 'Remaining', value: 100 - normalizedValue }
    ]);
  }, [normalizedValue]);

  // Determine color based on score
  const getColor = (score: number) => {
    if (score >= 80) return '#22c55e'; // green-500
    if (score >= 60) return '#84cc16'; // lime-500
    if (score >= 40) return '#eab308'; // yellow-500
    if (score >= 20) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  const color = getColor(normalizedValue);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.6 / 2}
              outerRadius={size / 2}
              startAngle={90}
              endAngle={-270}
              paddingAngle={0}
              dataKey="value"
            >
              <Cell key="value-cell" fill={color} />
              <Cell key="remaining-cell" fill="#e5e7eb" /> {/* gray-200 */}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value}%`, 'Score']}
              contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-center">
        <div className="text-2xl font-bold" style={{ color }}>{normalizedValue}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}