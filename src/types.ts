export interface ExpenseItem {
  id: string;
  nameEn: string;
  nameHi: string;
  amount: number;
  isDepreciation?: boolean;
}

export interface IncomeItem {
  id: string;
  nameEn: string;
  nameHi: string;
  amount: number;
}

export interface LoanItem {
  id: string;
  nameEn: string;
  nameHi: string;
  amount: number;
}

export interface InvestmentItem {
  id: string;
  nameEn: string;
  nameHi: string;
  amount: number;
}

export interface BankItem {
  id: string;
  nameEn: string;
  nameHi: string;
  amount: number;
}

export interface FixedAsset {
  id: string;
  nameEn: string;
  nameHi: string;
  rateOfDep: number; // e.g. 15 for 15%
  openingBalance: number;
  additionUpTo180Days: number;
  additionAfter180Days: number;
  sales: number;
  depreciation: number; // calculated
  closingBalance: number; // calculated
}

export interface AccountingData {
  // Trading P&L
  openingStock: number;
  purchases: number;
  directExpenses: ExpenseItem[];
  sales: number;
  closingStock: number;
  indirectExpenses: ExpenseItem[];
  indirectIncomes: IncomeItem[];

  // Balance Sheet - Liabilities
  capitalOpeningBalance: number;
  withdrawals: number;
  taxesPaid: number;
  securedLoans: LoanItem[];
  unsecuredLoans: LoanItem[];
  sundryCreditors: number;
  dutiesAndTaxes: number;
  expensesPayable: number;

  // Balance Sheet - Assets
  fixedAssets: FixedAsset[];
  investments: InvestmentItem[];
  sundryDebtors: number;
  cashInHand: number;
  bankAccounts: BankItem[];
  loansAndAdvances: number;
}

export type Language = "en" | "hi";
