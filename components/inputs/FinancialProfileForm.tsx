'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { CurrencyInput, PercentInput, SliderInput } from '@/components/shared';
import { formatCurrency } from '@/lib/utils/formatters';
import { FinancialProfile } from '@/lib/engine/types';
import { calculateTotalTax, calculateHouseholdTax, SUPPORTED_PROVINCES, Province } from '@/lib/engine/taxes';

// Calculate monthly cash flow preview
function calculateDiscretionaryPreview(profile: FinancialProfile) {
  const monthlyGrossIncome = profile.annualGrossIncome / 12;
  // Note: This preview uses gross income. Once taxes are enabled, it will use net income.
  const discretionaryIncome = monthlyGrossIncome - profile.monthlyNonHousingExpenses;
  const savingsAmount = discretionaryIncome * (profile.savingsRate / 100);
  const remainingForSpending = discretionaryIncome - savingsAmount;

  return {
    monthlyGrossIncome,
    discretionaryIncome,
    savingsAmount,
    remainingForSpending,
  };
}

function DiscretionaryPreview({ profile }: { profile: FinancialProfile }) {
  const rentScenario = useStore((state) => state.rentScenario);

  // Calculate total household gross income
  const isDualIncome = profile.incomeType === 'dual' && profile.secondaryIncome > 0;
  const totalGrossIncome = profile.annualGrossIncome + (isDualIncome ? profile.secondaryIncome : 0);
  const monthlyGrossIncome = totalGrossIncome / 12;

  // Apply taxes if enabled
  let monthlyNetIncome = monthlyGrossIncome;
  let taxInfo = null;
  if (profile.includeTaxes) {
    const province = (profile.province || 'ON') as Province;
    if (isDualIncome) {
      const householdTax = calculateHouseholdTax(profile.annualGrossIncome, profile.secondaryIncome, province);
      monthlyNetIncome = householdTax.netIncome / 12;
      taxInfo = householdTax;
    } else {
      const taxResult = calculateTotalTax(profile.annualGrossIncome, province);
      monthlyNetIncome = taxResult.netIncome / 12;
      taxInfo = taxResult;
    }
  }

  const monthlyHousing = rentScenario.monthlyRent + rentScenario.rentersInsurance;
  const discretionaryWithRent = monthlyNetIncome - monthlyHousing - profile.monthlyNonHousingExpenses;
  const savingsWithRent = Math.max(0, discretionaryWithRent * (profile.savingsRate / 100));
  const remainingAfterSavings = discretionaryWithRent - savingsWithRent;

  const isLow = remainingAfterSavings < 200;
  const isNegative = discretionaryWithRent < 0;

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-sm font-medium text-blue-900 mb-3">
        Monthly Cash Flow Preview (with rent{profile.includeTaxes ? ', after tax' : ''})
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-blue-600">{profile.includeTaxes ? 'Net Income' : 'Gross Income'}</p>
          <p className="font-semibold text-blue-900">{formatCurrency(monthlyNetIncome)}</p>
          {taxInfo && (
            <p className="text-xs text-blue-500">
              ({taxInfo.effectiveRate.toFixed(1)}% tax)
            </p>
          )}
        </div>
        <div>
          <p className="text-blue-600">Housing + Expenses</p>
          <p className="font-semibold text-blue-900">-{formatCurrency(monthlyHousing + profile.monthlyNonHousingExpenses)}</p>
        </div>
        <div>
          <p className="text-blue-600">Savings ({profile.savingsRate}%)</p>
          <p className="font-semibold text-blue-900">-{formatCurrency(savingsWithRent)}</p>
        </div>
        <div>
          <p className="text-blue-600">Remaining</p>
          <p className={`font-semibold ${isNegative ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-600'}`}>
            {formatCurrency(remainingAfterSavings)}
          </p>
        </div>
      </div>

      {isNegative && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800">
          <strong>Warning:</strong> Your expenses exceed your income. Reduce expenses or savings rate.
        </div>
      )}

      {!isNegative && isLow && (
        <div className="mt-3 p-2 bg-amber-100 border border-amber-300 rounded text-sm text-amber-800">
          <strong>Note:</strong> Only {formatCurrency(remainingAfterSavings)}/mo left after savings.
          Consider if this allows for gifts, vacations, dining out, and unexpected expenses.
        </div>
      )}
    </div>
  );
}

export function FinancialProfileForm() {
  const profile = useStore((state) => state.financialProfile);
  const setProfile = useStore((state) => state.setFinancialProfile);
  const [showTaxSettings, setShowTaxSettings] = useState(profile.includeTaxes || false);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Your Financial Profile
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <CurrencyInput
            id="annual-income"
            label={profile.incomeType === 'dual' ? 'Primary Income' : 'Annual Gross Income'}
            value={profile.annualGrossIncome}
            onChange={(value) => setProfile({ annualGrossIncome: value })}
            min={0}
            step={5000}
            helpText="Pre-tax annual income"
          />
          <div className="mt-2">
            <label className="inline-flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={profile.incomeType === 'dual'}
                onChange={(e) => setProfile({
                  incomeType: e.target.checked ? 'dual' : 'single',
                  secondaryIncome: e.target.checked ? profile.secondaryIncome || 75000 : 0,
                })}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
              />
              Dual income household
            </label>
          </div>
        </div>

        {profile.incomeType === 'dual' && (
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
          helpText="Food, transport, entertainment, etc."
        />

        <CurrencyInput
          id="investment-portfolio"
          label="Current Investment Portfolio"
          value={profile.currentInvestmentPortfolio}
          onChange={(value) => setProfile({ currentInvestmentPortfolio: value })}
          min={0}
          step={5000}
          helpText="Liquid investments available for down payment"
        />

        <PercentInput
          id="investment-return"
          label="Expected Investment Return"
          value={profile.expectedInvestmentReturn}
          onChange={(value) => setProfile({ expectedInvestmentReturn: value })}
          min={0}
          max={15}
          step={0.5}
          helpText="Long-term equity average is ~7%"
        />

        <PercentInput
          id="annual-raise"
          label="Annual Raise"
          value={profile.annualRaisePercent}
          onChange={(value) => setProfile({ annualRaisePercent: value })}
          min={0}
          max={10}
          step={0.5}
          helpText="Expected annual income growth"
        />

        <div className="md:col-span-2 lg:col-span-1">
          <SliderInput
            id="savings-rate"
            label="Savings Rate"
            value={profile.savingsRate}
            onChange={(value) => setProfile({ savingsRate: value })}
            min={0}
            max={100}
            step={5}
            helpText="% of discretionary income saved"
          />
        </div>
      </div>

      {/* Discretionary Spending Preview */}
      <DiscretionaryPreview profile={profile} />

      {/* Advanced Savings Section */}
      <div className="mt-4 border-t pt-4">
        <div className="flex items-start gap-3">
          <input
            id="use-advanced-savings"
            type="checkbox"
            checked={profile.useAdvancedSavings || false}
            onChange={(e) => setProfile({ useAdvancedSavings: e.target.checked })}
            className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <div className="flex-1">
            <label htmlFor="use-advanced-savings" className="text-sm font-medium text-gray-700 cursor-pointer">
              Use Advanced Savings Split
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              {profile.useAdvancedSavings
                ? 'Savings are split between investments and HISA based on settings below'
                : 'All savings go to investments at your expected investment return rate'}
            </p>
          </div>
        </div>

        {profile.useAdvancedSavings && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-4">
              Split your savings between invested (stocks/ETFs) and non-invested (HISA/emergency fund).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SliderInput
                id="non-invested-rate"
                label="Non-Invested Savings %"
                value={profile.nonInvestedSavingsRate || 0}
                onChange={(value) => setProfile({ nonInvestedSavingsRate: value })}
                min={0}
                max={100}
                step={5}
                helpText="% of savings kept in HISA/cash"
              />

              <PercentInput
                id="hisa-return"
                label="HISA Return Rate"
                value={profile.nonInvestedReturnRate || 2}
                onChange={(value) => setProfile({ nonInvestedReturnRate: value })}
                min={0}
                max={10}
                step={0.25}
                helpText="Expected return on non-invested savings"
              />
            </div>

            {(profile.nonInvestedSavingsRate || 0) > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                <strong>Split:</strong> {100 - (profile.nonInvestedSavingsRate || 0)}% invested at {profile.expectedInvestmentReturn}% |{' '}
                {profile.nonInvestedSavingsRate}% HISA at {profile.nonInvestedReturnRate || 2}%
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tax Settings Section */}
      <div className="mt-4 border-t pt-4">
        <button
          type="button"
          onClick={() => setShowTaxSettings(!showTaxSettings)}
          className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <svg
            className={`mr-2 h-4 w-4 transform transition-transform ${showTaxSettings ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Tax Settings (Canadian 2026)
        </button>

        {showTaxSettings && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="flex items-center">
                <input
                  id="include-taxes"
                  type="checkbox"
                  checked={profile.includeTaxes || false}
                  onChange={(e) => setProfile({ includeTaxes: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="include-taxes" className="ml-2 text-sm font-medium text-gray-700">
                  Include income taxes in calculations
                </label>
              </div>
            </div>

            {profile.includeTaxes && (
              <div className="mt-4">
                <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                  Province
                </label>
                <select
                  id="province"
                  value={profile.province || 'ON'}
                  onChange={(e) => setProfile({ province: e.target.value })}
                  className="block w-full max-w-xs rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
                >
                  {SUPPORTED_PROVINCES.map((prov) => (
                    <option key={prov.value} value={prov.value}>
                      {prov.label}
                    </option>
                  ))}
                </select>

                {/* Tax Summary */}
                <TaxSummary profile={profile} province={(profile.province || 'ON') as Province} />
              </div>
            )}

            <p className="mt-3 text-xs text-gray-500">
              Uses 2026 Canadian federal and provincial tax brackets. Does not include deductions, credits, or CPP/EI contributions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TaxSummary({ profile, province }: { profile: FinancialProfile; province: Province }) {
  const isDualIncome = profile.incomeType === 'dual' && profile.secondaryIncome > 0;

  if (isDualIncome) {
    const householdTax = calculateHouseholdTax(profile.annualGrossIncome, profile.secondaryIncome, province);
    const totalGross = profile.annualGrossIncome + profile.secondaryIncome;

    return (
      <div className="mt-4 p-3 bg-white rounded border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Household Tax Summary ({formatCurrency(totalGross)} total)
        </h4>

        {/* Individual breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-gray-500 mb-1">Primary ({formatCurrency(profile.annualGrossIncome)})</p>
            <p className="text-gray-700">
              Tax: {formatCurrency(householdTax.primaryResult.total)} ({householdTax.primaryResult.effectiveRate.toFixed(1)}%)
            </p>
            <p className="text-green-600 font-medium">
              Net: {formatCurrency(householdTax.primaryResult.netIncome)}
            </p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-gray-500 mb-1">Secondary ({formatCurrency(profile.secondaryIncome)})</p>
            <p className="text-gray-700">
              Tax: {formatCurrency(householdTax.secondaryResult.total)} ({householdTax.secondaryResult.effectiveRate.toFixed(1)}%)
            </p>
            <p className="text-green-600 font-medium">
              Net: {formatCurrency(householdTax.secondaryResult.netIncome)}
            </p>
          </div>
        </div>

        {/* Combined totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm border-t pt-3">
          <div>
            <p className="text-gray-500">Total Tax</p>
            <p className="font-semibold text-gray-900">{formatCurrency(householdTax.total)}</p>
          </div>
          <div>
            <p className="text-gray-500">Household Net</p>
            <p className="font-semibold text-green-600">{formatCurrency(householdTax.netIncome)}</p>
          </div>
          <div>
            <p className="text-gray-500">Effective Rate</p>
            <p className="font-semibold text-gray-900">{householdTax.effectiveRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-500">Tax Savings</p>
            <p className="font-semibold text-blue-600">
              {formatCurrency(calculateTotalTax(totalGross, province).total - householdTax.total)}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Tax savings shows benefit of dual income vs single earner at same total income.
        </p>
      </div>
    );
  }

  // Single income
  const taxResult = calculateTotalTax(profile.annualGrossIncome, province);

  return (
    <div className="mt-4 p-3 bg-white rounded border border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Tax Summary for {formatCurrency(profile.annualGrossIncome)}</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Federal Tax</p>
          <p className="font-semibold text-gray-900">{formatCurrency(taxResult.federal)}</p>
        </div>
        <div>
          <p className="text-gray-500">Provincial Tax</p>
          <p className="font-semibold text-gray-900">{formatCurrency(taxResult.provincial)}</p>
        </div>
        <div>
          <p className="text-gray-500">Net Income</p>
          <p className="font-semibold text-green-600">{formatCurrency(taxResult.netIncome)}</p>
        </div>
        <div>
          <p className="text-gray-500">Effective Rate</p>
          <p className="font-semibold text-gray-900">{taxResult.effectiveRate.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}
