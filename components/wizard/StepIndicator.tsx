'use client';

import { useWizard, STEP_CONFIG, WizardStep } from './WizardProvider';
import { CheckIcon } from '@/components/shared';

const INPUT_STEPS: WizardStep[] = ['welcome', 'financial', 'rent', 'buy', 'review'];

export function StepIndicator() {
  const { currentStep, stepIndex, maxVisitedStep, setStep } = useWizard();

  // Don't show step indicator on results page
  if (currentStep === 'results') {
    return null;
  }

  return (
    <nav aria-label="Progress" className="w-full">
      {/* Desktop version */}
      <ol className="hidden md:flex items-center justify-center gap-2">
        {INPUT_STEPS.map((step, index) => {
          const config = STEP_CONFIG[step];
          const isCurrent = step === currentStep;
          const isCompleted = index < stepIndex;
          const isAccessible = index <= maxVisitedStep;

          return (
            <li key={step} className="flex items-center">
              {index > 0 && (
                <div 
                  className={`w-12 h-0.5 mx-1 transition-colors ${
                    isCompleted ? 'bg-accent' : 'bg-border'
                  }`} 
                />
              )}
              <button
                onClick={() => isAccessible && setStep(step)}
                disabled={!isAccessible}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                  ${isCurrent 
                    ? 'bg-accent text-accent-foreground shadow-sm' 
                    : isCompleted
                      ? 'bg-accent/10 text-accent hover:bg-accent/20'
                      : isAccessible
                        ? 'bg-secondary text-secondary-foreground hover:bg-stone-200'
                        : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
                  }
                `}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className={`
                  flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold
                  ${isCurrent 
                    ? 'bg-white/20' 
                    : isCompleted 
                      ? 'bg-accent text-accent-foreground' 
                      : 'bg-stone-300 text-stone-600'
                  }
                `}>
                  {isCompleted ? (
                    <CheckIcon className="w-3.5 h-3.5" strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="text-sm font-medium">{config.shortTitle}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Mobile version - simplified */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Step {stepIndex + 1} of {INPUT_STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {STEP_CONFIG[currentStep].title}
          </span>
        </div>
        <div className="flex gap-1">
          {INPUT_STEPS.map((step, index) => (
            <button
              key={step}
              onClick={() => index <= maxVisitedStep && setStep(step)}
              disabled={index > maxVisitedStep}
              className={`
                flex-1 h-2 rounded-full transition-colors
                ${index < stepIndex 
                  ? 'bg-accent' 
                  : index === stepIndex 
                    ? 'bg-accent' 
                    : 'bg-border'
                }
                ${index <= maxVisitedStep ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}
              `}
              aria-label={`Go to ${STEP_CONFIG[step].title}`}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
