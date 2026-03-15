'use client';

import { useMemo, useState } from 'react';
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          The Math Behind the Numbers
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      {/* Summary Explanation */}
      <div className={`p-4 rounded-lg mb-6 ${winner === 'rent' ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'}`}>
        <p className={`text-sm ${winner === 'rent' ? 'text-blue-800' : 'text-green-800'}`}>
          <strong>Why {winnerLabel} wins by {formatCurrency(Math.abs(breakdown.finalDifference))} after {timeframe} years:</strong>
        </p>
        <ul className={`mt-2 text-sm space-y-1 ${winner === 'rent' ? 'text-blue-700' : 'text-green-700'}`}>
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

      {/* Renter's Investment Advantage - only show when renting wins */}
      {winner === 'rent' && breakdown.savingsDiff > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <p className="text-sm text-blue-800">
            <strong>Investment Advantage:</strong> When renting, you invest{' '}
            {formatCurrency(breakdown.savingsDiff)} more per month into your portfolio. Over {timeframe} years,
            this grows to {formatCurrency(breakdown.yearlyData[timeframe].rentPortfolio)}.
          </p>
        </div>
      )}

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Rent Scenario */}
        <div className="border border-blue-200 rounded-lg overflow-hidden">
          <div className="bg-blue-100 px-4 py-2">
            <h4 className="font-semibold text-blue-800">Rent Scenario</h4>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Starting Portfolio:</span>
              <span className="font-medium">{formatCurrency(breakdown.rentStartingPortfolio)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monthly Housing Cost:</span>
              <span className="font-medium">{formatCurrency(breakdown.rentMonthlyHousing)}</span>
            </div>
            {breakdown.rentMonthlyLifeEvents > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Life Event Costs:</span>
                <span className="font-medium text-red-600">-{formatCurrency(breakdown.rentMonthlyLifeEvents)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monthly Investment:</span>
              <span className="font-medium text-blue-600">+{formatCurrency(breakdown.rentMonthlySavings)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Investment Return:</span>
              <span className="font-medium">{financialProfile.expectedInvestmentReturn}% annually</span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between">
              <span className="font-medium text-gray-700">Net Worth at Year {timeframe}:</span>
              <span className="font-bold text-blue-600">{formatCurrency(breakdown.rentFinalNetWorth)}</span>
            </div>
          </div>
        </div>

        {/* Buy Scenario */}
        <div className="border border-green-200 rounded-lg overflow-hidden">
          <div className="bg-green-100 px-4 py-2">
            <h4 className="font-semibold text-green-800">Buy Scenario ({buyScenario.name})</h4>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Down Payment:</span>
              <span className="font-medium text-red-600">-{formatCurrency(breakdown.downPayment)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Closing Costs:</span>
              <span className="font-medium text-red-600">-{formatCurrency(breakdown.closingCosts)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Starting Portfolio:</span>
              <span className="font-medium">{formatCurrency(breakdown.buyStartingPortfolio)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monthly Housing Cost:</span>
              <span className="font-medium">{formatCurrency(breakdown.buyMonthlyHousing)}</span>
            </div>
            {breakdown.buyMonthlyLifeEvents > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Life Event Costs:</span>
                <span className="font-medium text-red-600">-{formatCurrency(breakdown.buyMonthlyLifeEvents)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monthly Investment:</span>
              <span className="font-medium text-green-600">+{formatCurrency(breakdown.buyMonthlySavings)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Home Appreciation:</span>
              <span className="font-medium">{buyScenario.annualAppreciation}% annually</span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between">
              <span className="font-medium text-gray-700">Net Worth at Year {timeframe}:</span>
              <span className="font-bold text-green-600">{formatCurrency(breakdown.buyFinalNetWorth)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Year-by-Year Progression */}
      {isExpanded && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">Year-by-Year Progression</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Year</th>
                  <th className="px-3 py-2 text-right font-medium text-blue-600">Rent Portfolio</th>
                  <th className="px-3 py-2 text-right font-medium text-blue-600">Rent Net Worth</th>
                  <th className="px-3 py-2 text-right font-medium text-green-600">Buy Portfolio</th>
                  <th className="px-3 py-2 text-right font-medium text-green-600">Home Value</th>
                  <th className="px-3 py-2 text-right font-medium text-green-600">Home Equity</th>
                  <th className="px-3 py-2 text-right font-medium text-green-600">Buy Net Worth</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {breakdown.yearlyData.map((row) => (
                  <tr key={row.year} className={row.year === 0 ? 'bg-yellow-50' : ''}>
                    <td className="px-3 py-2 font-medium">
                      {row.year === 0 ? 'Start' : `Year ${row.year}`}
                    </td>
                    <td className="px-3 py-2 text-right text-blue-700">
                      {formatCurrency(row.rentPortfolio)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-blue-700">
                      {formatCurrency(row.rentNetWorth)}
                    </td>
                    <td className="px-3 py-2 text-right text-green-700">
                      {formatCurrency(row.buyPortfolio)}
                    </td>
                    <td className="px-3 py-2 text-right text-green-700">
                      {formatCurrency(row.buyHomeValue)}
                    </td>
                    <td className="px-3 py-2 text-right text-green-700">
                      {formatCurrency(row.buyHomeEquity)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-green-700">
                      {formatCurrency(row.buyNetWorth)}
                    </td>
                    <td className={`px-3 py-2 text-right font-medium ${row.difference > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                      {row.difference > 0 ? '+' : ''}{formatCurrency(row.difference)}
                      <span className="text-xs text-gray-500 ml-1">
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
            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-700 mb-3">Monthly Housing Cost Breakdown (Buy)</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mortgage Payment:</span>
                  <span>{formatCurrency(breakdown.monthlyMortgage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Tax:</span>
                  <span>{formatCurrency(buyScenario.monthlyPropertyTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Home Insurance:</span>
                  <span>{formatCurrency(buyScenario.monthlyHomeInsurance)}</span>
                </div>
                {buyScenario.monthlyStrataFees > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Strata/HOA:</span>
                    <span>{formatCurrency(buyScenario.monthlyStrataFees)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Utilities:</span>
                  <span>{formatCurrency(buyScenario.monthlyUtilities)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Maintenance:</span>
                  <span>{formatCurrency(buyScenario.monthlyMaintenance)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300 font-medium">
                  <span>Total:</span>
                  <span>{formatCurrency(breakdown.buyMonthlyHousing)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-700 mb-3">Key Assumptions</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Investment Return:</span>
                  <span>{financialProfile.expectedInvestmentReturn}% annually</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Home Appreciation:</span>
                  <span>{buyScenario.annualAppreciation}% annually</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rent Increase:</span>
                  <span>{rentScenario.annualRentIncrease}% annually</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Income Growth:</span>
                  <span>{financialProfile.annualRaisePercent}% annually</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Savings Rate:</span>
                  <span>{financialProfile.savingsRate}% of discretionary</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mortgage Rate:</span>
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
