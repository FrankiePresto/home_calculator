'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { useStore } from '@/lib/store';
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/formatters';
import { categorizeAnnualCashFlow } from '@/lib/engine/cashflow';

const COLORS = {
  rent: '#0284c7',       // info (sky-600)
  buy: '#059669',        // success (emerald-600)
  grid: '#e7e5e4',
  text: '#57534e',
};

type ViewMode = 'annual' | 'cumulative';

export function SunkCostComparison() {
  const results = useStore((state) => state.results);
  const timeframe = useStore((state) => state.settings.timeframeYears);
  const [selectedYear, setSelectedYear] = useState(5);
  const [viewMode, setViewMode] = useState<ViewMode>('cumulative');

  const { comparisonData, chartData } = useMemo(() => {
    if (!results.rentProjection || !results.buyProjection) return { comparisonData: null, chartData: [] };

    const year = Math.min(selectedYear, timeframe);
    const rentSnap = results.rentProjection.snapshots[year];
    const buySnap = results.buyProjection.snapshots[year];

    if (!rentSnap || !buySnap) return { comparisonData: null, chartData: [] };

    const rentCashFlow = categorizeAnnualCashFlow(rentSnap, true);
    const buyCashFlow = categorizeAnnualCashFlow(buySnap, false);

    // Build chart data with cumulative tracking
    let rentCumulative = 0;
    let buyCumulative = 0;
    const chart = [];

    for (let i = 1; i <= timeframe; i++) {
      const rSnap = results.rentProjection.snapshots[i];
      const bSnap = results.buyProjection.snapshots[i];
      if (rSnap && bSnap) {
        const rFlow = categorizeAnnualCashFlow(rSnap, true);
        const bFlow = categorizeAnnualCashFlow(bSnap, false);
        rentCumulative += rFlow.totalSunk;
        buyCumulative += bFlow.totalSunk;
        chart.push({
          year: `Yr ${i}`,
          rentAnnual: Math.round(rFlow.totalSunk),
          buyAnnual: Math.round(bFlow.totalSunk),
          rentCumulative: Math.round(rentCumulative),
          buyCumulative: Math.round(buyCumulative),
        });
      }
    }

    // Get cumulative for the selected year
    const selectedRentCumulative = chart[year - 1]?.rentCumulative ?? 0;
    const selectedBuyCumulative = chart[year - 1]?.buyCumulative ?? 0;

    return {
      comparisonData: {
        year,
        rent: {
          annual: rentCashFlow.totalSunk,
          cumulative: selectedRentCumulative,
          breakdown: {
            rent: rentCashFlow.sunkCosts.rent,
            insurance: rentCashFlow.sunkCosts.homeInsurance,
            utilities: rentCashFlow.sunkCosts.utilities,
            other: rentCashFlow.sunkCosts.otherExpenses,
          }
        },
        buy: {
          annual: buyCashFlow.totalSunk,
          cumulative: selectedBuyCumulative,
          breakdown: {
            interest: buyCashFlow.sunkCosts.mortgageInterest,
            propertyTax: buyCashFlow.sunkCosts.propertyTax,
            insurance: buyCashFlow.sunkCosts.homeInsurance,
            maintenance: buyCashFlow.sunkCosts.maintenance,
            strata: buyCashFlow.sunkCosts.strataFees,
            utilities: buyCashFlow.sunkCosts.utilities,
            other: buyCashFlow.sunkCosts.otherExpenses,
          }
        },
        annualDiff: rentCashFlow.totalSunk - buyCashFlow.totalSunk,
        cumulativeDiff: selectedRentCumulative - selectedBuyCumulative,
      },
      chartData: chart,
    };
  }, [results, selectedYear, timeframe]);

  if (!comparisonData) return null;

  const rentLowerAnnual = comparisonData.annualDiff < 0;
  const rentLowerCumulative = comparisonData.cumulativeDiff < 0;
  const selectedYearLabel = `Yr ${Math.min(selectedYear, timeframe)}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-card p-3 shadow-lg rounded-xl border border-border text-sm">
        <p className="font-semibold text-foreground mb-1.5">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="font-medium tabular-nums">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="section-header">Sunk Costs Comparison</h3>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-border text-sm">
            <button
              onClick={() => setViewMode('annual')}
              className={`px-3 py-1.5 font-medium transition-colors ${
                viewMode === 'annual' ? 'bg-accent text-accent-foreground' : 'bg-background hover:bg-secondary'
              }`}
            >
              Annual
            </button>
            <button
              onClick={() => setViewMode('cumulative')}
              className={`px-3 py-1.5 font-medium transition-colors ${
                viewMode === 'cumulative' ? 'bg-accent text-accent-foreground' : 'bg-background hover:bg-secondary'
              }`}
            >
              Cumulative
            </button>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          >
            {Array.from({ length: timeframe }, (_, i) => (
              <option key={i + 1} value={i + 1}>Year {i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="h-56 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'annual' ? (
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: COLORS.text }} interval={Math.max(0, Math.floor(chartData.length / 8) - 1)} />
                <YAxis tick={{ fontSize: 11, fill: COLORS.text }} tickFormatter={(v) => formatCurrencyCompact(v)} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="rentAnnual" name="Rent" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={COLORS.rent} opacity={entry.year === selectedYearLabel ? 1 : 0.3} />
                  ))}
                </Bar>
                <Bar dataKey="buyAnnual" name="Buy" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={COLORS.buy} opacity={entry.year === selectedYearLabel ? 1 : 0.3} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: COLORS.text }} interval={Math.max(0, Math.floor(chartData.length / 8) - 1)} />
                <YAxis tick={{ fontSize: 11, fill: COLORS.text }} tickFormatter={(v) => formatCurrencyCompact(v)} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine x={selectedYearLabel} stroke={COLORS.text} strokeDasharray="4 4" strokeWidth={1.5} label={{ value: selectedYearLabel, position: 'top', fontSize: 11, fill: COLORS.text }} />
                <Line type="monotone" dataKey="rentCumulative" name="Rent" stroke={COLORS.rent} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="buyCumulative" name="Buy" stroke={COLORS.buy} strokeWidth={2} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Comparison cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Rent card */}
        <div className={`p-4 rounded-lg border-2 ${rentLowerAnnual ? 'border-success bg-success/5' : 'border-border'}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Rent</h4>
            {rentLowerAnnual && <span className="text-xs font-medium text-success px-2 py-0.5 bg-success/20 rounded">Lower</span>}
          </div>
          <p className="text-2xl font-bold tabular-nums mb-1">{formatCurrency(comparisonData.rent.annual)}</p>
          <p className="text-xs text-muted-foreground">Year {comparisonData.year} sunk costs</p>
        </div>

        {/* Buy card */}
        <div className={`p-4 rounded-lg border-2 ${!rentLowerAnnual ? 'border-success bg-success/5' : 'border-border'}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Buy</h4>
            {!rentLowerAnnual && <span className="text-xs font-medium text-success px-2 py-0.5 bg-success/20 rounded">Lower</span>}
          </div>
          <p className="text-2xl font-bold tabular-nums mb-1">{formatCurrency(comparisonData.buy.annual)}</p>
          <p className="text-xs text-muted-foreground">Year {comparisonData.year} sunk costs</p>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Rent breakdown */}
        <div className="space-y-1.5 text-sm">
          {comparisonData.rent.breakdown.rent > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rent</span>
              <span className="tabular-nums">{formatCurrency(comparisonData.rent.breakdown.rent)}</span>
            </div>
          )}
          {comparisonData.rent.breakdown.insurance > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Insurance</span>
              <span className="tabular-nums">{formatCurrency(comparisonData.rent.breakdown.insurance)}</span>
            </div>
          )}
          {comparisonData.rent.breakdown.utilities > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Utilities</span>
              <span className="tabular-nums">{formatCurrency(comparisonData.rent.breakdown.utilities)}</span>
            </div>
          )}
          {comparisonData.rent.breakdown.other > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Other</span>
              <span className="tabular-nums">{formatCurrency(comparisonData.rent.breakdown.other)}</span>
            </div>
          )}
        </div>

        {/* Buy breakdown */}
        <div className="space-y-1.5 text-sm">
          {comparisonData.buy.breakdown.interest > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Interest</span>
              <span className="tabular-nums">{formatCurrency(comparisonData.buy.breakdown.interest)}</span>
            </div>
          )}
          {comparisonData.buy.breakdown.propertyTax > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property Tax</span>
              <span className="tabular-nums">{formatCurrency(comparisonData.buy.breakdown.propertyTax)}</span>
            </div>
          )}
          {comparisonData.buy.breakdown.insurance > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Insurance</span>
              <span className="tabular-nums">{formatCurrency(comparisonData.buy.breakdown.insurance)}</span>
            </div>
          )}
          {comparisonData.buy.breakdown.maintenance > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maintenance</span>
              <span className="tabular-nums">{formatCurrency(comparisonData.buy.breakdown.maintenance)}</span>
            </div>
          )}
          {comparisonData.buy.breakdown.strata > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Strata/HOA</span>
              <span className="tabular-nums">{formatCurrency(comparisonData.buy.breakdown.strata)}</span>
            </div>
          )}
          {comparisonData.buy.breakdown.utilities > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Utilities</span>
              <span className="tabular-nums">{formatCurrency(comparisonData.buy.breakdown.utilities)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cumulative summary */}
      <div className="p-4 bg-secondary rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Cumulative sunk costs (Years 1-{comparisonData.year})</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Rent total</p>
            <p className="font-semibold tabular-nums">{formatCurrency(comparisonData.rent.cumulative)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Buy total</p>
            <p className="font-semibold tabular-nums">{formatCurrency(comparisonData.buy.cumulative)}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border text-sm">
          <span className="text-muted-foreground">Difference: </span>
          <span className="font-semibold">
            {formatCurrency(Math.abs(comparisonData.cumulativeDiff))}
            <span className={rentLowerCumulative ? 'text-info' : 'text-success'}>
              {' '}({rentLowerCumulative ? 'Rent' : 'Buy'} lower)
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
