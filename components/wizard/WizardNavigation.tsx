'use client';

import { useWizard, STEP_CONFIG } from './WizardProvider';
import { useStore } from '@/lib/store';

interface WizardNavigationProps {
  onCalculate?: () => void;
}

export function WizardNavigation({ onCalculate }: WizardNavigationProps) {
  const { currentStep, nextStep, prevStep, canGoNext, canGoPrev, isLastInputStep, goToResults } = useWizard();
  const calculate = useStore((state) => state.calculate);
  const isCalculating = useStore((state) => state.isCalculating);

  // Don't show navigation on results page
  if (currentStep === 'results') {
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
            <span>
              {currentStep === 'welcome' ? 'Get Started' : 'Continue'}
            </span>
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function CalculateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
