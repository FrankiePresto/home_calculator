'use client';

import { useWizard } from '@/components/wizard';
import { useStore } from '@/lib/store';

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
      <div className="text-left bg-secondary/50 rounded-xl p-6 mb-8">
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

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function BreakevenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
    </svg>
  );
}

function InsightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
