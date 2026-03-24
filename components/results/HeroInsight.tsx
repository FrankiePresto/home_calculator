'use client';

import { useStore } from '@/lib/store';
import { formatCurrency, formatYears } from '@/lib/utils/formatters';
import { RentIcon, HomeIcon } from '@/components/shared';

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
        return `Buying temporarily pulls ahead after ${formatYears(breakeven.timeBreakeven.exact, false)}, but renting regains the lead around ${formatYears(breakeven.secondCrossover.exact, false)}. Over ${timeframe} years, renting results in ${formatCurrency(difference)} more net worth.`;
      }
      if (breakeven?.timeBreakeven) {
        return `If you plan to stay less than ${formatYears(breakeven.timeBreakeven.exact, false)}, renting leads to a higher net worth. Beyond that, buying ${buyScenario.name} becomes the stronger option.`;
      }
      return `Renting leads to a higher net worth than buying ${buyScenario.name} over the entire ${timeframe}-year period. Consider a less expensive property or higher down payment.`;
    } else {
      if (breakeven?.timeBreakeven && breakeven.timeBreakeven.exact > 0) {
        return `After ${formatYears(breakeven.timeBreakeven.exact, false)}, buying ${buyScenario.name} leads to a higher net worth than renting. You'll be ${formatCurrency(difference)} ahead after ${timeframe} years.`;
      }
      return `Buying ${buyScenario.name} leads to a higher net worth than renting from day one. You'll be ${formatCurrency(difference)} ahead after ${timeframe} years.`;
    }
  };

  return (
    <div className={`rounded-xl border ${bgClass} p-6 md:p-8`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left side - Winner announcement */}
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {timeframe}-Year Outlook
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
              <h2 className={`text-2xl md:text-3xl font-bold ${textClass}`}>
                {winner === 'rent'
                  ? <>Renting leads to a higher net worth vs buying {buyScenario.name}</>
                  : <>Buying {buyScenario.name} leads to a higher net worth vs renting</>}
              </h2>
              <p className="text-muted-foreground mt-1">
                by <span className="font-semibold text-foreground">{formatCurrency(difference)}</span> over {timeframe} years
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
