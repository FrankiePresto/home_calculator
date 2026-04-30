'use client';

import { useStore } from '@/lib/store';
import { CurrencyInput, PercentInput, InfoTooltip } from '@/components/shared';
import { formatCurrency } from '@/lib/utils/formatters';

export function RentStep() {
  const scenario = useStore((state) => state.rentScenario);
  const setScenario = useStore((state) => state.setRentScenario);
  const profile = useStore((state) => state.financialProfile);

  // Calculate monthly total
  const monthlyTotal = scenario.monthlyRent + scenario.rentersInsurance;

  // Calculate rent projection
  const yearsToProject = 5;
  const rentIn5Years = scenario.monthlyRent * Math.pow(1 + scenario.annualRentIncrease / 100, yearsToProject);

  // Use household gross income for affordability so dual-income households are sized correctly
  const isDualIncome = profile.incomeType === 'dual' && (profile.secondaryIncome || 0) > 0;
  const householdGrossIncome = profile.annualGrossIncome + (isDualIncome ? (profile.secondaryIncome || 0) : 0);
  const monthlyHouseholdGrossIncome = householdGrossIncome / 12;

  return (
    <div className="space-y-8">
      {/* Main Rent Inputs */}
      <section className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-info" />
          <h3 className="section-header">Rent Details</h3>
          <InfoTooltip content="Enter your current monthly rent or the rent you expect to pay. This will be compared against the cost of buying." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CurrencyInput
            id="monthly-rent"
            label="Monthly Rent"
            value={scenario.monthlyRent}
            onChange={(value) => setScenario({ monthlyRent: value })}
            min={0}
            step={100}
            helpText="Your base monthly rent payment"
          />

          <PercentInput
            id="rent-increase"
            label="Annual Rent Increase"
            value={scenario.annualRentIncrease}
            onChange={(value) => setScenario({ annualRentIncrease: value })}
            min={0}
            max={10}
            step={0.5}
            helpText="Typical market increase is 2-4%"
          />

          <CurrencyInput
            id="renters-insurance"
            label="Renter's Insurance"
            value={scenario.rentersInsurance}
            onChange={(value) => setScenario({ rentersInsurance: value })}
            min={0}
            step={10}
            helpText="Monthly insurance cost"
          />
        </div>
      </section>

      {/* Cost Summary */}
      <section className="bg-info/5 border border-info/20 rounded-xl p-6">
        <h3 className="text-sm font-medium text-foreground mb-4">Rent Cost Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Monthly Total</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {formatCurrency(monthlyTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Rent + Insurance
            </p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">Annual Cost</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {formatCurrency(monthlyTotal * 12)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              First year total
            </p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">Rent in 5 Years</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {formatCurrency(rentIn5Years)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              At {scenario.annualRentIncrease}% annual increase
            </p>
          </div>
        </div>
      </section>

      {/* Affordability Check */}
      <section className="card p-6">
        <h3 className="text-sm font-medium text-foreground mb-4">Rent Affordability</h3>
        
        <div className="space-y-4">
          <AffordabilityBar
            label={`Rent as % of ${isDualIncome ? 'Household ' : ''}Gross Income`}
            current={monthlyTotal}
            total={monthlyHouseholdGrossIncome}
            threshold={30}
            warningText={`Aim for under 30% of ${isDualIncome ? 'household ' : ''}gross income`}
          />
        </div>
        
        <p className="mt-4 text-xs text-muted-foreground">
          Financial experts recommend spending no more than 30% of your gross income on housing.
        </p>
      </section>
    </div>
  );
}

interface AffordabilityBarProps {
  label: string;
  current: number;
  total: number;
  threshold: number;
  warningText: string;
}

function AffordabilityBar({ label, current, total, threshold, warningText }: AffordabilityBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const isOverThreshold = percentage > threshold;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`text-sm font-medium tabular-nums ${isOverThreshold ? 'text-warning' : 'text-success'}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${isOverThreshold ? 'bg-warning' : 'bg-success'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isOverThreshold && (
        <p className="mt-1 text-xs text-warning">{warningText}</p>
      )}
    </div>
  );
}
