'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { CurrencyInput, PercentInput, SliderInput, InfoTooltip, SettingsIcon, ChevronRightIcon } from '@/components/shared';
import { formatCurrency } from '@/lib/utils/formatters';
import { FinancialProfile } from '@/lib/engine/types';
import { calculateTotalTax, calculateHouseholdTax, SUPPORTED_PROVINCES, Province } from '@/lib/engine/taxes';

export function FinancialStep() {
  const profile = useStore((state) => state.financialProfile);
  const setProfile = useStore((state) => state.setFinancialProfile);
  const [showAdvanced, setShowAdvanced] = useState(
    profile.includeTaxes || profile.useAdvancedSavings || (profile.inflationRate != null && profile.inflationRate !== 2) || false
  );

  // Calculate preview - Note: Housing costs are entered on the Rent step, so we only show expenses here
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

  // Only show non-housing expenses here - housing is entered on the Rent step
  const discretionaryBeforeHousing = monthlyNetIncome - profile.monthlyNonHousingExpenses;
  const estimatedSavings = Math.max(0, discretionaryBeforeHousing * (profile.savingsRate / 100));

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
            <label className="checkbox-label mt-3">
              <input
                type="checkbox"
                checked={profile.incomeType === 'dual'}
                onChange={(e) => setProfile({
                  incomeType: e.target.checked ? 'dual' : 'single',
                  secondaryIncome: e.target.checked ? profile.secondaryIncome || 75000 : 0,
                })}
                className="checkbox"
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

      {/* Monthly Summary - Compact */}
      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Monthly Summary {profile.includeTaxes ? '(after tax)' : '(before tax)'}
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {profile.includeTaxes ? 'Net Income' : 'Income'}
            </p>
            <p className="text-lg font-semibold text-foreground tabular-nums">
              {formatCurrency(monthlyNetIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Expenses</p>
            <p className="text-lg font-semibold text-foreground tabular-nums">
              {formatCurrency(profile.monthlyNonHousingExpenses)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Available</p>
            <p className={`text-lg font-semibold tabular-nums ${discretionaryBeforeHousing < 0 ? 'text-destructive' : 'text-foreground'}`}>
              {formatCurrency(discretionaryBeforeHousing)}
            </p>
          </div>
        </div>
        {discretionaryBeforeHousing < 0 && (
          <p className="mt-3 text-xs text-destructive text-center">
            Expenses exceed income. Please adjust above.
          </p>
        )}
      </section>

      {/* Advanced Settings Toggle */}
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
              <p className="text-xs text-muted-foreground">Inflation, Canadian taxes, HISA vs investment split</p>
            </div>
          </div>
          <ChevronRightIcon className={`w-5 h-5 text-accent transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
        </button>

        {showAdvanced && (
          <div className="mt-6 space-y-6">
            {/* Inflation Rate */}
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-foreground">Inflation Rate</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Applied to fixed costs (property tax, insurance, maintenance, utilities, living expenses). Set to 0% to disable.
                  </p>
                </div>
                <PercentInput
                  id="inflation-rate"
                  label=""
                  value={profile.inflationRate ?? 2}
                  onChange={(value) => setProfile({ inflationRate: value })}
                  min={0}
                  max={10}
                  step={0.5}
                />
              </div>
            </div>

            {/* Tax Settings */}
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <label className="checkbox-label">
                  <input
                    id="include-taxes"
                    type="checkbox"
                    checked={profile.includeTaxes || false}
                    onChange={(e) => setProfile({ includeTaxes: e.target.checked })}
                    className="checkbox"
                  />
                  Include Canadian Income Taxes
                </label>
                {profile.includeTaxes && (
                  <select
                    id="province"
                    value={profile.province || 'ON'}
                    onChange={(e) => setProfile({ province: e.target.value })}
                    className="input w-auto text-sm py-1.5"
                  >
                    {SUPPORTED_PROVINCES.map((prov) => (
                      <option key={prov.value} value={prov.value}>
                        {prov.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Uses 2026 federal and provincial tax brackets
              </p>
            </div>

            {/* Advanced Savings Split */}
            <div className="card p-4">
              <label className="checkbox-label">
                <input
                  id="use-advanced-savings"
                  type="checkbox"
                  checked={profile.useAdvancedSavings || false}
                  onChange={(e) => setProfile({ useAdvancedSavings: e.target.checked })}
                  className="checkbox"
                />
                Split Savings Between Investments and HISA
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                By default, all savings are invested at your expected return rate
              </p>

              {profile.useAdvancedSavings && (
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </section>
    </div>
  );
}
