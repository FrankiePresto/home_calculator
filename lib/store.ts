/**
 * Zustand store for the Home Purchase Analyzer
 *
 * Manages all application state including:
 * - Financial profile
 * - Rent scenario
 * - Buy scenarios (up to 2)
 * - Life events
 * - Analysis settings
 * - Calculated results
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  FinancialProfile,
  RentScenario,
  BuyScenario,
  LifeEvent,
  ProjectionResult,
  BreakevenResult,
  SensitivityResult,
} from './engine/types';
import {
  projectRentScenario,
  projectBuyScenario,
  calculateBreakeven,
  runSensitivityAnalysis,
} from './engine';

// =============================================================================
// Default Values
// =============================================================================

const defaultFinancialProfile: FinancialProfile = {
  annualGrossIncome: 100000,
  monthlyNonHousingExpenses: 2000,
  currentInvestmentPortfolio: 100000,
  expectedInvestmentReturn: 7,
  savingsRate: 50,
  annualRaisePercent: 2,
  useAdvancedSavings: false,  // Default: all savings invested at investment return rate
  nonInvestedSavingsRate: 0,  // Default: all savings invested (preserves current behavior)
  nonInvestedReturnRate: 2,   // Default: 2% HISA rate
  includeTaxes: false,        // Default: taxes disabled (preserves current behavior)
  province: 'ON',             // Default: Ontario
  incomeType: 'single',       // Default: single income household
  secondaryIncome: 0,         // Default: no secondary income
};

const defaultRentScenario: RentScenario = {
  monthlyRent: 2500,
  annualRentIncrease: 3,
  rentersInsurance: 30,
};

const defaultBuyScenario: BuyScenario = {
  name: 'Property A',
  purchasePrice: 500000,
  downPaymentPercent: 20,
  closingCostPercent: 3,
  interestRate: 5,
  amortizationYears: 25,
  mortgageInsurancePercent: 0,
  monthlyPropertyTax: 350,
  monthlyHomeInsurance: 150,
  monthlyStrataFees: 0,
  monthlyUtilities: 200,
  monthlyMaintenance: 417, // ~1% of home value / 12
  annualAppreciation: 3,
};

// =============================================================================
// Store Types
// =============================================================================

interface AnalysisSettings {
  timeframeYears: number;
}

export interface SavedScenario {
  id: string;
  name: string;
  savedAt: number;
  financialProfile: FinancialProfile;
  rentScenario: RentScenario;
  buyScenario: BuyScenario;
  buyScenario2: BuyScenario | null;
  lifeEvents: LifeEvent[];
  settings: AnalysisSettings;
}

interface CalculatedResults {
  rentProjection: ProjectionResult | null;
  buyProjection: ProjectionResult | null;
  buyProjection2: ProjectionResult | null;
  breakeven: BreakevenResult | null;
  breakeven2: BreakevenResult | null;
  sensitivity: SensitivityResult[] | null;
  lastCalculated: number | null;
}

interface AppState {
  // Input Data
  financialProfile: FinancialProfile;
  rentScenario: RentScenario;
  buyScenario: BuyScenario;
  buyScenario2: BuyScenario | null;
  lifeEvents: LifeEvent[];
  settings: AnalysisSettings;

  // Saved Scenarios
  savedScenarios: SavedScenario[];

  // Calculated Results
  results: CalculatedResults;

  // UI State
  isCalculating: boolean;
  activeTab: 'inputs' | 'results';
  selectedBuyScenario: 1 | 2;
}

interface AppActions {
  // Profile Actions
  setFinancialProfile: (profile: Partial<FinancialProfile>) => void;
  resetFinancialProfile: () => void;

  // Rent Scenario Actions
  setRentScenario: (scenario: Partial<RentScenario>) => void;
  resetRentScenario: () => void;

  // Buy Scenario Actions
  setBuyScenario: (scenario: Partial<BuyScenario>) => void;
  setBuyScenario2: (scenario: Partial<BuyScenario> | null) => void;
  resetBuyScenario: () => void;
  addSecondBuyScenario: () => void;
  removeSecondBuyScenario: () => void;

  // Life Events Actions
  addLifeEvent: (event: LifeEvent) => void;
  updateLifeEvent: (id: string, event: Partial<LifeEvent>) => void;
  removeLifeEvent: (id: string) => void;
  clearLifeEvents: () => void;

  // Settings Actions
  setTimeframe: (years: number) => void;

  // Calculation Actions
  calculate: () => void;
  clearResults: () => void;

  // UI Actions
  setActiveTab: (tab: 'inputs' | 'results') => void;
  setSelectedBuyScenario: (scenario: 1 | 2) => void;

  // Persistence Actions
  resetAll: () => void;

  // Saved Scenarios Actions
  saveCurrentScenario: (name: string) => void;
  loadScenario: (id: string) => void;
  deleteScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
}

type Store = AppState & AppActions;

// =============================================================================
// Store Implementation
// =============================================================================

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // Initial State
      financialProfile: defaultFinancialProfile,
      rentScenario: defaultRentScenario,
      buyScenario: defaultBuyScenario,
      buyScenario2: null,
      lifeEvents: [],
      settings: {
        timeframeYears: 10,
      },
      savedScenarios: [],
      results: {
        rentProjection: null,
        buyProjection: null,
        buyProjection2: null,
        breakeven: null,
        breakeven2: null,
        sensitivity: null,
        lastCalculated: null,
      },
      isCalculating: false,
      activeTab: 'inputs',
      selectedBuyScenario: 1,

      // Profile Actions
      setFinancialProfile: (profile) =>
        set((state) => ({
          financialProfile: { ...state.financialProfile, ...profile },
          results: { ...state.results, lastCalculated: null },
        })),

      resetFinancialProfile: () =>
        set({
          financialProfile: defaultFinancialProfile,
          results: {
            rentProjection: null,
            buyProjection: null,
            buyProjection2: null,
            breakeven: null,
            breakeven2: null,
            sensitivity: null,
            lastCalculated: null,
          },
        }),

      // Rent Scenario Actions
      setRentScenario: (scenario) =>
        set((state) => ({
          rentScenario: { ...state.rentScenario, ...scenario },
          results: { ...state.results, lastCalculated: null },
        })),

      resetRentScenario: () =>
        set({
          rentScenario: defaultRentScenario,
          results: {
            rentProjection: null,
            buyProjection: null,
            buyProjection2: null,
            breakeven: null,
            breakeven2: null,
            sensitivity: null,
            lastCalculated: null,
          },
        }),

      // Buy Scenario Actions
      setBuyScenario: (scenario) =>
        set((state) => ({
          buyScenario: { ...state.buyScenario, ...scenario },
          results: { ...state.results, lastCalculated: null },
        })),

      setBuyScenario2: (scenario) =>
        set((state) => ({
          buyScenario2: scenario
            ? { ...(state.buyScenario2 || defaultBuyScenario), ...scenario }
            : null,
          results: { ...state.results, lastCalculated: null },
        })),

      resetBuyScenario: () =>
        set({
          buyScenario: defaultBuyScenario,
          buyScenario2: null,
          results: {
            rentProjection: null,
            buyProjection: null,
            buyProjection2: null,
            breakeven: null,
            breakeven2: null,
            sensitivity: null,
            lastCalculated: null,
          },
        }),

      addSecondBuyScenario: () =>
        set((state) => ({
          buyScenario2: {
            ...defaultBuyScenario,
            name: 'Property B',
          },
        })),

      removeSecondBuyScenario: () =>
        set({
          buyScenario2: null,
          results: {
            rentProjection: null,
            buyProjection: null,
            buyProjection2: null,
            breakeven: null,
            breakeven2: null,
            sensitivity: null,
            lastCalculated: null,
          },
        }),

      // Life Events Actions
      addLifeEvent: (event) =>
        set((state) => ({
          lifeEvents: [...state.lifeEvents, event],
          results: { ...state.results, lastCalculated: null },
        })),

      updateLifeEvent: (id, event) =>
        set((state) => ({
          lifeEvents: state.lifeEvents.map((e) =>
            e.id === id ? { ...e, ...event } : e
          ),
          results: { ...state.results, lastCalculated: null },
        })),

      removeLifeEvent: (id) =>
        set((state) => ({
          lifeEvents: state.lifeEvents.filter((e) => e.id !== id),
          results: { ...state.results, lastCalculated: null },
        })),

      clearLifeEvents: () =>
        set({
          lifeEvents: [],
          results: {
            rentProjection: null,
            buyProjection: null,
            buyProjection2: null,
            breakeven: null,
            breakeven2: null,
            sensitivity: null,
            lastCalculated: null,
          },
        }),

      // Settings Actions
      setTimeframe: (years) =>
        set((state) => ({
          settings: { ...state.settings, timeframeYears: years },
          results: { ...state.results, lastCalculated: null },
        })),

      // Calculation Actions
      calculate: () => {
        const state = get();
        set({ isCalculating: true });

        try {
          const { financialProfile, rentScenario, buyScenario, buyScenario2, lifeEvents, settings } = state;

          // Run projections
          const rentProjection = projectRentScenario(
            financialProfile,
            rentScenario,
            lifeEvents,
            settings.timeframeYears
          );

          const buyProjection = projectBuyScenario(
            financialProfile,
            buyScenario,
            lifeEvents,
            settings.timeframeYears
          );

          const buyProjection2 = buyScenario2
            ? projectBuyScenario(
                financialProfile,
                buyScenario2,
                lifeEvents,
                settings.timeframeYears
              )
            : null;

          // Calculate breakeven
          const breakeven = calculateBreakeven(
            financialProfile,
            rentScenario,
            buyScenario,
            lifeEvents,
            settings.timeframeYears
          );

          const breakeven2 = buyScenario2
            ? calculateBreakeven(
                financialProfile,
                rentScenario,
                buyScenario2,
                lifeEvents,
                settings.timeframeYears
              )
            : null;

          // Run sensitivity analysis
          const sensitivity = runSensitivityAnalysis(
            financialProfile,
            rentScenario,
            buyScenario,
            lifeEvents,
            settings.timeframeYears
          );

          set({
            results: {
              rentProjection,
              buyProjection,
              buyProjection2,
              breakeven,
              breakeven2,
              sensitivity,
              lastCalculated: Date.now(),
            },
            isCalculating: false,
            activeTab: 'results',
          });
        } catch (error) {
          console.error('Calculation error:', error);
          set({ isCalculating: false });
        }
      },

      clearResults: () =>
        set({
          results: {
            rentProjection: null,
            buyProjection: null,
            buyProjection2: null,
            breakeven: null,
            breakeven2: null,
            sensitivity: null,
            lastCalculated: null,
          },
        }),

      // UI Actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedBuyScenario: (scenario) => set({ selectedBuyScenario: scenario }),

      // Persistence Actions
      resetAll: () =>
        set({
          financialProfile: defaultFinancialProfile,
          rentScenario: defaultRentScenario,
          buyScenario: defaultBuyScenario,
          buyScenario2: null,
          lifeEvents: [],
          settings: { timeframeYears: 10 },
          results: {
            rentProjection: null,
            buyProjection: null,
            buyProjection2: null,
            breakeven: null,
            breakeven2: null,
            sensitivity: null,
            lastCalculated: null,
          },
          activeTab: 'inputs',
          selectedBuyScenario: 1,
        }),

      // Saved Scenarios Actions
      saveCurrentScenario: (name) => {
        const state = get();
        const newScenario: SavedScenario = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          savedAt: Date.now(),
          financialProfile: { ...state.financialProfile },
          rentScenario: { ...state.rentScenario },
          buyScenario: { ...state.buyScenario },
          buyScenario2: state.buyScenario2 ? { ...state.buyScenario2 } : null,
          lifeEvents: state.lifeEvents.map((e) => ({ ...e })),
          settings: { ...state.settings },
        };
        set((state) => ({
          savedScenarios: [...state.savedScenarios, newScenario],
        }));
      },

      loadScenario: (id) => {
        const state = get();
        const scenario = state.savedScenarios.find((s) => s.id === id);
        if (scenario) {
          set({
            financialProfile: { ...scenario.financialProfile },
            rentScenario: { ...scenario.rentScenario },
            buyScenario: { ...scenario.buyScenario },
            buyScenario2: scenario.buyScenario2 ? { ...scenario.buyScenario2 } : null,
            lifeEvents: scenario.lifeEvents.map((e) => ({ ...e })),
            settings: { ...scenario.settings },
            results: {
              rentProjection: null,
              buyProjection: null,
              buyProjection2: null,
              breakeven: null,
              breakeven2: null,
              sensitivity: null,
              lastCalculated: null,
            },
            activeTab: 'inputs',
          });
        }
      },

      deleteScenario: (id) =>
        set((state) => ({
          savedScenarios: state.savedScenarios.filter((s) => s.id !== id),
        })),

      renameScenario: (id, name) =>
        set((state) => ({
          savedScenarios: state.savedScenarios.map((s) =>
            s.id === id ? { ...s, name } : s
          ),
        })),
    }),
    {
      name: 'home-purchase-analyzer',
      partialize: (state) => ({
        financialProfile: state.financialProfile,
        rentScenario: state.rentScenario,
        buyScenario: state.buyScenario,
        buyScenario2: state.buyScenario2,
        lifeEvents: state.lifeEvents,
        settings: state.settings,
        savedScenarios: state.savedScenarios,
      }),
    }
  )
);

// =============================================================================
// Selector Hooks
// =============================================================================

export const useFinancialProfile = () => useStore((state) => state.financialProfile);
export const useRentScenario = () => useStore((state) => state.rentScenario);
export const useBuyScenario = () => useStore((state) => state.buyScenario);
export const useBuyScenario2 = () => useStore((state) => state.buyScenario2);
export const useLifeEvents = () => useStore((state) => state.lifeEvents);
export const useSettings = () => useStore((state) => state.settings);
export const useResults = () => useStore((state) => state.results);
export const useIsCalculating = () => useStore((state) => state.isCalculating);
export const useActiveTab = () => useStore((state) => state.activeTab);

// Helper to check if results are stale
export const useResultsStale = () =>
  useStore((state) => state.results.lastCalculated === null);

export const useSavedScenarios = () => useStore((state) => state.savedScenarios);
