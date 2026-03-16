'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useStore } from '@/lib/store';
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/formatters';

interface ChartDataPoint {
  year: number;
  rent: number;
  buy: number;
  buy2?: number;
  rentEquity: number;
  rentPortfolio: number;
  buyEquity: number;
  buyPortfolio: number;
}

// Design system colors
const COLORS = {
  rent: '#0284c7', // info (sky-600)
  buy: '#059669', // success (emerald-600)
  buy2: '#9333ea', // purple-600
  breakeven: '#d97706', // accent (amber-600)
  grid: '#e7e5e4', // stone-200
  text: '#57534e', // muted-foreground (stone-500)
};

export function NetWorthChart() {
  const results = useStore((state) => state.results);
  const buyScenario = useStore((state) => state.buyScenario);
  const buyScenario2 = useStore((state) => state.buyScenario2);

  const chartData = useMemo(() => {
    if (!results.rentProjection || !results.buyProjection) return [];

    return results.rentProjection.snapshots.map((rentSnap, idx) => {
      const buySnap = results.buyProjection!.snapshots[idx];
      const buy2Snap = results.buyProjection2?.snapshots[idx];

      return {
        year: idx,
        rent: Math.round(rentSnap.netWorth),
        buy: Math.round(buySnap.netWorth),
        buy2: buy2Snap ? Math.round(buy2Snap.netWorth) : undefined,
        rentEquity: 0,
        rentPortfolio: Math.round(rentSnap.investmentPortfolio),
        buyEquity: Math.round(buySnap.homeEquity),
        buyPortfolio: Math.round(buySnap.investmentPortfolio),
      };
    });
  }, [results]);

  // Find breakeven year for reference line
  const breakevenYear = results.breakeven?.timeBreakeven?.exact;

  if (chartData.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-card p-4 shadow-lg rounded-xl border border-border">
        <p className="font-semibold text-foreground mb-2">
          {label === 0 ? 'Initial' : `Year ${label}`}
        </p>
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex justify-between gap-4 text-sm">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-medium tabular-nums">{formatCurrency(entry.value)}</span>
          </div>
        ))}
        {payload.length >= 2 && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Difference:</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(Math.abs(payload[0].value - payload[1].value))}
                {' '}
                <span style={{ color: payload[0].value > payload[1].value ? COLORS.rent : COLORS.buy }}>
                  ({payload[0].value > payload[1].value ? 'Rent' : 'Buy'})
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card p-6">
      <h3 className="section-header mb-4">
        Net Worth Over Time
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
            <XAxis
              dataKey="year"
              tickFormatter={(value) => (value === 0 ? 'Now' : `Y${value}`)}
              stroke={COLORS.text}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => formatCurrencyCompact(value)}
              stroke={COLORS.text}
              fontSize={12}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
            />

            {/* Breakeven reference line */}
            {breakevenYear && breakevenYear > 0 && (
              <ReferenceLine
                x={Math.round(breakevenYear)}
                stroke={COLORS.breakeven}
                strokeDasharray="5 5"
                label={{
                  value: 'Breakeven',
                  position: 'top',
                  fill: COLORS.breakeven,
                  fontSize: 12,
                }}
              />
            )}

            <Line
              type="monotone"
              dataKey="rent"
              name="Rent"
              stroke={COLORS.rent}
              strokeWidth={3}
              dot={{ r: 4, fill: COLORS.rent }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="buy"
              name={buyScenario.name || 'Buy'}
              stroke={COLORS.buy}
              strokeWidth={3}
              dot={{ r: 4, fill: COLORS.buy }}
              activeDot={{ r: 6 }}
            />
            {buyScenario2 && (
              <Line
                type="monotone"
                dataKey="buy2"
                name={buyScenario2.name || 'Buy B'}
                stroke={COLORS.buy2}
                strokeWidth={3}
                dot={{ r: 4, fill: COLORS.buy2 }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend explanation */}
      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Net Worth</strong> = Investment Portfolio + Home Equity (for buyers)
        </p>
        {breakevenYear && (
          <p className="mt-1 flex items-center gap-2">
            <span className="inline-block w-4 h-0.5 bg-accent" style={{ borderStyle: 'dashed' }}></span>
            Breakeven point at approximately {breakevenYear.toFixed(1)} years
          </p>
        )}
      </div>
    </div>
  );
}
