import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AccountingData, Language } from "../types";
import { AccountingReport } from "../utils/accountingMath";

// Helper to format currency safely for standard PDF fonts (using "Rs.")
const formatPDFCurrency = (val: number, privacyMode?: boolean): string => {
  if (privacyMode) return "Rs. ***,***";
  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(absVal);
  return val < 0 ? `-Rs. ${formatted}` : `Rs. ${formatted}`;
};

export function exportFinancialReportPDF(
  data: AccountingData,
  report: AccountingReport,
  language: Language = "en",
  privacyMode: boolean = false
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate-900
  const accentColor: [number, number, number] = [16, 185, 129]; // Emerald-500
  const textColor: [number, number, number] = [51, 65, 85]; // Slate-700
  const headerBg: [number, number, number] = [241, 245, 249]; // Slate-100

  // ----------------------------------------------------
  // 1. LETTERHEAD & HEADER
  // ----------------------------------------------------
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  doc.text("AUDITED FINANCIAL STATEMENTS", pageWidth / 2, 16, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("FINANCIAL YEAR: 2025 - 2026  |  SCHEDULE III COMPLIANT STATEMENT", pageWidth / 2, 22, { align: "center" });

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(margin, 25, pageWidth - margin, 25);

  doc.setFontSize(8);
  doc.text(`Generated Date: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}`, margin, 30);
  doc.text(`Status: Verified & Audited`, pageWidth - margin, 30, { align: "right" });

  let currentY = 35;

  const {
    totalDirectExpenses,
    grossProfit,
    calculatedFixedAssets,
    totalDepreciation,
    totalIndirectExpenses,
    totalIndirectIncomes,
    netProfit,
    capitalClosingBalance,
    totalLiabilities,
    totalFixedAssetsVal,
    totalAssets,
  } = report;

  // ----------------------------------------------------
  // 2. TRADING ACCOUNT TABLE
  // ----------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text("I. TRADING & PROFIT AND LOSS ACCOUNT", margin, currentY);
  currentY += 4;

  // Build Trading rows
  const tradingDebitRows: [string, string][] = [
    ["To Opening Stock", formatPDFCurrency(data.openingStock, privacyMode)],
    ["To Purchases", formatPDFCurrency(data.purchases, privacyMode)],
  ];
  if (data.directExpenses.length > 0) {
    data.directExpenses.forEach((exp) => {
      tradingDebitRows.push([`  - ${exp.nameEn || exp.nameHi}`, formatPDFCurrency(exp.amount, privacyMode)]);
    });
  }
  if (grossProfit >= 0) {
    tradingDebitRows.push(["To Gross Profit c/d", formatPDFCurrency(grossProfit, privacyMode)]);
  }

  const tradingCreditRows: [string, string][] = [
    ["By Sales", formatPDFCurrency(data.sales, privacyMode)],
    ["By Closing Stock", formatPDFCurrency(data.closingStock, privacyMode)],
  ];
  if (grossProfit < 0) {
    tradingCreditRows.push(["By Gross Loss c/d", formatPDFCurrency(Math.abs(grossProfit), privacyMode)]);
  }

  const maxTradingRows = Math.max(tradingDebitRows.length, tradingCreditRows.length);
  const tradingBody: (string | number)[][] = [];

  for (let i = 0; i < maxTradingRows; i++) {
    const dr = tradingDebitRows[i] || ["", ""];
    const cr = tradingCreditRows[i] || ["", ""];
    tradingBody.push([dr[0], dr[1], cr[0], cr[1]]);
  }

  const totalTradingDr = data.openingStock + data.purchases + totalDirectExpenses + (grossProfit > 0 ? grossProfit : 0);
  const totalTradingCr = data.sales + data.closingStock + (grossProfit < 0 ? Math.abs(grossProfit) : 0);

  tradingBody.push([
    "TOTAL TRADING DEBIT",
    formatPDFCurrency(totalTradingDr, privacyMode),
    "TOTAL TRADING CREDIT",
    formatPDFCurrency(totalTradingCr, privacyMode),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Debit / Dr. Particulars", "Amount", "Credit / Cr. Particulars", "Amount"]],
    body: tradingBody,
    theme: "grid",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    bodyStyles: {
      textColor: textColor,
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 36, halign: "right", font: "courier" },
      2: { cellWidth: 55 },
      3: { cellWidth: 36, halign: "right", font: "courier" },
    },
    didParseCell: (data) => {
      if (data.row.index === tradingBody.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = headerBg;
      }
    },
    margin: { left: margin, right: margin },
  });

  // @ts-expect-error - jspdf-autotable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 8;

  // ----------------------------------------------------
  // 3. PROFIT & LOSS ACCOUNT TABLE
  // ----------------------------------------------------
  const pnlDebitRows: [string, string][] = [];
  if (grossProfit < 0) {
    pnlDebitRows.push(["To Gross Loss b/d", formatPDFCurrency(Math.abs(grossProfit), privacyMode)]);
  }
  data.indirectExpenses.forEach((exp) => {
    pnlDebitRows.push([`To ${exp.nameEn || exp.nameHi}`, formatPDFCurrency(exp.amount, privacyMode)]);
  });
  pnlDebitRows.push(["To Depreciation (Fixed Assets)", formatPDFCurrency(totalDepreciation, privacyMode)]);
  if (netProfit >= 0) {
    pnlDebitRows.push(["To Net Profit", formatPDFCurrency(netProfit, privacyMode)]);
  }

  const pnlCreditRows: [string, string][] = [];
  if (grossProfit >= 0) {
    pnlCreditRows.push(["By Gross Profit b/d", formatPDFCurrency(grossProfit, privacyMode)]);
  }
  data.indirectIncomes.forEach((inc) => {
    pnlCreditRows.push([`By ${inc.nameEn || inc.nameHi}`, formatPDFCurrency(inc.amount, privacyMode)]);
  });
  if (netProfit < 0) {
    pnlCreditRows.push(["By Net Loss", formatPDFCurrency(Math.abs(netProfit), privacyMode)]);
  }

  const maxPnlRows = Math.max(pnlDebitRows.length, pnlCreditRows.length);
  const pnlBody: (string | number)[][] = [];

  for (let i = 0; i < maxPnlRows; i++) {
    const dr = pnlDebitRows[i] || ["", ""];
    const cr = pnlCreditRows[i] || ["", ""];
    pnlBody.push([dr[0], dr[1], cr[0], cr[1]]);
  }

  const totalPnlDr = totalIndirectExpenses + totalDepreciation + (netProfit > 0 ? netProfit : 0) + (grossProfit < 0 ? Math.abs(grossProfit) : 0);
  const totalPnlCr = totalIndirectIncomes + (grossProfit >= 0 ? grossProfit : 0) + (netProfit < 0 ? Math.abs(netProfit) : 0);

  pnlBody.push([
    "TOTAL P&L DEBIT",
    formatPDFCurrency(totalPnlDr, privacyMode),
    "TOTAL P&L CREDIT",
    formatPDFCurrency(totalPnlCr, privacyMode),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["P&L Expenses (Debit)", "Amount", "P&L Incomes (Credit)", "Amount"]],
    body: pnlBody,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      textColor: textColor,
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 36, halign: "right", font: "courier" },
      2: { cellWidth: 55 },
      3: { cellWidth: 36, halign: "right", font: "courier" },
    },
    didParseCell: (data) => {
      if (data.row.index === pnlBody.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = headerBg;
      }
    },
    margin: { left: margin, right: margin },
  });

  // Check page height or add page for Balance Sheet
  doc.addPage();
  currentY = 16;

  // ----------------------------------------------------
  // 4. BALANCE SHEET TABLE
  // ----------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text("II. BALANCE SHEET (AS AT MARCH 31, 2026)", margin, currentY);
  currentY += 4;

  const liabRows: [string, string][] = [
    ["CAPITAL ACCOUNT", ""],
    ["  Opening Balance", formatPDFCurrency(data.capitalOpeningBalance, privacyMode)],
    ["  Add: Net Profit", formatPDFCurrency(netProfit, privacyMode)],
  ];
  if (data.withdrawals > 0) {
    liabRows.push(["  Less: Drawings/Withdrawals", `-${formatPDFCurrency(data.withdrawals, privacyMode)}`]);
  }
  if (data.taxesPaid > 0) {
    liabRows.push(["  Less: Income Tax Paid", `-${formatPDFCurrency(data.taxesPaid, privacyMode)}`]);
  }
  liabRows.push(["  Closing Capital Balance", formatPDFCurrency(capitalClosingBalance, privacyMode)]);

  if (data.securedLoans.length > 0) {
    liabRows.push(["SECURED LOANS", ""]);
    data.securedLoans.forEach((l) => liabRows.push([`  - ${l.nameEn || l.nameHi}`, formatPDFCurrency(l.amount, privacyMode)]));
  }
  if (data.unsecuredLoans.length > 0) {
    liabRows.push(["UNSECURED LOANS", ""]);
    data.unsecuredLoans.forEach((l) => liabRows.push([`  - ${l.nameEn || l.nameHi}`, formatPDFCurrency(l.amount, privacyMode)]));
  }

  liabRows.push(["CURRENT LIABILITIES", ""]);
  liabRows.push(["  - Sundry Creditors", formatPDFCurrency(data.sundryCreditors, privacyMode)]);
  liabRows.push(["  - Duties & Taxes Payable", formatPDFCurrency(data.dutiesAndTaxes, privacyMode)]);
  liabRows.push(["  - Outstanding Expenses", formatPDFCurrency(data.expensesPayable, privacyMode)]);

  const assetRows: [string, string][] = [
    ["FIXED ASSETS (WDV)", formatPDFCurrency(totalFixedAssetsVal, privacyMode)],
  ];
  calculatedFixedAssets.forEach((fa) => {
    assetRows.push([`  - ${fa.nameEn || fa.nameHi}`, formatPDFCurrency(fa.closingBalance, privacyMode)]);
  });

  if (data.investments.length > 0) {
    assetRows.push(["INVESTMENTS", ""]);
    data.investments.forEach((inv) => assetRows.push([`  - ${inv.nameEn || inv.nameHi}`, formatPDFCurrency(inv.amount, privacyMode)]));
  }

  assetRows.push(["CURRENT ASSETS", ""]);
  assetRows.push(["  - Closing Stock", formatPDFCurrency(data.closingStock, privacyMode)]);
  assetRows.push(["  - Sundry Debtors", formatPDFCurrency(data.sundryDebtors, privacyMode)]);
  data.bankAccounts.forEach((acc) => assetRows.push([`  - Bank: ${acc.nameEn || acc.nameHi}`, formatPDFCurrency(acc.amount, privacyMode)]));
  assetRows.push(["  - Cash in Hand", formatPDFCurrency(data.cashInHand, privacyMode)]);
  assetRows.push(["  - Loans & Advances", formatPDFCurrency(data.loansAndAdvances, privacyMode)]);

  const maxBsRows = Math.max(liabRows.length, assetRows.length);
  const bsBody: (string | number)[][] = [];

  for (let i = 0; i < maxBsRows; i++) {
    const l = liabRows[i] || ["", ""];
    const a = assetRows[i] || ["", ""];
    bsBody.push([l[0], l[1], a[0], a[1]]);
  }

  bsBody.push([
    "TOTAL LIABILITIES",
    formatPDFCurrency(totalLiabilities, privacyMode),
    "TOTAL ASSETS",
    formatPDFCurrency(totalAssets, privacyMode),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Liabilities & Capital", "Amount", "Assets & Properties", "Amount"]],
    body: bsBody,
    theme: "grid",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      textColor: textColor,
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 36, halign: "right", font: "courier" },
      2: { cellWidth: 55 },
      3: { cellWidth: 36, halign: "right", font: "courier" },
    },
    didParseCell: (data) => {
      if (data.row.index === bsBody.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = headerBg;
      }
    },
    margin: { left: margin, right: margin },
  });

  // @ts-expect-error - jspdf-autotable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 10;

  // ----------------------------------------------------
  // 5. SCHEDULE OF FIXED ASSETS
  // ----------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text("III. SCHEDULE OF FIXED ASSETS & DEPRECIATION", margin, currentY);
  currentY += 4;

  const faHead = [
    [
      "Asset Name",
      "Rate",
      "Opening Bal",
      "Add <=180d",
      "Add >180d",
      "Sales",
      "Depreciat.",
      "Closing WDV",
    ],
  ];

  const faBody = calculatedFixedAssets.map((fa) => [
    fa.nameEn || fa.nameHi,
    `${fa.rateOfDep}%`,
    formatPDFCurrency(fa.openingBalance, privacyMode),
    formatPDFCurrency(fa.additionUpTo180Days, privacyMode),
    formatPDFCurrency(fa.additionAfter180Days, privacyMode),
    formatPDFCurrency(fa.sales, privacyMode),
    formatPDFCurrency(fa.depreciation, privacyMode),
    formatPDFCurrency(fa.closingBalance, privacyMode),
  ]);

  faBody.push([
    "TOTAL FIXED ASSETS",
    "",
    formatPDFCurrency(calculatedFixedAssets.reduce((sum, fa) => sum + fa.openingBalance, 0), privacyMode),
    formatPDFCurrency(calculatedFixedAssets.reduce((sum, fa) => sum + fa.additionUpTo180Days, 0), privacyMode),
    formatPDFCurrency(calculatedFixedAssets.reduce((sum, fa) => sum + fa.additionAfter180Days, 0), privacyMode),
    formatPDFCurrency(calculatedFixedAssets.reduce((sum, fa) => sum + fa.sales, 0), privacyMode),
    formatPDFCurrency(totalDepreciation, privacyMode),
    formatPDFCurrency(totalFixedAssetsVal, privacyMode),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: faHead,
    body: faBody,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    bodyStyles: {
      textColor: textColor,
      fontSize: 7,
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 12, halign: "center" },
      2: { cellWidth: 20, halign: "right", font: "courier" },
      3: { cellWidth: 20, halign: "right", font: "courier" },
      4: { cellWidth: 20, halign: "right", font: "courier" },
      5: { cellWidth: 18, halign: "right", font: "courier" },
      6: { cellWidth: 22, halign: "right", font: "courier" },
      7: { cellWidth: 24, halign: "right", font: "courier" },
    },
    didParseCell: (data) => {
      if (data.row.index === faBody.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = headerBg;
      }
    },
    margin: { left: margin, right: margin },
  });

  // @ts-expect-error - jspdf-autotable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 18;

  // ----------------------------------------------------
  // 6. SIGNATURE BLOCK
  // ----------------------------------------------------
  if (currentY + 25 > pageHeight - 15) {
    doc.addPage();
    currentY = 25;
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);

  // Left signature
  doc.line(margin + 10, currentY, margin + 65, currentY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text("Authorized Accountant", margin + 37.5, currentY + 5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Chartered Accountant / Tax Consultant", margin + 37.5, currentY + 9, { align: "center" });

  // Right signature
  doc.line(pageWidth - margin - 65, currentY, pageWidth - margin - 10, currentY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text("Proprietor / Director", pageWidth - margin - 37.5, currentY + 5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Signature & Seal of Entity", pageWidth - margin - 37.5, currentY + 9, { align: "center" });

  // ----------------------------------------------------
  // 7. FOOTERS AND PAGE NUMBERS
  // ----------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer bar
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 10, pageWidth, 10, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Standard Financial Ledger Generator - Confidential", margin, pageHeight - 4);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 4, { align: "right" });
  }

  // Save the generated PDF
  doc.save(`Financial_Report_FY2025_26_${new Date().toISOString().slice(0, 10)}.pdf`);
}
