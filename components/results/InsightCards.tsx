'use client';

import { useStore } from '@/lib/store';
import { formatCurrency, formatYears } from '@/lib/utils/formatters';
import { getMilestoneComparisons } from '@/lib/engine';

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative inline-block ml-1 group cursor-help">
      <svg
        className="w-4 h-4 text-gray-400 hover:text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg">
        {text}
        <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></span>
      </span>
    </span>
  );
}

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
    <div className="space-y-4">
      {/* Primary Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Winner Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-gray-300"
          style={{ borderLeftColor: winner === 'rent' ? '#2563eb' : '#16a34a' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide flex items-center">
              Winner at {timeframe} Years
              <InfoTooltip text="The option that results in higher net worth at the end of your selected timeframe, considering all costs, investments, and appreciation." />
            </h3>
            <span className={`text-2xl ${winner === 'rent' ? 'text-blue-600' : 'text-green-600'}`}>
              {winner === 'rent' ? '🏠' : '🔑'}
            </span>
          </div>
          <p className={`mt-2 text-3xl font-bold ${winner === 'rent' ? 'text-blue-600' : 'text-green-600'}`}>
            {winner === 'rent' ? 'Renting' : 'Buying'}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            by {formatCurrency(difference)}
          </p>
        </div>

        {/* Breakeven Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide flex items-center">
              Breakeven Point
              <InfoTooltip text="The number of years until buying becomes financially better than renting. Before this point, renting is more advantageous." />
            </h3>
            <span className="text-2xl">⏱️</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {breakeven?.timeBreakeven
              ? formatYears(breakeven.timeBreakeven.exact, true)
              : 'Never'}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {breakeven?.timeBreakeven
              ? breakeven.secondCrossover
                ? 'until buying temporarily leads'
                : 'until buying wins'
              : `within ${timeframe} years`}
          </p>
        </div>

        {/* Equivalent Rent Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide flex items-center">
              Equivalent Rent
              <InfoTooltip text="The monthly rent at which renting and buying would result in the same net worth after the analysis period. If your current rent is below this, renting is more favorable." />
            </h3>
            <span className="text-2xl">💰</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {breakeven?.rentBreakeven
              ? `${formatCurrency(breakeven.rentBreakeven)}`
              : 'N/A'}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            per month at {timeframe} years
          </p>
        </div>

        {/* Initial Opportunity Cost */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide flex items-center">
              Day 1 Cost
              <InfoTooltip text="The immediate reduction in your net worth when purchasing a home, consisting of down payment, closing costs, and other upfront expenses that leave your investment portfolio." />
            </h3>
            <span className="text-2xl">📉</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {formatCurrency(
              rentProjection.snapshots[0].netWorth - buyProjection.snapshots[0].netWorth
            )}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            closing costs impact
          </p>
        </div>
      </div>

      {/* Milestone Comparison */}
      {milestones.length > 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
            Net Worth at Milestones
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {milestones.map((m) => (
              <div key={m.year} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Year {m.year}</p>
                <p className={`text-lg font-bold ${
                  m.winner === 'rent' ? 'text-blue-600' :
                  m.winner === 'buy' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {m.winner === 'rent' ? 'Rent' : m.winner === 'buy' ? 'Buy' : 'Tie'}
                </p>
                <p className="text-xs text-gray-500">
                  +{formatCurrency(m.difference)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Insight */}
      <div className={`rounded-lg p-4 ${
        winner === 'rent' ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'
      }`}>
        <p className={`text-sm ${winner === 'rent' ? 'text-blue-800' : 'text-green-800'}`}>
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
