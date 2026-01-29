'use client';

import { useStore } from '@/lib/store';
import { formatCurrency, formatYears } from '@/lib/utils/formatters';
import { getMilestoneComparisons } from '@/lib/engine';

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
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Winner at {timeframe} Years
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
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Breakeven Point
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
              ? 'until buying wins'
              : `within ${timeframe} years`}
          </p>
        </div>

        {/* Equivalent Rent Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Equivalent Rent
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
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Day 1 Cost
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
            breakeven?.timeBreakeven ? (
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
            <>
              Buying the {buyScenario.name} is better than renting from day one.
              You'll be {formatCurrency(difference)} ahead after {timeframe} years.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
