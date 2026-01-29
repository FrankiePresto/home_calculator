# **Home Purchase Analyzer v2**

## **Comprehensive Project Documentation for Claude Code**

---

## **Executive Summary**

A financial simulation tool that answers: **"Should I rent or buy, and at what price point does buying make sense?"**

The app models a user's entire financial life—including existing investments, future income growth, and life events—to determine the true opportunity cost of homeownership. It compares renting vs. buying scenarios over time, showing clear breakeven analysis, net worth projections, cash flow visualization, and sensitivity analysis.

**Core Philosophy:** Track the long-term delta in total net worth between "Buying" and "Renting" scenarios, with full transparency into where money flows.

---

## **Core Questions the App Answers**

1. **Time Breakeven**: How long must I live in a home before buying beats renting?  
2. **Price Breakeven**: At what purchase price does buying become better/worse than renting?  
3. **Rent Threshold**: What rent would make buying equivalent to renting at X years?  
4. **Net Worth Impact**: How does each scenario affect my total wealth over time?  
5. **Cash Flow Reality**: Where does my money actually go? (Sunk costs vs. wealth building)  
6. **Sensitivity**: How do changes in rates, appreciation, or rent increases affect the outcome?

---

## **Technical Architecture**

### **Stack**

* **Framework:** React / Next.js (App Router)  
* **Styling:** Tailwind CSS \+ Shadcn UI  
* **State Management:** Zustand (shared scenario state across components)  
* **Visualizations:** Recharts (line charts, bar charts) \+ Custom Sankey diagram  
* **Persistence:** localStorage (MVP)

### **Architecture Principles**

* **Modular Domain-Driven Design**: Core math in standalone TypeScript modules  
* **Testable Engine**: All financial calculations isolated in `/lib/engine/`  
* **Atomic Decomposition**: Build one component/hook at a time, verify before moving on  
* **Strict Typing**: Every financial input and output explicitly typed

### **File Structure**

home-purchase-analyzer/  
├── app/  
│   ├── page.tsx                    \# Main application page  
│   ├── layout.tsx                  \# Root layout  
│   └── globals.css                 \# Tailwind imports  
├── components/  
│   ├── inputs/  
│   │   ├── FinancialProfileForm.tsx  
│   │   ├── RentScenarioForm.tsx  
│   │   ├── BuyScenarioForm.tsx  
│   │   ├── LifeEventsTimeline.tsx  
│   │   └── ui/                     \# Shadcn components  
│   ├── results/  
│   │   ├── InsightCards.tsx  
│   │   ├── NetWorthChart.tsx  
│   │   ├── CashFlowSankey.tsx  
│   │   ├── SensitivityChart.tsx  
│   │   ├── SunkCostComparison.tsx  
│   │   └── BreakevenDisplay.tsx  
│   └── shared/  
│       ├── CurrencyInput.tsx  
│       ├── PercentInput.tsx  
│       └── SliderInput.tsx  
├── lib/  
│   ├── engine/  
│   │   ├── types.ts                \# All TypeScript interfaces  
│   │   ├── mortgage.ts             \# Payment, amortization calculations  
│   │   ├── investment.ts           \# Compound growth calculations  
│   │   ├── projection.ts           \# Year-by-year net worth projection  
│   │   ├── breakeven.ts            \# Breakeven calculations  
│   │   ├── sensitivity.ts          \# Sensitivity analysis  
│   │   └── cashflow.ts             \# Cash flow categorization for Sankey  
│   ├── store.ts                    \# Zustand store  
│   └── utils/  
│       ├── formatters.ts           \# Currency, percent formatting  
│       └── validators.ts           \# Input validation  
├── \_\_tests\_\_/  
│   ├── mortgage.test.ts  
│   ├── investment.test.ts  
│   └── projection.test.ts  
└── package.json

---

## **Data Models**

### **1\. Financial Profile**

interface FinancialProfile {  
  annualGrossIncome: number;          // Pre-tax annual income  
  monthlyNonHousingExpenses: number;  // Food, transport, etc. (non-housing)  
  currentInvestmentPortfolio: number; // Current liquid investments  
  expectedInvestmentReturn: number;   // Annual % (default: 7%)  
  savingsRate: number;                // % of discretionary income invested (0-100)  
  annualRaisePercent: number;         // Expected annual income growth (default: 2%)  
}

### **2\. Rent Scenario**

interface RentScenario {  
  monthlyRent: number;  
  annualRentIncrease: number;         // % increase per year (default: 3%)  
  rentersInsurance: number;           // Monthly (default: $30)  
}

### **3\. Buy Scenario**

interface BuyScenario {  
  name: string;                       // "Downtown Condo", "Suburban House"  
    
  // Property Details  
  purchasePrice: number;  
  downPaymentPercent: number;         // 5-100%  
    
  // Closing Costs (simplified)  
  closingCostPercent: number;         // % of purchase price (default: 3%)  
  // OR  
  closingCostFlat: number;            // Flat dollar amount  
    
  // Mortgage Configuration  
  interestRate: number;               // Current rate  
  amortizationYears: number;          // 15, 20, 25, or 30  
    
  // Renewal Assumption (simplified)  
  renewalRateAssumption: number;      // Expected rate at renewal (default: same as current)  
    
  // Mortgage Insurance (if applicable)  
  mortgageInsurancePercent: number;   // % of loan amount (0 if 20%+ down, \~2-4% otherwise)  
    
  // Ongoing Costs  
  monthlyPropertyTax: number;  
  monthlyHomeInsurance: number;  
  monthlyStrataFees: number;          // Condo/HOA fees (0 if not applicable)  
  monthlyUtilities: number;  
  monthlyMaintenance: number;         // Typically 1% of home value / 12  
    
  // Appreciation  
  annualAppreciation: number;         // % (default: 3%)  
}

### **4\. Life Event (with Phase-Based Support)**

type LifeEventType \= 'one-time' | 'ongoing' | 'phase' | 'income-change';

interface LifeEvent {  
  id: string;  
  description: string;                // "Child", "Promotion", "Car Purchase"  
  type: LifeEventType;  
    
  // For one-time events  
  year?: number;                      // Which year does this occur  
  amount?: number;                    // $ value (negative \= expense)  
    
  // For ongoing events (permanent change)  
  startYear?: number;  
  monthlyAmount?: number;             // $ change per month  
    
  // For phase-based events (temporary)  
  startYear?: number;  
  endYear?: number;                   // When does it stop  
  monthlyAmount?: number;  
    
  // For income changes  
  year?: number;  
  newAnnualIncome?: number;           // New income level  
  // OR  
  percentChange?: number;             // \+15% \= promotion  
}

// Examples:  
// { type: 'one-time', year: 3, amount: \-30000, description: 'Wedding' }  
// { type: 'ongoing', startYear: 2, monthlyAmount: \-500, description: 'Car Payment' }  
// { type: 'phase', startYear: 5, endYear: 10, monthlyAmount: \-2000, description: 'Childcare' }  
// { type: 'income-change', year: 2, percentChange: 15, description: 'Promotion' }

### **5\. Projection Result (Year-by-Year)**

interface YearlySnapshot {  
  year: number;                       // 0 \= initial state, 1+ \= end of year  
    
  // Income & Expenses  
  annualIncome: number;  
  monthlyHousingCost: number;  
  monthlyNonHousingExpenses: number;  
  monthlyLifeEventAdjustment: number;  
  monthlyDiscretionary: number;  
  monthlySavings: number;  
    
  // Wealth Components  
  investmentPortfolio: number;  
  homeValue: number;                  // 0 for rent scenario  
  mortgageBalance: number;            // 0 for rent scenario  
  homeEquity: number;                 // homeValue \- mortgageBalance  
    
  // Totals  
  netWorth: number;                   // portfolio \+ equity  
    
  // Cash Flow Categories (for Sankey)  
  cashFlow: {  
    income: number;  
    toRent: number;  
    toMortgageInterest: number;  
    toMortgagePrincipal: number;  
    toPropertyTax: number;  
    toInsurance: number;  
    toMaintenance: number;  
    toStrata: number;  
    toUtilities: number;  
    toOtherExpenses: number;  
    toLifeEvents: number;  
    toInvestments: number;  
  };  
}

interface ProjectionResult {  
  scenario: 'rent' | 'buy';  
  snapshots: YearlySnapshot\[\];        // Year 0 through Year N  
}

---

## **Core Engine Logic**

### **Critical: Year 0 Initial State**

The purchase of a house has an immediate "Year 0" impact that must be explicitly modeled:

function initializeScenarios(  
  profile: FinancialProfile,  
  rentScenario: RentScenario,  
  buyScenario: BuyScenario  
): { rentYear0: YearlySnapshot; buyYear0: YearlySnapshot } {  
    
  // \=== RENT SCENARIO: Year 0 \===  
  // Full portfolio remains invested from Day 0  
  const rentYear0: YearlySnapshot \= {  
    year: 0,  
    investmentPortfolio: profile.currentInvestmentPortfolio,  
    homeValue: 0,  
    mortgageBalance: 0,  
    homeEquity: 0,  
    netWorth: profile.currentInvestmentPortfolio,  
    // ... other fields initialized  
  };  
    
  // \=== BUY SCENARIO: Year 0 \===  
  // Down payment \+ closing costs leave portfolio IMMEDIATELY  
  const downPayment \= buyScenario.purchasePrice \* (buyScenario.downPaymentPercent / 100);  
  const closingCosts \= buyScenario.closingCostPercent   
    ? buyScenario.purchasePrice \* (buyScenario.closingCostPercent / 100\)  
    : buyScenario.closingCostFlat;  
    
  const loanAmount \= buyScenario.purchasePrice \- downPayment;  
  const mortgageInsurance \= loanAmount \* (buyScenario.mortgageInsurancePercent / 100);  
  const totalLoan \= loanAmount \+ mortgageInsurance; // Insurance added to loan  
    
  const portfolioAfterPurchase \= profile.currentInvestmentPortfolio \- downPayment \- closingCosts;  
    
  const buyYear0: YearlySnapshot \= {  
    year: 0,  
    investmentPortfolio: Math.max(0, portfolioAfterPurchase),  
    homeValue: buyScenario.purchasePrice,  
    mortgageBalance: totalLoan,  
    homeEquity: downPayment, // Initial equity \= down payment only  
    netWorth: Math.max(0, portfolioAfterPurchase) \+ downPayment,  
    // Note: Net worth at Year 0 is LOWER than rent scenario by closing costs  
    // ... other fields initialized  
  };  
    
  return { rentYear0, buyYear0 };  
}

**Key Insight:** At Year 0, the renter has higher net worth by exactly the closing costs amount. The buyer must "catch up" through equity gains and/or lower ongoing costs.

### **Mortgage Payment Calculation**

**Standard Formula (never deviate):**

M \= P × \[i(1 \+ i)^n\] / \[(1 \+ i)^n \- 1\]

Where:  
  M \= Monthly payment  
  P \= Principal (loan amount)  
  i \= Monthly interest rate (annual rate / 12\)  
  n \= Total number of payments (years × 12\)

function calculateMonthlyMortgagePayment(  
  principal: number,  
  annualRate: number,  
  amortizationYears: number  
): number {  
  const monthlyRate \= annualRate / 100 / 12;  
  const numPayments \= amortizationYears \* 12;  
    
  if (monthlyRate \=== 0\) {  
    return principal / numPayments;  
  }  
    
  return principal \*   
    (monthlyRate \* Math.pow(1 \+ monthlyRate, numPayments)) /  
    (Math.pow(1 \+ monthlyRate, numPayments) \- 1);  
}

### **Investment Growth (Compound Interest)**

function growPortfolio(  
  startingBalance: number,  
  monthlyContribution: number,  
  annualReturnPercent: number,  
  months: number \= 12  
): number {  
  const monthlyRate \= annualReturnPercent / 100 / 12;  
  let balance \= startingBalance;  
    
  for (let month \= 0; month \< months; month++) {  
    balance \+= monthlyContribution;  
    balance \*= (1 \+ monthlyRate);  
  }  
    
  return balance;  
}

### **Year-by-Year Projection Engine**

function projectScenario(  
  profile: FinancialProfile,  
  scenario: RentScenario | BuyScenario,  
  lifeEvents: LifeEvent\[\],  
  timeframeYears: number  
): ProjectionResult {  
  const snapshots: YearlySnapshot\[\] \= \[\];  
  const isRent \= 'monthlyRent' in scenario;  
    
  // Initialize Year 0  
  let portfolio \= profile.currentInvestmentPortfolio;  
  let homeValue \= 0;  
  let mortgageBalance \= 0;  
  let currentIncome \= profile.annualGrossIncome;  
  let currentRent \= isRent ? scenario.monthlyRent : 0;  
  let baseMonthlyExpenses \= profile.monthlyNonHousingExpenses;  
    
  if (\!isRent) {  
    // Buy scenario: Apply Year 0 costs  
    const buyScenario \= scenario as BuyScenario;  
    const downPayment \= buyScenario.purchasePrice \* (buyScenario.downPaymentPercent / 100);  
    const closingCosts \= calculateClosingCosts(buyScenario);  
    const loanAmount \= buyScenario.purchasePrice \- downPayment;  
    const mortgageInsurance \= loanAmount \* (buyScenario.mortgageInsurancePercent / 100);  
      
    portfolio \-= (downPayment \+ closingCosts);  
    portfolio \= Math.max(0, portfolio);  
    homeValue \= buyScenario.purchasePrice;  
    mortgageBalance \= loanAmount \+ mortgageInsurance;  
  }  
    
  // Record Year 0 snapshot  
  snapshots.push(createSnapshot(0, /\* ... current state ... \*/));  
    
  // Project Year 1 through Year N  
  for (let year \= 1; year \<= timeframeYears; year++) {  
    // 1\. Apply income growth (except Year 1\)  
    if (year \> 1\) {  
      currentIncome \*= (1 \+ profile.annualRaisePercent / 100);  
    }  
      
    // 2\. Apply life events for this year  
    const {   
      oneTimeExpenses,   
      monthlyAdjustment,   
      incomeOverride   
    } \= processLifeEvents(lifeEvents, year);  
      
    if (incomeOverride \!== null) {  
      currentIncome \= incomeOverride;  
    }  
      
    // 3\. Calculate monthly housing cost  
    let monthlyHousingCost: number;  
    let mortgageInterestPaid \= 0;  
    let mortgagePrincipalPaid \= 0;  
      
    if (isRent) {  
      monthlyHousingCost \= currentRent \+ scenario.rentersInsurance;  
    } else {  
      const buyScenario \= scenario as BuyScenario;  
      const monthlyPayment \= calculateMonthlyMortgagePayment(  
        mortgageBalance,  
        getRateForYear(buyScenario, year),  
        getRemainingAmortization(buyScenario, year)  
      );  
        
      // Break down payment into interest vs principal  
      const { interest, principal } \= amortizeYear(  
        mortgageBalance,  
        getRateForYear(buyScenario, year),  
        monthlyPayment  
      );  
      mortgageInterestPaid \= interest;  
      mortgagePrincipalPaid \= principal;  
        
      monthlyHousingCost \= monthlyPayment \+  
        buyScenario.monthlyPropertyTax \+  
        buyScenario.monthlyHomeInsurance \+  
        buyScenario.monthlyStrataFees \+  
        buyScenario.monthlyUtilities \+  
        buyScenario.monthlyMaintenance;  
    }  
      
    // 4\. Calculate discretionary income  
    const monthlyIncome \= currentIncome / 12;  
    const totalMonthlyExpenses \= monthlyHousingCost \+   
      baseMonthlyExpenses \+   
      monthlyAdjustment;  
    const monthlyDiscretionary \= monthlyIncome \- totalMonthlyExpenses;  
    const monthlySavings \= Math.max(0, monthlyDiscretionary \* (profile.savingsRate / 100));  
      
    // 5\. Grow portfolio through the year  
    portfolio \= growPortfolio(portfolio, monthlySavings, profile.expectedInvestmentReturn);  
      
    // 6\. Apply one-time expenses (deduct from portfolio)  
    portfolio \= Math.max(0, portfolio \- oneTimeExpenses);  
      
    // 7\. Update home value and mortgage (buy scenario only)  
    if (\!isRent) {  
      const buyScenario \= scenario as BuyScenario;  
      homeValue \*= (1 \+ buyScenario.annualAppreciation / 100);  
      mortgageBalance \= Math.max(0, mortgageBalance \- mortgagePrincipalPaid);  
    }  
      
    // 8\. Increase rent for next year (rent scenario only)  
    if (isRent) {  
      currentRent \*= (1 \+ scenario.annualRentIncrease / 100);  
    }  
      
    // 9\. Record snapshot  
    snapshots.push(createSnapshot(year, {  
      annualIncome: currentIncome,  
      monthlyHousingCost,  
      monthlyDiscretionary,  
      monthlySavings,  
      investmentPortfolio: portfolio,  
      homeValue,  
      mortgageBalance,  
      homeEquity: homeValue \- mortgageBalance,  
      netWorth: portfolio \+ (homeValue \- mortgageBalance),  
      cashFlow: {  
        income: currentIncome,  
        toMortgageInterest: mortgageInterestPaid,  
        toMortgagePrincipal: mortgagePrincipalPaid,  
        toRent: isRent ? currentRent \* 12 : 0,  
        // ... other categories  
        toInvestments: monthlySavings \* 12,  
      }  
    }));  
  }  
    
  return { scenario: isRent ? 'rent' : 'buy', snapshots };  
}

### **Life Event Processing**

function processLifeEvents(  
  events: LifeEvent\[\],  
  currentYear: number  
): {  
  oneTimeExpenses: number;  
  monthlyAdjustment: number;  
  incomeOverride: number | null;  
} {  
  let oneTimeExpenses \= 0;  
  let monthlyAdjustment \= 0;  
  let incomeOverride: number | null \= null;  
    
  for (const event of events) {  
    switch (event.type) {  
      case 'one-time':  
        if (event.year \=== currentYear) {  
          oneTimeExpenses \+= Math.abs(event.amount || 0);  
        }  
        break;  
          
      case 'ongoing':  
        if (event.startYear && currentYear \>= event.startYear) {  
          monthlyAdjustment \+= event.monthlyAmount || 0;  
        }  
        break;  
          
      case 'phase':  
        if (event.startYear && event.endYear &&  
            currentYear \>= event.startYear && currentYear \<= event.endYear) {  
          monthlyAdjustment \+= event.monthlyAmount || 0;  
        }  
        break;  
          
      case 'income-change':  
        if (event.year \=== currentYear) {  
          if (event.newAnnualIncome) {  
            incomeOverride \= event.newAnnualIncome;  
          }  
          // Note: percentChange would be handled differently  
          // (applied to current income rather than override)  
        }  
        break;  
    }  
  }  
    
  return { oneTimeExpenses, monthlyAdjustment, incomeOverride };  
}

### **Breakeven Calculations**

function findTimeBreakeven(  
  rentSnapshots: YearlySnapshot\[\],  
  buySnapshots: YearlySnapshot\[\]  
): { year: number; month: number; exact: number } | null {  
  // Find first year where buy net worth \>= rent net worth  
  for (let i \= 1; i \< rentSnapshots.length; i++) {  
    if (buySnapshots\[i\].netWorth \>= rentSnapshots\[i\].netWorth) {  
      // Interpolate for month precision  
      if (i \=== 1\) {  
        return { year: 1, month: 0, exact: 1 };  
      }  
        
      const prevDiff \= rentSnapshots\[i-1\].netWorth \- buySnapshots\[i-1\].netWorth;  
      const currDiff \= rentSnapshots\[i\].netWorth \- buySnapshots\[i\].netWorth;  
      const fraction \= prevDiff / (prevDiff \- currDiff);  
      const exactYear \= (i \- 1\) \+ fraction;  
        
      return {  
        year: i,  
        month: Math.round(fraction \* 12),  
        exact: exactYear  
      };  
    }  
  }  
    
  return null; // Buying never breaks even within timeframe  
}

function findRentBreakeven(  
  profile: FinancialProfile,  
  buyScenario: BuyScenario,  
  lifeEvents: LifeEvent\[\],  
  targetYear: number,  
  rentIncreasePercent: number  
): number {  
  // Binary search for rent that results in same net worth at targetYear  
  let low \= 0;  
  let high \= 10000;  
  const tolerance \= 10; // Within $10/month  
    
  const buyResult \= projectScenario(profile, buyScenario, lifeEvents, targetYear);  
  const targetNetWorth \= buyResult.snapshots\[targetYear\].netWorth;  
    
  while (high \- low \> tolerance) {  
    const mid \= (low \+ high) / 2;  
    const testRentScenario: RentScenario \= {  
      monthlyRent: mid,  
      annualRentIncrease: rentIncreasePercent,  
      rentersInsurance: 30  
    };  
      
    const rentResult \= projectScenario(profile, testRentScenario, lifeEvents, targetYear);  
    const rentNetWorth \= rentResult.snapshots\[targetYear\].netWorth;  
      
    if (rentNetWorth \> targetNetWorth) {  
      low \= mid; // Rent too low, renter is too wealthy  
    } else {  
      high \= mid; // Rent too high  
    }  
  }  
    
  return Math.round((low \+ high) / 2);  
}

---

## **Cash Flow Visualization (Sankey Diagram)**

The Sankey diagram is **the most powerful decision-making visual** in the app. It shows:

* **Left side:** Annual Income  
* **Middle:** Where money flows (Housing, Expenses, Life Events)  
* **Right side:** What's left (Sunk Costs vs. Wealth Building)

### **Cash Flow Categories**

interface AnnualCashFlow {  
  // INFLOWS  
  grossIncome: number;  
    
  // OUTFLOWS \- Sunk Costs (money gone forever)  
  sunkCosts: {  
    rent: number;                    // Rent scenario only  
    mortgageInterest: number;        // Buy scenario only  
    propertyTax: number;             // Buy scenario only  
    homeInsurance: number;           // Both (different amounts)  
    maintenance: number;             // Buy scenario only  
    strataFees: number;              // Buy scenario only (if applicable)  
    utilities: number;               // Both  
    otherExpenses: number;           // Both  
    lifeEventExpenses: number;       // Both  
  };  
    
  // OUTFLOWS \- Wealth Building (money that grows or becomes equity)  
  wealthBuilding: {  
    mortgagePrincipal: number;       // Buy: becomes equity  
    investments: number;             // Both: goes to portfolio  
  };  
    
  // Summary  
  totalSunk: number;  
  totalWealth: number;  
}

### **Sankey Data Structure**

interface SankeyNode {  
  id: string;  
  label: string;  
  value: number;  
}

interface SankeyLink {  
  source: string;  
  target: string;  
  value: number;  
}

function generateSankeyData(cashFlow: AnnualCashFlow): { nodes: SankeyNode\[\]; links: SankeyLink\[\] } {  
  return {  
    nodes: \[  
      { id: 'income', label: 'Gross Income', value: cashFlow.grossIncome },  
      { id: 'housing', label: 'Housing', value: /\* sum of housing costs \*/ },  
      { id: 'expenses', label: 'Other Expenses', value: cashFlow.sunkCosts.otherExpenses },  
      { id: 'sunk', label: 'Sunk Costs', value: cashFlow.totalSunk },  
      { id: 'wealth', label: 'Wealth Building', value: cashFlow.totalWealth },  
      // ... more granular nodes as needed  
    \],  
    links: \[  
      { source: 'income', target: 'housing', value: /\* housing total \*/ },  
      { source: 'income', target: 'expenses', value: cashFlow.sunkCosts.otherExpenses },  
      { source: 'income', target: 'wealth', value: cashFlow.totalWealth },  
      { source: 'housing', target: 'sunk', value: /\* sunk housing costs \*/ },  
      { source: 'housing', target: 'wealth', value: cashFlow.wealthBuilding.mortgagePrincipal },  
      // ... more links  
    \]  
  };  
}

### **Visual Design**

┌─────────────────────────────────────────────────────────────────────┐  
│                     ANNUAL CASH FLOW: YEAR 5                        │  
├─────────────────────────────────────────────────────────────────────┤  
│                                                                     │  
│   ┌──────────┐      ┌──────────┐      ┌──────────────────────────┐ │  
│   │          │─────▶│ Housing  │─────▶│ Sunk: Interest ($12k)    │ │  
│   │          │      │ ($28k)   │─────▶│ Sunk: Tax ($6k)          │ │  
│   │  INCOME  │      └──────────┘      │ Wealth: Principal ($8k)  │ │  
│   │ ($120k)  │                        └──────────────────────────┘ │  
│   │          │─────▶┌──────────┐      ┌──────────────────────────┐ │  
│   │          │      │ Living   │─────▶│ Sunk: Food, etc ($36k)   │ │  
│   │          │      │ ($36k)   │      └──────────────────────────┘ │  
│   │          │      └──────────┘                                   │  
│   │          │─────────────────────────▶┌────────────────────────┐ │  
│   │          │                          │ Wealth: Invest ($18k)  │ │  
│   └──────────┘                          └────────────────────────┘ │  
│                                                                     │  
│   SUMMARY:  Sunk Costs: $54k (45%)  │  Wealth Building: $26k (22%)│  
└─────────────────────────────────────────────────────────────────────┘

---

## **UI Components Specification**

### **Application Layout**

┌─────────────────────────────────────────────────────────────────────┐  
│  HOME PURCHASE ANALYZER                            \[Save\] \[Load\]    │  
├─────────────────────────────────────────────────────────────────────┤  
│                                                                     │  
│  ┌─── YOUR FINANCIAL PROFILE ──────────────────────────────────────┐│  
│  │ Income | Portfolio | Expenses | Savings Rate | Investment Return││  
│  └─────────────────────────────────────────────────────────────────┘│  
│                                                                     │  
│  ┌─── SCENARIOS ───────────────────────────────────────────────────┐│  
│  │ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ││  
│  │ │  RENT SCENARIO  │  │ BUY SCENARIO A  │  │ BUY SCENARIO B  │  ││  
│  │ │  Monthly rent   │  │ Price, Down %   │  │   (Optional)    │  ││  
│  │ │  Annual increase│  │ Rate, Costs     │  │                 │  ││  
│  │ └─────────────────┘  └─────────────────┘  └─────────────────┘  ││  
│  └─────────────────────────────────────────────────────────────────┘│  
│                                                                     │  
│  ┌─── LIFE EVENTS TIMELINE ────────────────────────────────────────┐│  
│  │ \[+Add\] Year 3: Wedding (-$30k) │ Years 5-10: Childcare (-$2k/mo)││  
│  └─────────────────────────────────────────────────────────────────┘│  
│                                                                     │  
│  ┌─── ANALYSIS SETTINGS ───────────────────────────────────────────┐│  
│  │ Time Horizon: \[10▼\] years    \[CALCULATE\]                        ││  
│  └─────────────────────────────────────────────────────────────────┘│  
│                                                                     │  
│  ═══════════════════════════════════════════════════════════════════│  
│                           RESULTS                                   │  
│  ═══════════════════════════════════════════════════════════════════│  
│                                                                     │  
│  ┌─── KEY INSIGHTS ────────────────────────────────────────────────┐│  
│  │ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    ││  
│  │ │ WINNER     │ │ BREAKEVEN  │ │ NET WORTH  │ │ EQUIV RENT │    ││  
│  │ │ Renting    │ │ 8.5 years  │ │ \+$45k Buy  │ │ $2,847/mo  │    ││  
│  │ │ by $23k    │ │            │ │ at 20 yrs  │ │            │    ││  
│  │ └────────────┘ └────────────┘ └────────────┘ └────────────┘    ││  
│  └─────────────────────────────────────────────────────────────────┘│  
│                                                                     │  
│  ┌─── NET WORTH OVER TIME ─────────────────────────────────────────┐│  
│  │            📈 Interactive Line Chart                            ││  
│  │   \- Rent scenario (blue line)                                   ││  
│  │   \- Buy scenario (green line)                                   ││  
│  │   \- Breakeven point (vertical dashed line)                      ││  
│  │   \- Year 0 clearly showing initial portfolio difference         ││  
│  └─────────────────────────────────────────────────────────────────┘│  
│                                                                     │  
│  ┌─── CASH FLOW COMPARISON ────────────────────────────────────────┐│  
│  │  \[Year 5 ▼\]    \[Rent │ Buy\] toggle                              ││  
│  │            📊 Sankey Diagram                                    ││  
│  │   Income → Housing/Expenses → Sunk Costs vs Wealth Building     ││  
│  └─────────────────────────────────────────────────────────────────┘│  
│                                                                     │  
│  ┌─── SUNK COST COMPARISON ────────────────────────────────────────┐│  
│  │            📊 Stacked Bar Chart                                 ││  
│  │   Rent: \[███ Rent ███ Utilities ██ Insurance\]                   ││  
│  │   Buy:  \[██ Interest ███ Tax ██ Maint ██ Ins █ Strata\]          ││  
│  └─────────────────────────────────────────────────────────────────┘│  
│                                                                     │  
│  ┌─── SENSITIVITY ANALYSIS ────────────────────────────────────────┐│  
│  │            📊 Tornado Chart                                     ││  
│  │   Impact on breakeven year if variables change ±2%              ││  
│  │   \- Mortgage Rate                                               ││  
│  │   \- Home Appreciation                                           ││  
│  │   \- Rent Increase                                               ││  
│  │   \- Investment Return                                           ││  
│  └─────────────────────────────────────────────────────────────────┘│  
│                                                                     │  
└─────────────────────────────────────────────────────────────────────┘

### **Input Forms**

#### **Financial Profile**

| Field | Type | Default | Validation |
| ----- | ----- | ----- | ----- |
| Annual Gross Income | Currency | \- | \> 0 |
| Monthly Non-Housing Expenses | Currency | \- | ≥ 0 |
| Current Investment Portfolio | Currency | 0 | ≥ 0 |
| Expected Investment Return | Percent | 7% | 0-15% |
| Savings Rate | Slider | 50% | 0-100% |
| Annual Raise | Percent | 2% | 0-10% |

#### **Rent Scenario**

| Field | Type | Default | Validation |
| ----- | ----- | ----- | ----- |
| Monthly Rent | Currency | \- | \> 0 |
| Annual Rent Increase | Percent | 3% | 0-10% |
| Renter's Insurance | Currency | $30 | ≥ 0 |

#### **Buy Scenario**

| Field | Type | Default | Validation |
| ----- | ----- | ----- | ----- |
| Scenario Name | Text | "Property A" | Max 30 chars |
| Purchase Price | Currency | \- | \> 0 |
| Down Payment | Slider \+ % | 20% | 5-100% |
| Closing Costs | % or $ toggle | 3% | ≥ 0 |
| Mortgage Insurance | Percent | 0% (auto if \<20% down) | 0-5% |
| Interest Rate | Percent | 5% | 0-15% |
| Renewal Rate Assumption | Percent | (same as above) | 0-15% |
| Amortization | Dropdown | 25 yrs | 15/20/25/30 |
| Monthly Property Tax | Currency | \- | ≥ 0 |
| Monthly Insurance | Currency | $150 | ≥ 0 |
| Monthly Strata/HOA | Currency | 0 | ≥ 0 |
| Monthly Utilities | Currency | $200 | ≥ 0 |
| Monthly Maintenance | Currency | auto (1%/12) | ≥ 0 |
| Annual Appreciation | Percent | 3% | \-5% to 10% |

#### **Life Events**

| Column | Type | Options |
| ----- | ----- | ----- |
| Description | Text | Free text |
| Type | Dropdown | One-time, Ongoing, Phase, Income Change |
| Year / Start Year | Number | 1-40 |
| End Year (phase only) | Number | Start+1 to 40 |
| Amount | Currency / Percent | Depends on type |

**Quick Presets:**

* Child (phase: years X-X+18, \-$1,500/mo)  
* Childcare (phase: years X-X+5, \-$2,000/mo)  
* Wedding (one-time: \-$30,000)  
* New Car (one-time: \-$40,000)  
* Promotion (income: \+15%)  
* Career Change (income: new amount)

---

## **Key Results & Insights**

### **Insight Cards**

1. **Winner at Time Horizon**

   * "After 10 years: **Renting wins by $23,450**"  
   * Clear, immediate answer to the core question  
2. **Breakeven Point**

   * "Buying breaks even after **8 years, 6 months**"  
   * Or "Buying **never breaks even** in 30 years"  
3. **Net Worth at Milestone Years**

   * Show comparison at 5, 10, 20, 30 years  
   * Highlight which scenario wins at each point  
4. **Equivalent Rent**

   * "If rent were **$2,847/month**, buying and renting would be equal at 10 years"  
   * Actionable: if your rent is below this, keep renting

### **Charts**

1. **Net Worth Over Time** (Primary)

   * Multi-line chart  
   * X: Year (0 to horizon)  
   * Y: Net Worth ($)  
   * Lines: Rent, Buy A, Buy B (if applicable)  
   * Annotations: Breakeven point, Year 0 difference  
2. **Cash Flow Sankey** (Key Visual)

   * Shows money flow for selected year  
   * Toggle between Rent/Buy scenarios  
   * Highlights sunk costs vs wealth building  
3. **Sunk Cost Comparison** (Bar Chart)

   * Side-by-side stacked bars  
   * Rent: Rent \+ Insurance  
   * Buy: Interest \+ Tax \+ Insurance \+ Maintenance \+ Strata  
   * Cumulative over time option  
4. **Sensitivity Analysis** (Tornado Chart)

   * Shows how ±1% and ±2% changes affect breakeven  
   * Variables: Mortgage Rate, Appreciation, Rent Increase, Investment Return  
   * Color: Red (worse for buying) / Green (better for buying)

---

## **Sensitivity Analysis**

interface SensitivityResult {  
  variable: string;  
  baseValue: number;  
  scenarios: {  
    change: number;        // e.g., \-2, \-1, 0, \+1, \+2  
    newValue: number;      // e.g., 5% becomes 7%  
    breakevenYear: number | null;  
    netWorthDelta: number; // vs base case at horizon  
  }\[\];  
}

function runSensitivityAnalysis(  
  profile: FinancialProfile,  
  rentScenario: RentScenario,  
  buyScenario: BuyScenario,  
  lifeEvents: LifeEvent\[\],  
  timeframe: number  
): SensitivityResult\[\] {  
  const variables \= \[  
    { name: 'Mortgage Rate', key: 'interestRate', changes: \[-2, \-1, 0, 1, 2\] },  
    { name: 'Home Appreciation', key: 'annualAppreciation', changes: \[-2, \-1, 0, 1, 2\] },  
    { name: 'Rent Increase', key: 'annualRentIncrease', changes: \[-2, \-1, 0, 1, 2\] },  
    { name: 'Investment Return', key: 'expectedInvestmentReturn', changes: \[-2, \-1, 0, 1, 2\] },  
  \];  
    
  // Run projections for each variable at each change level  
  // Return structured results for tornado chart  
}

---

## **Default Values & Assumptions**

| Parameter | Default | Rationale |
| ----- | ----- | ----- |
| Investment Return | 7% | Long-term equity average (real) |
| Home Appreciation | 3% | Historical average |
| Rent Increase | 3% | Typical market increase |
| Maintenance | 1% of value/year | Industry standard |
| Closing Costs | 3% | Typical range 1.5-4% |
| Mortgage Insurance | 2.5% if \<20% down | Typical range 2-4% |
| Savings Rate | 50% | Aggressive but reasonable |
| Annual Raise | 2% | Inflation-matching |

---

## **Implementation Roadmap**

### **Phase 1: Core Math Library (Week 1\)**

**Goal:** 100% accurate calculations before any UI

* \[ \] Implement `mortgage.ts` \- payment calculation, amortization  
* \[ \] Implement `investment.ts` \- compound growth  
* \[ \] Implement `projection.ts` \- year-by-year engine with Year 0  
* \[ \] Implement `breakeven.ts` \- time and rent breakeven  
* \[ \] Write comprehensive unit tests  
* \[ \] Verify against online calculators and manual spreadsheets

### **Phase 2: State & Input Forms (Week 2\)**

**Goal:** Capture all user inputs with validation

* \[ \] Set up Zustand store with TypeScript types  
* \[ \] Build Financial Profile form  
* \[ \] Build Rent Scenario form  
* \[ \] Build Buy Scenario form (with optional second scenario)  
* \[ \] Build Life Events timeline with phase support  
* \[ \] Implement localStorage save/load

### **Phase 3: Results & Visualization (Week 3\)**

**Goal:** Display insights and charts

* \[ \] Build Insight Cards component  
* \[ \] Implement Net Worth line chart  
* \[ \] Implement Sunk Cost bar chart  
* \[ \] Implement Cash Flow Sankey diagram  
* \[ \] Build Breakeven display

### **Phase 4: Sensitivity & Polish (Week 4\)**

**Goal:** Advanced features and refinement

* \[ \] Implement sensitivity analysis engine  
* \[ \] Build Tornado chart  
* \[ \] Add tooltips and help text  
* \[ \] Mobile responsive adjustments  
* \[ \] Performance optimization  
* \[ \] Final testing

---

## **Development Rules (for Claude Code)**

### **.clauderules**

\# Home Purchase Analyzer \- Development Rules

\#\# Core Principles  
1\. BUILD INCREMENTALLY: Complete and test one module before moving to the next  
2\. NO MATH HALLUCINATIONS: Use only the documented formulas. If unsure, ask.  
3\. STRICT TYPING: Every number has a type (Currency, Percent, Years, Months)  
4\. TEST FIRST: Write unit tests before implementing complex calculations

\#\# Mortgage Formula (NEVER DEVIATE)  
M \= P × \[i(1 \+ i)^n\] / \[(1 \+ i)^n \- 1\]  
Where: P \= principal, i \= monthly rate, n \= total payments

\#\# File Organization  
\- All math in /lib/engine/ \- no calculations in components  
\- All types in /lib/engine/types.ts  
\- Components only render and dispatch actions

\#\# Validation  
\- All currency inputs: \>= 0  
\- All percent inputs: 0-100 (stored as 0-100, converted to decimal in calculations)  
\- Down payment: 5-100%  
\- Interest rate: 0-15%  
\- Years: 1-40

\#\# Testing Requirements  
\- Every function in /lib/engine/ must have corresponding tests  
\- Test edge cases: 0% interest, 100% down, 0 portfolio  
\- Compare results to known online calculators

---

## **Summary**

This document provides everything needed to build a focused, powerful home purchase analyzer:

1. **Year 0 Modeling**: Explicitly tracks the immediate opportunity cost of buying  
2. **Sankey Visualization**: Shows "where the money goes" \- sunk costs vs wealth  
3. **Phase-Based Life Events**: Handles temporary expenses like childcare (years 5-10)  
4. **Simplified Inputs**: User provides closing costs % and mortgage insurance % directly  
5. **Clear Answers**: Breakeven time, equivalent rent, sensitivity analysis

**The core question:** "Should I rent or buy?" is answered with math, not opinion.

