'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { BuyScenario } from '@/lib/engine/types';
import { CurrencyInput, PercentInput, SliderInput, SelectInput, InfoTooltip } from '@/components/shared';
import { formatCurrency } from '@/lib/utils/formatters';
import { calculateMonthlyMortgagePayment } from '@/lib/engine/mortgage';

export function BuyStep() {
  const scenario = useStore((state) => state.buyScenario);
  const setScenario = useStore((state) => state.setBuyScenario);
  const scenario2 = useStore((state) => state.buyScenario2);
  const setScenario2 = useStore((state) => state.setBuyScenario2);
  const addSecondScenario = useStore((state) => state.addSecondBuyScenario);
  const removeSecondScenario = useStore((state) => state.removeSecondBuyScenario);
  const profile = useStore((state) => state.financialProfile);

  const [activeScenario, setActiveScenario] = useState<1 | 2>(1);

  return (
    <div className="space-y-8">
      {/* Scenario Tabs - only show if there's a second scenario */}
      {scenario2 && (
        <div className="flex gap-2 p-1 bg-secondary rounded-lg">
          <button
            onClick={() => setActiveScenario(1)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeScenario === 1
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              {scenario.name || 'Property A'}
            </span>
          </button>
          <button
            onClick={() => setActiveScenario(2)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeScenario === 2
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              {scenario2.name || 'Property B'}
            </span>
          </button>
        </div>
      )}

      {/* Main Form */}
      {(activeScenario === 1 || !scenario2) ? (
        <BuyScenarioFormContent
          scenario={scenario}
          onChange={setScenario}
          profile={profile}
          colorClass="bg-success"
          isSecondary={false}
        />
      ) : (
        <BuyScenarioFormContent
          scenario={scenario2!}
          onChange={(updates) => setScenario2(updates)}
          profile={profile}
          colorClass="bg-purple-500"
          isSecondary={true}
          onRemove={() => {
            removeSecondScenario();
            setActiveScenario(1);
          }}
        />
      )}

      {/* Add Second Scenario */}
      {!scenario2 && (
        <button
          onClick={addSecondScenario}
          className="w-full py-4 px-6 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Compare with Another Property
        </button>
      )}
    </div>
  );
}

interface BuyScenarioFormContentProps {
  scenario: BuyScenario;
  onChange: (updates: Partial<BuyScenario>) => void;
  profile: {
    currentInvestmentPortfolio: number;
    annualGrossIncome: number;
  };
  colorClass: string;
  isSecondary: boolean;
  onRemove?: () => void;
}

function BuyScenarioFormContent({
  scenario,
  onChange,
  profile,
  colorClass,
  isSecondary,
  onRemove,
}: BuyScenarioFormContentProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate derived values
  const downPaymentAmount = scenario.purchasePrice * (scenario.downPaymentPercent / 100);
  const closingCosts = scenario.purchasePrice * ((scenario.closingCostPercent ?? 3) / 100);
  const totalUpfront = downPaymentAmount + closingCosts;
  const canAfford = profile.currentInvestmentPortfolio >= totalUpfront;
  const needsInsurance = scenario.downPaymentPercent < 20;

  // Monthly costs using engine function
  const principal = scenario.purchasePrice - downPaymentAmount;
  const monthlyMortgage = calculateMonthlyMortgagePayment(
    principal,
    scenario.interestRate,
    scenario.amortizationYears
  );
  
  const monthlyOngoing = 
    scenario.monthlyPropertyTax +
    scenario.monthlyHomeInsurance +
    scenario.monthlyStrataFees +
    scenario.monthlyUtilities +
    scenario.monthlyMaintenance;

  const totalMonthly = monthlyMortgage + monthlyOngoing;

  return (
    <div className="space-y-6">
      {/* Scenario Name */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${colorClass}`} />
            <h3 className="section-header">{isSecondary ? 'Property B Details' : 'Property Details'}</h3>
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-sm text-destructive hover:text-destructive/80 transition-colors"
            >
              Remove
            </button>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="scenario-name" className="label mb-1 block">
            Property Name
          </label>
          <input
            type="text"
            id="scenario-name"
            value={scenario.name}
            onChange={(e) => onChange({ name: e.target.value })}
            maxLength={30}
            className="input max-w-md"
            placeholder="e.g., Downtown Condo, Suburban House"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CurrencyInput
            id="purchase-price"
            label="Purchase Price"
            value={scenario.purchasePrice}
            onChange={(value) => onChange({ purchasePrice: value })}
            min={0}
            step={10000}
          />

          <div>
            <SliderInput
              id="down-payment"
              label="Down Payment"
              value={scenario.downPaymentPercent}
              onChange={(value) => onChange({ downPaymentPercent: value })}
              min={5}
              max={100}
              step={5}
              formatValue={(v) => `${v}% (${formatCurrency(scenario.purchasePrice * v / 100)})`}
            />
            {needsInsurance && (
              <p className="mt-1 text-xs text-warning">
                Mortgage insurance required under 20%
              </p>
            )}
          </div>
        </div>

        {/* Affordability indicator */}
        <div className={`mt-6 p-4 rounded-lg ${canAfford ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Total Upfront Cost</p>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalUpfront)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(downPaymentAmount)} down + {formatCurrency(closingCosts)} closing
              </p>
            </div>
            <div className={`text-right ${canAfford ? 'text-success' : 'text-destructive'}`}>
              {canAfford ? (
                <>
                  <CheckIcon className="w-5 h-5 ml-auto" />
                  <p className="text-xs mt-1">
                    {formatCurrency(profile.currentInvestmentPortfolio - totalUpfront)} remaining
                  </p>
                </>
              ) : (
                <>
                  <XIcon className="w-5 h-5 ml-auto" />
                  <p className="text-xs mt-1">
                    Need {formatCurrency(totalUpfront - profile.currentInvestmentPortfolio)} more
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mortgage Details */}
      <section className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="section-header">Mortgage</h3>
          <InfoTooltip content="Configure your mortgage terms. The interest rate significantly impacts your monthly payment and total cost." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PercentInput
            id="interest-rate"
            label="Interest Rate"
            value={scenario.interestRate}
            onChange={(value) => onChange({ interestRate: value })}
            min={0}
            max={15}
            step={0.25}
          />

          <SelectInput
            id="amortization"
            label="Amortization Period"
            value={scenario.amortizationYears}
            onChange={(value) => onChange({ amortizationYears: value as number })}
            options={[
              { value: 15, label: '15 years' },
              { value: 20, label: '20 years' },
              { value: 25, label: '25 years' },
              { value: 30, label: '30 years' },
            ]}
          />

          <PercentInput
            id="closing-costs"
            label="Closing Costs"
            value={scenario.closingCostPercent ?? 3}
            onChange={(value) => onChange({ closingCostPercent: value })}
            min={0}
            max={10}
            step={0.5}
            helpText={`= ${formatCurrency(closingCosts)}`}
          />

          {needsInsurance && (
            <PercentInput
              id="mortgage-insurance"
              label="Mortgage Insurance"
              value={scenario.mortgageInsurancePercent}
              onChange={(value) => onChange({ mortgageInsurancePercent: value })}
              min={0}
              max={5}
              step={0.5}
              helpText="Added to mortgage principal"
            />
          )}
        </div>
      </section>

      {/* Ongoing Costs */}
      <section className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="section-header">Monthly Ownership Costs</h3>
          <InfoTooltip content="These ongoing costs are often underestimated by first-time buyers. Be realistic here." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CurrencyInput
            id="property-tax"
            label="Property Tax"
            value={scenario.monthlyPropertyTax}
            onChange={(value) => onChange({ monthlyPropertyTax: value })}
            min={0}
            step={50}
            helpText="Monthly portion"
          />

          <CurrencyInput
            id="home-insurance"
            label="Home Insurance"
            value={scenario.monthlyHomeInsurance}
            onChange={(value) => onChange({ monthlyHomeInsurance: value })}
            min={0}
            step={25}
          />

          <CurrencyInput
            id="strata-fees"
            label="Strata/HOA Fees"
            value={scenario.monthlyStrataFees}
            onChange={(value) => onChange({ monthlyStrataFees: value })}
            min={0}
            step={50}
            helpText="$0 if not applicable"
          />

          <CurrencyInput
            id="utilities"
            label="Utilities"
            value={scenario.monthlyUtilities}
            onChange={(value) => onChange({ monthlyUtilities: value })}
            min={0}
            step={25}
          />

          <CurrencyInput
            id="maintenance"
            label="Maintenance Reserve"
            value={scenario.monthlyMaintenance}
            onChange={(value) => onChange({ monthlyMaintenance: value })}
            min={0}
            step={50}
            helpText={`Suggested: ${formatCurrency(Math.round((scenario.purchasePrice * 0.01) / 12))} (1%/year)`}
          />

          <PercentInput
            id="appreciation"
            label="Annual Appreciation"
            value={scenario.annualAppreciation}
            onChange={(value) => onChange({ annualAppreciation: value })}
            min={-5}
            max={10}
            step={0.5}
            helpText="Historical average is ~3%"
          />
        </div>
      </section>

      {/* Cost Summary */}
      <section className="bg-success/5 border border-success/20 rounded-xl p-6">
        <h3 className="text-sm font-medium text-foreground mb-4">Monthly Payment Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Mortgage Payment</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {formatCurrency(monthlyMortgage)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Principal + Interest
            </p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">Other Costs</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {formatCurrency(monthlyOngoing)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tax, Insurance, Maintenance
            </p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Monthly</p>
            <p className="text-2xl font-bold text-success tabular-nums">
              {formatCurrency(totalMonthly)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              vs {formatCurrency(profile.annualGrossIncome / 12 * 0.28)} guideline (28%)
            </p>
          </div>
        </div>
      </section>

      {/* Advanced Settings */}
      <section className="card p-4 border-2 border-dashed border-accent/30 bg-accent/5">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-accent" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">Advanced Settings</span>
              <p className="text-xs text-muted-foreground">Mortgage renewal assumptions</p>
            </div>
          </div>
          <ChevronIcon className={`w-5 h-5 text-accent transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
        </button>

        {showAdvanced && (
          <div className="mt-6 card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PercentInput
                id="renewal-rate"
                label="Renewal Rate Assumption"
                value={scenario.renewalRateAssumption ?? scenario.interestRate}
                onChange={(value) => onChange({ renewalRateAssumption: value })}
                min={0}
                max={15}
                step={0.25}
                helpText="Expected rate at mortgage renewal"
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
