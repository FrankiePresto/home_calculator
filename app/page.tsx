'use client';

import { WizardLayout, useWizard } from '@/components/wizard';
import { WelcomeStep, FinancialStep, RentStep, BuyStep, ReviewStep } from '@/components/steps';
import { ResultsDashboard } from '@/components/results';

function WizardContent() {
  const { currentStep } = useWizard();

  switch (currentStep) {
    case 'welcome':
      return <WelcomeStep />;
    case 'financial':
      return <FinancialStep />;
    case 'rent':
      return <RentStep />;
    case 'buy':
      return <BuyStep />;
    case 'review':
      return <ReviewStep />;
    case 'results':
      return <ResultsDashboard />;
    default:
      return <WelcomeStep />;
  }
}

export default function Home() {
  return (
    <WizardLayout>
      <WizardContent />
    </WizardLayout>
  );
}
