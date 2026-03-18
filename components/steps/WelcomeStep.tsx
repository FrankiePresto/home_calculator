'use client';

import { useWizard } from '@/components/wizard';
import { useStore } from '@/lib/store';
import { HomeIcon, ChartIcon, BreakevenIcon, InsightIcon, CheckIcon } from '@/components/shared';

export function WelcomeStep() {
  const { setStep } = useWizard();
  const savedScenarios = useStore((state) => state.savedScenarios);
  const loadScenario = useStore((state) => state.loadScenario);

  return (
    <div className="text-center max-w-2xl mx-auto">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 mb-6">
          <HomeIcon className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
          Should You Rent or Buy?
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Get a clear, personalized analysis comparing the true costs of renting versus buying 
          a home over time. Make confident decisions backed by real numbers.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <FeatureCard
          icon={<ChartIcon className="w-6 h-6" />}
          title="Net Worth Projection"
          description="See how each choice impacts your wealth over 5-30 years"
        />
        <FeatureCard
          icon={<BreakevenIcon className="w-6 h-6" />}
          title="Breakeven Analysis"
          description="Find when buying becomes financially advantageous"
        />
        <FeatureCard
          icon={<InsightIcon className="w-6 h-6" />}
          title="Personalized Insights"
          description="Get tailored recommendations based on your situation"
        />
      </div>

      {/* Saved Scenarios */}
      {savedScenarios.length > 0 && (
        <div className="mb-8 p-6 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-medium text-foreground mb-3">
            Continue where you left off
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {savedScenarios.slice(0, 3).map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => {
                  loadScenario(scenario.id);
                  setStep('financial');
                }}
                className="px-4 py-2 text-sm bg-secondary hover:bg-stone-200 text-secondary-foreground rounded-lg transition-colors"
              >
                {scenario.name}
              </button>
            ))}
            {savedScenarios.length > 3 && (
              <span className="px-4 py-2 text-sm text-muted-foreground">
                +{savedScenarios.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* What you'll need */}
      <div className="text-left bg-secondary/50 rounded-xl p-6">
        <h3 className="font-medium text-foreground mb-3">What you will need</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckIcon className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span>Your annual income and current savings</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span>Your current or expected monthly rent</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span>Details about a property you are considering (price, down payment)</span>
          </li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Takes about 5 minutes. Your data stays in your browser.
        </p>
      </div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="p-5 bg-card border border-border rounded-xl text-left">
      <div className="text-accent mb-3">{icon}</div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
