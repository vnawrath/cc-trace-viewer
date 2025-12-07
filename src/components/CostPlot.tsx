import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { SessionSummary } from '../services/sessionManager';
import { formatCost } from '../services/costCalculator';

interface CostPlotProps {
  sessions: SessionSummary[];
}

interface DailyBucket {
  date: string; // YYYY-MM-DD format
  dateDisplay: string; // MMM DD format for display
  totalCost: number;
}

export function CostPlot({ sessions }: CostPlotProps) {
  // Process sessions into daily buckets
  const dailyBuckets = useMemo(() => {
    // Group sessions by date
    const bucketMap = new Map<string, number>();

    for (const session of sessions) {
      // Skip sessions with null cost
      if (session.metadata.totalCost === null) {
        continue;
      }

      // Convert startTime (unix seconds) to Date object
      const date = new Date(session.metadata.startTime * 1000);

      // Format as YYYY-MM-DD
      const dateKey = date.toISOString().split('T')[0];

      // Accumulate cost for this date
      const currentCost = bucketMap.get(dateKey) || 0;
      bucketMap.set(dateKey, currentCost + session.metadata.totalCost);
    }

    // Convert to array and sort chronologically
    const buckets: DailyBucket[] = Array.from(bucketMap.entries())
      .map(([date, totalCost]) => {
        // Parse date and format for display
        const dateObj = new Date(date + 'T00:00:00');
        const dateDisplay = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        return {
          date,
          dateDisplay,
          totalCost,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return buckets;
  }, [sessions]);

  // Handle edge cases
  if (sessions.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">No data</p>
      </div>
    );
  }

  if (dailyBuckets.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">No cost data available</p>
      </div>
    );
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload as DailyBucket;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded px-3 py-2">
          <p className="text-xs text-gray-300">{data.dateDisplay}</p>
          <p className="text-sm font-semibold text-white">
            {formatCost(data.totalCost)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-200 mb-4">Daily Cost</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={dailyBuckets} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="dateDisplay"
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="totalCost" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
