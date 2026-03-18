'use client';

import { useStore } from '@/lib/store';
import { formatCurrency, formatYears } from '@/lib/utils/formatters';

export function HeroInsight() {
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

  const bgClass = winner === 'rent' ? 'bg-info/5 border-info/20' : 'bg-success/5 border-success/20';
  const textClass = winner === 'rent' ? 'text-info' : 'text-success';

  // Generate the bottom line message
  const getBottomLine = () => {
    if (winner === 'rent') {
      if (breakeven?.timeBreakeven && breakeven.secondCrossover) {
        return `Buying temporarily overtakes renting after ${formatYears(breakeven.timeBreakeven.exact, false)}, but renting catches back up around ${formatYears(breakeven.secondCrossover.exact, false)}. Over ${timeframe} years, renting wins by ${formatCurrency(difference)}.`;
      }
      if (breakeven?.timeBreakeven) {
        return `If you plan to stay less than ${formatYears(breakeven.timeBreakeven.exact, false)}, renting is better. After that, buying ${buyScenario.name} wins.`;
      }
      return `Renting beats buying ${buyScenario.name} over the entire ${timeframe}-year period. Consider a less expensive property or higher down payment.`;
    } else {
      if (breakeven?.timeBreakeven && breakeven.timeBreakeven.exact > 0) {
        return `After ${formatYears(breakeven.timeBreakeven.exact, false)}, buying ${buyScenario.name} becomes better than renting. You'll be ${formatCurrency(difference)} ahead after ${timeframe} years.`;
      }
      return `Buying ${buyScenario.name} is better than renting from day one. You'll be ${formatCurrency(difference)} ahead after ${timeframe} years.`;
    }
  };

  return (
    <div className={`rounded-xl border ${bgClass} p-6 md:p-8`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left side - Winner announcement */}
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Winner at {timeframe} Years
          </p>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${winner === 'rent' ? 'bg-info/10' : 'bg-success/10'}`}>
              {winner === 'rent' ? (
                <RentIcon className={`w-8 h-8 ${textClass}`} />
              ) : (
                <HomeIcon className={`w-8 h-8 ${textClass}`} />
              )}
            </div>
            <div>
              <h2 className={`text-4xl font-bold ${textClass}`}>
                {winner === 'rent' ? 'Renting' : 'Buying'}
              </h2>
              <p className="text-muted-foreground mt-1">
                by <span className="font-semibold text-foreground">{formatCurrency(difference)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Key metrics */}
        <div className="flex gap-6 md:gap-8">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Breakeven</p>
            <p className="text-2xl font-bold text-foreground">
              {breakeven?.timeBreakeven
                ? formatYears(breakeven.timeBreakeven.exact, true)
                : 'Never'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Equiv. Rent</p>
            <p className="text-2xl font-bold text-foreground">
              {breakeven?.rentBreakeven
                ? formatCurrency(breakeven.rentBreakeven)
                : 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Day 1 Cost</p>
            <p className="text-2xl font-bold text-destructive">
              {formatCurrency(
                rentProjection.snapshots[0].netWorth - buyProjection.snapshots[0].netWorth
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <div className={`mt-6 pt-6 border-t ${winner === 'rent' ? 'border-info/20' : 'border-success/20'}`}>
        <p className="text-sm text-foreground leading-relaxed">
          <span className="font-semibold">Bottom Line:</span> {getBottomLine()}
        </p>
      </div>
    </div>
  );
}

function RentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}
