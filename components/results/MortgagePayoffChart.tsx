'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { simulateMortgageWithExtraPayments, calculateTotalLoan } from '@/lib/engine/mortgage';
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

// ---------------------------------------------------------------------------
// Local types — this component manages its own extra-payment state so it
// works as an interactive exploration tool without touching the main store.
// ---------------------------------------------------------------------------

interface PeriodicPayment {
  id: string;
  year: number;
  amount: number;
}

/**
 * Aggregate all extra-payment rules into a flat per-year array that the
 * simulation engine understands.
 */
function buildLumpSumsPerYear(
  annualAmount: number,
  annualStartYear: number,
  annualEndYear: number | undefined,
  periodicPayments: PeriodicPayment[],
  amortizationYears: number
): Array<{ year: number; amount: number }> {
  const map = new Map<number, number>();

  if (annualAmount > 0) {
    const end = annualEndYear ?? amortizationYears;
    for (let y = annualStartYear; y <= end; y++) {
      map.set(y, (map.get(y) || 0) + annualAmount);
    }
  }

  for (const p of periodicPayments) {
    if (p.amount > 0 && p.year >= 1 && p.year <= amortizationYears) {
      map.set(p.year, (map.get(p.year) || 0) + p.amount);
    }
  }

  return Array.from(map.entries()).map(([year, amount]) => ({ year, amount }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MortgagePayoffChart() {
  const buyScenario = useStore((state) => state.buyScenario);
  const amort = buyScenario.amortizationYears;

  // --- Extra payment state ---
  const [extraMonthly, setExtraMonthly] = useState(0);
  const [annualAmount, setAnnualAmount] = useState(0);
  const [annualStartYear, setAnnualStartYear] = useState(1);
  const [annualEndYear, setAnnualEndYear] = useState<number | undefined>(undefined);
  const [periodicPayments, setPeriodicPayments] = useState<PeriodicPayment[]>([]);

  // --- Add-periodic-payment form state ---
  const [addingPayment, setAddingPayment] = useState(false);
  const [draftYear, setDraftYear] = useState(1);
  const [draftAmount, setDraftAmount] = useState('');

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

  const lumpSumsPerYear = useMemo(
    () =>
      buildLumpSumsPerYear(
        annualAmount,
        annualStartYear,
        annualEndYear,
        periodicPayments,
        amort
      ),
    [annualAmount, annualStartYear, annualEndYear, periodicPayments, amort]
  );

  const simulation = useMemo(
    () =>
      simulateMortgageWithExtraPayments(
        principal,
        buyScenario.interestRate,
        amort,
        extraMonthly,
        lumpSumsPerYear
      ),
    [principal, buyScenario.interestRate, amort, extraMonthly, lumpSumsPerYear]
  );

  const hasExtraPayments =
    extraMonthly > 0 || annualAmount > 0 || periodicPayments.length > 0;

  // Chart data: merge base + accelerated by index (both arrays are same length)
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

  // Unique years with periodic payments (for reference lines)
  const periodicYears = Array.from(new Set(periodicPayments.map((p) => p.year)));

  // --- Handlers ---
  const commitPeriodicPayment = () => {
    const amount = parseFloat(draftAmount.replace(/[^0-9.]/g, ''));
    if (!amount || amount <= 0) return;
    setPeriodicPayments((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2, 9), year: draftYear, amount },
    ]);
    setAddingPayment(false);
    setDraftAmount('');
    // Suggest the next year as a convenience for the next entry
    setDraftYear(Math.min(draftYear + 3, amort));
  };

  const removePeriodicPayment = (id: string) =>
    setPeriodicPayments((prev) => prev.filter((p) => p.id !== id));

  const formatYAxis = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
    return `$${v}`;
  };

  const inputClass =
    'block rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm';
  const currencyInputClass =
    'block w-full rounded-md border-0 py-2 pl-7 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Mortgage Acceleration</h2>
        <p className="text-sm text-gray-500 mt-1">
          Explore how extra payments reduce your total interest and shorten your payoff timeline.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Controls                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-6 mb-6">

        {/* Extra Monthly Payment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Extra Monthly Payment
          </label>
          <div className="relative w-44">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 sm:text-sm">
              $
            </span>
            <input
              type="number"
              min={0}
              step={50}
              value={extraMonthly || ''}
              onChange={(e) => setExtraMonthly(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0"
              className={currencyInputClass}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Added on top of your required payment every month
          </p>
        </div>

        {/* Annual Contribution */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Annual Contribution</h3>
          <p className="text-xs text-gray-400 mb-3">
            A predictable yearly amount — e.g. tax refund or annual bonus
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount / year</label>
              <div className="relative w-40">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 sm:text-sm">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={annualAmount || ''}
                  onChange={(e) => setAnnualAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                  className={currencyInputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">From year</label>
              <input
                type="number"
                min={1}
                max={amort}
                value={annualStartYear}
                onChange={(e) =>
                  setAnnualStartYear(
                    Math.max(1, Math.min(amort, parseInt(e.target.value) || 1))
                  )
                }
                className={`${inputClass} w-20`}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Through year{' '}
                <span className="text-gray-400">(blank = end of mortgage)</span>
              </label>
              <input
                type="number"
                min={annualStartYear}
                max={amort}
                value={annualEndYear ?? ''}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  setAnnualEndYear(
                    e.target.value === '' || isNaN(v)
                      ? undefined
                      : Math.min(amort, Math.max(annualStartYear, v))
                  );
                }}
                placeholder={`${amort}`}
                className={`${inputClass} w-24`}
              />
            </div>
          </div>
        </div>

        {/* Periodic Payments */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Periodic Payments</h3>
          <p className="text-xs text-gray-400 mb-3">
            Irregular extra payments at specific years — windfalls, proceeds, or anything
            that doesn't follow a fixed schedule
          </p>

          {/* Existing payments list */}
          {periodicPayments.length > 0 && (
            <div className="mb-3 divide-y divide-gray-100 border border-gray-100 rounded-md overflow-hidden">
              {periodicPayments
                .slice()
                .sort((a, b) => a.year - b.year)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2 bg-white text-sm"
                  >
                    <span className="text-gray-500 w-16 shrink-0">Year {p.year}</span>
                    <span className="font-medium text-gray-900 flex-1">
                      {formatCurrency(p.amount)}
                    </span>
                    <button
                      onClick={() => removePeriodicPayment(p.id)}
                      className="text-xs text-red-400 hover:text-red-600 ml-3"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
          )}

          {/* Inline add form */}
          {addingPayment ? (
            <div className="flex flex-wrap gap-3 items-end bg-gray-50 border border-gray-200 rounded-md p-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Year</label>
                <input
                  type="number"
                  min={1}
                  max={amort}
                  value={draftYear}
                  onChange={(e) =>
                    setDraftYear(
                      Math.max(1, Math.min(amort, parseInt(e.target.value) || 1))
                    )
                  }
                  className={`${inputClass} w-20`}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Amount</label>
                <div className="relative w-40">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 sm:text-sm">
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
                    className={currencyInputClass}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={commitPeriodicPayment}
                  disabled={!draftAmount || parseFloat(draftAmount) <= 0}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setAddingPayment(false);
                    setDraftAmount('');
                  }}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingPayment(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add payment
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Summary cards (only when extra payments actually change something)  */}
      {/* ------------------------------------------------------------------ */}
      {hasExtraPayments && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Original interest</p>
            <p className="text-base font-semibold text-gray-900">
              {formatCurrency(simulation.baseTotalInterest)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">New interest</p>
            <p className="text-base font-semibold text-gray-900">
              {formatCurrency(simulation.acceleratedTotalInterest)}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-green-700 mb-1">Interest saved</p>
            <p className="text-base font-semibold text-green-800">
              {formatCurrency(simulation.interestSaved)}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-700 mb-1">Time saved</p>
            <p className="text-base font-semibold text-blue-800">{timeSavedLabel}</p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Chart                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="year"
              tickFormatter={(v) => `Yr ${v}`}
              tick={{ fontSize: 11 }}
            />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} width={60} />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              labelFormatter={(label) => `Year ${label}`}
            />
            <Legend />

            {/* Mark years where periodic payments land */}
            {periodicYears.map((year) => (
              <ReferenceLine
                key={year}
                x={year}
                stroke="#c4b5fd"
                strokeDasharray="4 3"
                label={{ value: '↓', position: 'insideTop', fontSize: 11, fill: '#7c3aed' }}
              />
            ))}

            <Line
              type="monotone"
              dataKey="Original"
              stroke="#94a3b8"
              strokeWidth={2}
              dot={false}
            />
            {hasExtraPayments && (
              <Line
                type="monotone"
                dataKey="With extra payments"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {!hasExtraPayments && (
        <p className="text-center text-sm text-gray-400 mt-3">
          Configure extra payments above to see how they affect your payoff timeline.
        </p>
      )}
    </div>
  );
}
