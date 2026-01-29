'use client';

import { useStore } from '@/lib/store';
import { CurrencyInput, PercentInput } from '@/components/shared';

export function RentScenarioForm() {
  const scenario = useStore((state) => state.rentScenario);
  const setScenario = useStore((state) => state.setRentScenario);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
        <h2 className="text-lg font-semibold text-gray-900">Rent Scenario</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CurrencyInput
          id="monthly-rent"
          label="Monthly Rent"
          value={scenario.monthlyRent}
          onChange={(value) => setScenario({ monthlyRent: value })}
          min={0}
          step={100}
        />

        <PercentInput
          id="rent-increase"
          label="Annual Rent Increase"
          value={scenario.annualRentIncrease}
          onChange={(value) => setScenario({ annualRentIncrease: value })}
          min={0}
          max={10}
          step={0.5}
          helpText="Typical market increase is 3%"
        />

        <CurrencyInput
          id="renters-insurance"
          label="Renter's Insurance"
          value={scenario.rentersInsurance}
          onChange={(value) => setScenario({ rentersInsurance: value })}
          min={0}
          step={10}
          helpText="Monthly cost"
        />
      </div>
    </div>
  );
}
