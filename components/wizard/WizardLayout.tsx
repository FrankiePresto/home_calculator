'use client';

import { ReactNode } from 'react';
import { WizardProvider, useWizard, STEP_CONFIG } from './WizardProvider';
import { StepIndicator } from './StepIndicator';
import { HomeIconSimple } from '@/components/shared';
import { WizardNavigation } from './WizardNavigation';
import { useStore } from '@/lib/store';

interface WizardLayoutProps {
  children: ReactNode;
}

function WizardLayoutInner({ children }: WizardLayoutProps) {
  const { currentStep, setStep } = useWizard();
  const resetAll = useStore((state) => state.resetAll);
  const results = useStore((state) => state.results);

  const isResultsPage = currentStep === 'results';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Title */}
            <button 
              onClick={() => setStep('welcome')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <HomeIconSimple className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-foreground tracking-tight">
                  Home Purchase Analyzer
                </h1>
              </div>
            </button>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isResultsPage && (
                <button
                  onClick={() => setStep('financial')}
                  className="btn-ghost text-sm"
                >
                  Edit Inputs
                </button>
              )}
              {results.lastCalculated && !isResultsPage && (
                <button
                  onClick={() => setStep('results')}
                  className="btn-ghost text-sm flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-success" />
                  View Results
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm('Reset all data and start fresh?')) {
                    resetAll();
                    setStep('welcome');
                  }
                }}
                className="btn-ghost text-sm text-muted-foreground"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      {!isResultsPage && (
        <div className="border-b border-border bg-card">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <StepIndicator />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {/* Step Header - only for input steps */}
          {!isResultsPage && currentStep !== 'welcome' && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                {STEP_CONFIG[currentStep].title}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {STEP_CONFIG[currentStep].description}
              </p>
            </div>
          )}

          {/* Step Content */}
          {children}

          {/* Navigation */}
          <WizardNavigation />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-muted-foreground text-center">
            This calculator provides estimates for educational purposes only. 
            Consult a financial advisor for personalized advice.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function WizardLayout({ children }: WizardLayoutProps) {
  return (
    <WizardProvider>
      <WizardLayoutInner>{children}</WizardLayoutInner>
    </WizardProvider>
  );
}
