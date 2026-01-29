'use client';

import { useStore } from '@/lib/store';
import { SelectInput } from '@/components/shared';

export function AnalysisSettings() {
  const timeframe = useStore((state) => state.settings.timeframeYears);
  const setTimeframe = useStore((state) => state.setTimeframe);
  const calculate = useStore((state) => state.calculate);
  const isCalculating = useStore((state) => state.isCalculating);
  const resultsStale = useStore((state) => state.results.lastCalculated === null);

  const timeframeOptions = [
    { value: 5, label: '5 years' },
    { value: 10, label: '10 years' },
    { value: 15, label: '15 years' },
    { value: 20, label: '20 years' },
    { value: 25, label: '25 years' },
    { value: 30, label: '30 years' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Settings</h2>
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-40">
          <SelectInput
            id="timeframe"
            label="Time Horizon"
            value={timeframe}
            onChange={(value) => setTimeframe(value as number)}
            options={timeframeOptions}
          />
        </div>

        <button
          onClick={calculate}
          disabled={isCalculating}
          className={`px-6 py-2 rounded-md font-medium text-white transition-colors
            ${isCalculating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
        >
          {isCalculating ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calculating...
            </span>
          ) : (
            'Calculate'
          )}
        </button>

        {resultsStale && !isCalculating && (
          <span className="text-sm text-amber-600">
            Results need recalculation
          </span>
        )}
      </div>
    </div>
  );
}
