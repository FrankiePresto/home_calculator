'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { simulateMortgageWithExtraPayments, calculateTotalLoan, buildLumpSumMap } from '@/lib/engine/mortgage';
import { MortgageAcceleration, PeriodicPayment } from '@/lib/engine/types';
import { formatCurrency } from '@/lib/utils/formatters';
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

const DEFAULT_ACCELERATION: MortgageAcceleration = {
  extraMonthlyPayment: 0,
  annualLumpSum: 0,
  annualLumpSumStartYear: 1,
  annualLumpSumEndYear: undefined,
  periodicPayments: [],
};

export function MortgagePayoffChart() {
  const buyScenario = useStore((state) => state.buyScenario);
  const setAcceleration = useStore((state) => state.setAcceleration);
  const calculate = useStore((state) => state.calculate);
  const amort = buyScenario.amortizationYears;
  const sectionRef = useRef<HTMLDivElement>(null);

  const accel = buyScenario.acceleration ?? DEFAULT_ACCELERATION;
  const recalcTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced updater for continuous inputs (typing numbers).
  // setAcceleration does NOT clear lastCalculated, so the page stays on results.
  // calculate() is debounced so it only fires after the user stops typing.
  const updateAcceleration = useCallback(
    (updates: Partial<MortgageAcceleration>) => {
      setAcceleration({ ...accel, ...updates });
      if (recalcTimer.current) clearTimeout(recalcTimer.current);
      recalcTimer.current = setTimeout(() => calculate(), 800);
    },
    [accel, setAcceleration, calculate]
  );

  // Immediate updater for discrete actions (add/remove periodic payment)
  const updateAccelerationImmediate = useCallback(
    (updates: Partial<MortgageAcceleration>) => {
      setAcceleration({ ...accel, ...updates });
      if (recalcTimer.current) clearTimeout(recalcTimer.current);
      calculate();
    },
    [accel, setAcceleration, calculate]
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => { if (recalcTimer.current) clearTimeout(recalcTimer.current); };
  }, []);

  // --- Local draft state for text inputs (allows free typing, validates on blur) ---
  const [addingPayment, setAddingPayment] = useState(false);
  const [draftYear, setDraftYear] = useState('1');
  const [draftAmount, setDraftAmount] = useState('');
  const [draftAnnualAmount, setDraftAnnualAmount] = useState(accel.annualLumpSum ? String(accel.annualLumpSum) : '');
  const [draftStartYear, setDraftStartYear] = useState(String(accel.annualLumpSumStartYear));
  const [draftEndYear, setDraftEndYear] = useState(accel.annualLumpSumEndYear != null ? String(accel.annualLumpSumEndYear) : '');

  // --- Derived ---
  const principal = useMemo(
    () =>
      calculateTotalLoan(
        buyScenario.purchasePrice,
        buyScenario.downPaymentPercent,
        buyScenario.mortgageInsurancePercent
      ),
    [buyScenario.purchasePrice, buyScenario.downPaymentPercent, buyScenario.mortgageInsurancePercent]
  );

  const lumpSumsPerYear = useMemo(() => {
    const map = buildLumpSumMap(accel, amort);
    return Array.from(map.entries()).map(([year, amount]) => ({ year, amount }));
  }, [accel, amort]);

  const simulation = useMemo(
    () =>
      simulateMortgageWithExtraPayments(
        principal,
        buyScenario.interestRate,
        amort,
        accel.extraMonthlyPayment,
        lumpSumsPerYear
      ),
    [principal, buyScenario.interestRate, amort, accel.extraMonthlyPayment, lumpSumsPerYear]
  );

  const hasExtraPayments =
    accel.extraMonthlyPayment > 0 || accel.annualLumpSum > 0 || accel.periodicPayments.length > 0;

  // Chart data
  const chartData = simulation.base.map((item, i) => ({
    year: item.year,
    Original: Math.round(item.balance),
    ...(hasExtraPayments
      ? { 'With extra payments': Math.round(simulation.accelerated[i]?.balance ?? 0) }
      : {}),
  }));

  // Summary helpers
  const yearsSaved = Math.floor(simulation.monthsSaved / 12);
  const remMonths = simulation.monthsSaved % 12;
  const timeSavedLabel =
    simulation.monthsSaved === 0
      ? '—'
      : [yearsSaved > 0 ? `${yearsSaved}y` : '', remMonths > 0 ? `${remMonths}m` : '']
          .filter(Boolean)
          .join(' ');

  const periodicYears = Array.from(new Set(accel.periodicPayments.map((p) => p.year)));

  // --- Handlers ---
  const commitPeriodicPayment = () => {
    const amount = parseFloat(draftAmount.replace(/[^0-9.]/g, ''));
    if (!amount || amount <= 0) return;
    const yearNum = parseInt(draftYear);
    if (!yearNum || yearNum < 1 || yearNum > amort) return;
    updateAccelerationImmediate({
      periodicPayments: [
        ...accel.periodicPayments,
        { id: Math.random().toString(36).slice(2, 9), year: yearNum, amount },
      ],
    });
    setAddingPayment(false);
    setDraftAmount('');
    setDraftYear(String(Math.min(yearNum + 3, amort)));
  };

  const removePeriodicPayment = (id: string) =>
    updateAccelerationImmediate({
      periodicPayments: accel.periodicPayments.filter((p) => p.id !== id),
    });

  const formatYAxis = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
    return `$${v}`;
  };

  return (
    <div ref={sectionRef} className="card p-6">
      {/* Header */}
      <div className="mb-5">
        <h3 className="section-header">Mortgage Acceleration</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Explore how extra payments reduce your total interest and shorten your payoff timeline.
          These settings are reflected in all calculations across the dashboard.
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-6 mb-6">

        {/* Extra Monthly Payment */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Extra Monthly Payment
          </label>
          <div className="relative w-44">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-sm">
              $
            </span>
            <input
              type="number"
              min={0}
              step={50}
              value={accel.extraMonthlyPayment || ''}
              onChange={(e) => updateAcceleration({ extraMonthlyPayment: Math.max(0, parseFloat(e.target.value) || 0) })}
              placeholder="0"
              className="input pl-7"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Added on top of your required payment every month
          </p>
        </div>

        {/* Annual Contribution */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-1">Annual Contribution</h4>
          <p className="text-xs text-muted-foreground mb-3">
            A predictable yearly amount — e.g. tax refund or annual bonus
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Amount / year</label>
              <div className="relative w-40">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-sm">
                  $
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={draftAnnualAmount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.]/g, '');
                    setDraftAnnualAmount(raw);
                    updateAcceleration({ annualLumpSum: Math.max(0, parseFloat(raw) || 0) });
                  }}
                  onBlur={() => {
                    const val = Math.max(0, parseFloat(draftAnnualAmount) || 0);
                    setDraftAnnualAmount(val ? String(val) : '');
                  }}
                  placeholder="0"
                  className="input pl-7"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">From year</label>
              <input
                type="text"
                inputMode="numeric"
                value={draftStartYear}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setDraftStartYear(raw);
                  const v = parseInt(raw);
                  if (v >= 1 && v <= amort) {
                    updateAcceleration({ annualLumpSumStartYear: v });
                  }
                }}
                onBlur={() => {
                  const v = parseInt(draftStartYear);
                  const clamped = Math.max(1, Math.min(amort, v || 1));
                  setDraftStartYear(String(clamped));
                  updateAcceleration({ annualLumpSumStartYear: clamped });
                }}
                className="input w-20"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Through year{' '}
                <span className="text-muted-foreground/60">(blank = end)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={draftEndYear}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setDraftEndYear(raw);
                  if (raw === '') {
                    updateAcceleration({ annualLumpSumEndYear: undefined });
                  } else {
                    const v = parseInt(raw);
                    if (v >= 1 && v <= amort) {
                      updateAcceleration({ annualLumpSumEndYear: v });
                    }
                  }
                }}
                onBlur={() => {
                  if (draftEndYear === '') {
                    updateAcceleration({ annualLumpSumEndYear: undefined });
                  } else {
                    const v = parseInt(draftEndYear);
                    const clamped = Math.max(accel.annualLumpSumStartYear, Math.min(amort, v || amort));
                    setDraftEndYear(String(clamped));
                    updateAcceleration({ annualLumpSumEndYear: clamped });
                  }
                }}
                placeholder={`${amort}`}
                className="input w-24"
              />
            </div>
          </div>
        </div>

        {/* Periodic Payments */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-1">Periodic Payments</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Irregular extra payments at specific years — windfalls, proceeds, or anything
            that doesn't follow a fixed schedule
          </p>

          {accel.periodicPayments.length > 0 && (
            <div className="mb-3 divide-y divide-border border border-border rounded-lg overflow-hidden">
              {accel.periodicPayments
                .slice()
                .sort((a, b) => a.year - b.year)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2 bg-card text-sm"
                  >
                    <span className="text-muted-foreground w-16 shrink-0">Year {p.year}</span>
                    <span className="font-medium text-foreground flex-1">
                      {formatCurrency(p.amount)}
                    </span>
                    <button
                      onClick={() => removePeriodicPayment(p.id)}
                      className="text-xs text-destructive hover:text-destructive/80 ml-3"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
          )}

          {addingPayment ? (
            <div className="flex flex-wrap gap-3 items-end bg-secondary border border-border rounded-lg p-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Year (1–{amort})</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={draftYear}
                  onChange={(e) => setDraftYear(e.target.value.replace(/[^0-9]/g, ''))}
                  className="input w-20"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Amount</label>
                <div className="relative w-40">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={draftAmount}
                    onChange={(e) => setDraftAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && commitPeriodicPayment()}
                    placeholder="0"
                    autoFocus
                    className="input pl-7"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={commitPeriodicPayment}
                  disabled={!draftAmount || parseFloat(draftAmount) <= 0 || !draftYear || parseInt(draftYear) < 1 || parseInt(draftYear) > amort}
                  className="btn-primary px-3 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setAddingPayment(false);
                    setDraftAmount('');
                  }}
                  className="btn-outline px-3 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingPayment(true)}
              className="text-sm text-accent hover:text-accent/80 font-medium"
            >
              + Add payment
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {hasExtraPayments && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-secondary rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Original interest</p>
            <p className="text-base font-semibold text-foreground tabular-nums">
              {formatCurrency(simulation.baseTotalInterest)}
            </p>
          </div>
          <div className="bg-secondary rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">New interest</p>
            <p className="text-base font-semibold text-foreground tabular-nums">
              {formatCurrency(simulation.acceleratedTotalInterest)}
            </p>
          </div>
          <div className="bg-success/10 rounded-lg p-3">
            <p className="text-xs text-success mb-1">Interest saved</p>
            <p className="text-base font-semibold text-success tabular-nums">
              {formatCurrency(simulation.interestSaved)}
            </p>
          </div>
          <div className="bg-info/10 rounded-lg p-3">
            <p className="text-xs text-info mb-1">Time saved</p>
            <p className="text-base font-semibold text-info">{timeSavedLabel}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="year"
              tickFormatter={(v) => `Yr ${v}`}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              width={60}
            />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend />

            {periodicYears.map((year) => (
              <ReferenceLine
                key={year}
                x={year}
                stroke="hsl(var(--accent))"
                strokeDasharray="4 3"
                label={{ value: '↓', position: 'insideTop', fontSize: 11, fill: 'hsl(var(--accent))' }}
              />
            ))}

            <Line
              type="monotone"
              dataKey="Original"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              dot={false}
            />
            {hasExtraPayments && (
              <Line
                type="monotone"
                dataKey="With extra payments"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {!hasExtraPayments && (
        <p className="text-center text-sm text-muted-foreground mt-3">
          Configure extra payments above to see how they affect your payoff timeline.
        </p>
      )}
    </div>
  );
}
