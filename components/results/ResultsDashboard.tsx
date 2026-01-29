'use client';

import { useStore } from '@/lib/store';
import { InsightCards } from './InsightCards';
import { NetWorthChart } from './NetWorthChart';
import { SunkCostComparison } from './SunkCostComparison';
import { CashFlowSankey } from './CashFlowSankey';
import { SensitivityChart } from './SensitivityChart';
import { BreakevenDisplay } from './BreakevenDisplay';
import { MathBreakdown } from './MathBreakdown';

export function ResultsDashboard() {
  const results = useStore((state) => state.results);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const calculate = useStore((state) => state.calculate);

  if (!results.lastCalculated) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <svg
          className="mx-auto h-16 w-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-4 text-xl font-semibold text-gray-900">No Results Yet</h3>
        <p className="mt-2 text-gray-500 max-w-md mx-auto">
          Enter your financial details, rent scenario, and at least one buy scenario,
          then click Calculate to see a comprehensive analysis.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => setActiveTab('inputs')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Go to Inputs
          </button>
          <button
            onClick={calculate}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Calculate Now
          </button>
        </div>
      </div>
    );
  }

  if (!results.rentProjection || !results.buyProjection) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">Error: Missing projection data. Please try calculating again.</p>
        <button
          onClick={calculate}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
        >
          Recalculate
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <InsightCards />

      {/* Math Breakdown - Shows the numbers behind the results */}
      <MathBreakdown />

      {/* Net Worth Chart */}
      <NetWorthChart />

      {/* Breakeven Analysis */}
      <BreakevenDisplay />

      {/* Cash Flow and Sunk Costs - Side by side on larger screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CashFlowSankey />
        <SunkCostComparison />
      </div>

      {/* Sensitivity Analysis */}
      <SensitivityChart />

      {/* Calculation timestamp */}
      <div className="text-center text-sm text-gray-500">
        Last calculated: {new Date(results.lastCalculated).toLocaleString()}
      </div>
    </div>
  );
}
