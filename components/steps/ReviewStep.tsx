'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { SelectInput, InfoTooltip } from '@/components/shared';
import { formatCurrency } from '@/lib/utils/formatters';
import { calculateMonthlyMortgagePayment } from '@/lib/engine/mortgage';
import { LifeEventsTimeline } from '@/components/inputs/LifeEventsTimeline';

export function ReviewStep() {
  const profile = useStore((state) => state.financialProfile);
  const rentScenario = useStore((state) => state.rentScenario);
  const buyScenario = useStore((state) => state.buyScenario);
  const buyScenario2 = useStore((state) => state.buyScenario2);
  const settings = useStore((state) => state.settings);
  const setTimeframe = useStore((state) => state.setTimeframe);
  const lifeEvents = useStore((state) => state.lifeEvents);
  
  const [showLifeEvents, setShowLifeEvents] = useState(lifeEvents.length > 0);

  // Calculate key metrics for summary
  const downPayment = buyScenario.purchasePrice * (buyScenario.downPaymentPercent / 100);
  const closingCosts = buyScenario.purchasePrice * ((buyScenario.closingCostPercent ?? 3) / 100);
  const totalUpfront = downPayment + closingCosts;
  const canAfford = profile.currentInvestmentPortfolio >= totalUpfront;

  // Monthly mortgage using engine function
  const principal = buyScenario.purchasePrice - downPayment;
  const monthlyMortgage = calculateMonthlyMortgagePayment(
    principal,
    buyScenario.interestRate,
    buyScenario.amortizationYears
  );
  
  const monthlyOwnershipCosts = 
    monthlyMortgage +
    buyScenario.monthlyPropertyTax +
    buyScenario.monthlyHomeInsurance +
    buyScenario.monthlyStrataFees +
    buyScenario.monthlyUtilities +
    buyScenario.monthlyMaintenance;

  const monthlyRentCosts = rentScenario.monthlyRent + rentScenario.rentersInsurance;

  const timeframeOptions = [
    { value: 5, label: '5 years' },
    { value: 10, label: '10 years' },
    { value: 15, label: '15 years' },
    { value: 20, label: '20 years' },
    { value: 25, label: '25 years' },
    { value: 30, label: '30 years' },
  ];

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Summary */}
        <SummaryCard
          title="Your Finances"
          icon={<WalletIcon className="w-5 h-5" />}
          items={[
            { 
              label: profile.incomeType === 'dual' ? 'Household Income' : 'Annual Income', 
              value: formatCurrency(profile.annualGrossIncome + (profile.secondaryIncome || 0)) 
            },
            { label: 'Current Savings', value: formatCurrency(profile.currentInvestmentPortfolio) },
            { label: 'Savings Rate', value: `${profile.savingsRate}%` },
          ]}
        />

        {/* Rent Summary */}
        <SummaryCard
          title="Rent Scenario"
          icon={<RentIcon className="w-5 h-5" />}
          color="info"
          items={[
            { label: 'Monthly Rent', value: formatCurrency(rentScenario.monthlyRent) },
            { label: 'Total Monthly', value: formatCurrency(monthlyRentCosts) },
            { label: 'Annual Increase', value: `${rentScenario.annualRentIncrease}%` },
          ]}
        />

        {/* Buy Summary */}
        <SummaryCard
          title={buyScenario.name || 'Buy Scenario'}
          icon={<HomeIcon className="w-5 h-5" />}
          color="success"
          items={[
            { label: 'Purchase Price', value: formatCurrency(buyScenario.purchasePrice) },
            { label: 'Down Payment', value: `${buyScenario.downPaymentPercent}% (${formatCurrency(downPayment)})` },
            { label: 'Total Monthly', value: formatCurrency(monthlyOwnershipCosts) },
          ]}
          warning={!canAfford ? `Need ${formatCurrency(totalUpfront - profile.currentInvestmentPortfolio)} more for down payment` : undefined}
        />
      </div>

      {/* Second Buy Scenario Summary if exists */}
      {buyScenario2 && (
        <SummaryCard
          title={buyScenario2.name || 'Property B'}
          icon={<HomeIcon className="w-5 h-5" />}
          color="purple"
          items={[
            { label: 'Purchase Price', value: formatCurrency(buyScenario2.purchasePrice) },
            { label: 'Down Payment', value: `${buyScenario2.downPaymentPercent}%` },
            { 
              label: 'Total Monthly', 
              value: formatCurrency(
                calculateMonthlyMortgagePayment(
                  buyScenario2.purchasePrice * (1 - buyScenario2.downPaymentPercent / 100),
                  buyScenario2.interestRate,
                  buyScenario2.amortizationYears
                ) +
                buyScenario2.monthlyPropertyTax +
                buyScenario2.monthlyHomeInsurance +
                buyScenario2.monthlyStrataFees +
                buyScenario2.monthlyUtilities +
                buyScenario2.monthlyMaintenance
              ) 
            },
          ]}
        />
      )}

      {/* Analysis Settings */}
      <section className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="section-header">Analysis Settings</h3>
          <InfoTooltip content="Choose how far into the future to project. Longer timeframes show more compound growth effects." />
        </div>

        <div className="max-w-xs">
          <SelectInput
            id="timeframe"
            label="Time Horizon"
            value={settings.timeframeYears}
            onChange={(value) => setTimeframe(value as number)}
            options={timeframeOptions}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Results will show projections over this period
          </p>
        </div>
      </section>

      {/* Life Events (Optional) */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="section-header">Life Events</h3>
            <span className="text-xs text-muted-foreground">(Optional)</span>
          </div>
          <button
            onClick={() => setShowLifeEvents(!showLifeEvents)}
            className="text-sm text-accent hover:text-accent/80 transition-colors"
          >
            {showLifeEvents ? 'Hide' : 'Add Life Events'}
          </button>
        </div>

        {showLifeEvents ? (
          <div className="mt-4">
            <LifeEventsTimeline />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Model future expenses like weddings, kids, or income changes to see how they affect your decision.
          </p>
        )}
      </section>

      {/* Ready to Calculate */}
      <section className="bg-accent/5 border border-accent/20 rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Ready to See Your Results?</h3>
        <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
          Click Calculate below to generate a comprehensive analysis comparing renting vs buying over {settings.timeframeYears} years.
        </p>
        {!canAfford && (
          <p className="text-sm text-warning mb-4">
            Note: You may not have enough savings for the down payment, but we will still show the analysis.
          </p>
        )}
      </section>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  icon: React.ReactNode;
  items: { label: string; value: string }[];
  color?: 'default' | 'info' | 'success' | 'purple';
  warning?: string;
}

function SummaryCard({ title, icon, items, color = 'default', warning }: SummaryCardProps) {
  const colorClasses = {
    default: 'bg-card',
    info: 'bg-info/5 border-info/20',
    success: 'bg-success/5 border-success/20',
    purple: 'bg-purple-500/5 border-purple-500/20',
  };

  const iconColorClasses = {
    default: 'text-foreground',
    info: 'text-info',
    success: 'text-success',
    purple: 'text-purple-500',
  };

  return (
    <div className={`rounded-xl p-5 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className={iconColorClasses[color]}>{icon}</span>
        <h3 className="font-medium text-foreground">{title}</h3>
      </div>
      <dl className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between">
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="text-sm font-medium text-foreground tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
      {warning && (
        <p className="mt-3 text-xs text-warning">{warning}</p>
      )}
    </div>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  );
}

function RentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}
