'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatYears } from '@/lib/utils/formatters';

export function BreakevenDisplay() {
  const results = useStore((state) => state.results);
  const timeframe = useStore((state) => state.settings.timeframeYears);
  const rentScenario = useStore((state) => state.rentScenario);
  const buyScenario = useStore((state) => state.buyScenario);

  const analysis = useMemo(() => {
    if (!results.rentProjection || !results.buyProjection || !results.breakeven) {
      return null;
    }

    const { breakeven } = results;
    const rentFinal = results.rentProjection.snapshots[timeframe].netWorth;
    const buyFinal = results.buyProjection.snapshots[timeframe].netWorth;

    // Calculate year-by-year advantage
    const yearlyAdvantage = results.rentProjection.snapshots.map((rentSnap, idx) => {
      const buySnap = results.buyProjection!.snapshots[idx];
      return {
        year: idx,
        rentAdvantage: rentSnap.netWorth - buySnap.netWorth,
      };
    });

    // Find when advantage flips
    let flipYear: number | null = null;
    for (let i = 1; i < yearlyAdvantage.length; i++) {
      if (yearlyAdvantage[i - 1].rentAdvantage > 0 && yearlyAdvantage[i].rentAdvantage <= 0) {
        flipYear = i;
        break;
      }
    }

    return {
      timeBreakeven: breakeven.timeBreakeven,
      rentBreakeven: breakeven.rentBreakeven,
      rentFinal,
      buyFinal,
      winner: rentFinal > buyFinal ? 'rent' : 'buy',
      flipYear,
      yearlyAdvantage,
    };
  }, [results, timeframe]);

  if (!analysis) return null;

  // Create a visual timeline
  const timelineYears = Array.from({ length: timeframe + 1 }, (_, i) => i);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Breakeven Analysis
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Breakeven */}
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-800 mb-2">Time Breakeven</h4>
            {analysis.timeBreakeven ? (
              <>
                <p className="text-3xl font-bold text-amber-900">
                  {formatYears(analysis.timeBreakeven.exact, true)}
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  After this point, buying becomes more advantageous than renting.
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-amber-900">Never</p>
                <p className="text-sm text-amber-700 mt-1">
                  Renting remains better throughout the {timeframe}-year analysis period.
                </p>
              </>
            )}
          </div>

          {/* Decision guidance */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">What This Means</h4>
            {analysis.timeBreakeven ? (
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">→</span>
                  <span>
                    <strong>Stay &lt; {Math.ceil(analysis.timeBreakeven.exact)} years:</strong> Rent is better
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">→</span>
                  <span>
                    <strong>Stay &gt; {Math.ceil(analysis.timeBreakeven.exact)} years:</strong> Buy is better
                  </span>
                </li>
              </ul>
            ) : (
              <p className="text-sm text-gray-600">
                Consider a less expensive property, higher down payment, or better mortgage rate
                to make buying competitive with renting.
              </p>
            )}
          </div>
        </div>

        {/* Rent Breakeven */}
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">Equivalent Rent</h4>
            {analysis.rentBreakeven ? (
              <>
                <p className="text-3xl font-bold text-purple-900">
                  {formatCurrency(analysis.rentBreakeven)}/mo
                </p>
                <p className="text-sm text-purple-700 mt-1">
                  At this rent level, renting and buying would be equivalent at {timeframe} years.
                </p>
              </>
            ) : (
              <p className="text-purple-900">Could not calculate equivalent rent</p>
            )}
          </div>

          {/* Rent comparison */}
          {analysis.rentBreakeven && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Your Situation</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Your current rent:</span>
                  <span className="font-medium">{formatCurrency(rentScenario.monthlyRent)}/mo</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Breakeven rent:</span>
                  <span className="font-medium">{formatCurrency(analysis.rentBreakeven)}/mo</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  {rentScenario.monthlyRent < analysis.rentBreakeven ? (
                    <p className="text-sm text-blue-600">
                      Your rent is <strong>{formatCurrency(analysis.rentBreakeven - rentScenario.monthlyRent)}</strong> below
                      breakeven. Renting is financially advantageous.
                    </p>
                  ) : (
                    <p className="text-sm text-green-600">
                      Your rent is <strong>{formatCurrency(rentScenario.monthlyRent - analysis.rentBreakeven)}</strong> above
                      breakeven. Buying makes financial sense.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="mt-6">
        <h4 className="font-medium text-gray-700 mb-3">Advantage Timeline</h4>
        <div className="relative">
          {/* Timeline track */}
          <div className="h-12 flex rounded-lg overflow-hidden border border-gray-200">
            {analysis.yearlyAdvantage.slice(1).map((ya, idx) => {
              const isRentAdvantage = ya.rentAdvantage > 0;
              const isBreakevenYear = analysis.timeBreakeven &&
                Math.floor(analysis.timeBreakeven.exact) === idx + 1;

              return (
                <div
                  key={idx}
                  className={`flex-1 flex items-center justify-center text-xs font-medium
                    ${isRentAdvantage ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                    ${isBreakevenYear ? 'ring-2 ring-amber-400 ring-inset' : ''}
                    border-r border-gray-200 last:border-r-0`}
                  title={`Year ${idx + 1}: ${isRentAdvantage ? 'Rent' : 'Buy'} ahead by ${formatCurrency(Math.abs(ya.rentAdvantage))}`}
                >
                  {(idx + 1) % Math.ceil(timeframe / 10) === 0 || idx === 0 ? idx + 1 : ''}
                </div>
              );
            })}
          </div>

          {/* Labels */}
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>Year 1</span>
            <span>Year {timeframe}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span className="text-gray-600">Renting wins</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-gray-600">Buying wins</span>
          </div>
          {analysis.timeBreakeven && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-amber-400 rounded"></div>
              <span className="text-gray-600">Breakeven</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
