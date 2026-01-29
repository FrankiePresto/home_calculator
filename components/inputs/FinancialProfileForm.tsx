'use client';

import { useStore } from '@/lib/store';
import { CurrencyInput, PercentInput, SliderInput } from '@/components/shared';

export function FinancialProfileForm() {
  const profile = useStore((state) => state.financialProfile);
  const setProfile = useStore((state) => state.setFinancialProfile);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Your Financial Profile
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CurrencyInput
          id="annual-income"
          label="Annual Gross Income"
          value={profile.annualGrossIncome}
          onChange={(value) => setProfile({ annualGrossIncome: value })}
          min={0}
          step={5000}
          helpText="Pre-tax annual income"
        />

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
            helpText="% of discretionary income invested"
          />
        </div>
      </div>
    </div>
  );
}
