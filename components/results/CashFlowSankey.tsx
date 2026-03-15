'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils/formatters';
import { categorizeAnnualCashFlow, AnnualCashFlow } from '@/lib/engine/cashflow';

type ScenarioType = 'rent' | 'buy';

interface FlowItem {
  label: string;
  value: number;
  color: string;
  type: 'sunk' | 'wealth';
}

export function CashFlowSankey() {
  const results = useStore((state) => state.results);
  const financialProfile = useStore((state) => state.financialProfile);
  const timeframe = useStore((state) => state.settings.timeframeYears);
  const [selectedYear, setSelectedYear] = useState(1);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('buy');

  const cashFlowData = useMemo(() => {
    if (!results.rentProjection || !results.buyProjection) return null;

    const year = Math.min(selectedYear, timeframe);
    const snapshot = selectedScenario === 'rent'
      ? results.rentProjection.snapshots[year]
      : results.buyProjection.snapshots[year];

    if (!snapshot) return null;

    return categorizeAnnualCashFlow(snapshot, selectedScenario === 'rent');
  }, [results, selectedYear, selectedScenario, timeframe]);

  if (!cashFlowData) return null;

  // Build flow items
  const sunkItems: FlowItem[] = [];
  const wealthItems: FlowItem[] = [];

  if (selectedScenario === 'rent') {
    if (cashFlowData.sunkCosts.rent > 0) {
      sunkItems.push({ label: 'Rent', value: cashFlowData.sunkCosts.rent, color: '#3b82f6', type: 'sunk' });
    }
    if (cashFlowData.sunkCosts.homeInsurance > 0) {
      sunkItems.push({ label: 'Insurance', value: cashFlowData.sunkCosts.homeInsurance, color: '#eab308', type: 'sunk' });
    }
  } else {
    if (cashFlowData.sunkCosts.mortgageInterest > 0) {
      sunkItems.push({ label: 'Mortgage Interest', value: cashFlowData.sunkCosts.mortgageInterest, color: '#ef4444', type: 'sunk' });
    }
    if (cashFlowData.sunkCosts.propertyTax > 0) {
      sunkItems.push({ label: 'Property Tax', value: cashFlowData.sunkCosts.propertyTax, color: '#f97316', type: 'sunk' });
    }
    if (cashFlowData.sunkCosts.homeInsurance > 0) {
      sunkItems.push({ label: 'Home Insurance', value: cashFlowData.sunkCosts.homeInsurance, color: '#eab308', type: 'sunk' });
    }
    if (cashFlowData.sunkCosts.maintenance > 0) {
      sunkItems.push({ label: 'Maintenance', value: cashFlowData.sunkCosts.maintenance, color: '#84cc16', type: 'sunk' });
    }
    if (cashFlowData.sunkCosts.strataFees > 0) {
      sunkItems.push({ label: 'Strata/HOA', value: cashFlowData.sunkCosts.strataFees, color: '#22c55e', type: 'sunk' });
    }
    if (cashFlowData.wealthBuilding.mortgagePrincipal > 0) {
      wealthItems.push({ label: 'Mortgage Principal', value: cashFlowData.wealthBuilding.mortgagePrincipal, color: '#10b981', type: 'wealth' });
    }
  }

  // Common items
  if (cashFlowData.sunkCosts.utilities > 0) {
    sunkItems.push({ label: 'Utilities', value: cashFlowData.sunkCosts.utilities, color: '#06b6d4', type: 'sunk' });
  }
  if (cashFlowData.sunkCosts.otherExpenses > 0) {
    sunkItems.push({ label: 'Living Expenses', value: cashFlowData.sunkCosts.otherExpenses, color: '#8b5cf6', type: 'sunk' });
  }
  if (cashFlowData.sunkCosts.lifeEventExpenses > 0) {
    sunkItems.push({ label: 'Life Events', value: cashFlowData.sunkCosts.lifeEventExpenses, color: '#ec4899', type: 'sunk' });
  }
  if (cashFlowData.wealthBuilding.investments > 0) {
    wealthItems.push({ label: 'Investments', value: cashFlowData.wealthBuilding.investments, color: '#2563eb', type: 'wealth' });
  }

  const maxValue = Math.max(
    ...sunkItems.map(i => i.value),
    ...wealthItems.map(i => i.value),
    1
  );

  const totalIncome = cashFlowData.grossIncome;
  const sunkPercent = (cashFlowData.totalSunk / totalIncome) * 100;
  const wealthPercent = (cashFlowData.totalWealth / totalIncome) * 100;
  const unaccounted = totalIncome - cashFlowData.totalSunk - cashFlowData.totalWealth;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Cash Flow Breakdown
        </h3>
        <div className="flex items-center gap-4">
          {/* Scenario toggle */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setSelectedScenario('rent')}
              className={`px-3 py-1.5 text-sm font-medium rounded-l-md border ${
                selectedScenario === 'rent'
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Rent
            </button>
            <button
              onClick={() => setSelectedScenario('buy')}
              className={`px-3 py-1.5 text-sm font-medium rounded-r-md border-t border-r border-b ${
                selectedScenario === 'buy'
                  ? 'bg-green-50 text-green-700 border-green-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Buy
            </button>
          </div>

          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-md border-gray-300 text-sm"
          >
            {Array.from({ length: timeframe }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Year {i + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Income header */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Annual {financialProfile.includeTaxes ? 'Net' : 'Gross'} Income</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Year {selectedYear}</p>
            <p className="text-lg font-semibold text-gray-700">
              {selectedScenario === 'rent' ? 'Renting' : 'Buying'}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Cash Flow Summary */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-blue-700 mb-2">Monthly Cash Flow</p>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-blue-600">{financialProfile.includeTaxes ? 'Net ' : ''}Income</p>
            <p className="font-semibold text-blue-900">{formatCurrency(totalIncome / 12)}/mo</p>
          </div>
          <div>
            <p className="text-red-600">Sunk Costs</p>
            <p className="font-semibold text-red-700">-{formatCurrency(cashFlowData.totalSunk / 12)}/mo</p>
          </div>
          <div>
            <p className="text-green-600">Wealth Building</p>
            <p className="font-semibold text-green-700">+{formatCurrency(cashFlowData.totalWealth / 12)}/mo</p>
          </div>
          <div>
            <p className="text-gray-600">Remaining</p>
            <p className="font-semibold text-gray-700">{formatCurrency((totalIncome - cashFlowData.totalSunk - cashFlowData.totalWealth) / 12)}/mo</p>
          </div>
        </div>
      </div>

      {/* Mortgage Payment Breakdown - Buy scenario only */}
      {selectedScenario === 'buy' && cashFlowData.sunkCosts.mortgageInterest + cashFlowData.wealthBuilding.mortgagePrincipal > 0 && (() => {
        const monthlyInterest = cashFlowData.sunkCosts.mortgageInterest / 12;
        const monthlyPrincipal = cashFlowData.wealthBuilding.mortgagePrincipal / 12;
        const monthlyPayment = monthlyInterest + monthlyPrincipal;
        const interestPercent = (monthlyInterest / monthlyPayment) * 100;
        const principalPercent = (monthlyPrincipal / monthlyPayment) * 100;

        return (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Monthly Mortgage Payment</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(monthlyPayment)}</p>
            </div>
            <div className="h-6 flex rounded overflow-hidden">
              <div
                className="bg-red-400 flex items-center justify-center text-xs font-medium text-white transition-all duration-300"
                style={{ width: `${interestPercent}%` }}
                title={`Interest: ${formatCurrency(monthlyInterest)}`}
              >
                {interestPercent > 20 && `${interestPercent.toFixed(0)}%`}
              </div>
              <div
                className="bg-green-500 flex items-center justify-center text-xs font-medium text-white transition-all duration-300"
                style={{ width: `${principalPercent}%` }}
                title={`Principal: ${formatCurrency(monthlyPrincipal)}`}
              >
                {principalPercent > 20 && `${principalPercent.toFixed(0)}%`}
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-red-600">
                Interest: {formatCurrency(monthlyInterest)} ({interestPercent.toFixed(0)}%)
              </span>
              <span className="text-green-600">
                Principal: {formatCurrency(monthlyPrincipal)} ({principalPercent.toFixed(0)}%)
              </span>
            </div>
          </div>
        );
      })()}

      {/* Flow visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sunk Costs */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <h4 className="font-semibold text-gray-700">Sunk Costs</h4>
            <span className="text-sm text-gray-500">
              ({sunkPercent.toFixed(0)}% of income)
            </span>
          </div>
          <div className="space-y-2">
            {sunkItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-600 truncate">{item.label}</div>
                <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-300"
                    style={{
                      width: `${(item.value / maxValue) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <div className="w-24 text-sm font-medium text-right">
                  {formatCurrency(item.value)}
                </div>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-gray-200 flex items-center gap-3">
              <div className="w-32 text-sm font-semibold text-gray-700">Total Sunk</div>
              <div className="flex-1"></div>
              <div className="w-24 text-sm font-bold text-red-600 text-right">
                {formatCurrency(cashFlowData.totalSunk)}
              </div>
            </div>
          </div>
        </div>

        {/* Wealth Building */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <h4 className="font-semibold text-gray-700">Wealth Building</h4>
            <span className="text-sm text-gray-500">
              ({wealthPercent.toFixed(0)}% of income)
            </span>
          </div>
          <div className="space-y-2">
            {wealthItems.length > 0 ? (
              wealthItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-32 text-sm text-gray-600 truncate">{item.label}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-300"
                      style={{
                        width: `${(item.value / maxValue) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                  <div className="w-24 text-sm font-medium text-right">
                    {formatCurrency(item.value)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No wealth building this year</p>
            )}
            <div className="pt-2 mt-2 border-t border-gray-200 flex items-center gap-3">
              <div className="w-32 text-sm font-semibold text-gray-700">Total Wealth</div>
              <div className="flex-1"></div>
              <div className="w-24 text-sm font-bold text-green-600 text-right">
                {formatCurrency(cashFlowData.totalWealth)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">Income Allocation</p>
        <div className="h-8 flex rounded-lg overflow-hidden">
          <div
            className="bg-red-400 flex items-center justify-center text-xs font-medium text-white"
            style={{ width: `${sunkPercent}%` }}
            title={`Sunk Costs: ${sunkPercent.toFixed(1)}%`}
          >
            {sunkPercent > 15 && `${sunkPercent.toFixed(0)}%`}
          </div>
          <div
            className="bg-green-500 flex items-center justify-center text-xs font-medium text-white"
            style={{ width: `${wealthPercent}%` }}
            title={`Wealth Building: ${wealthPercent.toFixed(1)}%`}
          >
            {wealthPercent > 15 && `${wealthPercent.toFixed(0)}%`}
          </div>
          {unaccounted > 0 && (
            <div
              className="bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600"
              style={{ width: `${(unaccounted / totalIncome) * 100}%` }}
              title={financialProfile.includeTaxes ? "Remaining Funds" : "Unallocated/Tax"}
            >
              {(unaccounted / totalIncome) * 100 > 15 && (financialProfile.includeTaxes ? 'Remaining' : 'Other')}
            </div>
          )}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Sunk: {formatCurrency(cashFlowData.totalSunk)}</span>
          <span>Wealth: {formatCurrency(cashFlowData.totalWealth)}</span>
          {unaccounted > 0 && <span>{financialProfile.includeTaxes ? 'Remaining' : 'Other'}: {formatCurrency(unaccounted)}</span>}
        </div>
      </div>
    </div>
  );
}
