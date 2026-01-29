'use client';

import { useStore } from '@/lib/store';
import {
  FinancialProfileForm,
  RentScenarioForm,
  PrimaryBuyScenarioForm,
  SecondaryBuyScenarioForm,
  LifeEventsTimeline,
  AnalysisSettings,
  SavedScenarios,
} from '@/components/inputs';
import { ResultsDashboard } from '@/components/results';

export default function Home() {
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const results = useStore((state) => state.results);
  const resetAll = useStore((state) => state.resetAll);

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Home Purchase Analyzer
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={resetAll}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Reset All
              </button>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('inputs')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'inputs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Inputs
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Results
              {results.lastCalculated && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Ready
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'inputs' ? (
          <div className="space-y-6">
            {/* Saved Scenarios */}
            <SavedScenarios />

            {/* Financial Profile */}
            <FinancialProfileForm />

            {/* Scenarios */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RentScenarioForm />
              <div className="space-y-6">
                <PrimaryBuyScenarioForm />
                <SecondaryBuyScenarioForm />
              </div>
            </div>

            {/* Life Events */}
            <LifeEventsTimeline />

            {/* Analysis Settings */}
            <AnalysisSettings />
          </div>
        ) : (
          <ResultsDashboard />
        )}
      </div>
    </main>
  );
}
