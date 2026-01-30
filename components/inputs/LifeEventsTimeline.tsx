'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { LifeEvent, LifeEventType } from '@/lib/engine/types';
import { CurrencyInput, PercentInput, SelectInput } from '@/components/shared';
import { formatCurrency } from '@/lib/utils/formatters';

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Preset life events
const PRESETS: Partial<LifeEvent>[] = [
  { description: 'Wedding', type: 'one-time', amount: -30000 },
  { description: 'New Car', type: 'one-time', amount: -40000 },
  { description: 'Childcare', type: 'phase', monthlyAmount: -2000 },
  { description: 'Child Expenses', type: 'phase', monthlyAmount: -1500 },
  { description: 'Car Payment', type: 'ongoing', monthlyAmount: -500 },
  { description: 'Promotion', type: 'income-change', percentChange: 15, incomeChangeDuration: 'ongoing' },
  { description: 'Sabbatical', type: 'income-change', incomeChangeDuration: 'phase', incomeMultiplier: 0.5 },
  { description: 'Mat Leave (EI)', type: 'income-change', incomeChangeDuration: 'phase', incomeMultiplier: 0.55 },
  { description: 'Part-time Period', type: 'income-change', incomeChangeDuration: 'phase', incomeMultiplier: 0.6 },
];

interface LifeEventRowProps {
  event: LifeEvent;
  onUpdate: (updates: Partial<LifeEvent>) => void;
  onRemove: () => void;
  maxYear: number;
  isDualIncome: boolean;
}

function LifeEventRow({ event, onUpdate, onRemove, maxYear, isDualIncome }: LifeEventRowProps) {
  const yearOptions = Array.from({ length: maxYear }, (_, i) => ({
    value: i + 1,
    label: `Year ${i + 1}`,
  }));

  return (
    <div className="flex flex-wrap items-start gap-3 p-4 bg-gray-50 rounded-lg">
      {/* Description */}
      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
        <input
          type="text"
          value={event.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
          placeholder="Event description"
        />
      </div>

      {/* Type */}
      <div className="w-32">
        <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
        <select
          value={event.type}
          onChange={(e) => onUpdate({ type: e.target.value as LifeEventType })}
          className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
        >
          <option value="one-time">One-time</option>
          <option value="ongoing">Ongoing</option>
          <option value="phase">Phase</option>
          <option value="income-change">Income Change</option>
        </select>
      </div>

      {/* Type-specific fields */}
      {event.type === 'one-time' && (
        <>
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
            <select
              value={event.year || 1}
              onChange={(e) => onUpdate({ year: parseInt(e.target.value) })}
              className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
            >
              {yearOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
              <input
                type="number"
                value={Math.abs(event.amount || 0)}
                onChange={(e) => onUpdate({ amount: -Math.abs(parseFloat(e.target.value) || 0) })}
                className="block w-full rounded-md border-0 py-1.5 pl-5 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </>
      )}

      {event.type === 'ongoing' && (
        <>
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Year</label>
            <select
              value={event.startYear || 1}
              onChange={(e) => onUpdate({ startYear: parseInt(e.target.value) })}
              className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
            >
              {yearOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Cost</label>
            <div className="relative">
              <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
              <input
                type="number"
                value={Math.abs(event.monthlyAmount || 0)}
                onChange={(e) => onUpdate({ monthlyAmount: -Math.abs(parseFloat(e.target.value) || 0) })}
                className="block w-full rounded-md border-0 py-1.5 pl-5 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </>
      )}

      {event.type === 'phase' && (
        <>
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Year</label>
            <select
              value={event.startYear || 1}
              onChange={(e) => onUpdate({ startYear: parseInt(e.target.value) })}
              className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
            >
              {yearOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-500 mb-1">End Year</label>
            <select
              value={event.endYear || (event.startYear || 1) + 5}
              onChange={(e) => onUpdate({ endYear: parseInt(e.target.value) })}
              className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
            >
              {yearOptions
                .filter((opt) => opt.value > (event.startYear || 1))
                .map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Cost</label>
            <div className="relative">
              <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
              <input
                type="number"
                value={Math.abs(event.monthlyAmount || 0)}
                onChange={(e) => onUpdate({ monthlyAmount: -Math.abs(parseFloat(e.target.value) || 0) })}
                className="block w-full rounded-md border-0 py-1.5 pl-5 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </>
      )}

      {event.type === 'income-change' && (
        <>
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-500 mb-1">Duration</label>
            <select
              value={event.incomeChangeDuration || 'ongoing'}
              onChange={(e) => {
                const duration = e.target.value as 'ongoing' | 'phase';
                if (duration === 'phase') {
                  onUpdate({
                    incomeChangeDuration: duration,
                    startYear: event.startYear || 1,
                    endYear: event.endYear || 2,
                    incomeMultiplier: event.incomeMultiplier || 0.5,
                    year: undefined,
                    percentChange: undefined,
                    newAnnualIncome: undefined,
                  });
                } else {
                  onUpdate({
                    incomeChangeDuration: duration,
                    year: event.year || 1,
                    percentChange: event.percentChange || 0,
                    startYear: undefined,
                    endYear: undefined,
                    incomeMultiplier: undefined,
                  });
                }
              }}
              className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
            >
              <option value="ongoing">Ongoing</option>
              <option value="phase">Temporary</option>
            </select>
          </div>

          {/* Earner selector (only for dual income households) */}
          {isDualIncome && (
            <div className="w-28">
              <label className="block text-xs font-medium text-gray-500 mb-1">Earner</label>
              <select
                value={event.affectedEarner || 'primary'}
                onChange={(e) => onUpdate({ affectedEarner: e.target.value as 'primary' | 'secondary' })}
                className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </select>
            </div>
          )}

          {/* Ongoing income change fields */}
          {(!event.incomeChangeDuration || event.incomeChangeDuration === 'ongoing') && (
            <>
              <div className="w-28">
                <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                <select
                  value={event.year || 1}
                  onChange={(e) => onUpdate({ year: parseInt(e.target.value) })}
                  className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
                >
                  {yearOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-gray-500 mb-1">Change %</label>
                <div className="relative">
                  <input
                    type="number"
                    value={event.percentChange || 0}
                    onChange={(e) => onUpdate({ percentChange: parseFloat(e.target.value) || 0 })}
                    className="block w-full rounded-md border-0 py-1.5 pl-2 pr-6 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
                  />
                  <span className="absolute right-2 top-1.5 text-gray-500 text-sm">%</span>
                </div>
              </div>
            </>
          )}

          {/* Phase-based income change fields */}
          {event.incomeChangeDuration === 'phase' && (
            <>
              <div className="w-28">
                <label className="block text-xs font-medium text-gray-500 mb-1">Start Year</label>
                <select
                  value={event.startYear || 1}
                  onChange={(e) => onUpdate({ startYear: parseInt(e.target.value) })}
                  className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
                >
                  {yearOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium text-gray-500 mb-1">End Year</label>
                <select
                  value={event.endYear || (event.startYear || 1) + 1}
                  onChange={(e) => onUpdate({ endYear: parseInt(e.target.value) })}
                  className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
                >
                  {yearOptions
                    .filter((opt) => opt.value >= (event.startYear || 1))
                    .map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-gray-500 mb-1">Income %</label>
                <div className="relative">
                  <input
                    type="number"
                    value={Math.round((event.incomeMultiplier || 0.5) * 100)}
                    onChange={(e) => onUpdate({ incomeMultiplier: (parseFloat(e.target.value) || 50) / 100 })}
                    min={0}
                    max={100}
                    className="block w-full rounded-md border-0 py-1.5 pl-2 pr-6 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
                  />
                  <span className="absolute right-2 top-1.5 text-gray-500 text-sm">%</span>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Remove button */}
      <div className="flex items-end">
        <button
          onClick={onRemove}
          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
          title="Remove event"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function LifeEventsTimeline() {
  const lifeEvents = useStore((state) => state.lifeEvents);
  const addLifeEvent = useStore((state) => state.addLifeEvent);
  const updateLifeEvent = useStore((state) => state.updateLifeEvent);
  const removeLifeEvent = useStore((state) => state.removeLifeEvent);
  const clearLifeEvents = useStore((state) => state.clearLifeEvents);
  const timeframe = useStore((state) => state.settings.timeframeYears);
  const profile = useStore((state) => state.financialProfile);

  const isDualIncome = profile.incomeType === 'dual' && (profile.secondaryIncome || 0) > 0;

  const [showPresets, setShowPresets] = useState(false);

  const handleAddEvent = () => {
    const newEvent: LifeEvent = {
      id: generateId(),
      description: '',
      type: 'one-time',
      year: 1,
      amount: -10000,
    };
    addLifeEvent(newEvent);
  };

  const handleAddPreset = (preset: Partial<LifeEvent>) => {
    const isPhaseIncome = preset.type === 'income-change' && preset.incomeChangeDuration === 'phase';
    const newEvent: LifeEvent = {
      id: generateId(),
      description: preset.description || '',
      type: preset.type || 'one-time',
      year: (preset.type === 'one-time' || (preset.type === 'income-change' && !isPhaseIncome)) ? 3 : undefined,
      amount: preset.amount,
      startYear: (preset.type === 'ongoing' || preset.type === 'phase' || isPhaseIncome) ? 3 : undefined,
      endYear: (preset.type === 'phase' || isPhaseIncome) ? 4 : undefined,
      monthlyAmount: preset.monthlyAmount,
      percentChange: preset.percentChange,
      incomeChangeDuration: preset.incomeChangeDuration,
      incomeMultiplier: preset.incomeMultiplier,
    };
    addLifeEvent(newEvent);
    setShowPresets(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Life Events</h2>
        {lifeEvents.length > 0 && (
          <button
            onClick={clearLifeEvents}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear All
          </button>
        )}
      </div>

      {lifeEvents.length === 0 ? (
        <p className="text-gray-500 text-sm mb-4">
          Add life events to model future expenses or income changes (optional).
        </p>
      ) : (
        <div className="space-y-3 mb-4">
          {lifeEvents.map((event) => (
            <LifeEventRow
              key={event.id}
              event={event}
              onUpdate={(updates) => updateLifeEvent(event.id, updates)}
              onRemove={() => removeLifeEvent(event.id)}
              maxYear={timeframe}
              isDualIncome={isDualIncome}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleAddEvent}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Event
        </button>

        <div className="relative">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Quick Add
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showPresets && (
            <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAddPreset(preset)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {preset.description}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
