'use client';

import { useMemo, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@/components/shared';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils/formatters';
import { calculateMonthlyMortgagePayment } from '@/lib/engine/mortgage';

export function MathBreakdown() {
  const results = useStore((state) => state.results);
  const financialProfile = useStore((state) => state.financialProfile);
  const rentScenario = useStore((state) => state.rentScenario);
  const buyScenario = useStore((state) => state.buyScenario);
  const timeframe = useStore((state) => state.settings.timeframeYears);

  const [isExpanded, setIsExpanded] = useState(false);

  const breakdown = useMemo(() => {
    if (!results.rentProjection || !results.buyProjection) return null;

    const { rentProjection, buyProjection } = results;

    // Calculate key values for the buy scenario
    const downPayment = buyScenario.purchasePrice * (buyScenario.downPaymentPercent / 100);
    const closingCosts = buyScenario.purchasePrice * ((buyScenario.closingCostPercent ?? 3) / 100);
    const loanAmount = buyScenario.purchasePrice - downPayment;
    const mortgageInsurance = loanAmount * (buyScenario.mortgageInsurancePercent / 100);
    const totalLoan = loanAmount + mortgageInsurance;
    const monthlyMortgage = calculateMonthlyMortgagePayment(
      totalLoan,
      buyScenario.interestRate,
      buyScenario.amortizationYears
    );

    // Monthly costs
    const rentMonthlyHousing = rentScenario.monthlyRent + rentScenario.rentersInsurance;
    const buyMonthlyHousing = monthlyMortgage +
      buyScenario.monthlyPropertyTax +
      buyScenario.monthlyHomeInsurance +
      buyScenario.monthlyStrataFees +
      buyScenario.monthlyUtilities +
      buyScenario.monthlyMaintenance;

    // Starting positions
    const rentStartingPortfolio = financialProfile.currentInvestmentPortfolio;
    const buyStartingPortfolio = Math.max(0, financialProfile.currentInvestmentPortfolio - downPayment - closingCosts);

    // Monthly values from Year 1 snapshots (includes life events correctly)
    const year1Rent = rentProjection.snapshots[1];
    const year1Buy = buyProjection.snapshots[1];

    const rentMonthlySavings = year1Rent.monthlySavings;
    const buyMonthlySavings = year1Buy.monthlySavings;
    const rentMonthlyLifeEvents = year1Rent.monthlyLifeEventAdjustment;
    const buyMonthlyLifeEvents = year1Buy.monthlyLifeEventAdjustment;

    // Year-by-year data
    const yearlyData = rentProjection.snapshots.map((rentSnap, idx) => {
      const buySnap = buyProjection.snapshots[idx];
      return {
        year: idx,
        rentPortfolio: rentSnap.investmentPortfolio,
        rentNetWorth: rentSnap.netWorth,
        buyPortfolio: buySnap.investmentPortfolio,
        buyHomeValue: buySnap.homeValue,
        buyHomeEquity: buySnap.homeEquity,
        buyMortgageBalance: buySnap.mortgageBalance,
        buyNetWorth: buySnap.netWorth,
        difference: rentSnap.netWorth - buySnap.netWorth,
      };
    });

    return {
      // Initial values
      downPayment,
      closingCosts,
      totalUpfront: downPayment + closingCosts,
      loanAmount,
      mortgageInsurance,
      totalLoan,
      monthlyMortgage,

      // Monthly housing
      rentMonthlyHousing,
      buyMonthlyHousing,
      monthlyHousingDiff: buyMonthlyHousing - rentMonthlyHousing,

      // Starting portfolios
      rentStartingPortfolio,
      buyStartingPortfolio,
      portfolioDiff: rentStartingPortfolio - buyStartingPortfolio,

      // Monthly savings
      rentMonthlySavings,
      buyMonthlySavings,
      savingsDiff: rentMonthlySavings - buyMonthlySavings,

      // Life event adjustments
      rentMonthlyLifeEvents,
      buyMonthlyLifeEvents,

      // Yearly progression
      yearlyData,

      // Final values
      rentFinalNetWorth: rentProjection.snapshots[timeframe].netWorth,
      buyFinalNetWorth: buyProjection.snapshots[timeframe].netWorth,
      finalDifference: rentProjection.snapshots[timeframe].netWorth - buyProjection.snapshots[timeframe].netWorth,
    };
  }, [results, financialProfile, rentScenario, buyScenario, timeframe]);

  if (!breakdown) return null;

  const winner = breakdown.finalDifference > 0 ? 'rent' : 'buy';
  const winnerLabel = winner === 'rent' ? 'Renting' : 'Buying';

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="section-header">
          The Math Behind the Numbers
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-sm text-accent hover:text-amber-700 font-medium transition-colors"
        >
          {isExpanded ? (
            <>Show Less <ChevronUpIcon className="w-4 h-4" /></>
          ) : (
            <>Show More <ChevronDownIcon className="w-4 h-4" /></>
          )}
        </button>
      </div>

      {/* Summary Explanation */}
      <div className={`p-5 rounded-xl mb-6 ${winner === 'rent' ? 'bg-info/10 border border-info/20' : 'bg-success/10 border border-success/20'}`}>
        <p className={`text-sm font-medium ${winner === 'rent' ? 'text-info' : 'text-success'}`}>
          Why {winnerLabel.toLowerCase()} leads to {formatCurrency(Math.abs(breakdown.finalDifference))} more net worth after {timeframe} years:
        </p>
        <ul className={`mt-3 text-sm space-y-1.5 ${winner === 'rent' ? 'text-info/90' : 'text-success/90'}`}>
          {winner === 'rent' ? (
            <>
              <li>• You keep {formatCurrency(breakdown.totalUpfront)} invested from Day 1 (no down payment/closing costs)</li>
              <li>• Monthly housing costs are {breakdown.monthlyHousingDiff > 0 ? formatCurrency(breakdown.monthlyHousingDiff) + ' lower' : formatCurrency(Math.abs(breakdown.monthlyHousingDiff)) + ' higher'}</li>
              <li>• Monthly investment contributions are {breakdown.savingsDiff > 0 ? formatCurrency(breakdown.savingsDiff) + ' higher' : formatCurrency(Math.abs(breakdown.savingsDiff)) + ' lower'}</li>
              <li>• Investment returns ({financialProfile.expectedInvestmentReturn}%) compound on a larger base</li>
              {breakdown.rentMonthlyLifeEvents > 0 && (
                <li>• Life events reduce monthly savings by {formatCurrency(breakdown.rentMonthlyLifeEvents)}</li>
              )}
            </>
          ) : (
            <>
              <li>• Home appreciation ({buyScenario.annualAppreciation}%) builds equity faster than rent savings grow</li>
              <li>• Mortgage principal payments build equity (forced savings)</li>
              <li>• Home value grows to {formatCurrency(breakdown.yearlyData[timeframe].buyHomeValue)} by year {timeframe}</li>
              <li>• Home equity ({formatCurrency(breakdown.yearlyData[timeframe].buyHomeEquity)}) + portfolio ({formatCurrency(breakdown.yearlyData[timeframe].buyPortfolio)}) exceeds renter's portfolio ({formatCurrency(breakdown.yearlyData[timeframe].rentPortfolio)})</li>
              {breakdown.buyMonthlyLifeEvents > 0 && (
                <li>• Life events reduce monthly savings by {formatCurrency(breakdown.buyMonthlyLifeEvents)}</li>
              )}
            </>
          )}
        </ul>
      </div>

      {/* Renter's Investment Advantage - only show when renting leads */}
      {winner === 'rent' && breakdown.savingsDiff > 0 && (
        <div className="p-4 bg-info/10 border border-info/20 rounded-xl mb-6">
          <p className="text-sm text-info">
            <strong>Investment Advantage:</strong> When renting, you invest{' '}
            {formatCurrency(breakdown.savingsDiff)} more per month into your portfolio. Over {timeframe} years,
            the renter's portfolio grows to {formatCurrency(breakdown.yearlyData[timeframe].rentPortfolio)} vs
            the buyer's {formatCurrency(breakdown.yearlyData[timeframe].buyPortfolio)} — a difference
            of {formatCurrency(breakdown.yearlyData[timeframe].rentPortfolio - breakdown.yearlyData[timeframe].buyPortfolio)} in
            investment assets alone.
          </p>
        </div>
      )}

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Rent Scenario */}
        <div className="border border-info/30 rounded-xl overflow-hidden">
          <div className="bg-info/10 px-4 py-3">
            <h4 className="font-semibold text-info">Rent Scenario</h4>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Starting Portfolio:</span>
              <span className="font-medium tabular-nums">{formatCurrency(breakdown.rentStartingPortfolio)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Housing Cost:</span>
              <span className="font-medium tabular-nums">{formatCurrency(breakdown.rentMonthlyHousing)}</span>
            </div>
            {breakdown.rentMonthlyLifeEvents > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Life Event Costs:</span>
                <span className="font-medium text-destructive tabular-nums">-{formatCurrency(breakdown.rentMonthlyLifeEvents)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Investment:</span>
              <span className="font-medium text-info tabular-nums">+{formatCurrency(breakdown.rentMonthlySavings)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Investment Return:</span>
              <span className="font-medium">{financialProfile.expectedInvestmentReturn}% annually</span>
            </div>
            <div className="pt-3 border-t border-border flex justify-between">
              <span className="font-medium text-foreground">Net Worth at Year {timeframe}:</span>
              <span className="font-bold text-info tabular-nums">{formatCurrency(breakdown.rentFinalNetWorth)}</span>
            </div>
          </div>
        </div>

        {/* Buy Scenario */}
        <div className="border border-success/30 rounded-xl overflow-hidden">
          <div className="bg-success/10 px-4 py-3">
            <h4 className="font-semibold text-success">Buy Scenario ({buyScenario.name})</h4>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Down Payment:</span>
              <span className="font-medium text-destructive tabular-nums">-{formatCurrency(breakdown.downPayment)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Closing Costs:</span>
              <span className="font-medium text-destructive tabular-nums">-{formatCurrency(breakdown.closingCosts)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Starting Portfolio:</span>
              <span className="font-medium tabular-nums">{formatCurrency(breakdown.buyStartingPortfolio)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Housing Cost:</span>
              <span className="font-medium tabular-nums">{formatCurrency(breakdown.buyMonthlyHousing)}</span>
            </div>
            {breakdown.buyMonthlyLifeEvents > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Life Event Costs:</span>
                <span className="font-medium text-destructive tabular-nums">-{formatCurrency(breakdown.buyMonthlyLifeEvents)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Investment:</span>
              <span className="font-medium text-success tabular-nums">+{formatCurrency(breakdown.buyMonthlySavings)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Home Appreciation:</span>
              <span className="font-medium">{buyScenario.annualAppreciation}% annually</span>
            </div>
            <div className="pt-3 border-t border-border flex justify-between">
              <span className="font-medium text-foreground">Net Worth at Year {timeframe}:</span>
              <span className="font-bold text-success tabular-nums">{formatCurrency(breakdown.buyFinalNetWorth)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Year-by-Year Progression */}
      {isExpanded && (
        <div className="animate-fade-in">
          <h4 className="font-semibold text-foreground mb-4">Year-by-Year Progression</h4>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-secondary">
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Year</th>
                  <th className="px-3 py-3 text-right font-medium text-info">Rent Portfolio</th>
                  <th className="px-3 py-3 text-right font-medium text-info">Rent Net Worth</th>
                  <th className="px-3 py-3 text-right font-medium text-success">Buy Portfolio</th>
                  <th className="px-3 py-3 text-right font-medium text-success">Home Value</th>
                  <th className="px-3 py-3 text-right font-medium text-success">Home Equity</th>
                  <th className="px-3 py-3 text-right font-medium text-success">Buy Net Worth</th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {breakdown.yearlyData.map((row) => (
                  <tr key={row.year} className={row.year === 0 ? 'bg-accent/10' : 'hover:bg-secondary/50'}>
                    <td className="px-3 py-2.5 font-medium">
                      {row.year === 0 ? 'Start' : `Year ${row.year}`}
                    </td>
                    <td className="px-3 py-2.5 text-right text-info tabular-nums">
                      {formatCurrency(row.rentPortfolio)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-info tabular-nums">
                      {formatCurrency(row.rentNetWorth)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-success tabular-nums">
                      {formatCurrency(row.buyPortfolio)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-success tabular-nums">
                      {formatCurrency(row.buyHomeValue)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-success tabular-nums">
                      {formatCurrency(row.buyHomeEquity)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-success tabular-nums">
                      {formatCurrency(row.buyNetWorth)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-medium tabular-nums ${row.difference > 0 ? 'text-info' : 'text-success'}`}>
                      {row.difference > 0 ? '+' : ''}{formatCurrency(row.difference)}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({row.difference > 0 ? 'Rent' : 'Buy'})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cost Breakdown */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-secondary rounded-xl">
              <h5 className="font-medium text-foreground mb-4">Monthly Housing Cost Breakdown (Buy)</h5>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mortgage Payment:</span>
                  <span className="tabular-nums">{formatCurrency(breakdown.monthlyMortgage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property Tax:</span>
                  <span className="tabular-nums">{formatCurrency(buyScenario.monthlyPropertyTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Home Insurance:</span>
                  <span className="tabular-nums">{formatCurrency(buyScenario.monthlyHomeInsurance)}</span>
                </div>
                {buyScenario.monthlyStrataFees > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Strata/HOA:</span>
                    <span className="tabular-nums">{formatCurrency(buyScenario.monthlyStrataFees)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Utilities:</span>
                  <span className="tabular-nums">{formatCurrency(buyScenario.monthlyUtilities)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maintenance:</span>
                  <span className="tabular-nums">{formatCurrency(buyScenario.monthlyMaintenance)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border font-medium">
                  <span>Total:</span>
                  <span className="tabular-nums">{formatCurrency(breakdown.buyMonthlyHousing)}</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-secondary rounded-xl">
              <h5 className="font-medium text-foreground mb-4">Key Assumptions</h5>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Investment Return:</span>
                  <span>{financialProfile.expectedInvestmentReturn}% annually</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Home Appreciation:</span>
                  <span>{buyScenario.annualAppreciation}% annually</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rent Increase:</span>
                  <span>{rentScenario.annualRentIncrease}% annually</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Income Growth:</span>
                  <span>{financialProfile.annualRaisePercent}% annually</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Savings Rate:</span>
                  <span>{financialProfile.savingsRate}% of discretionary</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mortgage Rate:</span>
                  <span>{buyScenario.interestRate}% ({buyScenario.amortizationYears} years)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
