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
      <div className="bg-card p-4 shadow-lg rounded-lg border border-border max-w-xs">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        <p className="text-sm text-muted-foreground mb-2">
          Base: {data.baseValue}% → Testing ±2%
        </p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>At {data.minLabel}:</span>
            <span className={`tabular-nums ${data.minChange > 0 ? 'text-success' : 'text-destructive'}`}>
              {data.minChange > 0 ? '+' : ''}{formatCurrency(data.minChange)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>At {data.maxLabel}:</span>
            <span className={`tabular-nums ${data.maxChange > 0 ? 'text-success' : 'text-destructive'}`}>
              {data.maxChange > 0 ? '+' : ''}{formatCurrency(data.maxChange)}
            </span>
          </div>
        </div>
        {data.baseBreakeven && (
          <div className="mt-2 pt-2 border-t border-border text-sm">
            <p className="text-muted-foreground">
              Breakeven shifts: {data.minBreakeven?.toFixed(1) ?? 'Never'} → {data.maxBreakeven?.toFixed(1) ?? 'Never'} years
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card p-6">
      <h3 className="section-header mb-2">
        Sensitivity Analysis
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Impact on net worth difference (Buy vs Rent) when variables change by ±2%
      </p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(214 211 209)" />
            <XAxis
              type="number"
              domain={[-maxAbsValue * 1.1, maxAbsValue * 1.1]}
              tickFormatter={(value) => `${value > 0 ? '+' : ''}${(value / 1000).toFixed(0)}K`}
              stroke="rgb(87 83 78)"
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="variable"
              stroke="rgb(87 83 78)"
              fontSize={12}
              width={110}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={0} stroke="rgb(28 25 23)" strokeWidth={2} />

            {/* Negative impact (when variable decreases) */}
            <Bar dataKey="minChange" name="At -2%">
              {chartData.map((entry, index) => (
                <Cell
                  key={`min-${index}`}
                  fill={entry.minChange >= 0 ? 'rgb(5 150 105)' : 'rgb(225 29 72)'}
                />
              ))}
            </Bar>

            {/* Positive impact (when variable increases) */}
            <Bar dataKey="maxChange" name="At +2%">
              {chartData.map((entry, index) => (
                <Cell
                  key={`max-${index}`}
                  fill={entry.maxChange >= 0 ? 'rgb(5 150 105)' : 'rgb(225 29 72)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend and interpretation */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-secondary rounded-xl">
          <h4 className="font-medium text-foreground mb-2">How to Read This</h4>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>• <span className="text-success font-medium">Green bars</span> = Better for buying</li>
            <li>• <span className="text-destructive font-medium">Red bars</span> = Better for renting</li>
            <li>• Longer bars = More sensitive to changes</li>
          </ul>
        </div>

        <div className="p-4 bg-secondary rounded-xl">
          <h4 className="font-medium text-foreground mb-2">Key Insights</h4>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            {chartData.slice(0, 2).map((d) => (
              <li key={d.variable}>
                • <strong className="text-foreground">{d.variable}</strong> has {d.range > chartData[chartData.length - 1].range * 2 ? 'high' : 'moderate'} impact
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-secondary">
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Variable</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">Base</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">At -2%</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">At +2%</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">Range</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {chartData.map((row) => (
              <tr key={row.variable} className="hover:bg-secondary/50">
                <td className="py-2.5 px-3 text-foreground">{row.variable}</td>
                <td className="py-2.5 px-3 text-center text-muted-foreground">{row.baseValue}%</td>
                <td className={`py-2.5 px-3 text-center tabular-nums ${row.minChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {row.minChange >= 0 ? '+' : ''}{formatCurrency(row.minChange)}
                </td>
                <td className={`py-2.5 px-3 text-center tabular-nums ${row.maxChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {row.maxChange >= 0 ? '+' : ''}{formatCurrency(row.maxChange)}
                </td>
                <td className="py-2.5 px-3 text-center text-foreground font-medium tabular-nums">
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
