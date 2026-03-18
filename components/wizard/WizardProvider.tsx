'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type WizardStep = 'welcome' | 'financial' | 'rent' | 'buy' | 'review' | 'results';

interface WizardContextType {
  currentStep: WizardStep;
  stepIndex: number;
  maxVisitedStep: number;
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToResults: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  isLastInputStep: boolean;
}

const STEPS: WizardStep[] = ['welcome', 'financial', 'rent', 'buy', 'review', 'results'];
const INPUT_STEPS: WizardStep[] = ['welcome', 'financial', 'rent', 'buy', 'review'];

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [maxVisitedStep, setMaxVisitedStep] = useState(0);

  const stepIndex = STEPS.indexOf(currentStep);
  const canGoPrev = stepIndex > 0 && currentStep !== 'results';
  const canGoNext = stepIndex < INPUT_STEPS.length - 1;
  const isLastInputStep = currentStep === 'review';

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const setStep = useCallback((step: WizardStep) => {
    const newIndex = STEPS.indexOf(step);
    setCurrentStep(step);
    setMaxVisitedStep((prev) => Math.max(prev, newIndex));
    scrollToTop();
  }, [scrollToTop]);

  const nextStep = useCallback(() => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < INPUT_STEPS.length) {
      const next = STEPS[nextIndex];
      setCurrentStep(next);
      setMaxVisitedStep((prev) => Math.max(prev, nextIndex));
      scrollToTop();
    }
  }, [stepIndex, scrollToTop]);

  const prevStep = useCallback(() => {
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1]);
      scrollToTop();
    }
  }, [stepIndex, scrollToTop]);

  const goToResults = useCallback(() => {
    setCurrentStep('results');
    setMaxVisitedStep(STEPS.length - 1);
    scrollToTop();
  }, [scrollToTop]);

  return (
    <WizardContext.Provider
      value={{
        currentStep,
        stepIndex,
        maxVisitedStep,
        setStep,
        nextStep,
        prevStep,
        goToResults,
        canGoNext,
        canGoPrev,
        isLastInputStep,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}

export const STEP_CONFIG = {
  welcome: {
    title: 'Welcome',
    description: 'Get started',
    shortTitle: 'Start',
  },
  financial: {
    title: 'Your Finances',
    description: 'Income & savings',
    shortTitle: 'Finances',
  },
  rent: {
    title: 'Rent Scenario',
    description: 'Current rent details',
    shortTitle: 'Rent',
  },
  buy: {
    title: 'Buy Scenario',
    description: 'Property details',
    shortTitle: 'Buy',
  },
  review: {
    title: 'Review & Calculate',
    description: 'Final settings',
    shortTitle: 'Review',
  },
  results: {
    title: 'Results',
    description: 'Your analysis',
    shortTitle: 'Results',
  },
} as const;
