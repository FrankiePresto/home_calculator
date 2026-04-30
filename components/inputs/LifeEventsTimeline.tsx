'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { LifeEvent, LifeEventType } from '@/lib/engine/types';

const generateId = () => Math.random().toString(36).slice(2, 9);

type Polarity = 'income' | 'expense';
type SalaryMethod = 'percent' | 'absolute';

interface PresetSpec extends Partial<LifeEvent> {
  presetLabel: string;
}

const PRESETS: PresetSpec[] = [
  { presetLabel: 'Wedding', description: 'Wedding', type: 'one-time', amount: -30000 },
  { presetLabel: 'New Car', description: 'New Car', type: 'one-time', amount: -40000 },
  { presetLabel: 'Inheritance', description: 'Inheritance', type: 'one-time', amount: 50000 },
  { presetLabel: 'Bonus / Windfall', description: 'Bonus', type: 'one-time', amount: 10000 },
  { presetLabel: 'Childcare', description: 'Childcare', type: 'phase', monthlyAmount: -2000 },
  { presetLabel: 'Child Expenses', description: 'Child Expenses', type: 'phase', monthlyAmount: -1500 },
  { presetLabel: 'Car Payment', description: 'Car Payment', type: 'ongoing', monthlyAmount: -500 },
  { presetLabel: 'Side Hustle', description: 'Side Hustle', type: 'ongoing', monthlyAmount: 1000 },
  { presetLabel: 'Promotion', description: 'Promotion', type: 'income-change', percentChange: 15, incomeChangeDuration: 'ongoing' },
  { presetLabel: 'Sabbatical', description: 'Sabbatical', type: 'income-change', incomeChangeDuration: 'phase', incomeMultiplier: 0.5 },
  { presetLabel: 'Mat Leave (EI)', description: 'Mat Leave', type: 'income-change', incomeChangeDuration: 'phase', incomeMultiplier: 0.55 },
];

const inputClass = "w-full rounded-lg border-0 py-1.5 px-2 text-sm text-foreground ring-1 ring-inset ring-border focus:ring-2 focus:ring-accent";
const labelClass = "text-xs font-medium text-muted-foreground";

function getPolarity(event: LifeEvent): Polarity {
  if (event.type === 'one-time') {
    return (event.amount ?? 0) >= 0 ? 'income' : 'expense';
  }
  if (event.type === 'ongoing' || event.type === 'phase') {
    return (event.monthlyAmount ?? 0) >= 0 ? 'income' : 'expense';
  }
  return 'expense';
}

function getSalaryMethod(event: LifeEvent): SalaryMethod {
  return event.newAnnualIncome !== undefined ? 'absolute' : 'percent';
}

function buildTypeLabel(event: LifeEvent): string {
  if (event.type === 'income-change') {
    return event.incomeChangeDuration === 'phase'
      ? 'Temporary salary change'
      : 'Permanent salary change';
  }
  const kind = getPolarity(event) === 'income' ? 'income' : 'expense';
  switch (event.type) {
    case 'one-time': return `One-time ${kind}`;
    case 'ongoing': return `Recurring ${kind}`;
    case 'phase': return `Temporary ${kind}`;
    default: return '';
  }
}

interface LifeEventRowProps {
  event: LifeEvent;
  onUpdate: (updates: Partial<LifeEvent>) => void;
  onRemove: () => void;
  maxYear: number;
  isDualIncome: boolean;
}

function LifeEventRow({ event, onUpdate, onRemove, maxYear, isDualIncome }: LifeEventRowProps) {
  const years = Array.from({ length: maxYear }, (_, i) => i + 1);
  const polarity = getPolarity(event);
  const salaryMethod = getSalaryMethod(event);

  const setPolarity = (next: Polarity) => {
    if (event.type === 'one-time') {
      const magnitude = Math.abs(event.amount ?? 0);
      onUpdate({ amount: next === 'income' ? magnitude : -magnitude });
    } else if (event.type === 'ongoing' || event.type === 'phase') {
      const magnitude = Math.abs(event.monthlyAmount ?? 0);
      onUpdate({ monthlyAmount: next === 'income' ? magnitude : -magnitude });
    }
  };

  return (
    <div className="p-3 bg-secondary/50 rounded-lg">
      {/* Header row: Description, Type badge, Delete */}
      <div className="flex items-start gap-3 mb-3">
        <input
          type="text"
          value={event.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className={`${inputClass} flex-1`}
          placeholder="Description"
        />
        <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground whitespace-nowrap">
          {buildTypeLabel(event)}
        </span>
        <button
          onClick={onRemove}
          className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
          title="Remove"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Details row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {/* Type selector */}
        <div className="flex items-center gap-1.5">
          <span className={labelClass}>Type:</span>
          <select
            value={event.type}
            onChange={(e) => {
              const newType = e.target.value as LifeEventType;
              // When switching to a non-salary type, default to expense to preserve old behavior
              if (newType === 'one-time') {
                onUpdate({ type: newType, amount: event.amount ?? -10000 });
              } else if (newType === 'ongoing' || newType === 'phase') {
                onUpdate({ type: newType, monthlyAmount: event.monthlyAmount ?? -500 });
              } else {
                onUpdate({ type: newType });
              }
            }}
            className={`${inputClass} w-auto py-1`}
          >
            <option value="one-time">One-time</option>
            <option value="ongoing">Recurring</option>
            <option value="phase">Temporary</option>
            <option value="income-change">Salary change</option>
          </select>
        </div>

        {/* Income / Expense polarity for non-salary types */}
        {(event.type === 'one-time' || event.type === 'ongoing' || event.type === 'phase') && (
          <div className="flex items-center gap-1.5">
            <span className={labelClass}>Kind:</span>
            <select
              value={polarity}
              onChange={(e) => setPolarity(e.target.value as Polarity)}
              className={`${inputClass} w-auto py-1`}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
        )}

        {/* Duration for income-change */}
        {event.type === 'income-change' && (
          <div className="flex items-center gap-1.5">
            <span className={labelClass}>Duration:</span>
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
                    percentChange: event.percentChange ?? 0,
                    startYear: undefined,
                    endYear: undefined,
                    incomeMultiplier: undefined,
                  });
                }
              }}
              className={`${inputClass} w-auto py-1`}
            >
              <option value="ongoing">Permanent</option>
              <option value="phase">Temporary</option>
            </select>
          </div>
        )}

        {/* Earner for dual income */}
        {event.type === 'income-change' && isDualIncome && (
          <div className="flex items-center gap-1.5">
            <span className={labelClass}>Earner:</span>
            <select
              value={event.affectedEarner || 'primary'}
              onChange={(e) => onUpdate({ affectedEarner: e.target.value as 'primary' | 'secondary' })}
              className={`${inputClass} w-auto py-1`}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
          </div>
        )}

        {/* Year (one-time or permanent salary change) */}
        {(event.type === 'one-time' || (event.type === 'income-change' && event.incomeChangeDuration !== 'phase')) && (
          <div className="flex items-center gap-1.5">
            <span className={labelClass}>Year:</span>
            <select
              value={event.year || 1}
              onChange={(e) => onUpdate({ year: parseInt(e.target.value) })}
              className={`${inputClass} w-16 py-1`}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}

        {/* Start year (recurring, temporary, or temp salary change) */}
        {(event.type === 'ongoing' || event.type === 'phase' || (event.type === 'income-change' && event.incomeChangeDuration === 'phase')) && (
          <div className="flex items-center gap-1.5">
            <span className={labelClass}>From:</span>
            <select
              value={event.startYear || 1}
              onChange={(e) => onUpdate({ startYear: parseInt(e.target.value) })}
              className={`${inputClass} w-16 py-1`}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}

        {/* End year (temporary or temp salary change) */}
        {(event.type === 'phase' || (event.type === 'income-change' && event.incomeChangeDuration === 'phase')) && (
          <div className="flex items-center gap-1.5">
            <span className={labelClass}>To:</span>
            <select
              value={event.endYear || (event.startYear || 1) + 1}
              onChange={(e) => onUpdate({ endYear: parseInt(e.target.value) })}
              className={`${inputClass} w-16 py-1`}
            >
              {years.filter((y) => y >= (event.startYear || 1)).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}

        {/* Amount (one-time): sign tracks polarity */}
        {event.type === 'one-time' && (
          <div className="flex items-center gap-1.5">
            <span className={labelClass}>Amount:</span>
            <div className="relative">
              <span className="absolute left-2 top-1 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                value={Math.abs(event.amount || 0)}
                onChange={(e) => {
                  const magnitude = Math.abs(parseFloat(e.target.value) || 0);
                  onUpdate({ amount: polarity === 'income' ? magnitude : -magnitude });
                }}
                className={`${inputClass} w-24 py-1 pl-5`}
              />
            </div>
          </div>
        )}

        {/* Monthly amount (ongoing, phase): sign tracks polarity */}
        {(event.type === 'ongoing' || event.type === 'phase') && (
          <div className="flex items-center gap-1.5">
            <span className={labelClass}>Monthly:</span>
            <div className="relative">
              <span className="absolute left-2 top-1 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                value={Math.abs(event.monthlyAmount || 0)}
                onChange={(e) => {
                  const magnitude = Math.abs(parseFloat(e.target.value) || 0);
                  onUpdate({ monthlyAmount: polarity === 'income' ? magnitude : -magnitude });
                }}
                className={`${inputClass} w-24 py-1 pl-5`}
              />
            </div>
          </div>
        )}

        {/* Permanent salary change: method toggle (% vs $) + value */}
        {event.type === 'income-change' && event.incomeChangeDuration !== 'phase' && (
          <>
            <div className="flex items-center gap-1.5">
              <span className={labelClass}>Method:</span>
              <select
                value={salaryMethod}
                onChange={(e) => {
                  const m = e.target.value as SalaryMethod;
                  if (m === 'percent') {
                    onUpdate({
                      percentChange: event.percentChange ?? 0,
                      newAnnualIncome: undefined,
                    });
                  } else {
                    onUpdate({
                      newAnnualIncome: event.newAnnualIncome ?? 100000,
                      percentChange: undefined,
                    });
                  }
                }}
                className={`${inputClass} w-auto py-1`}
              >
                <option value="percent">% change</option>
                <option value="absolute">New salary</option>
              </select>
            </div>

            {salaryMethod === 'percent' ? (
              <div className="flex items-center gap-1.5">
                <span className={labelClass}>Change:</span>
                <div className="relative">
                  <input
                    type="number"
                    value={event.percentChange ?? 0}
                    onChange={(e) => onUpdate({ percentChange: parseFloat(e.target.value) || 0 })}
                    className={`${inputClass} w-20 py-1 pr-5`}
                  />
                  <span className="absolute right-2 top-1 text-muted-foreground text-sm">%</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className={labelClass}>New salary:</span>
                <div className="relative">
                  <span className="absolute left-2 top-1 text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    value={event.newAnnualIncome ?? 0}
                    onChange={(e) => onUpdate({ newAnnualIncome: Math.max(0, parseFloat(e.target.value) || 0) })}
                    min={0}
                    step={5000}
                    className={`${inputClass} w-32 py-1 pl-5`}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Income multiplier (temporary salary change) */}
        {event.type === 'income-change' && event.incomeChangeDuration === 'phase' && (
          <div className="flex items-center gap-1.5">
            <span className={labelClass}>Income:</span>
            <div className="relative">
              <input
                type="number"
                value={Math.round((event.incomeMultiplier || 0.5) * 100)}
                onChange={(e) => onUpdate({ incomeMultiplier: (parseFloat(e.target.value) || 50) / 100 })}
                min={0}
                max={100}
                className={`${inputClass} w-20 py-1 pr-5`}
              />
              <span className="absolute right-2 top-1 text-muted-foreground text-sm">%</span>
            </div>
          </div>
        )}
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
    addLifeEvent({
      id: generateId(),
      description: '',
      type: 'one-time',
      year: 1,
      amount: -10000,
    });
  };

  const handleAddPreset = (preset: PresetSpec) => {
    const isPhaseIncome = preset.type === 'income-change' && preset.incomeChangeDuration === 'phase';
    addLifeEvent({
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
    });
    setShowPresets(false);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-header">Life Events</h2>
        {lifeEvents.length > 0 && (
          <button
            onClick={clearLifeEvents}
            className="text-sm text-destructive hover:text-destructive/80"
          >
            Clear All
          </button>
        )}
      </div>

      {lifeEvents.length === 0 ? (
        <p className="text-muted-foreground text-sm mb-4">
          Add life events to model future expenses, income, windfalls, or salary changes (optional).
        </p>
      ) : (
        <div className="space-y-2 mb-4">
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

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button onClick={handleAddEvent} className="btn btn-outline text-sm px-3 py-2">
          + Add Event
        </button>
        <div className="relative">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="btn btn-outline text-sm px-3 py-2"
          >
            Quick Add
            <svg className={`w-4 h-4 ml-1 transition-transform ${showPresets ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showPresets && (
            <div className="absolute left-0 mt-1 w-56 rounded-lg shadow-lg bg-card border border-border z-10 py-1">
              {PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => handleAddPreset(preset)}
                  className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary"
                >
                  {preset.presetLabel}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
