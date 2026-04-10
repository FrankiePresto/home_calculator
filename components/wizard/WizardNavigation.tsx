'use client';

import { useWizard, STEP_CONFIG } from './WizardProvider';
import { useStore } from '@/lib/store';
import { ArrowLeftIcon, ArrowRightIcon, CalculateIcon, SpinnerIcon } from '@/components/shared';

interface WizardNavigationProps {
  onCalculate?: () => void;
}

export function WizardNavigation({ onCalculate }: WizardNavigationProps) {
  const { currentStep, nextStep, prevStep, canGoNext, canGoPrev, isLastInputStep, goToResults } = useWizard();
  const calculate = useStore((state) => state.calculate);
  const isCalculating = useStore((state) => state.isCalculating);

  // Don't show navigation on welcome or results page
  if (currentStep === 'welcome' || currentStep === 'results') {
    return null;
  }

  const handleCalculate = () => {
    calculate();
    goToResults();
    onCalculate?.();
  };

  return (
    <div className="flex items-center justify-between pt-8 mt-8 border-t border-border">
      {/* Back button */}
      <div>
        {canGoPrev && (
          <button
            onClick={prevStep}
            className="btn-ghost flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}
      </div>

      {/* Next / Calculate button */}
      <div className="flex items-center gap-3">
        {isLastInputStep ? (
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="btn-primary flex items-center gap-2"
          >
            {isCalculating ? (
              <>
                <SpinnerIcon className="w-4 h-4 animate-spin" />
                <span>Calculating...</span>
              </>
            ) : (
              <>
                <CalculateIcon className="w-4 h-4" />
                <span>Calculate Results</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={nextStep}
            disabled={!canGoNext}
            className="btn-primary flex items-center gap-2"
          >
            <span>Continue</span>
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
