import { AccountingData, FixedAsset } from "../types";

export function calculateAssetDepreciation(asset: Omit<FixedAsset, "depreciation" | "closingBalance">): {
  depreciation: number;
  closingBalance: number;
} {
  const { openingBalance, additionUpTo180Days, additionAfter180Days, sales, rateOfDep } = asset;

  // Base for full rate depreciation
  let fullBase = openingBalance + additionUpTo180Days - sales;
  let halfBase = additionAfter180Days;

  if (fullBase < 0) {
    const remainingSales = -fullBase;
    fullBase = 0;
    halfBase = Math.max(0, additionAfter180Days - remainingSales);
  }

  const depFull = (fullBase * rateOfDep) / 100;
  const depHalf = (halfBase * (rateOfDep / 2)) / 100;
  const depreciation = depFull + depHalf;

  const totalValueBeforeDep = openingBalance + additionUpTo180Days + additionAfter180Days - sales;
  const closingBalance = Math.max(0, totalValueBeforeDep - depreciation);

  return {
    depreciation: Math.round(depreciation * 100) / 100,
    closingBalance: Math.round(closingBalance * 100) / 100,
  };
}

export interface AccountingReport {
  // Trading Account
  totalDirectExpenses: number;
  grossProfit: number;

  // Profit & Loss
  calculatedFixedAssets: FixedAsset[];
  totalDepreciation: number;
  totalIndirectExpenses: number;
  totalIndirectIncomes: number;
  netProfit: number;

  // Balance Sheet - Liabilities
  capitalClosingBalance: number;
  totalSecuredLoans: number;
  totalUnsecuredLoans: number;
  totalCurrentLiabilities: number;
  totalLiabilities: number;

  // Balance Sheet - Assets
  totalFixedAssetsVal: number;
  totalInvestments: number;
  totalCurrentAssets: number;
  totalAssets: number;

  // Audit / Balance Check
  isBalanced: boolean;
  difference: number;
}

export function generateAccountingReport(data: AccountingData): AccountingReport {
  // 1. Calculate Fixed Assets Depreciation and closing values first
  const calculatedFixedAssets = data.fixedAssets.map((asset) => {
    const { depreciation, closingBalance } = calculateAssetDepreciation(asset);
    return {
      ...asset,
      depreciation,
      closingBalance,
    };
  });

  const totalDepreciation = calculatedFixedAssets.reduce((sum, fa) => sum + fa.depreciation, 0);

  // 2. Trading Account Calculations
  const totalDirectExpenses = data.directExpenses.reduce((sum, item) => sum + item.amount, 0);
  const tradingCreditTotal = data.sales + data.closingStock;
  const tradingDebitBeforeGP = data.openingStock + data.purchases + totalDirectExpenses;
  const grossProfit = tradingCreditTotal - tradingDebitBeforeGP;

  // 3. Profit & Loss Account Calculations
  const baseIndirectExpenses = data.indirectExpenses.reduce((sum, item) => sum + item.amount, 0);
  // Total indirect expenses includes calculated depreciation
  const totalIndirectExpenses = baseIndirectExpenses + totalDepreciation;
  const totalIndirectIncomes = data.indirectIncomes.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = (grossProfit + totalIndirectIncomes) - totalIndirectExpenses;

  // 4. Balance Sheet Calculations
  // Liabilities
  const capitalClosingBalance = data.capitalOpeningBalance + netProfit - data.withdrawals - data.taxesPaid;
  const totalSecuredLoans = data.securedLoans.reduce((sum, item) => sum + item.amount, 0);
  const totalUnsecuredLoans = data.unsecuredLoans.reduce((sum, item) => sum + item.amount, 0);
  const totalCurrentLiabilities = data.sundryCreditors + data.dutiesAndTaxes + data.expensesPayable;
  const totalLiabilities = capitalClosingBalance + totalSecuredLoans + totalUnsecuredLoans + totalCurrentLiabilities;

  // Assets
  const totalFixedAssetsVal = calculatedFixedAssets.reduce((sum, fa) => sum + fa.closingBalance, 0);
  const totalInvestments = data.investments.reduce((sum, item) => sum + item.amount, 0);
  
  // Current assets = closingStock + sundryDebtors + cashInHand + totalBank + loansAndAdvances
  const totalBank = data.bankAccounts.reduce((sum, item) => sum + item.amount, 0);
  const totalCurrentAssets = data.closingStock + data.sundryDebtors + data.cashInHand + totalBank + data.loansAndAdvances;
  
  const totalAssets = totalFixedAssetsVal + totalInvestments + totalCurrentAssets;

  // Difference / Balance check
  const difference = Math.round((totalLiabilities - totalAssets) * 100) / 100;
  const isBalanced = Math.abs(difference) < 0.01;

  return {
    totalDirectExpenses,
    grossProfit,
    calculatedFixedAssets,
    totalDepreciation,
    totalIndirectExpenses,
    totalIndirectIncomes,
    netProfit,
    capitalClosingBalance,
    totalSecuredLoans,
    totalUnsecuredLoans,
    totalCurrentLiabilities,
    totalLiabilities,
    totalFixedAssetsVal,
    totalInvestments,
    totalCurrentAssets,
    totalAssets,
    isBalanced,
    difference,
  };
}
