'use client';

import { useStore } from '@/lib/store';
import { analyzeFeasibility, getFeasibilitySummary } from '@/lib/engine/feasibility';
import { FeasibilityWarning } from '@/lib/engine/types';

function WarningIcon({ severity }: { severity: 'warning' | 'critical' }) {
  if (severity === 'critical') {
    return (
      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function WarningItem({ warning }: { warning: FeasibilityWarning }) {
  const isCritical = warning.severity === 'critical';
  const scenarioLabel = warning.scenario === 'rent' ? 'Rent' : 'Buy';

  return (
    <div className="flex items-start gap-3">
      <WarningIcon severity={warning.severity} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isCritical ? 'text-red-800' : 'text-amber-800'}`}>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2 ${
            warning.scenario === 'rent' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
          }`}>
            {scenarioLabel}
          </span>
          {warning.message}
        </p>
      </div>
    </div>
  );
}

export function FeasibilityWarnings() {
  const results = useStore((state) => state.results);
  const profile = useStore((state) => state.financialProfile);

  if (!results.rentProjection || !results.buyProjection) {
    return null;
  }

  const warnings = analyzeFeasibility(
    results.rentProjection,
    results.buyProjection,
    profile
  );

  if (warnings.length === 0) {
    return null;
  }

  const summary = getFeasibilitySummary(warnings);
  const hasCritical = summary.criticalCount > 0;

  return (
    <div className={`rounded-lg p-4 ${
      hasCritical ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
    }`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {hasCritical ? (
            <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-6 w-6 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${hasCritical ? 'text-red-800' : 'text-amber-800'}`}>
            {hasCritical ? 'Financial Feasibility Concerns' : 'Financial Warnings'}
          </h3>
          <div className="mt-2 space-y-2">
            {warnings.map((warning, idx) => (
              <WarningItem key={`${warning.scenario}-${warning.type}-${warning.year}-${idx}`} warning={warning} />
            ))}
          </div>
          {hasCritical && (
            <p className="mt-3 text-sm text-red-700">
              Consider adjusting your scenarios to ensure financial viability.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
