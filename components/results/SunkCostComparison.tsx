'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useStore } from '@/lib/store';
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/formatters';
import { categorizeAnnualCashFlow } from '@/lib/engine/cashflow';

type ViewMode = 'annual' | 'cumulative';

export function SunkCostComparison() {
  const results = useStore((state) => state.results);
  const [viewMode, setViewMode] = useState<ViewMode>('annual');
  const [selectedYear, setSelectedYear] = useState(5);
  const timeframe = useStore((state) => state.settings.timeframeYears);

  const chartData = useMemo(() => {
    if (!results.rentProjection || !results.buyProjection) return [];

    if (viewMode === 'annual') {
      // Show single year comparison
      const year = Math.min(selectedYear, timeframe);
      const rentSnap = results.rentProjection.snapshots[year];
      const buySnap = results.buyProjection.snapshots[year];

      if (!rentSnap || !buySnap) return [];

      const rentCashFlow = categorizeAnnualCashFlow(rentSnap, true);
      const buyCashFlow = categorizeAnnualCashFlow(buySnap, false);

      return [
        {
          name: 'Rent',
          rent: rentCashFlow.sunkCosts.rent,
          insurance: rentCashFlow.sunkCosts.homeInsurance,
          utilities: rentCashFlow.sunkCosts.utilities,
          other: rentCashFlow.sunkCosts.otherExpenses,
          total: rentCashFlow.totalSunk,
        },
        {
          name: 'Buy',
          interest: buyCashFlow.sunkCosts.mortgageInterest,
          propertyTax: buyCashFlow.sunkCosts.propertyTax,
          insurance: buyCashFlow.sunkCosts.homeInsurance,
          maintenance: buyCashFlow.sunkCosts.maintenance,
          strata: buyCashFlow.sunkCosts.strataFees,
          utilities: buyCashFlow.sunkCosts.utilities,
          other: buyCashFlow.sunkCosts.otherExpenses,
          total: buyCashFlow.totalSunk,
        },
      ];
    } else {
      // Show cumulative over years
      let rentCumulative = 0;
      let buyCumulative = 0;

      return results.rentProjection.snapshots.slice(1).map((rentSnap, idx) => {
        const buySnap = results.buyProjection!.snapshots[idx + 1];
        const rentCashFlow = categorizeAnnualCashFlow(rentSnap, true);
        const buyCashFlow = categorizeAnnualCashFlow(buySnap, false);

        rentCumulative += rentCashFlow.totalSunk;
        buyCumulative += buyCashFlow.totalSunk;

        return {
          year: idx + 1,
          rent: rentCumulative,
          buy: buyCumulative,
          difference: rentCumulative - buyCumulative,
        };
      });
    }
  }, [results, viewMode, selectedYear, timeframe]);

  if (chartData.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    if (viewMode === 'annual') {
      const data = payload[0]?.payload;
      if (!data) return null;

      return (
        <div className="bg-card p-4 shadow-lg rounded-lg border border-border">
          <p className="font-semibold text-foreground mb-2">{data.name} Scenario</p>
          {payload.filter((p: any) => p.value > 0).map((entry: any, idx: number) => (
            <div key={idx} className="flex justify-between gap-4 text-sm">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-medium tabular-nums">{formatCurrency(entry.value)}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-border">
            <div className="flex justify-between gap-4 text-sm font-semibold">
              <span>Total Sunk:</span>
              <span className="tabular-nums">{formatCurrency(data.total)}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-card p-4 shadow-lg rounded-lg border border-border">
        <p className="font-semibold text-foreground mb-2">Year {label}</p>
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex justify-between gap-4 text-sm">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-medium tabular-nums">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="section-header">
          Sunk Costs Comparison
        </h3>
        <div className="flex items-center gap-4">
          {/* View mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              onClick={() => setViewMode('annual')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'annual'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-background text-foreground hover:bg-secondary'
              }`}
            >
              Single Year
            </button>
            <button
              onClick={() => setViewMode('cumulative')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'cumulative'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-background text-foreground hover:bg-secondary'
              }`}
            >
              Cumulative
            </button>
          </div>

          {/* Year selector for annual view */}
          {viewMode === 'annual' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              {Array.from({ length: timeframe }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Year {i + 1}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'annual' ? (
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(214 211 209)" />
              <XAxis
                type="number"
                tickFormatter={(value) => formatCurrencyCompact(value)}
                stroke="rgb(87 83 78)"
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="rgb(87 83 78)"
                fontSize={12}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Rent bars */}
              <Bar dataKey="rent" name="Rent" stackId="stack" fill="rgb(2 132 199)" />

              {/* Buy bars */}
              <Bar dataKey="interest" name="Interest" stackId="stack" fill="rgb(225 29 72)" />
              <Bar dataKey="propertyTax" name="Property Tax" stackId="stack" fill="rgb(249 115 22)" />
              <Bar dataKey="insurance" name="Insurance" stackId="stack" fill="rgb(234 179 8)" />
              <Bar dataKey="maintenance" name="Maintenance" stackId="stack" fill="rgb(132 204 22)" />
              <Bar dataKey="strata" name="Strata/HOA" stackId="stack" fill="rgb(34 197 94)" />
              <Bar dataKey="utilities" name="Utilities" stackId="stack" fill="rgb(6 182 212)" />
              <Bar dataKey="other" name="Other" stackId="stack" fill="rgb(139 92 246)" />
            </BarChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(214 211 209)" />
              <XAxis
                dataKey="year"
                tickFormatter={(value) => `Y${value}`}
                stroke="rgb(87 83 78)"
                fontSize={12}
              />
              <YAxis
                tickFormatter={(value) => formatCurrencyCompact(value)}
                stroke="rgb(87 83 78)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="rent" name="Rent (Cumulative)" fill="rgb(2 132 199)" />
              <Bar dataKey="buy" name="Buy (Cumulative)" fill="rgb(5 150 105)" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      {viewMode === 'annual' && chartData.length === 2 && (
        <div className="mt-4 p-4 bg-secondary rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Rent sunk costs (Year {selectedYear}):</span>
            <span className="font-semibold text-info tabular-nums">
              {formatCurrency((chartData[0] as any).total)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Buy sunk costs (Year {selectedYear}):</span>
            <span className="font-semibold text-success tabular-nums">
              {formatCurrency((chartData[1] as any).total)}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-2 pt-2 border-t border-border">
            <span className="text-muted-foreground">Difference:</span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(Math.abs((chartData[0] as any).total - (chartData[1] as any).total))}
              {' '}
              <span className={(chartData[0] as any).total > (chartData[1] as any).total ? 'text-success' : 'text-info'}>
                ({(chartData[0] as any).total > (chartData[1] as any).total ? 'Buy lower' : 'Rent lower'})
              </span>
            </span>
          </div>
        </div>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Sunk costs</strong> are expenses that don't build wealth (rent, interest, taxes, maintenance).
        Lower sunk costs mean more money available for investing.
      </p>
    </div>
  );
}
