import { AccountingData, Language } from "../types";
import { AccountingReport } from "../utils/accountingMath";
import { translations } from "../utils/translations";
import { X, Printer, FileDown } from "lucide-react";
import { exportFinancialReportPDF } from "../utils/pdfGenerator";

interface PrintReportProps {
  data: AccountingData;
  report: AccountingReport;
  language: Language;
  onClose: () => void;
  privacyMode?: boolean;
}

export default function PrintReport({ data, report, language, onClose, privacyMode }: PrintReportProps) {
  const t = translations[language];

  const formatCurrency = (val: number) => {
    if (privacyMode) return "₹ •••,•••";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
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
  } = report;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        
        {/* Controls Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-emerald-400" />
            <h2 className="text-sm font-bold">{language === "en" ? "Print Preview - Audited Statements" : "प्रिंट पूर्वावलोकन - लेखा परीक्षित विवरण"}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportFinancialReportPDF(data, report, language, privacyMode)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
            >
              <FileDown size={14} />
              <span>{language === "en" ? "Export PDF" : "PDF डाउनलोड"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm"
            >
              {language === "en" ? "Print Now" : "अभी प्रिंट करें"}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div id="printable-statement" className="p-10 overflow-y-auto bg-white text-slate-800 space-y-10 print:p-0 print:m-0 font-sans">
          
          {/* Letterhead */}
          <div className="text-center space-y-2 border-b-2 border-slate-900 pb-6">
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-900">
              {language === "en" ? "AUDITED FINANCIAL STATEMENTS" : "लेखा परीक्षित वित्तीय विवरण"}
            </h1>
            <p className="text-xs text-slate-500 uppercase font-medium tracking-wider">
              {language === "en" ? "Financial Year: 2025 - 2026" : "वित्तीय वर्ष: 2025 - 2026"}
            </p>
            <div className="text-[10px] text-slate-400 font-mono">
              Generated via standard compliance generator on: {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* 1. TRADING & PROFIT AND LOSS ACCOUNT */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-300">
              I. {t.tradingAc}
            </h2>
            <div className="grid grid-cols-2 border border-slate-400 divide-x divide-slate-400 text-xs">
              {/* Debit */}
              <div>
                <div className="bg-slate-100 px-3 py-1.5 font-bold border-b border-slate-400 flex justify-between">
                  <span>Debit / Dr.</span>
                  <span>{t.amount}</span>
                </div>
                <div className="divide-y divide-slate-200">
                  <div className="px-3 py-1 flex justify-between">
                    <span>{t.toOpeningStock}</span>
                    <span className="font-mono">{formatCurrency(data.openingStock)}</span>
                  </div>
                  <div className="px-3 py-1 flex justify-between">
                    <span>{t.toPurchases}</span>
                    <span className="font-mono">{formatCurrency(data.purchases)}</span>
                  </div>
                  <div className="px-3 py-1 font-semibold text-slate-600 bg-slate-50">
                    {t.toDirectExpenses}:
                  </div>
                  {data.directExpenses.map((exp) => (
                    <div key={exp.id} className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                      <span>{language === "en" ? exp.nameEn : exp.nameHi}</span>
                      <span className="font-mono">{formatCurrency(exp.amount)}</span>
                    </div>
                  ))}
                  {grossProfit >= 0 && (
                    <div className="px-3 py-1 font-semibold flex justify-between bg-slate-50/50">
                      <span>{t.toGrossProfit}</span>
                      <span className="font-mono font-bold">{formatCurrency(grossProfit)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Credit */}
              <div>
                <div className="bg-slate-100 px-3 py-1.5 font-bold border-b border-slate-400 flex justify-between">
                  <span>Credit / Cr.</span>
                  <span>{t.amount}</span>
                </div>
                <div className="divide-y divide-slate-200">
                  <div className="px-3 py-1 flex justify-between">
                    <span>{t.bySales}</span>
                    <span className="font-mono">{formatCurrency(data.sales)}</span>
                  </div>
                  <div className="px-3 py-1 flex justify-between">
                    <span>{t.byClosingStock}</span>
                    <span className="font-mono">{formatCurrency(data.closingStock)}</span>
                  </div>
                  {grossProfit < 0 && (
                    <div className="px-3 py-1 font-semibold flex justify-between bg-slate-50/50 text-rose-700">
                      <span>By Gross Loss c/d</span>
                      <span className="font-mono font-bold">{formatCurrency(Math.abs(grossProfit))}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trading Total */}
            <div className="grid grid-cols-2 border border-slate-400 border-t-0 font-bold text-xs bg-slate-50">
              <div className="px-3 py-2 flex justify-between border-r border-slate-400">
                <span>Total Trading Debit</span>
                <span className="font-mono border-b border-slate-900">
                  {formatCurrency(data.openingStock + data.purchases + totalDirectExpenses + (grossProfit > 0 ? grossProfit : 0))}
                </span>
              </div>
              <div className="px-3 py-2 flex justify-between">
                <span>Total Trading Credit</span>
                <span className="font-mono border-b border-slate-900">
                  {formatCurrency(data.sales + data.closingStock + (grossProfit < 0 ? Math.abs(grossProfit) : 0))}
                </span>
              </div>
            </div>

            {/* P&L Items */}
            <div className="grid grid-cols-2 border border-slate-400 mt-4 divide-x divide-slate-400 text-xs">
              {/* P&L Debit */}
              <div>
                <div className="bg-slate-100 px-3 py-1.5 font-bold border-b border-slate-400 flex justify-between">
                  <span>Debit / Dr. Expenses</span>
                  <span>{t.amount}</span>
                </div>
                <div className="divide-y divide-slate-200">
                  {grossProfit < 0 && (
                    <div className="px-3 py-1 flex justify-between">
                      <span>To Gross Loss b/d</span>
                      <span className="font-mono">{formatCurrency(Math.abs(grossProfit))}</span>
                    </div>
                  )}
                  {data.indirectExpenses.map((exp) => (
                    <div key={exp.id} className="px-3 py-1 flex justify-between text-slate-600">
                      <span>{language === "en" ? exp.nameEn : exp.nameHi}</span>
                      <span className="font-mono">{formatCurrency(exp.amount)}</span>
                    </div>
                  ))}
                  <div className="px-3 py-1 flex justify-between text-slate-600">
                    <span>Depreciation (As per Schedule)</span>
                    <span className="font-mono">{formatCurrency(totalDepreciation)}</span>
                  </div>
                  {netProfit >= 0 && (
                    <div className="px-3 py-1 font-semibold flex justify-between bg-slate-50/50">
                      <span>{t.toNetProfit}</span>
                      <span className="font-mono font-bold">{formatCurrency(netProfit)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* P&L Credit */}
              <div>
                <div className="bg-slate-100 px-3 py-1.5 font-bold border-b border-slate-400 flex justify-between">
                  <span>Credit / Cr. Income</span>
                  <span>{t.amount}</span>
                </div>
                <div className="divide-y divide-slate-200">
                  {grossProfit >= 0 && (
                    <div className="px-3 py-1 flex justify-between">
                      <span>{t.byGrossProfit}</span>
                      <span className="font-mono">{formatCurrency(grossProfit)}</span>
                    </div>
                  )}
                  {data.indirectIncomes.map((inc) => (
                    <div key={inc.id} className="px-3 py-1 flex justify-between text-slate-600">
                      <span>{language === "en" ? inc.nameEn : inc.nameHi}</span>
                      <span className="font-mono">{formatCurrency(inc.amount)}</span>
                    </div>
                  ))}
                  {netProfit < 0 && (
                    <div className="px-3 py-1 font-semibold flex justify-between bg-slate-50/50 text-rose-700">
                      <span>By Net Loss</span>
                      <span className="font-mono font-bold">{formatCurrency(Math.abs(netProfit))}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* P&L Total */}
            <div className="grid grid-cols-2 border border-slate-400 border-t-0 font-bold text-xs bg-slate-50">
              <div className="px-3 py-2 flex justify-between border-r border-slate-400">
                <span>Total P&L Debit</span>
                <span className="font-mono border-b-4 border-double border-slate-950">
                  {formatCurrency(totalIndirectExpenses + (netProfit > 0 ? netProfit : 0) + (grossProfit < 0 ? Math.abs(grossProfit) : 0))}
                </span>
              </div>
              <div className="px-3 py-2 flex justify-between">
                <span>Total P&L Credit</span>
                <span className="font-mono border-b-4 border-double border-slate-950">
                  {formatCurrency(totalIndirectIncomes + (grossProfit >= 0 ? grossProfit : 0) + (netProfit < 0 ? Math.abs(netProfit) : 0))}
                </span>
              </div>
            </div>
          </div>

          {/* 2. BALANCE SHEET */}
          <div className="space-y-4 break-before-page">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-300">
              II. {t.balanceSheet}
            </h2>
            <div className="grid grid-cols-2 border border-slate-400 divide-x divide-slate-400 text-xs">
              {/* Liabilities */}
              <div>
                <div className="bg-slate-100 px-3 py-1.5 font-bold border-b border-slate-400 flex justify-between">
                  <span>Liabilities</span>
                  <span>{t.amount}</span>
                </div>
                <div className="divide-y divide-slate-200">
                  <div className="px-3 py-1 bg-slate-50 font-bold">{t.capitalAccount}</div>
                  <div className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                    <span>Opening Balance</span>
                    <span className="font-mono">{formatCurrency(data.capitalOpeningBalance)}</span>
                  </div>
                  <div className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                    <span>Add: Net Profit</span>
                    <span className="font-mono">{formatCurrency(netProfit)}</span>
                  </div>
                  {data.withdrawals > 0 && (
                    <div className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                      <span>Less: Withdrawals</span>
                      <span className="font-mono">-{formatCurrency(data.withdrawals)}</span>
                    </div>
                  )}
                  {data.taxesPaid > 0 && (
                    <div className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                      <span>Less: Taxes Paid</span>
                      <span className="font-mono">-{formatCurrency(data.taxesPaid)}</span>
                    </div>
                  )}
                  <div className="px-3 py-1 pl-6 font-bold flex justify-between">
                    <span>Closing Capital</span>
                    <span className="font-mono">{formatCurrency(capitalClosingBalance)}</span>
                  </div>

                  <div className="px-3 py-1 bg-slate-50 font-bold">{t.loansSecured}</div>
                  {data.securedLoans.map((loan) => (
                    <div key={loan.id} className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                      <span>{language === "en" ? loan.nameEn : loan.nameHi}</span>
                      <span className="font-mono">{formatCurrency(loan.amount)}</span>
                    </div>
                  ))}

                  <div className="px-3 py-1 bg-slate-50 font-bold">{t.loansUnsecured}</div>
                  {data.unsecuredLoans.map((loan) => (
                    <div key={loan.id} className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                      <span>{language === "en" ? loan.nameEn : loan.nameHi}</span>
                      <span className="font-mono">{formatCurrency(loan.amount)}</span>
                    </div>
                  ))}

                  <div className="px-3 py-1 bg-slate-50 font-bold">{t.currentLiabilities}</div>
                  <div className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                    <span>Sundry Creditors</span>
                    <span className="font-mono">{formatCurrency(data.sundryCreditors)}</span>
                  </div>
                  <div className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                    <span>Duties & Taxes</span>
                    <span className="font-mono">{formatCurrency(data.dutiesAndTaxes)}</span>
                  </div>
                  <div className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                    <span>Outstanding Expenses</span>
                    <span className="font-mono">{formatCurrency(data.expensesPayable)}</span>
                  </div>
                </div>
              </div>

              {/* Assets */}
              <div>
                <div className="bg-slate-100 px-3 py-1.5 font-bold border-b border-slate-400 flex justify-between">
                  <span>Assets</span>
                  <span>{t.amount}</span>
                </div>
                <div className="divide-y divide-slate-200">
                  <div className="px-3 py-1 bg-slate-50 font-bold">{t.fixedAssets}</div>
                  {calculatedFixedAssets.map((fa) => (
                    <div key={fa.id} className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                      <span>{language === "en" ? fa.nameEn : fa.nameHi} (WDV)</span>
                      <span className="font-mono">{formatCurrency(fa.closingBalance)}</span>
                    </div>
                  ))}

                  <div className="px-3 py-1 bg-slate-50 font-bold">{t.investments}</div>
                  {data.investments.map((inv) => (
                    <div key={inv.id} className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                      <span>{language === "en" ? inv.nameEn : inv.nameHi}</span>
                      <span className="font-mono">{formatCurrency(inv.amount)}</span>
                    </div>
                  ))}

                  <div className="px-3 py-1 bg-slate-50 font-bold">{t.currentAssets}</div>
                  <div className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                    <span>Closing Stock</span>
                    <span className="font-mono">{formatCurrency(data.closingStock)}</span>
                  </div>
                  <div className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                    <span>Sundry Debtors</span>
                    <span className="font-mono">{formatCurrency(data.sundryDebtors)}</span>
                  </div>
                  {data.bankAccounts.map((acc) => (
                    <div key={acc.id} className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                      <span>{language === "en" ? acc.nameEn : acc.nameHi}</span>
                      <span className="font-mono">{formatCurrency(acc.amount)}</span>
                    </div>
                  ))}
                  <div className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                    <span>Cash in Hand</span>
                    <span className="font-mono">{formatCurrency(data.cashInHand)}</span>
                  </div>
                  <div className="px-3 py-1 pl-6 flex justify-between text-slate-600">
                    <span>Loans & Advances</span>
                    <span className="font-mono">{formatCurrency(data.loansAndAdvances)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BS Grand Total */}
            <div className="grid grid-cols-2 border border-slate-400 border-t-0 font-bold text-xs bg-slate-50">
              <div className="px-3 py-2 flex justify-between border-r border-slate-400">
                <span>Total Liabilities</span>
                <span className="font-mono border-b-4 border-double border-slate-950">{formatCurrency(totalLiabilities)}</span>
              </div>
              <div className="px-3 py-2 flex justify-between">
                <span>Total Assets</span>
                <span className="font-mono border-b-4 border-double border-slate-950">{formatCurrency(totalAssets)}</span>
              </div>
            </div>
          </div>

          {/* 3. SCHEDULE OF FIXED ASSETS */}
          <div className="space-y-4 break-before-page">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-300">
              III. {t.fixedAssetsSchedule}
            </h2>
            <table className="w-full border-collapse border border-slate-400 text-[10px]">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-400">
                  <th className="border-r border-slate-400 p-2 text-left">{t.assetName}</th>
                  <th className="border-r border-slate-400 p-2 text-center">Rate</th>
                  <th className="border-r border-slate-400 p-2 text-right">Opening Bal</th>
                  <th className="border-r border-slate-400 p-2 text-right">Add &lt;= 180 Days</th>
                  <th className="border-r border-slate-400 p-2 text-right">Add &gt; 180 Days</th>
                  <th className="border-r border-slate-400 p-2 text-right">Sales</th>
                  <th className="border-r border-slate-400 p-2 text-right">Depreciation</th>
                  <th className="p-2 text-right">Closing Bal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {calculatedFixedAssets.map((fa) => (
                  <tr key={fa.id}>
                    <td className="border-r border-slate-400 p-2 font-medium">{language === "en" ? fa.nameEn : fa.nameHi}</td>
                    <td className="border-r border-slate-400 p-2 text-center font-mono">{fa.rateOfDep}%</td>
                    <td className="border-r border-slate-400 p-2 text-right font-mono">{formatCurrency(fa.openingBalance)}</td>
                    <td className="border-r border-slate-400 p-2 text-right font-mono">{formatCurrency(fa.additionUpTo180Days)}</td>
                    <td className="border-r border-slate-400 p-2 text-right font-mono">{formatCurrency(fa.additionAfter180Days)}</td>
                    <td className="border-r border-slate-400 p-2 text-right font-mono text-rose-700">{formatCurrency(fa.sales)}</td>
                    <td className="border-r border-slate-400 p-2 text-right font-mono font-medium">{formatCurrency(fa.depreciation)}</td>
                    <td className="p-2 text-right font-mono font-bold">{formatCurrency(fa.closingBalance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t border-slate-400">
                  <td className="border-r border-slate-400 p-2">Total Fixed Assets</td>
                  <td className="border-r border-slate-400 p-2"></td>
                  <td className="border-r border-slate-400 p-2 text-right font-mono">
                    {formatCurrency(calculatedFixedAssets.reduce((sum, fa) => sum + fa.openingBalance, 0))}
                  </td>
                  <td className="border-r border-slate-400 p-2 text-right font-mono">
                    {formatCurrency(calculatedFixedAssets.reduce((sum, fa) => sum + fa.additionUpTo180Days, 0))}
                  </td>
                  <td className="border-r border-slate-400 p-2 text-right font-mono">
                    {formatCurrency(calculatedFixedAssets.reduce((sum, fa) => sum + fa.additionAfter180Days, 0))}
                  </td>
                  <td className="border-r border-slate-400 p-2 text-right font-mono text-rose-800">
                    {formatCurrency(calculatedFixedAssets.reduce((sum, fa) => sum + fa.sales, 0))}
                  </td>
                  <td className="border-r border-slate-400 p-2 text-right font-mono">
                    {formatCurrency(totalDepreciation)}
                  </td>
                  <td className="p-2 text-right font-mono">
                    {formatCurrency(totalFixedAssetsVal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signature Block */}
          <div className="pt-16 grid grid-cols-2 gap-20 text-xs">
            <div className="text-center space-y-12">
              <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              <p className="font-semibold text-slate-800">{language === "en" ? "Authorized Accountant Signature" : "अधिकृत लेखाकार के हस्ताक्षर"}</p>
            </div>
            <div className="text-center space-y-12">
              <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              <p className="font-semibold text-slate-800">{language === "en" ? "Proprietor / Director Signature" : "मालिक / निदेशक के हस्ताक्षर"}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
