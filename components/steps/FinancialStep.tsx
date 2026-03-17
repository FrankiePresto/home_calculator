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
  const [showAdvanced, setShowAdvanced] = useState(profile.includeTaxes || profile.useAdvancedSavings || false);

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
      <section className="bg-accent/5 border border-accent/20 rounded-xl p-8">
        <h3 className="text-base font-semibold text-foreground mb-6">
          Monthly Income Preview {profile.includeTaxes ? '(after tax)' : '(before tax)'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-4 bg-card rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-2">
              {profile.includeTaxes ? 'Net Income' : 'Gross Income'}
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {formatCurrency(monthlyNetIncome)}
            </p>
          </div>
          <div className="text-center p-4 bg-card rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-2">Non-Housing Expenses</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              -{formatCurrency(profile.monthlyNonHousingExpenses)}
            </p>
          </div>
          <div className="text-center p-4 bg-card rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-2">Available for Housing + Savings</p>
            <p className={`text-2xl font-bold tabular-nums ${discretionaryBeforeHousing < 500 ? 'text-warning' : 'text-success'}`}>
              {formatCurrency(discretionaryBeforeHousing)}
            </p>
          </div>
        </div>
        <p className="mt-6 text-sm text-muted-foreground text-center">
          Housing costs will be entered in the next step.
        </p>
        {discretionaryBeforeHousing < 0 && (
          <p className="mt-3 text-sm text-destructive text-center">
            Your expenses exceed your income. Adjust your numbers above.
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
              <p className="text-xs text-muted-foreground">Canadian taxes, HISA vs investment split</p>
            </div>
          </div>
          <ChevronIcon className={`w-5 h-5 text-accent transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
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
      </section>
    </div>
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

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
