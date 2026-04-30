/**
 * Hook that returns inflation-adjusted results based on user settings.
 *
 * By default (showNominalDollars = false), all monetary values in projections
 * are deflated to "today's dollars" using the configured inflation rate.
 *
 * When showNominalDollars is true, raw nominal values are returned as-is.
 */

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { deflateProjection, deflateValue } from '@/lib/engine/inflation';

export function useAdjustedResults() {
  const results = useStore((state) => state.results);
  const showNominal = useStore((state) => state.settings.showNominalDollars);
  const inflationRate = useStore((state) => state.financialProfile.inflationRate ?? 0);

  return useMemo(() => {
    if (showNominal || inflationRate === 0) return results;

    return {
      ...results,
      rentProjection: results.rentProjection
        ? deflateProjection(results.rentProjection, inflationRate)
        : null,
      buyProjection: results.buyProjection
        ? deflateProjection(results.buyProjection, inflationRate)
        : null,
      buyProjection2: results.buyProjection2
        ? deflateProjection(results.buyProjection2, inflationRate)
        : null,
      // Breakeven years don't change with uniform deflation.
      // rentBreakeven is a starting rent (today's value) — no deflation needed.
      breakeven: results.breakeven,
      breakeven2: results.breakeven2,
      // Sensitivity deltas: deflate by the horizon year's factor for consistency
      sensitivity: results.sensitivity,
    };
  }, [results, showNominal, inflationRate]);
}

/**
 * Hook that returns a deflation helper for ad-hoc value adjustments.
 * Useful when components need to deflate individual values outside of projections.
 */
export function useDeflator() {
  const showNominal = useStore((state) => state.settings.showNominalDollars);
  const inflationRate = useStore((state) => state.financialProfile.inflationRate ?? 0);

  return {
    deflate: (nominal: number, year: number) => {
      if (showNominal || inflationRate === 0) return nominal;
      return deflateValue(nominal, year, inflationRate);
    },
    inflationRate,
    isRealDollars: !showNominal && inflationRate > 0,
  };
}
