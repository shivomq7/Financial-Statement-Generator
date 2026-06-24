import { useState } from "react";
import { AccountingData, Language } from "../types";
import { AccountingReport } from "../utils/accountingMath";
import { translations } from "../utils/translations";
import { Download, Printer, CheckCircle, AlertTriangle, HelpCircle, Edit } from "lucide-react";

interface ReportViewerProps {
  data: AccountingData;
  report: AccountingReport;
  language: Language;
  onPrint: () => void;
  onChange?: (data: AccountingData) => void;
  privacyMode?: boolean;
}

export default function ReportViewer({ data, report, language, onPrint, onChange, privacyMode }: ReportViewerProps) {
  const [activeTab, setActiveTab] = useState<"tpl" | "bs" | "fa">("tpl");
  const [editMode, setEditMode] = useState<boolean>(false);
  const t = translations[language];

  // Helper to format currency
  const formatCurrency = (val: number) => {
    if (privacyMode) return "₹ •••,•••";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleValueChange = (key: string, val: number, extraId?: string, subKey?: string) => {
    if (!onChange) return;
    const updated = { ...data };
    
    if (key === "openingStock") updated.openingStock = val;
    else if (key === "purchases") updated.purchases = val;
    else if (key === "sales") updated.sales = val;
    else if (key === "closingStock") updated.closingStock = val;
    else if (key === "directExpenses" && extraId) {
      updated.directExpenses = updated.directExpenses.map(item => 
        item.id === extraId ? { ...item, amount: val } : item
      );
    }
    else if (key === "indirectExpenses" && extraId) {
      updated.indirectExpenses = updated.indirectExpenses.map(item => 
        item.id === extraId ? { ...item, amount: val } : item
      );
    }
    else if (key === "indirectIncomes" && extraId) {
      updated.indirectIncomes = updated.indirectIncomes.map(item => 
        item.id === extraId ? { ...item, amount: val } : item
      );
    }
    else if (key === "capitalOpeningBalance") updated.capitalOpeningBalance = val;
    else if (key === "withdrawals") updated.withdrawals = val;
    else if (key === "taxesPaid") updated.taxesPaid = val;
    else if (key === "sundryCreditors") updated.sundryCreditors = val;
    else if (key === "dutiesAndTaxes") updated.dutiesAndTaxes = val;
    else if (key === "expensesPayable") updated.expensesPayable = val;
    else if (key === "sundryDebtors") updated.sundryDebtors = val;
    else if (key === "cashInHand") updated.cashInHand = val;
    else if (key === "loansAndAdvances") updated.loansAndAdvances = val;
    else if (key === "securedLoans" && extraId) {
      updated.securedLoans = updated.securedLoans.map(item => item.id === extraId ? { ...item, amount: val } : item);
    }
    else if (key === "unsecuredLoans" && extraId) {
      updated.unsecuredLoans = updated.unsecuredLoans.map(item => item.id === extraId ? { ...item, amount: val } : item);
    }
    else if (key === "investments" && extraId) {
      updated.investments = updated.investments.map(item => item.id === extraId ? { ...item, amount: val } : item);
    }
    else if (key === "bankAccounts" && extraId) {
      updated.bankAccounts = updated.bankAccounts.map(item => item.id === extraId ? { ...item, amount: val } : item);
    }
    else if (key === "fixedAssets" && extraId && subKey) {
      updated.fixedAssets = updated.fixedAssets.map(item => {
        if (item.id === extraId) {
          const updatedAsset = { ...item };
          if (subKey === "openingBalance") updatedAsset.openingBalance = val;
          else if (subKey === "additionUpTo180Days") updatedAsset.additionUpTo180Days = val;
          else if (subKey === "additionAfter180Days") updatedAsset.additionAfter180Days = val;
          else if (subKey === "sales") updatedAsset.sales = val;
          return updatedAsset;
        }
        return item;
      });
    }
    
    onChange(updated);
  };

  const {
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
  } = report;

  // Align T-shape rows by generating balanced arrays of rows
  // Trading & P&L Left (Debits) vs Right (Credits)
  const getTradingPLRows = () => {
    const leftRows: { label: string; amount: number | null; isHeader?: boolean; isTotal?: boolean; indent?: boolean; editKey?: string; editId?: string }[] = [];
    const rightRows: { label: string; amount: number | null; isHeader?: boolean; isTotal?: boolean; indent?: boolean; editKey?: string; editId?: string }[] = [];

    // --- TRADING ACCOUNT PART ---
    // Left (Debit)
    leftRows.push({ label: t.toOpeningStock, amount: data.openingStock, editKey: "openingStock" });
    leftRows.push({ label: t.toPurchases, amount: data.purchases, editKey: "purchases" });
    leftRows.push({ label: t.toDirectExpenses, amount: null, isHeader: true });
    data.directExpenses.forEach((exp) => {
      leftRows.push({ label: language === "en" ? exp.nameEn : exp.nameHi, amount: exp.amount, indent: true, editKey: "directExpenses", editId: exp.id });
    });
    
    // Right (Credit)
    rightRows.push({ label: t.bySales, amount: data.sales, editKey: "sales" });
    rightRows.push({ label: t.byClosingStock, amount: data.closingStock, editKey: "closingStock" });

    // Pad Trading P&L to align Gross Profit
    const tradingLeftItemsCount = leftRows.length;
    const tradingRightItemsCount = rightRows.length;
    const maxTradingCount = Math.max(tradingLeftItemsCount, tradingRightItemsCount);

    while (leftRows.length < maxTradingCount) leftRows.push({ label: "", amount: null });
    while (rightRows.length < maxTradingCount) rightRows.push({ label: "", amount: null });

    // Gross profit c/d
    if (grossProfit >= 0) {
      leftRows.push({ label: t.toGrossProfit, amount: grossProfit, isTotal: true });
      rightRows.push({ label: "", amount: null });
    } else {
      leftRows.push({ label: "", amount: null });
      rightRows.push({ label: `By Gross Loss c/d`, amount: Math.abs(grossProfit), isTotal: true });
    }

    // Trading Totals
    const tradingTotal = Math.max(
      data.openingStock + data.purchases + totalDirectExpenses + (grossProfit > 0 ? grossProfit : 0),
      data.sales + data.closingStock + (grossProfit < 0 ? Math.abs(grossProfit) : 0)
    );

    leftRows.push({ label: `${t.total} (Trading)`, amount: tradingTotal, isHeader: true });
    rightRows.push({ label: `${t.total} (Trading)`, amount: tradingTotal, isHeader: true });

    // --- PROFIT & LOSS PART ---
    // Left (Debit)
    if (grossProfit < 0) {
      leftRows.push({ label: `To Gross Loss b/d`, amount: Math.abs(grossProfit) });
    }
    leftRows.push({ label: t.toIndirectExpenses, amount: null, isHeader: true });
    data.indirectExpenses.forEach((exp) => {
      leftRows.push({ label: language === "en" ? exp.nameEn : exp.nameHi, amount: exp.amount, indent: true, editKey: "indirectExpenses", editId: exp.id });
    });
    // Add calculated depreciation row
    leftRows.push({ label: `${language === "en" ? "Depreciation" : "मूल्यह्रास"} (${t.fixedAssetsSchedule})`, amount: totalDepreciation, indent: true });

    // Right (Credit)
    if (grossProfit >= 0) {
      rightRows.push({ label: t.byGrossProfit, amount: grossProfit });
    }
    rightRows.push({ label: t.byIndirectIncomes, amount: null, isHeader: true });
    data.indirectIncomes.forEach((inc) => {
      rightRows.push({ label: language === "en" ? inc.nameEn : inc.nameHi, amount: inc.amount, indent: true, editKey: "indirectIncomes", editId: inc.id });
    });

    // Pad Profit & Loss to align Net Profit
    const plLeftCount = leftRows.length;
    const plRightCount = rightRows.length;
    const maxPlCount = Math.max(plLeftCount, plRightCount);

    while (leftRows.length < maxPlCount) leftRows.push({ label: "", amount: null });
    while (rightRows.length < maxPlCount) rightRows.push({ label: "", amount: null });

    // Net Profit
    if (netProfit >= 0) {
      leftRows.push({ label: t.toNetProfit, amount: netProfit, isTotal: true });
      rightRows.push({ label: "", amount: null });
    } else {
      leftRows.push({ label: "", amount: null });
      rightRows.push({ label: t.netLoss, amount: Math.abs(netProfit), isTotal: true });
    }

    // P&L Totals
    const plTotal = Math.max(
      totalIndirectExpenses + (netProfit > 0 ? netProfit : 0) + (grossProfit < 0 ? Math.abs(grossProfit) : 0),
      totalIndirectIncomes + (grossProfit > 0 ? grossProfit : 0) + (netProfit < 0 ? Math.abs(netProfit) : 0)
    );

    leftRows.push({ label: `${t.total} (P&L)`, amount: plTotal, isHeader: true });
    rightRows.push({ label: `${t.total} (P&L)`, amount: plTotal, isHeader: true });

    return { leftRows, rightRows };
  };

  // Balance Sheet T-shape Rows (Liabilities left, Assets right)
  const getBalanceSheetRows = () => {
    const leftRows: { label: string; amount: number | null; isHeader?: boolean; isTotal?: boolean; indent?: boolean; editKey?: string; editId?: string }[] = [];
    const rightRows: { label: string; amount: number | null; isHeader?: boolean; isTotal?: boolean; indent?: boolean; editKey?: string; editId?: string }[] = [];

    // --- LIABILITIES SIDE ---
    leftRows.push({ label: t.capitalAccount, amount: null, isHeader: true });
    leftRows.push({ label: `${t.openingBalance}`, amount: data.capitalOpeningBalance, indent: true, editKey: "capitalOpeningBalance" });
    if (netProfit >= 0) {
      leftRows.push({ label: `${t.netProfitAdd}`, amount: netProfit, indent: true });
    } else {
      leftRows.push({ label: `- Net Loss (शुद्ध हानि)`, amount: -netProfit, indent: true });
    }
    // We always include withdrawals and taxesPaid in leftRows if Edit Mode is active, or if they have value, to make sure they can be edited!
    if (data.withdrawals > 0 || editMode) {
      leftRows.push({ label: `- Withdrawals (निकासी)`, amount: -data.withdrawals, indent: true, editKey: "withdrawals" });
    }
    if (data.taxesPaid > 0 || editMode) {
      leftRows.push({ label: `- Taxes Paid (भुगतान किया गया कर)`, amount: -data.taxesPaid, indent: true, editKey: "taxesPaid" });
    }
    leftRows.push({ label: `Closing Capital Balance`, amount: capitalClosingBalance, isTotal: true, indent: true });

    // Loans
    if (data.securedLoans.length > 0 || data.unsecuredLoans.length > 0 || editMode) {
      leftRows.push({ label: t.loansSecured, amount: null, isHeader: true });
      data.securedLoans.forEach((loan) => {
        leftRows.push({ label: language === "en" ? loan.nameEn : loan.nameHi, amount: loan.amount, indent: true, editKey: "securedLoans", editId: loan.id });
      });
      
      leftRows.push({ label: t.loansUnsecured, amount: null, isHeader: true });
      data.unsecuredLoans.forEach((loan) => {
        leftRows.push({ label: language === "en" ? loan.nameEn : loan.nameHi, amount: loan.amount, indent: true, editKey: "unsecuredLoans", editId: loan.id });
      });
    }

    // Current Liabilities
    leftRows.push({ label: t.currentLiabilities, amount: null, isHeader: true });
    leftRows.push({ label: t.sundryCreditors, amount: data.sundryCreditors, indent: true, editKey: "sundryCreditors" });
    leftRows.push({ label: t.dutiesTaxes, amount: data.dutiesAndTaxes, indent: true, editKey: "dutiesAndTaxes" });
    leftRows.push({ label: t.expensesPayable, amount: data.expensesPayable, indent: true, editKey: "expensesPayable" });


    // --- ASSETS SIDE ---
    rightRows.push({ label: t.fixedAssets, amount: null, isHeader: true });
    calculatedFixedAssets.forEach((fa) => {
      rightRows.push({ label: `${language === "en" ? fa.nameEn : fa.nameHi} (WDV)`, amount: fa.closingBalance, indent: true });
    });

    if (data.investments.length > 0 || editMode) {
      rightRows.push({ label: t.investments, amount: null, isHeader: true });
      data.investments.forEach((inv) => {
        rightRows.push({ label: language === "en" ? inv.nameEn : inv.nameHi, amount: inv.amount, indent: true, editKey: "investments", editId: inv.id });
      });
    }

    rightRows.push({ label: t.currentAssets, amount: null, isHeader: true });
    rightRows.push({ label: t.closingStock, amount: data.closingStock, indent: true, editKey: "closingStock" });
    rightRows.push({ label: t.sundryDebtors, amount: data.sundryDebtors, indent: true, editKey: "sundryDebtors" });
    
    // Bank accounts details
    data.bankAccounts.forEach((acc) => {
      rightRows.push({ label: language === "en" ? acc.nameEn : acc.nameHi, amount: acc.amount, indent: true, editKey: "bankAccounts", editId: acc.id });
    });
    rightRows.push({ label: t.cashInHand, amount: data.cashInHand, indent: true, editKey: "cashInHand" });
    rightRows.push({ label: t.loansAdvances, amount: data.loansAndAdvances, indent: true, editKey: "loansAndAdvances" });

    // Pad sides so totals align
    const leftCount = leftRows.length;
    const rightCount = rightRows.length;
    const maxCount = Math.max(leftCount, rightCount);

    while (leftRows.length < maxCount) leftRows.push({ label: "", amount: null });
    while (rightRows.length < maxCount) rightRows.push({ label: "", amount: null });

    return { leftRows, rightRows };
  };

  const tradingPLData = getTradingPLRows();
  const balanceSheetData = getBalanceSheetRows();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header and Controls */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-slate-200/60 p-1">
            <button
              onClick={() => setActiveTab("tpl")}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                activeTab === "tpl"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {language === "en" ? "Trading & P&L" : "व्यापार एवं लाभ-हानि"}
            </button>
            <button
              onClick={() => setActiveTab("bs")}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                activeTab === "bs"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {language === "en" ? "Balance Sheet" : "तुलन पत्र"}
            </button>
            <button
              onClick={() => setActiveTab("fa")}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                activeTab === "fa"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {language === "en" ? "Fixed Assets Schedule" : "अचल संपत्ति अनुसूची"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onChange && (
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-xs border transition-all cursor-pointer ${
                editMode
                  ? "bg-amber-600 hover:bg-amber-700 border-amber-600 text-white"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
              }`}
              title={t.editModeTooltip}
            >
              <Edit size={13} />
              <span>{editMode ? t.editModeOn : t.editModeOff}</span>
            </button>
          )}

          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Printer size={14} />
            {t.printReport}
          </button>
        </div>
      </div>

      {/* Balance Indicator Alert */}
      <div className="px-6 pt-4">
        {isBalanced ? (
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5 text-emerald-800">
            <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-xs font-semibold">{t.balanced} - {formatCurrency(totalLiabilities)}</p>
              <p className="text-[11px] text-emerald-700">{t.diffBalancedMsg}</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2.5 text-amber-800">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-xs font-semibold">
                  {t.unbalanced} — {t.diffWarning}: {formatCurrency(Math.abs(difference))}
                </p>
                <p className="text-[11px] text-amber-700">
                  {t.diffUnbalancedMsg} (Total Liabilities: {formatCurrency(totalLiabilities)} | Total Assets: {formatCurrency(totalAssets)})
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-6 overflow-x-auto">
        {/* TAB 1: TRADING & P&L ACCOUNT */}
        {activeTab === "tpl" && (
          <div className="min-w-[800px]">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 text-center pb-2 border-b border-slate-100">
              {t.tradingAc}
            </h3>
            <div className="grid grid-cols-2 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
              {/* Left Column (Debit) */}
              <div className="border-r border-slate-200">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 font-semibold text-xs text-slate-700 flex justify-between">
                  <span>Debit / Dr. {language === "en" ? "(व्यय मदें)" : "(खर्चे)"}</span>
                  <span>{t.amount}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {tradingPLData.leftRows.map((row, i) => (
                    <div
                      key={`tpl-dr-${i}`}
                      className={`px-4 py-2 flex justify-between items-center h-9 ${
                        row.isHeader ? "bg-slate-50/50 font-medium text-slate-600" : ""
                      } ${row.isTotal ? "font-semibold text-slate-900 bg-slate-50/30" : "text-slate-600"}`}
                    >
                      <span className={row.indent ? "pl-4 text-slate-500" : ""}>{row.label}</span>
                      {editMode && row.editKey && row.amount !== null ? (
                        <div className="flex items-center gap-1">
                          <span className="text-amber-600 font-mono text-[10px]">₹</span>
                          <input
                            type="number"
                            value={
                              row.editKey === "withdrawals"
                                ? (data.withdrawals === 0 ? "" : data.withdrawals)
                                : row.editKey === "taxesPaid"
                                ? (data.taxesPaid === 0 ? "" : data.taxesPaid)
                                : (row.amount === null ? "" : Math.abs(row.amount))
                            }
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              handleValueChange(row.editKey!, val, row.editId);
                            }}
                            className="w-24 px-1.5 py-0.5 font-mono text-right border border-amber-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden text-xs bg-amber-50/10 focus:bg-white text-slate-950 font-bold transition-all animate-fade-in"
                            placeholder="0"
                          />
                        </div>
                      ) : (
                        <span className="font-mono text-slate-800 font-medium">
                          {row.amount !== null ? formatCurrency(row.amount) : ""}
                        </span>
                      )}
                    </div>
                  ))}
                  {/* Grand Total */}
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 font-bold text-slate-800 flex justify-between items-center h-10">
                    <span>{t.total} Dr.</span>
                    <span className="font-mono border-b-4 border-double border-slate-400">
                      {formatCurrency(
                        Math.max(
                          data.openingStock + data.purchases + totalDirectExpenses + (grossProfit > 0 ? grossProfit : 0),
                          totalIndirectExpenses + (netProfit > 0 ? netProfit : 0) + (grossProfit < 0 ? Math.abs(grossProfit) : 0)
                        ) + (grossProfit < 0 ? Math.abs(grossProfit) : 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column (Credit) */}
              <div>
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 font-semibold text-xs text-slate-700 flex justify-between">
                  <span>Credit / Cr. {language === "en" ? "(आय मदें)" : "(आय)"}</span>
                  <span>{t.amount}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {tradingPLData.rightRows.map((row, i) => (
                    <div
                      key={`tpl-cr-${i}`}
                      className={`px-4 py-2 flex justify-between items-center h-9 ${
                        row.isHeader ? "bg-slate-50/50 font-medium text-slate-600" : ""
                      } ${row.isTotal ? "font-semibold text-slate-900 bg-slate-50/30" : "text-slate-600"}`}
                    >
                      <span className={row.indent ? "pl-4 text-slate-500" : ""}>{row.label}</span>
                      {editMode && row.editKey && row.amount !== null ? (
                        <div className="flex items-center gap-1">
                          <span className="text-amber-600 font-mono text-[10px]">₹</span>
                          <input
                            type="number"
                            value={
                              row.editKey === "withdrawals"
                                ? (data.withdrawals === 0 ? "" : data.withdrawals)
                                : row.editKey === "taxesPaid"
                                ? (data.taxesPaid === 0 ? "" : data.taxesPaid)
                                : (row.amount === null ? "" : Math.abs(row.amount))
                            }
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              handleValueChange(row.editKey!, val, row.editId);
                            }}
                            className="w-24 px-1.5 py-0.5 font-mono text-right border border-amber-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden text-xs bg-amber-50/10 focus:bg-white text-slate-950 font-bold transition-all animate-fade-in"
                            placeholder="0"
                          />
                        </div>
                      ) : (
                        <span className="font-mono text-slate-800 font-medium">
                          {row.amount !== null ? formatCurrency(row.amount) : ""}
                        </span>
                      )}
                    </div>
                  ))}
                  {/* Grand Total */}
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 font-bold text-slate-800 flex justify-between items-center h-10">
                    <span>{t.total} Cr.</span>
                    <span className="font-mono border-b-4 border-double border-slate-400">
                      {formatCurrency(
                        Math.max(
                          data.sales + data.closingStock + (grossProfit < 0 ? Math.abs(grossProfit) : 0),
                          totalIndirectIncomes + (grossProfit > 0 ? grossProfit : 0) + (netProfit < 0 ? Math.abs(netProfit) : 0)
                        ) + (grossProfit >= 0 ? 0 : 0) // adjusted for aligning
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BALANCE SHEET */}
        {activeTab === "bs" && (
          <div className="min-w-[800px]">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 text-center pb-2 border-b border-slate-100">
              {t.balanceSheet}
            </h3>
            <div className="grid grid-cols-2 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
              {/* Liabilities Column */}
              <div className="border-r border-slate-200">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 font-semibold text-xs text-slate-700 flex justify-between">
                  <span>{t.liabilities}</span>
                  <span>{t.amount}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {balanceSheetData.leftRows.map((row, i) => (
                    <div
                      key={`bs-liab-${i}`}
                      className={`px-4 py-2 flex justify-between items-center h-9 ${
                        row.isHeader ? "bg-slate-50/50 font-medium text-slate-600" : ""
                      } ${row.isTotal ? "font-semibold text-slate-900 bg-slate-50/30" : "text-slate-600"}`}
                    >
                      <span className={row.indent ? "pl-4 text-slate-500" : ""}>{row.label}</span>
                      {editMode && row.editKey && row.amount !== null ? (
                        <div className="flex items-center gap-1">
                          <span className="text-amber-600 font-mono text-[10px]">₹</span>
                          <input
                            type="number"
                            value={
                              row.editKey === "withdrawals"
                                ? (data.withdrawals === 0 ? "" : data.withdrawals)
                                : row.editKey === "taxesPaid"
                                ? (data.taxesPaid === 0 ? "" : data.taxesPaid)
                                : (row.amount === null ? "" : Math.abs(row.amount))
                            }
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              handleValueChange(row.editKey!, val, row.editId);
                            }}
                            className="w-24 px-1.5 py-0.5 font-mono text-right border border-amber-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden text-xs bg-amber-50/10 focus:bg-white text-slate-950 font-bold transition-all animate-fade-in"
                            placeholder="0"
                          />
                        </div>
                      ) : (
                        <span className="font-mono text-slate-800 font-medium">
                          {row.amount !== null ? formatCurrency(row.amount) : ""}
                        </span>
                      )}
                    </div>
                  ))}
                  {/* Grand Liabilities Total */}
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 font-bold text-slate-800 flex justify-between items-center h-10">
                    <span>{t.total} {t.liabilities}</span>
                    <span className="font-mono border-b-4 border-double border-slate-400">
                      {formatCurrency(totalLiabilities)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assets Column */}
              <div>
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 font-semibold text-xs text-slate-700 flex justify-between">
                  <span>{t.assets}</span>
                  <span>{t.amount}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {balanceSheetData.rightRows.map((row, i) => (
                    <div
                      key={`bs-asset-${i}`}
                      className={`px-4 py-2 flex justify-between items-center h-9 ${
                        row.isHeader ? "bg-slate-50/50 font-medium text-slate-600" : ""
                      } ${row.isTotal ? "font-semibold text-slate-900 bg-slate-50/30" : "text-slate-600"}`}
                    >
                      <span className={row.indent ? "pl-4 text-slate-500" : ""}>{row.label}</span>
                      {editMode && row.editKey && row.amount !== null ? (
                        <div className="flex items-center gap-1">
                          <span className="text-amber-600 font-mono text-[10px]">₹</span>
                          <input
                            type="number"
                            value={
                              row.editKey === "withdrawals"
                                ? (data.withdrawals === 0 ? "" : data.withdrawals)
                                : row.editKey === "taxesPaid"
                                ? (data.taxesPaid === 0 ? "" : data.taxesPaid)
                                : (row.amount === null ? "" : Math.abs(row.amount))
                            }
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              handleValueChange(row.editKey!, val, row.editId);
                            }}
                            className="w-24 px-1.5 py-0.5 font-mono text-right border border-amber-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden text-xs bg-amber-50/10 focus:bg-white text-slate-950 font-bold transition-all animate-fade-in"
                            placeholder="0"
                          />
                        </div>
                      ) : (
                        <span className="font-mono text-slate-800 font-medium">
                          {row.amount !== null ? formatCurrency(row.amount) : ""}
                        </span>
                      )}
                    </div>
                  ))}
                  {/* Grand Assets Total */}
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 font-bold text-slate-800 flex justify-between items-center h-10">
                    <span>{t.total} {t.assets}</span>
                    <span className="font-mono border-b-4 border-double border-slate-400">
                      {formatCurrency(totalAssets)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FIXED ASSETS DEPRECIATION SCHEDULE */}
        {activeTab === "fa" && (
          <div className="min-w-[900px]">
            <h3 className="text-sm font-semibold text-slate-800 mb-2 text-center">
              {t.fixedAssetsSchedule}
            </h3>
            <p className="text-[11px] text-slate-500 mb-4 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
              💡 <strong>{t.formulaLabel}</strong> <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700 font-mono text-[10px]">{t.formulaText}</code>.
              <br />
              {t.depRulesInfo}
            </p>

            <table className="w-full border-collapse border border-slate-200 text-xs rounded-lg overflow-hidden shadow-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="border-r border-slate-200 px-3 py-2.5 text-left w-[200px]">{t.assetName}</th>
                  <th className="border-r border-slate-200 px-3 py-2.5 text-center">{t.rateDep}</th>
                  <th className="border-r border-slate-200 px-3 py-2.5 text-right">{t.openingBalance}</th>
                  <th className="border-r border-slate-200 px-3 py-2.5 text-right">{t.addUpTo180}</th>
                  <th className="border-r border-slate-200 px-3 py-2.5 text-right">{t.addAfter180}</th>
                  <th className="border-r border-slate-200 px-3 py-2.5 text-right">{t.sales}</th>
                  <th className="border-r border-slate-200 px-3 py-2.5 text-right font-medium text-amber-700 bg-amber-50/20">{t.depreciation}</th>
                  <th className="px-3 py-2.5 text-right font-medium text-emerald-800 bg-emerald-50/20">{t.closingBalance}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {calculatedFixedAssets.map((fa) => (
                  <tr key={fa.id} className="hover:bg-slate-50/40 text-slate-600">
                    <td className="border-r border-slate-200 px-3 py-2 font-medium text-slate-800">
                      {language === "en" ? fa.nameEn : fa.nameHi}
                    </td>
                    <td className="border-r border-slate-200 px-3 py-2 text-center font-mono font-medium text-slate-500">
                      {fa.rateOfDep}%
                    </td>
                    <td className="border-r border-slate-200 px-3 py-1 text-right font-mono text-slate-700">
                      {editMode ? (
                        <input
                          type="number"
                          value={fa.openingBalance === 0 ? "" : fa.openingBalance}
                          onChange={(e) => handleValueChange("fixedAssets", parseFloat(e.target.value) || 0, fa.id, "openingBalance")}
                          className="w-24 px-1.5 py-0.5 font-mono text-right border border-amber-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden text-xs bg-amber-50/10 focus:bg-white text-slate-950 font-bold"
                          placeholder="0"
                        />
                      ) : (
                        formatCurrency(fa.openingBalance)
                      )}
                    </td>
                    <td className="border-r border-slate-200 px-3 py-1 text-right font-mono text-slate-700">
                      {editMode ? (
                        <input
                          type="number"
                          value={fa.additionUpTo180Days === 0 ? "" : fa.additionUpTo180Days}
                          onChange={(e) => handleValueChange("fixedAssets", parseFloat(e.target.value) || 0, fa.id, "additionUpTo180Days")}
                          className="w-24 px-1.5 py-0.5 font-mono text-right border border-amber-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden text-xs bg-amber-50/10 focus:bg-white text-slate-950 font-bold"
                          placeholder="0"
                        />
                      ) : (
                        formatCurrency(fa.additionUpTo180Days)
                      )}
                    </td>
                    <td className="border-r border-slate-200 px-3 py-1 text-right font-mono text-slate-700">
                      {editMode ? (
                        <input
                          type="number"
                          value={fa.additionAfter180Days === 0 ? "" : fa.additionAfter180Days}
                          onChange={(e) => handleValueChange("fixedAssets", parseFloat(e.target.value) || 0, fa.id, "additionAfter180Days")}
                          className="w-24 px-1.5 py-0.5 font-mono text-right border border-amber-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden text-xs bg-amber-50/10 focus:bg-white text-slate-950 font-bold"
                          placeholder="0"
                        />
                      ) : (
                        formatCurrency(fa.additionAfter180Days)
                      )}
                    </td>
                    <td className="border-r border-slate-200 px-3 py-1 text-right font-mono text-slate-700 text-rose-600">
                      {editMode ? (
                        <input
                          type="number"
                          value={fa.sales === 0 ? "" : fa.sales}
                          onChange={(e) => handleValueChange("fixedAssets", parseFloat(e.target.value) || 0, fa.id, "sales")}
                          className="w-24 px-1.5 py-0.5 font-mono text-right border border-amber-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden text-xs bg-amber-50/10 focus:bg-white text-rose-700 font-bold"
                          placeholder="0"
                        />
                      ) : (
                        fa.sales > 0 ? `- ${formatCurrency(fa.sales)}` : "₹0"
                      )}
                    </td>
                    <td className="border-r border-slate-200 px-3 py-2 text-right font-mono font-medium text-amber-700 bg-amber-50/10">
                      {formatCurrency(fa.depreciation)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-emerald-800 bg-emerald-50/10">
                      {formatCurrency(fa.closingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                  <td className="border-r border-slate-200 px-3 py-2">{t.total}</td>
                  <td className="border-r border-slate-200 px-3 py-2"></td>
                  <td className="border-r border-slate-200 px-3 py-2 text-right font-mono">
                    {formatCurrency(calculatedFixedAssets.reduce((sum, fa) => sum + fa.openingBalance, 0))}
                  </td>
                  <td className="border-r border-slate-200 px-3 py-2 text-right font-mono">
                    {formatCurrency(calculatedFixedAssets.reduce((sum, fa) => sum + fa.additionUpTo180Days, 0))}
                  </td>
                  <td className="border-r border-slate-200 px-3 py-2 text-right font-mono">
                    {formatCurrency(calculatedFixedAssets.reduce((sum, fa) => sum + fa.additionAfter180Days, 0))}
                  </td>
                  <td className="border-r border-slate-200 px-3 py-2 text-right font-mono text-rose-700">
                    {formatCurrency(calculatedFixedAssets.reduce((sum, fa) => sum + fa.sales, 0))}
                  </td>
                  <td className="border-r border-slate-200 px-3 py-2 text-right font-mono text-amber-800 bg-amber-50/30">
                    {formatCurrency(totalDepreciation)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-emerald-800 bg-emerald-50/30">
                    {formatCurrency(totalFixedAssetsVal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
