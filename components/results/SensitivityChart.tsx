'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils/formatters';

export function SensitivityChart() {
  const results = useStore((state) => state.results);
  const timeframe = useStore((state) => state.settings.timeframeYears);

  const chartData = useMemo(() => {
    if (!results.sensitivity) return [];

    return results.sensitivity.map((result) => {
      const minScenario = result.scenarios.find((s) => s.change === -2);
      const maxScenario = result.scenarios.find((s) => s.change === 2);
      const baseScenario = result.scenarios.find((s) => s.change === 0);

      const baseBreakeven = baseScenario?.breakevenYear ?? null;
      const minBreakeven = minScenario?.breakevenYear ?? baseBreakeven;
      const maxBreakeven = maxScenario?.breakevenYear ?? baseBreakeven;

      // Calculate the impact on net worth difference
      const minDelta = minScenario?.netWorthDelta ?? 0;
      const maxDelta = maxScenario?.netWorthDelta ?? 0;

      return {
        variable: result.variable,
        baseValue: result.baseValue,
        minChange: minDelta,
        maxChange: maxDelta,
        range: Math.abs(maxDelta - minDelta),
        minLabel: `${result.baseValue - 2}%`,
        maxLabel: `${result.baseValue + 2}%`,
        baseBreakeven,
        minBreakeven,
        maxBreakeven,
      };
    }).sort((a, b) => b.range - a.range); // Sort by impact
  }, [results.sensitivity]);

  if (chartData.length === 0) return null;

  const maxAbsValue = Math.max(
    ...chartData.map((d) => Math.max(Math.abs(d.minChange), Math.abs(d.maxChange)))
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = chartData.find((d) => d.variable === label);
    if (!data) return null;

    return (
      <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200 max-w-xs">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <p className="text-sm text-gray-600 mb-2">
          Base: {data.baseValue}% → Testing ±2%
        </p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>At {data.minLabel}:</span>
            <span className={data.minChange > 0 ? 'text-green-600' : 'text-red-600'}>
              {data.minChange > 0 ? '+' : ''}{formatCurrency(data.minChange)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>At {data.maxLabel}:</span>
            <span className={data.maxChange > 0 ? 'text-green-600' : 'text-red-600'}>
              {data.maxChange > 0 ? '+' : ''}{formatCurrency(data.maxChange)}
            </span>
          </div>
        </div>
        {data.baseBreakeven && (
          <div className="mt-2 pt-2 border-t border-gray-200 text-sm">
            <p className="text-gray-600">
              Breakeven shifts: {data.minBreakeven?.toFixed(1) ?? 'Never'} → {data.maxBreakeven?.toFixed(1) ?? 'Never'} years
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Sensitivity Analysis
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Impact on net worth difference (Buy vs Rent) when variables change by ±2%
      </p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              domain={[-maxAbsValue * 1.1, maxAbsValue * 1.1]}
              tickFormatter={(value) => `${value > 0 ? '+' : ''}${(value / 1000).toFixed(0)}K`}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="variable"
              stroke="#6b7280"
              fontSize={12}
              width={110}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={0} stroke="#374151" strokeWidth={2} />

            {/* Negative impact (when variable decreases) */}
            <Bar dataKey="minChange" name="At -2%">
              {chartData.map((entry, index) => (
                <Cell
                  key={`min-${index}`}
                  fill={entry.minChange >= 0 ? '#22c55e' : '#ef4444'}
                />
              ))}
            </Bar>

            {/* Positive impact (when variable increases) */}
            <Bar dataKey="maxChange" name="At +2%">
              {chartData.map((entry, index) => (
                <Cell
                  key={`max-${index}`}
                  fill={entry.maxChange >= 0 ? '#22c55e' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend and interpretation */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">How to Read This</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <span className="text-green-600 font-medium">Green bars</span> = Better for buying</li>
            <li>• <span className="text-red-600 font-medium">Red bars</span> = Better for renting</li>
            <li>• Longer bars = More sensitive to changes</li>
          </ul>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Key Insights</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {chartData.slice(0, 2).map((d) => (
              <li key={d.variable}>
                • <strong>{d.variable}</strong> has {d.range > chartData[chartData.length - 1].range * 2 ? 'high' : 'moderate'} impact
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-gray-600 font-medium">Variable</th>
              <th className="text-center py-2 text-gray-600 font-medium">Base</th>
              <th className="text-center py-2 text-gray-600 font-medium">At -2%</th>
              <th className="text-center py-2 text-gray-600 font-medium">At +2%</th>
              <th className="text-center py-2 text-gray-600 font-medium">Range</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row) => (
              <tr key={row.variable} className="border-b border-gray-100">
                <td className="py-2 text-gray-900">{row.variable}</td>
                <td className="py-2 text-center text-gray-600">{row.baseValue}%</td>
                <td className={`py-2 text-center ${row.minChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {row.minChange >= 0 ? '+' : ''}{formatCurrency(row.minChange)}
                </td>
                <td className={`py-2 text-center ${row.maxChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {row.maxChange >= 0 ? '+' : ''}{formatCurrency(row.maxChange)}
                </td>
                <td className="py-2 text-center text-gray-900 font-medium">
                  {formatCurrency(row.range)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
