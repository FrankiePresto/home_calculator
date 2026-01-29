'use client';

import { useStore } from '@/lib/store';
import { BuyScenario } from '@/lib/engine/types';
import { CurrencyInput, PercentInput, SliderInput, SelectInput } from '@/components/shared';
import { formatCurrency } from '@/lib/utils/formatters';

interface BuyScenarioFormProps {
  scenario: BuyScenario;
  onChange: (updates: Partial<BuyScenario>) => void;
  onRemove?: () => void;
  colorClass?: string;
  isSecondary?: boolean;
}

export function BuyScenarioForm({
  scenario,
  onChange,
  onRemove,
  colorClass = 'bg-green-500',
  isSecondary = false,
}: BuyScenarioFormProps) {
  const profile = useStore((state) => state.financialProfile);

  // Calculate derived values
  const downPaymentAmount = scenario.purchasePrice * (scenario.downPaymentPercent / 100);
  const closingCosts = scenario.purchasePrice * ((scenario.closingCostPercent ?? 3) / 100);
  const totalUpfront = downPaymentAmount + closingCosts;
  const canAfford = profile.currentInvestmentPortfolio >= totalUpfront;

  // Auto-calculate maintenance if it's close to 1% annual
  const suggestedMaintenance = Math.round((scenario.purchasePrice * 0.01) / 12);

  // Determine if mortgage insurance is needed
  const needsInsurance = scenario.downPaymentPercent < 20;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isSecondary ? 'Buy Scenario B' : 'Buy Scenario'}
          </h2>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        )}
      </div>

      {/* Scenario Name */}
      <div className="mb-4">
        <label htmlFor={`scenario-name-${isSecondary ? '2' : '1'}`} className="block text-sm font-medium text-gray-700 mb-1">
          Scenario Name
        </label>
        <input
          type="text"
          id={`scenario-name-${isSecondary ? '2' : '1'}`}
          value={scenario.name}
          onChange={(e) => onChange({ name: e.target.value })}
          maxLength={30}
          className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
          placeholder="e.g., Downtown Condo"
        />
      </div>

      {/* Property Details */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Property Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CurrencyInput
            id={`purchase-price-${isSecondary ? '2' : '1'}`}
            label="Purchase Price"
            value={scenario.purchasePrice}
            onChange={(value) => onChange({ purchasePrice: value })}
            min={0}
            step={10000}
          />

          <div>
            <SliderInput
              id={`down-payment-${isSecondary ? '2' : '1'}`}
              label="Down Payment"
              value={scenario.downPaymentPercent}
              onChange={(value) => onChange({ downPaymentPercent: value })}
              min={5}
              max={100}
              step={5}
              formatValue={(v) => `${v}% (${formatCurrency(scenario.purchasePrice * v / 100)})`}
            />
          </div>

          <PercentInput
            id={`closing-costs-${isSecondary ? '2' : '1'}`}
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
              id={`mortgage-insurance-${isSecondary ? '2' : '1'}`}
              label="Mortgage Insurance"
              value={scenario.mortgageInsurancePercent}
              onChange={(value) => onChange({ mortgageInsurancePercent: value })}
              min={0}
              max={5}
              step={0.5}
              helpText="Required when down payment < 20%"
            />
          )}
        </div>

        {/* Affordability indicator */}
        <div className={`mt-3 p-3 rounded-md text-sm ${canAfford ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <strong>Total upfront: {formatCurrency(totalUpfront)}</strong>
          {canAfford ? (
            <span className="ml-2">
              ({formatCurrency(profile.currentInvestmentPortfolio - totalUpfront)} remaining in portfolio)
            </span>
          ) : (
            <span className="ml-2">
              (Need {formatCurrency(totalUpfront - profile.currentInvestmentPortfolio)} more)
            </span>
          )}
        </div>
      </div>

      {/* Mortgage Configuration */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Mortgage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PercentInput
            id={`interest-rate-${isSecondary ? '2' : '1'}`}
            label="Interest Rate"
            value={scenario.interestRate}
            onChange={(value) => onChange({ interestRate: value })}
            min={0}
            max={15}
            step={0.25}
          />

          <SelectInput
            id={`amortization-${isSecondary ? '2' : '1'}`}
            label="Amortization"
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
            id={`renewal-rate-${isSecondary ? '2' : '1'}`}
            label="Renewal Rate Assumption"
            value={scenario.renewalRateAssumption ?? scenario.interestRate}
            onChange={(value) => onChange({ renewalRateAssumption: value })}
            min={0}
            max={15}
            step={0.25}
            helpText="Rate at mortgage renewal"
          />
        </div>
      </div>

      {/* Ongoing Costs */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Monthly Ongoing Costs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CurrencyInput
            id={`property-tax-${isSecondary ? '2' : '1'}`}
            label="Property Tax"
            value={scenario.monthlyPropertyTax}
            onChange={(value) => onChange({ monthlyPropertyTax: value })}
            min={0}
            step={50}
          />

          <CurrencyInput
            id={`home-insurance-${isSecondary ? '2' : '1'}`}
            label="Home Insurance"
            value={scenario.monthlyHomeInsurance}
            onChange={(value) => onChange({ monthlyHomeInsurance: value })}
            min={0}
            step={25}
          />

          <CurrencyInput
            id={`strata-fees-${isSecondary ? '2' : '1'}`}
            label="Strata/HOA Fees"
            value={scenario.monthlyStrataFees}
            onChange={(value) => onChange({ monthlyStrataFees: value })}
            min={0}
            step={50}
            helpText="$0 if not applicable"
          />

          <CurrencyInput
            id={`utilities-${isSecondary ? '2' : '1'}`}
            label="Utilities"
            value={scenario.monthlyUtilities}
            onChange={(value) => onChange({ monthlyUtilities: value })}
            min={0}
            step={25}
          />

          <CurrencyInput
            id={`maintenance-${isSecondary ? '2' : '1'}`}
            label="Maintenance"
            value={scenario.monthlyMaintenance}
            onChange={(value) => onChange({ monthlyMaintenance: value })}
            min={0}
            step={50}
            helpText={`Suggested: ${formatCurrency(suggestedMaintenance)} (1%/year)`}
          />

          <PercentInput
            id={`appreciation-${isSecondary ? '2' : '1'}`}
            label="Annual Appreciation"
            value={scenario.annualAppreciation}
            onChange={(value) => onChange({ annualAppreciation: value })}
            min={-5}
            max={10}
            step={0.5}
            helpText="Historical average is ~3%"
          />
        </div>
      </div>
    </div>
  );
}

// Wrapper component that connects to the store for the primary buy scenario
export function PrimaryBuyScenarioForm() {
  const scenario = useStore((state) => state.buyScenario);
  const setScenario = useStore((state) => state.setBuyScenario);
  const buyScenario2 = useStore((state) => state.buyScenario2);
  const addSecondScenario = useStore((state) => state.addSecondBuyScenario);

  return (
    <div className="space-y-4">
      <BuyScenarioForm
        scenario={scenario}
        onChange={setScenario}
        colorClass="bg-green-500"
      />
      {!buyScenario2 && (
        <button
          onClick={addSecondScenario}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
        >
          + Add Second Buy Scenario
        </button>
      )}
    </div>
  );
}

// Wrapper component for the secondary buy scenario
export function SecondaryBuyScenarioForm() {
  const scenario = useStore((state) => state.buyScenario2);
  const setScenario = useStore((state) => state.setBuyScenario2);
  const removeScenario = useStore((state) => state.removeSecondBuyScenario);

  if (!scenario) return null;

  return (
    <BuyScenarioForm
      scenario={scenario}
      onChange={setScenario}
      onRemove={removeScenario}
      colorClass="bg-purple-500"
      isSecondary
    />
  );
}
