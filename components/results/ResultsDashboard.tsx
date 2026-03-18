'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useWizard } from '@/components/wizard';
import { ChartIcon } from '@/components/shared';
import { HeroInsight } from './HeroInsight';
import { FeasibilityWarnings } from './FeasibilityWarnings';
import { NetWorthChart } from './NetWorthChart';
import { SunkCostComparison } from './SunkCostComparison';
import { CashFlowSankey } from './CashFlowSankey';
import { SensitivityChart } from './SensitivityChart';
import { BreakevenDisplay } from './BreakevenDisplay';
import { MathBreakdown } from './MathBreakdown';
import { MortgagePayoffChart } from './MortgagePayoffChart';

type TabId = 'overview' | 'details' | 'sensitivity' | 'math';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'details', label: 'Cash Flow' },
  { id: 'sensitivity', label: 'What-If Analysis' },
  { id: 'math', label: 'Math Breakdown' },
];

export function ResultsDashboard() {
  const results = useStore((state) => state.results);
  const { setStep } = useWizard();
  const calculate = useStore((state) => state.calculate);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  if (!results.lastCalculated) {
    return (
      <div className="card p-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-xl bg-secondary flex items-center justify-center mb-6">
          <ChartIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No Results Yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Enter your financial details, rent scenario, and at least one buy scenario,
          then click Calculate to see a comprehensive analysis.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setStep('financial')}
            className="btn-outline"
          >
            Go to Inputs
          </button>
          <button
            onClick={calculate}
            className="btn-primary"
          >
            Calculate Now
          </button>
        </div>
      </div>
    );
  }

  if (!results.rentProjection || !results.buyProjection) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
        <p className="text-destructive">Error: Missing projection data. Please try calculating again.</p>
        <button
          onClick={calculate}
          className="mt-4 btn-primary bg-destructive hover:bg-destructive/90"
        >
          Recalculate
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Feasibility Warnings - Show at top if any issues */}
      <FeasibilityWarnings />

      {/* Hero Insight */}
      <HeroInsight />

      {/* Tabs - Prominent navigation for different analysis views */}
      <div className="card p-2">
        <nav className="flex gap-2" aria-label="Results tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <NetWorthChart />
            <BreakevenDisplay />
            <MortgagePayoffChart />
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            <CashFlowSankey />
            <SunkCostComparison />
          </div>
        )}

        {activeTab === 'sensitivity' && (
          <div className="space-y-6">
            <SensitivityChart />
          </div>
        )}

        {activeTab === 'math' && (
          <div className="space-y-6">
            <MathBreakdown />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Last calculated: {new Date(results.lastCalculated).toLocaleString()}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setStep('financial')}
            className="btn-outline text-sm"
          >
            Edit Inputs
          </button>
          <button
            onClick={calculate}
            className="btn-secondary text-sm"
          >
            Recalculate
          </button>
        </div>
      </div>
    </div>
  );
}
