import { AccountingData } from "./types";

export const initialAccountingData: AccountingData = {
  openingStock: 150000,
  purchases: 1200000,
  directExpenses: [
    { id: "dir-1", nameEn: "Freight & Carriage", nameHi: "भाड़ा और ढुलाई", amount: 25000 },
    { id: "dir-2", nameEn: "Wages", nameHi: "मजदूरी", amount: 80000 },
    { id: "dir-3", nameEn: "Factory Electricity", nameHi: "कारखाना बिजली", amount: 15000 },
    { id: "dir-4", nameEn: "Loading / Unloading", nameHi: "चढ़ाई / उतराई खर्च", amount: 10000 }
  ],
  sales: 200000, // wait, sales should be 2000000 (20 Lakhs)
  closingStock: 240000,
  indirectExpenses: [
    { id: "ind-1", nameEn: "Staff Salary", nameHi: "कर्मचारी वेतन", amount: 240000 },
    { id: "ind-2", nameEn: "Bank Charges", nameHi: "बैंक शुल्क", amount: 4500 },
    { id: "ind-3", nameEn: "Audit Fees", nameHi: "ऑडिट शुल्क", amount: 15000 },
    { id: "ind-4", nameEn: "Printing & Stationery", nameHi: "मुद्रण और स्टेशनरी", amount: 8500 },
    { id: "ind-5", nameEn: "Office Rent", nameHi: "कार्यालय किराया", amount: 60000 }
  ],
  indirectIncomes: [
    { id: "inc-1", nameEn: "Discount Received", nameHi: "प्राप्त छूट", amount: 12000 },
    { id: "inc-2", nameEn: "Miscellaneous Income", nameHi: "विविध आय", amount: 8000 }
  ],

  // Balance Sheet - Liabilities
  capitalOpeningBalance: 1500000,
  withdrawals: 50000,
  taxesPaid: 24000,
  securedLoans: [
    { id: "sec-1", nameEn: "HDFC Bank Cash Credit (CC)", nameHi: "एचडीएफसी बैंक कैश क्रेडिट (CC)", amount: 250000 },
    { id: "sec-2", nameEn: "ICICI Car Loan", nameHi: "आईसीआईसीआई कार लोन", amount: 120000 }
  ],
  unsecuredLoans: [
    { id: "unsec-1", nameEn: "Loan from Director", nameHi: "निदेशक से ऋण", amount: 150000 }
  ],
  sundryCreditors: 185000,
  dutiesAndTaxes: 42000,
  expensesPayable: 23000,

  // Balance Sheet - Assets
  fixedAssets: [
    {
      id: "fa-1",
      nameEn: "Land",
      nameHi: "भूमि",
      rateOfDep: 0,
      openingBalance: 500000,
      additionUpTo180Days: 0,
      additionAfter180Days: 0,
      sales: 0,
      depreciation: 0,
      closingBalance: 500000
    },
    {
      id: "fa-2",
      nameEn: "Factory Building",
      nameHi: "कारखाना भवन",
      rateOfDep: 10,
      openingBalance: 800000,
      additionUpTo180Days: 50000,
      additionAfter180Days: 100000,
      sales: 0,
      depreciation: 0,
      closingBalance: 0
    },
    {
      id: "fa-3",
      nameEn: "Plant & Machinery",
      nameHi: "प्लांट एवं मशीनरी",
      rateOfDep: 15,
      openingBalance: 300000,
      additionUpTo180Days: 80000,
      additionAfter180Days: 40000,
      sales: 20000,
      depreciation: 0,
      closingBalance: 0
    },
    {
      id: "fa-4",
      nameEn: "Office Computers",
      nameHi: "कार्यालय कंप्यूटर",
      rateOfDep: 40,
      openingBalance: 50000,
      additionUpTo180Days: 0,
      additionAfter180Days: 20000,
      sales: 0,
      depreciation: 0,
      closingBalance: 0
    },
    {
      id: "fa-5",
      nameEn: "Delivery Vehicles",
      nameHi: "वितरण वाहन",
      rateOfDep: 15,
      openingBalance: 180000,
      additionUpTo180Days: 0,
      additionAfter180Days: 0,
      sales: 0,
      depreciation: 0,
      closingBalance: 0
    }
  ],
  investments: [
    { id: "inv-1", nameEn: "SBI Fixed Deposit", nameHi: "एसबीआई सावधि जमा (FD)", amount: 100000 }
  ],
  sundryDebtors: 120000,
  cashInHand: 18000,
  bankAccounts: [
    { id: "bnk-1", nameEn: "HDFC Current Account", nameHi: "एचडीएफसी चालू खाता", amount: 55000 }
  ],
  loansAndAdvances: 15000
};

// Adjust sales to be exactly 20,00,000 (2000000) instead of 200000
initialAccountingData.sales = 2000000;
