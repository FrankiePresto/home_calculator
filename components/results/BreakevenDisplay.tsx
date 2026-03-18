'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatYears } from '@/lib/utils/formatters';

export function BreakevenDisplay() {
  const results = useStore((state) => state.results);
  const timeframe = useStore((state) => state.settings.timeframeYears);
  const rentScenario = useStore((state) => state.rentScenario);

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

    return {
      timeBreakeven: breakeven.timeBreakeven,
      secondCrossover: breakeven.secondCrossover,
      rentBreakeven: breakeven.rentBreakeven,
      rentFinal,
      buyFinal,
      winner: rentFinal > buyFinal ? 'rent' : 'buy',
      yearlyAdvantage,
    };
  }, [results, timeframe]);

  if (!analysis) return null;

  return (
    <div className="card p-6">
      <h3 className="section-header mb-6">
        Breakeven Analysis
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Breakeven */}
        <div className="space-y-4">
          <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
            <h4 className="font-medium text-foreground mb-2">Time Breakeven</h4>
            {analysis.timeBreakeven ? (
              <>
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {formatYears(analysis.timeBreakeven.exact, true)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {analysis.secondCrossover
                    ? `Buying temporarily leads after this point, but renting catches back up around ${formatYears(analysis.secondCrossover.exact, true)}.`
                    : 'After this point, buying becomes more advantageous than renting.'}
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-foreground">Never</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Renting remains better throughout the {timeframe}-year analysis period.
                </p>
              </>
            )}
          </div>

          {/* Decision guidance */}
          <div className="p-4 bg-secondary rounded-xl">
            <h4 className="font-medium text-foreground mb-2">What This Means</h4>
            {analysis.timeBreakeven ? (
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-info mt-0.5">-</span>
                  <span>
                    <strong className="text-foreground">Stay {'<'} {Math.ceil(analysis.timeBreakeven.exact)} years:</strong> Rent is better
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-0.5">-</span>
                  <span>
                    <strong className="text-foreground">Stay {Math.ceil(analysis.timeBreakeven.exact)}–{analysis.secondCrossover ? Math.floor(analysis.secondCrossover.exact) : `${Math.ceil(analysis.timeBreakeven.exact)}+`} years:</strong> Buy is better
                  </span>
                </li>
                {analysis.secondCrossover && (
                  <li className="flex items-start gap-2">
                    <span className="text-info mt-0.5">-</span>
                    <span>
                      <strong className="text-foreground">Stay {'>'} {Math.ceil(analysis.secondCrossover.exact)} years:</strong> Rent is better again
                    </span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Consider a less expensive property, higher down payment, or better mortgage rate
                to make buying competitive with renting.
              </p>
            )}
          </div>
        </div>

        {/* Rent Breakeven */}
        <div className="space-y-4">
          <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
            <h4 className="font-medium text-foreground mb-2">Equivalent Rent</h4>
            {analysis.rentBreakeven ? (
              <>
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {formatCurrency(analysis.rentBreakeven)}/mo
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  At this rent level, renting and buying would be equivalent at {timeframe} years.
                </p>
              </>
            ) : (
              <p className="text-foreground">Could not calculate equivalent rent</p>
            )}
          </div>

          {/* Rent comparison */}
          {analysis.rentBreakeven && (
            <div className="p-4 bg-secondary rounded-xl">
              <h4 className="font-medium text-foreground mb-2">Your Situation</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your current rent:</span>
                  <span className="font-medium text-foreground tabular-nums">{formatCurrency(rentScenario.monthlyRent)}/mo</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Breakeven rent:</span>
                  <span className="font-medium text-foreground tabular-nums">{formatCurrency(analysis.rentBreakeven)}/mo</span>
                </div>
                <div className="pt-2 border-t border-border">
                  {rentScenario.monthlyRent < analysis.rentBreakeven ? (
                    <p className="text-sm text-info">
                      Your rent is <strong>{formatCurrency(analysis.rentBreakeven - rentScenario.monthlyRent)}</strong> below
                      breakeven. Renting is financially advantageous.
                    </p>
                  ) : (
                    <p className="text-sm text-success">
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
        <h4 className="font-medium text-foreground mb-3">Advantage Timeline</h4>
        <div className="relative">
          {/* Timeline track */}
          <div className="h-10 flex rounded-lg overflow-hidden border border-border">
            {analysis.yearlyAdvantage.slice(1).map((ya, idx) => {
              const isRentAdvantage = ya.rentAdvantage > 0;
              const isBreakevenYear = analysis.timeBreakeven &&
                Math.floor(analysis.timeBreakeven.exact) === idx + 1;

              return (
                <div
                  key={idx}
                  className={`flex-1 flex items-center justify-center text-xs font-medium transition-colors
                    ${isRentAdvantage ? 'bg-info/10 text-info' : 'bg-success/10 text-success'}
                    ${isBreakevenYear ? 'ring-2 ring-accent ring-inset' : ''}
                    border-r border-border last:border-r-0`}
                  title={`Year ${idx + 1}: ${isRentAdvantage ? 'Rent' : 'Buy'} ahead by ${formatCurrency(Math.abs(ya.rentAdvantage))}`}
                >
                  {(idx + 1) % Math.ceil(timeframe / 10) === 0 || idx === 0 ? idx + 1 : ''}
                </div>
              );
            })}
          </div>

          {/* Labels */}
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>Year 1</span>
            <span>Year {timeframe}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-info/10 border border-info/20 rounded"></div>
            <span className="text-muted-foreground">Renting wins</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-success/10 border border-success/20 rounded"></div>
            <span className="text-muted-foreground">Buying wins</span>
          </div>
          {analysis.timeBreakeven && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-accent rounded"></div>
              <span className="text-muted-foreground">Breakeven</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
