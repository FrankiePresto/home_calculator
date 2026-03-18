'use client';

import { useStore } from '@/lib/store';
import { formatCurrency, formatYears } from '@/lib/utils/formatters';
import { getMilestoneComparisons } from '@/lib/engine';
import { InfoTooltip } from '@/components/shared';

export function InsightCards() {
  const results = useStore((state) => state.results);
  const timeframe = useStore((state) => state.settings.timeframeYears);
  const buyScenario = useStore((state) => state.buyScenario);

  if (!results.rentProjection || !results.buyProjection) {
    return null;
  }

  const { rentProjection, buyProjection, breakeven } = results;

  const rentFinalNetWorth = rentProjection.snapshots[timeframe].netWorth;
  const buyFinalNetWorth = buyProjection.snapshots[timeframe].netWorth;
  const winner = rentFinalNetWorth > buyFinalNetWorth ? 'rent' : 'buy';
  const difference = Math.abs(rentFinalNetWorth - buyFinalNetWorth);

  // Get milestone comparisons
  const milestones = getMilestoneComparisons(
    rentProjection.snapshots,
    buyProjection.snapshots,
    [5, 10, 15, 20, 25, 30].filter((y) => y <= timeframe)
  );

  return (
    <div className="space-y-6">
      {/* Primary Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Winner Card */}
        <div className={`card p-6 border-l-4 ${winner === 'rent' ? 'border-l-info' : 'border-l-success'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center">
              Winner at {timeframe} Years
              <InfoTooltip content="The option that results in higher net worth at the end of your selected timeframe, considering all costs, investments, and appreciation." />
            </h3>
          </div>
          <p className={`text-2xl font-bold ${winner === 'rent' ? 'text-info' : 'text-success'}`}>
            {winner === 'rent' ? 'Renting' : 'Buying'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            by {formatCurrency(difference)}
          </p>
        </div>

        {/* Breakeven Card */}
        <div className="card p-6 border-l-4 border-l-accent">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center">
              Breakeven Point
              <InfoTooltip content="The number of years until buying becomes financially better than renting. Before this point, renting is more advantageous." />
            </h3>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {breakeven?.timeBreakeven
              ? formatYears(breakeven.timeBreakeven.exact, true)
              : 'Never'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {breakeven?.timeBreakeven
              ? breakeven.secondCrossover
                ? 'until buying temporarily leads'
                : 'until buying wins'
              : `within ${timeframe} years`}
          </p>
        </div>

        {/* Equivalent Rent Card */}
        <div className="card p-6 border-l-4 border-l-accent">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center">
              Equivalent Rent
              <InfoTooltip content="The monthly rent at which renting and buying would result in the same net worth after the analysis period. If your current rent is below this, renting is more favorable." />
            </h3>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {breakeven?.rentBreakeven
              ? `${formatCurrency(breakeven.rentBreakeven)}`
              : 'N/A'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            per month at {timeframe} years
          </p>
        </div>

        {/* Initial Opportunity Cost */}
        <div className="card p-6 border-l-4 border-l-destructive">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center">
              Day 1 Cost
              <InfoTooltip content="The immediate reduction in your net worth when purchasing a home, consisting of down payment, closing costs, and other upfront expenses that leave your investment portfolio." />
            </h3>
          </div>
          <p className="text-2xl font-bold text-destructive tabular-nums">
            {formatCurrency(
              rentProjection.snapshots[0].netWorth - buyProjection.snapshots[0].netWorth
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            closing costs impact
          </p>
        </div>
      </div>

      {/* Milestone Comparison */}
      {milestones.length > 1 && (
        <div className="card p-6">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Net Worth at Milestones
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {milestones.map((m) => (
              <div key={m.year} className="text-center p-3 bg-secondary rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Year {m.year}</p>
                <p className={`text-lg font-bold ${
                  m.winner === 'rent' ? 'text-info' :
                  m.winner === 'buy' ? 'text-success' : 'text-muted-foreground'
                }`}>
                  {m.winner === 'rent' ? 'Rent' : m.winner === 'buy' ? 'Buy' : 'Tie'}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  +{formatCurrency(m.difference)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Insight */}
      <div className={`rounded-xl p-5 ${
        winner === 'rent' ? 'bg-info/10 border border-info/20' : 'bg-success/10 border border-success/20'
      }`}>
        <p className={`text-sm leading-relaxed ${winner === 'rent' ? 'text-info' : 'text-success'}`}>
          <strong>Bottom Line:</strong>{' '}
          {winner === 'rent' ? (
            breakeven?.timeBreakeven && breakeven.secondCrossover ? (
              <>
                Buying temporarily overtakes renting after {formatYears(breakeven.timeBreakeven.exact, false)},
                but renting catches back up around {formatYears(breakeven.secondCrossover.exact, false)}.
                Over {timeframe} years, renting wins by {formatCurrency(difference)}.
              </>
            ) : breakeven?.timeBreakeven ? (
              <>
                If you plan to stay less than {formatYears(breakeven.timeBreakeven.exact, false)},
                renting is better. After that, buying the {buyScenario.name} wins.
              </>
            ) : (
              <>
                Renting beats buying the {buyScenario.name} over the entire {timeframe}-year period.
                Consider a less expensive property or higher down payment.
              </>
            )
          ) : (
            breakeven?.timeBreakeven && breakeven.timeBreakeven.exact > 0 ? (
              <>
                After {formatYears(breakeven.timeBreakeven.exact, false)}, buying the {buyScenario.name}
                becomes better than renting. You'll be {formatCurrency(difference)} ahead after {timeframe} years.
              </>
            ) : (
              <>
                Buying the {buyScenario.name} is better than renting from day one.
                You'll be {formatCurrency(difference)} ahead after {timeframe} years.
              </>
            )
          )}
        </p>
      </div>
    </div>
  );
}
