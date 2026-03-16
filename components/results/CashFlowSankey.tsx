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
      sunkItems.push({ label: 'Rent', value: cashFlowData.sunkCosts.rent, color: 'rgb(2 132 199)', type: 'sunk' });
    }
    if (cashFlowData.sunkCosts.homeInsurance > 0) {
      sunkItems.push({ label: 'Insurance', value: cashFlowData.sunkCosts.homeInsurance, color: 'rgb(234 179 8)', type: 'sunk' });
    }
  } else {
    if (cashFlowData.sunkCosts.mortgageInterest > 0) {
      sunkItems.push({ label: 'Mortgage Interest', value: cashFlowData.sunkCosts.mortgageInterest, color: 'rgb(225 29 72)', type: 'sunk' });
    }
    if (cashFlowData.sunkCosts.propertyTax > 0) {
      sunkItems.push({ label: 'Property Tax', value: cashFlowData.sunkCosts.propertyTax, color: 'rgb(249 115 22)', type: 'sunk' });
    }
    if (cashFlowData.sunkCosts.homeInsurance > 0) {
      sunkItems.push({ label: 'Home Insurance', value: cashFlowData.sunkCosts.homeInsurance, color: 'rgb(234 179 8)', type: 'sunk' });
    }
    if (cashFlowData.sunkCosts.maintenance > 0) {
      sunkItems.push({ label: 'Maintenance', value: cashFlowData.sunkCosts.maintenance, color: 'rgb(132 204 22)', type: 'sunk' });
    }
    if (cashFlowData.sunkCosts.strataFees > 0) {
      sunkItems.push({ label: 'Strata/HOA', value: cashFlowData.sunkCosts.strataFees, color: 'rgb(34 197 94)', type: 'sunk' });
    }
    if (cashFlowData.wealthBuilding.mortgagePrincipal > 0) {
      wealthItems.push({ label: 'Mortgage Principal', value: cashFlowData.wealthBuilding.mortgagePrincipal, color: 'rgb(5 150 105)', type: 'wealth' });
    }
  }

  // Common items
  if (cashFlowData.sunkCosts.utilities > 0) {
    sunkItems.push({ label: 'Utilities', value: cashFlowData.sunkCosts.utilities, color: 'rgb(6 182 212)', type: 'sunk' });
  }
  if (cashFlowData.sunkCosts.otherExpenses > 0) {
    sunkItems.push({ label: 'Living Expenses', value: cashFlowData.sunkCosts.otherExpenses, color: 'rgb(139 92 246)', type: 'sunk' });
  }
  if (cashFlowData.sunkCosts.lifeEventExpenses > 0) {
    sunkItems.push({ label: 'Life Events', value: cashFlowData.sunkCosts.lifeEventExpenses, color: 'rgb(236 72 153)', type: 'sunk' });
  }
  if (cashFlowData.wealthBuilding.investments > 0) {
    wealthItems.push({ label: 'Investments', value: cashFlowData.wealthBuilding.investments, color: 'rgb(2 132 199)', type: 'wealth' });
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
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="section-header">
          Cash Flow Breakdown
        </h3>
        <div className="flex items-center gap-4">
          {/* Scenario toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              onClick={() => setSelectedScenario('rent')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                selectedScenario === 'rent'
                  ? 'bg-info text-info-foreground'
                  : 'bg-background text-foreground hover:bg-secondary'
              }`}
            >
              Rent
            </button>
            <button
              onClick={() => setSelectedScenario('buy')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                selectedScenario === 'buy'
                  ? 'bg-success text-success-foreground'
                  : 'bg-background text-foreground hover:bg-secondary'
              }`}
            >
              Buy
            </button>
          </div>

          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:ring-offset-2"
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
      <div className="mb-6 p-5 bg-secondary rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Annual {financialProfile.includeTaxes ? 'Net' : 'Gross'} Income</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Year {selectedYear}</p>
            <p className={`text-lg font-semibold ${selectedScenario === 'rent' ? 'text-info' : 'text-success'}`}>
              {selectedScenario === 'rent' ? 'Renting' : 'Buying'}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Cash Flow Summary */}
      <div className="mb-6 p-4 bg-info/10 border border-info/20 rounded-xl">
        <p className="text-sm font-medium text-info mb-3">Monthly Cash Flow</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-info/80">{financialProfile.includeTaxes ? 'Net ' : ''}Income</p>
            <p className="font-semibold text-info tabular-nums">{formatCurrency(totalIncome / 12)}/mo</p>
          </div>
          <div>
            <p className="text-destructive/80">Sunk Costs</p>
            <p className="font-semibold text-destructive tabular-nums">-{formatCurrency(cashFlowData.totalSunk / 12)}/mo</p>
          </div>
          <div>
            <p className="text-success/80">Wealth Building</p>
            <p className="font-semibold text-success tabular-nums">+{formatCurrency(cashFlowData.totalWealth / 12)}/mo</p>
          </div>
          <div>
            <p className="text-muted-foreground">Remaining</p>
            <p className="font-semibold text-foreground tabular-nums">{formatCurrency((totalIncome - cashFlowData.totalSunk - cashFlowData.totalWealth) / 12)}/mo</p>
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
          <div className="mb-6 p-4 bg-secondary rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-foreground">Monthly Mortgage Payment</p>
              <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(monthlyPayment)}</p>
            </div>
            <div className="h-6 flex rounded-lg overflow-hidden">
              <div
                className="bg-destructive/80 flex items-center justify-center text-xs font-medium text-destructive-foreground transition-all duration-300"
                style={{ width: `${interestPercent}%` }}
                title={`Interest: ${formatCurrency(monthlyInterest)}`}
              >
                {interestPercent > 20 && `${interestPercent.toFixed(0)}%`}
              </div>
              <div
                className="bg-success flex items-center justify-center text-xs font-medium text-success-foreground transition-all duration-300"
                style={{ width: `${principalPercent}%` }}
                title={`Principal: ${formatCurrency(monthlyPrincipal)}`}
              >
                {principalPercent > 20 && `${principalPercent.toFixed(0)}%`}
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-destructive">
                Interest: {formatCurrency(monthlyInterest)} ({interestPercent.toFixed(0)}%)
              </span>
              <span className="text-success">
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
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-destructive"></div>
            <h4 className="font-semibold text-foreground">Sunk Costs</h4>
            <span className="text-sm text-muted-foreground">
              ({sunkPercent.toFixed(0)}% of income)
            </span>
          </div>
          <div className="space-y-2">
            {sunkItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-32 text-sm text-muted-foreground truncate">{item.label}</div>
                <div className="flex-1 h-6 bg-secondary rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-300"
                    style={{
                      width: `${(item.value / maxValue) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <div className="w-24 text-sm font-medium text-right tabular-nums">
                  {formatCurrency(item.value)}
                </div>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-border flex items-center gap-3">
              <div className="w-32 text-sm font-semibold text-foreground">Total Sunk</div>
              <div className="flex-1"></div>
              <div className="w-24 text-sm font-bold text-destructive text-right tabular-nums">
                {formatCurrency(cashFlowData.totalSunk)}
              </div>
            </div>
          </div>
        </div>

        {/* Wealth Building */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <h4 className="font-semibold text-foreground">Wealth Building</h4>
            <span className="text-sm text-muted-foreground">
              ({wealthPercent.toFixed(0)}% of income)
            </span>
          </div>
          <div className="space-y-2">
            {wealthItems.length > 0 ? (
              wealthItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-32 text-sm text-muted-foreground truncate">{item.label}</div>
                  <div className="flex-1 h-6 bg-secondary rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-300"
                      style={{
                        width: `${(item.value / maxValue) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                  <div className="w-24 text-sm font-medium text-right tabular-nums">
                    {formatCurrency(item.value)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">No wealth building this year</p>
            )}
            <div className="pt-3 mt-3 border-t border-border flex items-center gap-3">
              <div className="w-32 text-sm font-semibold text-foreground">Total Wealth</div>
              <div className="flex-1"></div>
              <div className="w-24 text-sm font-bold text-success text-right tabular-nums">
                {formatCurrency(cashFlowData.totalWealth)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="mt-6 p-5 bg-secondary rounded-xl">
        <p className="text-sm text-muted-foreground mb-3">Income Allocation</p>
        <div className="h-8 flex rounded-lg overflow-hidden">
          <div
            className="bg-destructive/80 flex items-center justify-center text-xs font-medium text-destructive-foreground"
            style={{ width: `${sunkPercent}%` }}
            title={`Sunk Costs: ${sunkPercent.toFixed(1)}%`}
          >
            {sunkPercent > 15 && `${sunkPercent.toFixed(0)}%`}
          </div>
          <div
            className="bg-success flex items-center justify-center text-xs font-medium text-success-foreground"
            style={{ width: `${wealthPercent}%` }}
            title={`Wealth Building: ${wealthPercent.toFixed(1)}%`}
          >
            {wealthPercent > 15 && `${wealthPercent.toFixed(0)}%`}
          </div>
          {unaccounted > 0 && (
            <div
              className="bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground"
              style={{ width: `${(unaccounted / totalIncome) * 100}%` }}
              title={financialProfile.includeTaxes ? "Remaining Funds" : "Unallocated/Tax"}
            >
              {(unaccounted / totalIncome) * 100 > 15 && (financialProfile.includeTaxes ? 'Remaining' : 'Other')}
            </div>
          )}
        </div>
        <div className="flex justify-between mt-3 text-xs text-muted-foreground">
          <span className="tabular-nums">Sunk: {formatCurrency(cashFlowData.totalSunk)}</span>
          <span className="tabular-nums">Wealth: {formatCurrency(cashFlowData.totalWealth)}</span>
          {unaccounted > 0 && <span className="tabular-nums">{financialProfile.includeTaxes ? 'Remaining' : 'Other'}: {formatCurrency(unaccounted)}</span>}
        </div>
      </div>
    </div>
  );
}
