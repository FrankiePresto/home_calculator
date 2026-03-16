'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { CurrencyInput, PercentInput, SliderInput } from '@/components/shared';
import { formatCurrency } from '@/lib/utils/formatters';
import { FinancialProfile } from '@/lib/engine/types';
import { calculateTotalTax, calculateHouseholdTax, SUPPORTED_PROVINCES, Province } from '@/lib/engine/taxes';
import { InfoTooltip } from '@/components/shared/InfoTooltip';

export function FinancialStep() {
  const profile = useStore((state) => state.financialProfile);
  const setProfile = useStore((state) => state.setFinancialProfile);
  const rentScenario = useStore((state) => state.rentScenario);
  const [showAdvanced, setShowAdvanced] = useState(profile.includeTaxes || profile.useAdvancedSavings || false);

  // Calculate preview
  const isDualIncome = profile.incomeType === 'dual' && profile.secondaryIncome > 0;
  const totalGrossIncome = profile.annualGrossIncome + (isDualIncome ? profile.secondaryIncome : 0);
  const monthlyGrossIncome = totalGrossIncome / 12;

  let monthlyNetIncome = monthlyGrossIncome;
  if (profile.includeTaxes) {
    const province = (profile.province || 'ON') as Province;
    if (isDualIncome) {
      const householdTax = calculateHouseholdTax(profile.annualGrossIncome, profile.secondaryIncome, province);
      monthlyNetIncome = householdTax.netIncome / 12;
    } else {
      const taxResult = calculateTotalTax(profile.annualGrossIncome, province);
      monthlyNetIncome = taxResult.netIncome / 12;
    }
  }

  const monthlyHousing = rentScenario.monthlyRent + rentScenario.rentersInsurance;
  const discretionary = monthlyNetIncome - monthlyHousing - profile.monthlyNonHousingExpenses;
  const monthlySavings = Math.max(0, discretionary * (profile.savingsRate / 100));

  return (
    <div className="space-y-8">
      {/* Income Section */}
      <section className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="section-header">Income</h3>
          <InfoTooltip content="Enter your total pre-tax annual income. This helps calculate your savings potential." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <CurrencyInput
              id="annual-income"
              label={isDualIncome ? 'Primary Income' : 'Annual Gross Income'}
              value={profile.annualGrossIncome}
              onChange={(value) => setProfile({ annualGrossIncome: value })}
              min={0}
              step={5000}
              helpText="Pre-tax annual income"
            />
            <label className="inline-flex items-center mt-3 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={profile.incomeType === 'dual'}
                onChange={(e) => setProfile({
                  incomeType: e.target.checked ? 'dual' : 'single',
                  secondaryIncome: e.target.checked ? profile.secondaryIncome || 75000 : 0,
                })}
                className="h-4 w-4 text-accent rounded border-border focus:ring-accent mr-2"
              />
              Dual income household
            </label>
          </div>

          {isDualIncome && (
            <CurrencyInput
              id="secondary-income"
              label="Secondary Income"
              value={profile.secondaryIncome || 0}
              onChange={(value) => setProfile({ secondaryIncome: value })}
              min={0}
              step={5000}
              helpText="Second earner's pre-tax income"
            />
          )}

          <CurrencyInput
            id="monthly-expenses"
            label="Monthly Non-Housing Expenses"
            value={profile.monthlyNonHousingExpenses}
            onChange={(value) => setProfile({ monthlyNonHousingExpenses: value })}
            min={0}
            step={100}
            helpText="Food, transport, entertainment, subscriptions, etc."
          />

          <PercentInput
            id="annual-raise"
            label="Expected Annual Raise"
            value={profile.annualRaisePercent}
            onChange={(value) => setProfile({ annualRaisePercent: value })}
            min={0}
            max={10}
            step={0.5}
            helpText="Typical is 2-3% per year"
          />
        </div>
      </section>

      {/* Savings & Investments Section */}
      <section className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="section-header">Savings & Investments</h3>
          <InfoTooltip content="Your current savings will be used for down payment. The savings rate determines how quickly you build wealth." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CurrencyInput
            id="investment-portfolio"
            label="Current Savings/Investments"
            value={profile.currentInvestmentPortfolio}
            onChange={(value) => setProfile({ currentInvestmentPortfolio: value })}
            min={0}
            step={5000}
            helpText="Liquid assets available for down payment"
          />

          <PercentInput
            id="investment-return"
            label="Expected Investment Return"
            value={profile.expectedInvestmentReturn}
            onChange={(value) => setProfile({ expectedInvestmentReturn: value })}
            min={0}
            max={15}
            step={0.5}
            helpText="Long-term stock market average is ~7%"
          />

          <div className="md:col-span-2">
            <SliderInput
              id="savings-rate"
              label="Savings Rate"
              value={profile.savingsRate}
              onChange={(value) => setProfile({ savingsRate: value })}
              min={0}
              max={100}
              step={5}
              helpText="Percentage of discretionary income you save each month"
              formatValue={(v) => `${v}%`}
            />
          </div>
        </div>
      </section>

      {/* Cash Flow Preview */}
      <section className="bg-accent/5 border border-accent/20 rounded-xl p-6">
        <h3 className="text-sm font-medium text-foreground mb-4">
          Monthly Cash Flow Preview {profile.includeTaxes ? '(after tax)' : '(before tax)'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {profile.includeTaxes ? 'Net Income' : 'Gross Income'}
            </p>
            <p className="text-lg font-semibold text-foreground tabular-nums">
              {formatCurrency(monthlyNetIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Housing + Expenses</p>
            <p className="text-lg font-semibold text-foreground tabular-nums">
              -{formatCurrency(monthlyHousing + profile.monthlyNonHousingExpenses)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Monthly Savings</p>
            <p className="text-lg font-semibold text-success tabular-nums">
              {formatCurrency(monthlySavings)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
            <p className={`text-lg font-semibold tabular-nums ${discretionary - monthlySavings < 200 ? 'text-warning' : 'text-foreground'}`}>
              {formatCurrency(discretionary - monthlySavings)}
            </p>
          </div>
        </div>
        {discretionary < 0 && (
          <p className="mt-3 text-sm text-destructive">
            Your expenses exceed your income. Adjust your numbers above.
          </p>
        )}
      </section>

      {/* Advanced Settings Toggle */}
      <div className="border-t border-border pt-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronIcon className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
          Advanced Settings (Taxes, Savings Split)
        </button>

        {showAdvanced && (
          <div className="mt-6 space-y-6">
            {/* Tax Settings */}
            <div className="card p-6">
              <div className="flex items-start gap-3 mb-4">
                <input
                  id="include-taxes"
                  type="checkbox"
                  checked={profile.includeTaxes || false}
                  onChange={(e) => setProfile({ includeTaxes: e.target.checked })}
                  className="mt-1 h-4 w-4 text-accent rounded border-border focus:ring-accent"
                />
                <div>
                  <label htmlFor="include-taxes" className="text-sm font-medium text-foreground cursor-pointer">
                    Include Canadian Income Taxes
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Uses 2026 federal and provincial tax brackets
                  </p>
                </div>
              </div>

              {profile.includeTaxes && (
                <div className="mt-4 pl-7">
                  <label htmlFor="province" className="block text-sm font-medium text-stone-700 mb-1">
                    Province
                  </label>
                  <select
                    id="province"
                    value={profile.province || 'ON'}
                    onChange={(e) => setProfile({ province: e.target.value })}
                    className="block w-full max-w-xs rounded-lg border-border py-2 px-3 text-foreground ring-1 ring-inset ring-border focus:ring-2 focus:ring-accent text-sm"
                  >
                    {SUPPORTED_PROVINCES.map((prov) => (
                      <option key={prov.value} value={prov.value}>
                        {prov.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Advanced Savings Split */}
            <div className="card p-6">
              <div className="flex items-start gap-3 mb-4">
                <input
                  id="use-advanced-savings"
                  type="checkbox"
                  checked={profile.useAdvancedSavings || false}
                  onChange={(e) => setProfile({ useAdvancedSavings: e.target.checked })}
                  className="mt-1 h-4 w-4 text-accent rounded border-border focus:ring-accent"
                />
                <div>
                  <label htmlFor="use-advanced-savings" className="text-sm font-medium text-foreground cursor-pointer">
                    Split Savings Between Investments and HISA
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    By default, all savings are invested at your expected return rate
                  </p>
                </div>
              </div>

              {profile.useAdvancedSavings && (
                <div className="mt-4 pl-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SliderInput
                    id="non-invested-rate"
                    label="Keep in HISA/Cash"
                    value={profile.nonInvestedSavingsRate || 0}
                    onChange={(value) => setProfile({ nonInvestedSavingsRate: value })}
                    min={0}
                    max={100}
                    step={5}
                    formatValue={(v) => `${v}%`}
                  />
                  <PercentInput
                    id="hisa-return"
                    label="HISA Return Rate"
                    value={profile.nonInvestedReturnRate || 2}
                    onChange={(value) => setProfile({ nonInvestedReturnRate: value })}
                    min={0}
                    max={10}
                    step={0.25}
                    helpText="Typical HISA rate is 2-4%"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
