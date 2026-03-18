'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils/formatters';
import { categorizeAnnualCashFlow } from '@/lib/engine/cashflow';

type ScenarioType = 'rent' | 'buy';

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

  const totalIncome = cashFlowData.grossIncome;
  const sunkPercent = (cashFlowData.totalSunk / totalIncome) * 100;
  const wealthPercent = (cashFlowData.totalWealth / totalIncome) * 100;

  // Build categorized items
  const sunkItems = [];
  const wealthItems = [];

  if (selectedScenario === 'rent') {
    if (cashFlowData.sunkCosts.rent > 0) sunkItems.push({ label: 'Rent', value: cashFlowData.sunkCosts.rent });
    if (cashFlowData.sunkCosts.homeInsurance > 0) sunkItems.push({ label: 'Insurance', value: cashFlowData.sunkCosts.homeInsurance });
  } else {
    if (cashFlowData.sunkCosts.mortgageInterest > 0) sunkItems.push({ label: 'Mortgage Interest', value: cashFlowData.sunkCosts.mortgageInterest });
    if (cashFlowData.sunkCosts.propertyTax > 0) sunkItems.push({ label: 'Property Tax', value: cashFlowData.sunkCosts.propertyTax });
    if (cashFlowData.sunkCosts.homeInsurance > 0) sunkItems.push({ label: 'Insurance', value: cashFlowData.sunkCosts.homeInsurance });
    if (cashFlowData.sunkCosts.maintenance > 0) sunkItems.push({ label: 'Maintenance', value: cashFlowData.sunkCosts.maintenance });
    if (cashFlowData.sunkCosts.strataFees > 0) sunkItems.push({ label: 'Strata/HOA', value: cashFlowData.sunkCosts.strataFees });
    if (cashFlowData.wealthBuilding.mortgagePrincipal > 0) wealthItems.push({ label: 'Mortgage Principal', value: cashFlowData.wealthBuilding.mortgagePrincipal });
  }

  if (cashFlowData.sunkCosts.utilities > 0) sunkItems.push({ label: 'Utilities', value: cashFlowData.sunkCosts.utilities });
  if (cashFlowData.sunkCosts.otherExpenses > 0) sunkItems.push({ label: 'Living Expenses', value: cashFlowData.sunkCosts.otherExpenses });
  if (cashFlowData.wealthBuilding.investments > 0) wealthItems.push({ label: 'Investments', value: cashFlowData.wealthBuilding.investments });

  return (
    <div className="card p-6">
      {/* Header with controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="section-header">Cash Flow Breakdown</h3>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-border text-sm">
            <button
              onClick={() => setSelectedScenario('rent')}
              className={`px-3 py-1.5 font-medium transition-colors ${
                selectedScenario === 'rent' ? 'bg-accent text-accent-foreground' : 'bg-background hover:bg-secondary'
              }`}
            >
              Rent
            </button>
            <button
              onClick={() => setSelectedScenario('buy')}
              className={`px-3 py-1.5 font-medium transition-colors ${
                selectedScenario === 'buy' ? 'bg-accent text-accent-foreground' : 'bg-background hover:bg-secondary'
              }`}
            >
              Buy
            </button>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          >
            {Array.from({ length: timeframe }, (_, i) => (
              <option key={i + 1} value={i + 1}>Year {i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-secondary rounded-lg text-center">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{financialProfile.includeTaxes ? 'Net' : 'Gross'} Income</p>
          <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalIncome)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Sunk Costs</p>
          <p className="text-lg font-semibold text-destructive tabular-nums">{formatCurrency(cashFlowData.totalSunk)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Wealth Building</p>
          <p className="text-lg font-semibold text-success tabular-nums">{formatCurrency(cashFlowData.totalWealth)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Efficiency</p>
          <p className="text-lg font-semibold tabular-nums">{wealthPercent.toFixed(0)}%</p>
        </div>
      </div>

      {/* Allocation bar */}
      <div className="mb-6">
        <div className="h-3 flex rounded-full overflow-hidden">
          <div className="bg-destructive" style={{ width: `${sunkPercent}%` }} title={`Sunk: ${sunkPercent.toFixed(0)}%`} />
          <div className="bg-success" style={{ width: `${wealthPercent}%` }} title={`Wealth: ${wealthPercent.toFixed(0)}%`} />
          <div className="bg-muted flex-1" />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Sunk: {sunkPercent.toFixed(0)}%</span>
          <span>Wealth: {wealthPercent.toFixed(0)}%</span>
        </div>
      </div>

      {/* Two-column breakdown */}
      <div className="grid grid-cols-2 gap-6">
        {/* Sunk Costs */}
        <div>
          <h4 className="text-sm font-medium text-destructive mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-destructive"></span>
            Sunk Costs
          </h4>
          <div className="space-y-2">
            {sunkItems.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium tabular-nums">{formatCurrency(item.value)}</span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-border flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span className="text-destructive tabular-nums">{formatCurrency(cashFlowData.totalSunk)}</span>
            </div>
          </div>
        </div>

        {/* Wealth Building */}
        <div>
          <h4 className="text-sm font-medium text-success mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            Wealth Building
          </h4>
          <div className="space-y-2">
            {wealthItems.length > 0 ? wealthItems.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium tabular-nums">{formatCurrency(item.value)}</span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground italic">No wealth building this year</p>
            )}
            <div className="pt-2 mt-2 border-t border-border flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span className="text-success tabular-nums">{formatCurrency(cashFlowData.totalWealth)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
