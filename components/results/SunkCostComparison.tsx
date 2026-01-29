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
        <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{data.name} Scenario</p>
          {payload.filter((p: any) => p.value > 0).map((entry: any, idx: number) => (
            <div key={idx} className="flex justify-between gap-4 text-sm">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex justify-between gap-4 text-sm font-semibold">
              <span>Total Sunk:</span>
              <span>{formatCurrency(data.total)}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-2">Year {label}</p>
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex justify-between gap-4 text-sm">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-medium">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Sunk Costs Comparison
        </h3>
        <div className="flex items-center gap-4">
          {/* View mode toggle */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('annual')}
              className={`px-3 py-1.5 text-sm font-medium rounded-l-md border ${
                viewMode === 'annual'
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Single Year
            </button>
            <button
              onClick={() => setViewMode('cumulative')}
              className={`px-3 py-1.5 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === 'cumulative'
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
              className="rounded-md border-gray-300 text-sm"
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                tickFormatter={(value) => formatCurrencyCompact(value)}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#6b7280"
                fontSize={12}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Rent bars */}
              <Bar dataKey="rent" name="Rent" stackId="stack" fill="#3b82f6" />

              {/* Buy bars */}
              <Bar dataKey="interest" name="Interest" stackId="stack" fill="#ef4444" />
              <Bar dataKey="propertyTax" name="Property Tax" stackId="stack" fill="#f97316" />
              <Bar dataKey="insurance" name="Insurance" stackId="stack" fill="#eab308" />
              <Bar dataKey="maintenance" name="Maintenance" stackId="stack" fill="#84cc16" />
              <Bar dataKey="strata" name="Strata/HOA" stackId="stack" fill="#22c55e" />
              <Bar dataKey="utilities" name="Utilities" stackId="stack" fill="#06b6d4" />
              <Bar dataKey="other" name="Other" stackId="stack" fill="#8b5cf6" />
            </BarChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="year"
                tickFormatter={(value) => `Y${value}`}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis
                tickFormatter={(value) => formatCurrencyCompact(value)}
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="rent" name="Rent (Cumulative)" fill="#2563eb" />
              <Bar dataKey="buy" name="Buy (Cumulative)" fill="#16a34a" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      {viewMode === 'annual' && chartData.length === 2 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>Rent sunk costs (Year {selectedYear}):</span>
            <span className="font-semibold text-blue-600">
              {formatCurrency((chartData[0] as any).total)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Buy sunk costs (Year {selectedYear}):</span>
            <span className="font-semibold text-green-600">
              {formatCurrency((chartData[1] as any).total)}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200">
            <span>Difference:</span>
            <span className="font-semibold">
              {formatCurrency(Math.abs((chartData[0] as any).total - (chartData[1] as any).total))}
              {' '}
              <span className={(chartData[0] as any).total > (chartData[1] as any).total ? 'text-green-600' : 'text-blue-600'}>
                ({(chartData[0] as any).total > (chartData[1] as any).total ? 'Buy lower' : 'Rent lower'})
              </span>
            </span>
          </div>
        </div>
      )}

      <p className="mt-4 text-sm text-gray-600">
        <strong>Sunk costs</strong> are expenses that don't build wealth (rent, interest, taxes, maintenance).
        Lower sunk costs mean more money available for investing.
      </p>
    </div>
  );
}
