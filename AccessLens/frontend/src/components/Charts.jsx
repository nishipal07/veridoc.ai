import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const IMPACT_COLORS = {
  critical: '#ef4444',
  serious: '#f97316',
  moderate: '#eab308',
  minor: '#3b82f6'
};

/**
 * Custom tooltip for the Pie chart
 */
function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
        <p className="font-bold">{data.name}</p>
        <p className="text-slate-300">{data.value} {data.value === 1 ? 'violation' : 'violations'}</p>
      </div>
    );
  }
  return null;
}

/**
 * Custom tooltip for the Bar chart
 */
function CustomBarTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
        <p className="font-bold font-mono">{data.ruleId}</p>
        <p className="capitalize text-slate-300">Impact: {data.impact}</p>
        <p className="text-indigo-300 font-semibold">{data.nodesCount} affected elements</p>
      </div>
    );
  }
  return null;
}

export default function Charts({ summary = {}, issues = [] }) {
  // 1. Severity Distribution Data
  const pieData = [
    { name: 'Critical', value: summary.critical || 0, color: IMPACT_COLORS.critical },
    { name: 'Serious', value: summary.serious || 0, color: IMPACT_COLORS.serious },
    { name: 'Moderate', value: summary.moderate || 0, color: IMPACT_COLORS.moderate },
    { name: 'Minor', value: summary.minor || 0, color: IMPACT_COLORS.minor }
  ].filter((item) => item.value > 0);

  // 2. Top Issues Data (by number of failing DOM nodes)
  const topIssuesData = [...issues]
    .map((issue) => ({
      ruleId: issue.ruleId,
      nodesCount: issue.nodes?.length || 1,
      impact: issue.impact
    }))
    .sort((a, b) => b.nodesCount - a.nodesCount)
    .slice(0, 5); // top 5 most frequent

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Chart 1: Severity Distribution */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Issue Severity Distribution</h3>
        <p className="text-xs text-slate-500 mb-4">Proportion of detected issues by impact category</p>

        <div className="h-64 w-full flex-grow flex items-center justify-center">
          {pieData.length === 0 ? (
            <div className="text-center text-xs text-slate-400">
              No accessibility violations to display.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-slate-600 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 2: Top Issues by Affected Elements */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Top Failing Rules</h3>
        <p className="text-xs text-slate-500 mb-4">Rules with the highest number of affected DOM nodes</p>

        <div className="h-64 w-full flex-grow flex items-center justify-center">
          {topIssuesData.length === 0 ? (
            <div className="text-center text-xs text-slate-400">
              No failing rules detected on this page.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topIssuesData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="ruleId"
                  tick={{ fontSize: 11, fill: '#334155', fontFamily: 'monospace' }}
                  width={100}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="nodesCount" radius={[0, 4, 4, 0]}>
                  {topIssuesData.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={IMPACT_COLORS[entry.impact] || '#6366f1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
