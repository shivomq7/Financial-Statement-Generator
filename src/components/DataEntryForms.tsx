import { useState } from "react";
import { AccountingData, ExpenseItem, IncomeItem, LoanItem, InvestmentItem, BankItem, FixedAsset } from "../types";
import { translations } from "../utils/translations";
import { Plus, Trash2, HelpCircle, Save, Percent, ChevronDown, ChevronUp } from "lucide-react";

interface DataEntryFormsProps {
  data: AccountingData;
  onChange: (newData: AccountingData) => void;
  language: "en" | "hi";
}

export default function DataEntryForms({ data, onChange, language }: DataEntryFormsProps) {
  const t = translations[language];
  const [activeSection, setActiveSection] = useState<string>("trading");

  const toggleSection = (sec: string) => {
    setActiveSection(activeSection === sec ? "" : sec);
  };

  // Generic updater
  const updateField = <K extends keyof AccountingData>(field: K, value: AccountingData[K]) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  // Helper lists handlers
  const addListItem = <T extends { id: string; nameEn: string; nameHi: string; amount: number }>(
    field: keyof AccountingData,
    newItem: T
  ) => {
    const list = (data[field] as T[]) || [];
    updateField(field, [...list, newItem] as any);
  };

  const removeListItem = (field: keyof AccountingData, id: string) => {
    const list = (data[field] as any[]) || [];
    updateField(field, list.filter((item) => item.id !== id) as any);
  };

  const updateListItem = (field: keyof AccountingData, id: string, key: string, val: any) => {
    const list = (data[field] as any[]) || [];
    const updated = list.map((item) => (item.id === id ? { ...item, [key]: val } : item));
    updateField(field, updated as any);
  };

  // Specific list templates
  const handleAddDirectExpense = () => {
    addListItem("directExpenses", {
      id: "dir-" + Date.now(),
      nameEn: "New Direct Expense",
      nameHi: "नया प्रत्यक्ष व्यय",
      amount: 0,
    });
  };

  const handleAddIndirectExpense = () => {
    addListItem("indirectExpenses", {
      id: "ind-" + Date.now(),
      nameEn: "New Indirect Expense",
      nameHi: "नया अप्रत्यक्ष व्यय",
      amount: 0,
    });
  };

  const handleAddIndirectIncome = () => {
    addListItem("indirectIncomes", {
      id: "inc-" + Date.now(),
      nameEn: "New Indirect Income",
      nameHi: "नयी अप्रत्यक्ष आय",
      amount: 0,
    });
  };

  const handleAddSecuredLoan = () => {
    addListItem("securedLoans", {
      id: "sec-" + Date.now(),
      nameEn: "New Secured Loan",
      nameHi: "नया सुरक्षित ऋण",
      amount: 0,
    });
  };

  const handleAddUnsecuredLoan = () => {
    addListItem("unsecuredLoans", {
      id: "unsec-" + Date.now(),
      nameEn: "New Unsecured Loan",
      nameHi: "नया असुरक्षित ऋण",
      amount: 0,
    });
  };

  const handleAddInvestment = () => {
    addListItem("investments", {
      id: "inv-" + Date.now(),
      nameEn: "New Investment",
      nameHi: "नया निवेश",
      amount: 0,
    });
  };

  const handleAddBankAccount = () => {
    addListItem("bankAccounts", {
      id: "bnk-" + Date.now(),
      nameEn: "New Bank Account",
      nameHi: "नया बैंक खाता",
      amount: 0,
    });
  };

  const handleAddFixedAsset = () => {
    const newAsset: FixedAsset = {
      id: "fa-" + Date.now(),
      nameEn: "New Asset",
      nameHi: "नई संपत्ति",
      rateOfDep: 10,
      openingBalance: 0,
      additionUpTo180Days: 0,
      additionAfter180Days: 0,
      sales: 0,
      depreciation: 0,
      closingBalance: 0,
    };
    updateField("fixedAssets", [...data.fixedAssets, newAsset]);
  };

  // Inline styling classes
  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-shadow";
  const numInputClass = "w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 bg-white text-right font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-shadow";
  const btnSec = "flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 text-xs font-medium cursor-pointer transition-colors";
  const labelClass = "block text-[11px] font-medium text-slate-500 mb-1";

  return (
    <div className="space-y-4">
      {/* SECTION 1: TRADING ACCOUNT SETUP */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-2xs">
        <button
          onClick={() => toggleSection("trading")}
          className="w-full flex items-center justify-between px-5 py-4 bg-slate-50/50 hover:bg-slate-50 font-semibold text-slate-700 text-xs transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">1</span>
            {t.tradingSetup}
          </span>
          {activeSection === "trading" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {activeSection === "trading" && (
          <div className="p-5 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>{language === "en" ? "Opening Stock (प्रारंभिक स्टॉक)" : "प्रारंभिक स्टॉक"}</label>
                <input
                  type="number"
                  value={data.openingStock || ""}
                  onChange={(e) => updateField("openingStock", Number(e.target.value))}
                  className={numInputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>{language === "en" ? "Purchases (कुल खरीद)" : "कुल खरीद"}</label>
                <input
                  type="number"
                  value={data.purchases || ""}
                  onChange={(e) => updateField("purchases", Number(e.target.value))}
                  className={numInputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>{language === "en" ? "Sales (कुल बिक्री)" : "कुल बिक्री"}</label>
                <input
                  type="number"
                  value={data.sales || ""}
                  onChange={(e) => updateField("sales", Number(e.target.value))}
                  className={numInputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>{language === "en" ? "Closing Stock (अंतिम स्टॉक)" : "अंतिम स्टॉक"}</label>
                <input
                  type="number"
                  value={data.closingStock || ""}
                  onChange={(e) => updateField("closingStock", Number(e.target.value))}
                  className={numInputClass}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-600">{t.directExpensesList}</h4>
                <button onClick={handleAddDirectExpense} className={btnSec}>
                  <Plus size={12} /> {t.addDirectExpense}
                </button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {data.directExpenses.map((exp) => (
                  <div key={exp.id} className="flex gap-2 items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    <input
                      type="text"
                      value={language === "en" ? exp.nameEn : exp.nameHi}
                      onChange={(e) =>
                        updateListItem("directExpenses", exp.id, language === "en" ? "nameEn" : "nameHi", e.target.value)
                      }
                      className="w-1/2 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <input
                      type="number"
                      value={exp.amount || ""}
                      onChange={(e) => updateListItem("directExpenses", exp.id, "amount", Number(e.target.value))}
                      className="w-1/3 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 text-right font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Amount"
                    />
                    <button
                      onClick={() => removeListItem("directExpenses", exp.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: PROFIT & LOSS ITEMS */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-2xs">
        <button
          onClick={() => toggleSection("pl")}
          className="w-full flex items-center justify-between px-5 py-4 bg-slate-50/50 hover:bg-slate-50 font-semibold text-slate-700 text-xs transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">2</span>
            {t.indirectExpensesIncomes}
          </span>
          {activeSection === "pl" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {activeSection === "pl" && (
          <div className="p-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Indirect Expenses */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-600">{t.indirectExpensesList}</h4>
                <button onClick={handleAddIndirectExpense} className={btnSec}>
                  <Plus size={12} /> {t.addIndirectExpense}
                </button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {data.indirectExpenses.map((exp) => (
                  <div key={exp.id} className="flex gap-2 items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    <input
                      type="text"
                      value={language === "en" ? exp.nameEn : exp.nameHi}
                      onChange={(e) =>
                        updateListItem("indirectExpenses", exp.id, language === "en" ? "nameEn" : "nameHi", e.target.value)
                      }
                      className="w-1/2 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={exp.amount || ""}
                      onChange={(e) => updateListItem("indirectExpenses", exp.id, "amount", Number(e.target.value))}
                      className="w-1/3 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 text-right font-mono focus:outline-none"
                      placeholder="Amount"
                    />
                    <button
                      onClick={() => removeListItem("indirectExpenses", exp.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Indirect Incomes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-600">{t.indirectIncomesList}</h4>
                <button onClick={handleAddIndirectIncome} className={btnSec}>
                  <Plus size={12} /> {t.addIndirectIncome}
                </button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {data.indirectIncomes.map((inc) => (
                  <div key={inc.id} className="flex gap-2 items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    <input
                      type="text"
                      value={language === "en" ? inc.nameEn : inc.nameHi}
                      onChange={(e) =>
                        updateListItem("indirectIncomes", inc.id, language === "en" ? "nameEn" : "nameHi", e.target.value)
                      }
                      className="w-1/2 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={inc.amount || ""}
                      onChange={(e) => updateListItem("indirectIncomes", inc.id, "amount", Number(e.target.value))}
                      className="w-1/3 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 text-right font-mono focus:outline-none"
                      placeholder="Amount"
                    />
                    <button
                      onClick={() => removeListItem("indirectIncomes", inc.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: LIABILITIES LEDGER */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-2xs">
        <button
          onClick={() => toggleSection("liabilities")}
          className="w-full flex items-center justify-between px-5 py-4 bg-slate-50/50 hover:bg-slate-50 font-semibold text-slate-700 text-xs transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">3</span>
            {t.liabilitiesSetup}
          </span>
          {activeSection === "liabilities" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {activeSection === "liabilities" && (
          <div className="p-5 border-t border-slate-100 space-y-6">
            {/* Capital accounts row */}
            <div>
              <h4 className="text-xs font-semibold text-slate-600 mb-2">{t.capitalAccount}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <label className={labelClass}>{t.openingBalance} (₹)</label>
                  <input
                    type="number"
                    value={data.capitalOpeningBalance || ""}
                    onChange={(e) => updateField("capitalOpeningBalance", Number(e.target.value))}
                    className={numInputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{language === "en" ? "Withdrawals / Drawings (निकासी)" : "निकासी (Drawings)"}</label>
                  <input
                    type="number"
                    value={data.withdrawals || ""}
                    onChange={(e) => updateField("withdrawals", Number(e.target.value))}
                    className={numInputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{language === "en" ? "Taxes Paid / Income Tax (आयकर)" : "भुगतान किया गया आयकर"}</label>
                  <input
                    type="number"
                    value={data.taxesPaid || ""}
                    onChange={(e) => updateField("taxesPaid", Number(e.target.value))}
                    className={numInputClass}
                  />
                </div>
              </div>
            </div>

            {/* Loans grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Secured Loans */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-slate-600">{language === "en" ? "Secured Loans" : "सुरक्षित ऋण (Secured Loans)"}</h4>
                  <button onClick={handleAddSecuredLoan} className={btnSec}>
                    <Plus size={12} /> {t.addSecuredLoan}
                  </button>
                </div>
                <div className="space-y-2">
                  {data.securedLoans.map((loan) => (
                    <div key={loan.id} className="flex gap-2 items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                      <input
                        type="text"
                        value={language === "en" ? loan.nameEn : loan.nameHi}
                        onChange={(e) =>
                          updateListItem("securedLoans", loan.id, language === "en" ? "nameEn" : "nameHi", e.target.value)
                        }
                        className="w-1/2 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700"
                      />
                      <input
                        type="number"
                        value={loan.amount || ""}
                        onChange={(e) => updateListItem("securedLoans", loan.id, "amount", Number(e.target.value))}
                        className="w-1/3 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 text-right font-mono"
                        placeholder="Amount"
                      />
                      <button
                        onClick={() => removeListItem("securedLoans", loan.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unsecured Loans */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-slate-600">{language === "en" ? "Unsecured Loans" : "असुरक्षित ऋण (Unsecured)"}</h4>
                  <button onClick={handleAddUnsecuredLoan} className={btnSec}>
                    <Plus size={12} /> {t.addUnsecuredLoan}
                  </button>
                </div>
                <div className="space-y-2">
                  {data.unsecuredLoans.map((loan) => (
                    <div key={loan.id} className="flex gap-2 items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                      <input
                        type="text"
                        value={language === "en" ? loan.nameEn : loan.nameHi}
                        onChange={(e) =>
                          updateListItem("unsecuredLoans", loan.id, language === "en" ? "nameEn" : "nameHi", e.target.value)
                        }
                        className="w-1/2 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700"
                      />
                      <input
                        type="number"
                        value={loan.amount || ""}
                        onChange={(e) => updateListItem("unsecuredLoans", loan.id, "amount", Number(e.target.value))}
                        className="w-1/3 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 text-right font-mono"
                        placeholder="Amount"
                      />
                      <button
                        onClick={() => removeListItem("unsecuredLoans", loan.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Liabilities */}
            <div>
              <h4 className="text-xs font-semibold text-slate-600 mb-2">{t.currentLiabilities}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <label className={labelClass}>{language === "en" ? "Sundry Creditors (विविध लेनदार)" : "विविध लेनदार (Creditors)"}</label>
                  <input
                    type="number"
                    value={data.sundryCreditors || ""}
                    onChange={(e) => updateField("sundryCreditors", Number(e.target.value))}
                    className={numInputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{language === "en" ? "Duties & Taxes (कर एवं शुल्क)" : "कर एवं शुल्क (GST/Duties)"}</label>
                  <input
                    type="number"
                    value={data.dutiesAndTaxes || ""}
                    onChange={(e) => updateField("dutiesAndTaxes", Number(e.target.value))}
                    className={numInputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{language === "en" ? "Outstanding Expenses (देय व्यय)" : "देय व्यय (Outstanding)"}</label>
                  <input
                    type="number"
                    value={data.expensesPayable || ""}
                    onChange={(e) => updateField("expensesPayable", Number(e.target.value))}
                    className={numInputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: ASSETS & BANK LEDGER */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-2xs">
        <button
          onClick={() => toggleSection("assets")}
          className="w-full flex items-center justify-between px-5 py-4 bg-slate-50/50 hover:bg-slate-50 font-semibold text-slate-700 text-xs transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">4</span>
            {t.assetsSetup}
          </span>
          {activeSection === "assets" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {activeSection === "assets" && (
          <div className="p-5 border-t border-slate-100 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Investments */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-slate-600">{language === "en" ? "Investments" : "निवेश (Investments)"}</h4>
                  <button onClick={handleAddInvestment} className={btnSec}>
                    <Plus size={12} /> {t.addInvestment}
                  </button>
                </div>
                <div className="space-y-2">
                  {data.investments.map((inv) => (
                    <div key={inv.id} className="flex gap-2 items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                      <input
                        type="text"
                        value={language === "en" ? inv.nameEn : inv.nameHi}
                        onChange={(e) =>
                          updateListItem("investments", inv.id, language === "en" ? "nameEn" : "nameHi", e.target.value)
                        }
                        className="w-1/2 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700"
                      />
                      <input
                        type="number"
                        value={inv.amount || ""}
                        onChange={(e) => updateListItem("investments", inv.id, "amount", Number(e.target.value))}
                        className="w-1/3 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 text-right font-mono"
                        placeholder="Amount"
                      />
                      <button
                        onClick={() => removeListItem("investments", inv.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bank Accounts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-slate-600">{language === "en" ? "Bank Accounts" : "बैंक खाते (Bank Accounts)"}</h4>
                  <button onClick={handleAddBankAccount} className={btnSec}>
                    <Plus size={12} /> {t.addBankAccount}
                  </button>
                </div>
                <div className="space-y-2">
                  {data.bankAccounts.map((acc) => (
                    <div key={acc.id} className="flex gap-2 items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                      <input
                        type="text"
                        value={language === "en" ? acc.nameEn : acc.nameHi}
                        onChange={(e) =>
                          updateListItem("bankAccounts", acc.id, language === "en" ? "nameEn" : "nameHi", e.target.value)
                        }
                        className="w-1/2 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700"
                      />
                      <input
                        type="number"
                        value={acc.amount || ""}
                        onChange={(e) => updateListItem("bankAccounts", acc.id, "amount", Number(e.target.value))}
                        className="w-1/3 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 text-right font-mono"
                        placeholder="Amount"
                      />
                      <button
                        onClick={() => removeListItem("bankAccounts", acc.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Other Current Assets */}
            <div>
              <h4 className="text-xs font-semibold text-slate-600 mb-2">{language === "en" ? "Other Current Assets" : "अन्य चालू संपत्तियां (Current Assets)"}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <label className={labelClass}>{language === "en" ? "Sundry Debtors (विविध देनदार)" : "विविध देनदार (Debtors)"}</label>
                  <input
                    type="number"
                    value={data.sundryDebtors || ""}
                    onChange={(e) => updateField("sundryDebtors", Number(e.target.value))}
                    className={numInputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{language === "en" ? "Cash in Hand (हस्तस्थ रोकड़)" : "हस्तस्थ रोकड़ (Cash)"}</label>
                  <input
                    type="number"
                    value={data.cashInHand || ""}
                    onChange={(e) => updateField("cashInHand", Number(e.target.value))}
                    className={numInputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{language === "en" ? "Loans & Advances (अग्रिम ऋण)" : "अग्रिम ऋण (Advances)"}</label>
                  <input
                    type="number"
                    value={data.loansAndAdvances || ""}
                    onChange={(e) => updateField("loansAndAdvances", Number(e.target.value))}
                    className={numInputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: FIXED ASSETS REGISTER */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-2xs">
        <button
          onClick={() => toggleSection("assets_register")}
          className="w-full flex items-center justify-between px-5 py-4 bg-slate-50/50 hover:bg-slate-50 font-semibold text-slate-700 text-xs transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">5</span>
            {t.fixedAssetsList}
          </span>
          {activeSection === "assets_register" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {activeSection === "assets_register" && (
          <div className="p-5 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-500 max-w-[70%]">
                {language === "en"
                  ? "Enter Fixed Assets values below. The depreciation schedule updates instantly."
                  : "अचल संपत्तियों के मान दर्ज करें। मूल्यह्रास अनुसूची तुरंत अपडेट हो जाएगी।"}
              </p>
              <button onClick={handleAddFixedAsset} className="flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-xs">
                <Plus size={12} /> {t.addAsset}
              </button>
            </div>

            <div className="space-y-4 overflow-x-auto">
              <div className="min-w-[750px] space-y-2.5">
                {/* Header labels */}
                <div className="grid grid-cols-12 gap-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-3">{t.assetName}</div>
                  <div className="col-span-1 text-center">{t.rateDep}</div>
                  <div className="col-span-2 text-right">{t.openingBalance}</div>
                  <div className="col-span-2 text-right">Add &lt;= 180 Days</div>
                  <div className="col-span-2 text-right">Add &gt; 180 Days</div>
                  <div className="col-span-1 text-right">{language === "en" ? "Sales" : "बिक्री"}</div>
                  <div className="col-span-1 text-right">Action</div>
                </div>

                {data.fixedAssets.map((asset) => (
                  <div key={asset.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={language === "en" ? asset.nameEn : asset.nameHi}
                        onChange={(e) =>
                          updateListItem("fixedAssets", asset.id, language === "en" ? "nameEn" : "nameHi", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-1">
                      <div className="relative">
                        <input
                          type="number"
                          value={asset.rateOfDep}
                          onChange={(e) => updateListItem("fixedAssets", asset.id, "rateOfDep", Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-lg pr-5 pl-2 py-1.5 text-xs text-slate-800 text-center font-mono focus:outline-none"
                        />
                        <span className="absolute right-1.5 top-2 text-[10px] text-slate-400">%</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={asset.openingBalance || ""}
                        onChange={(e) => updateListItem("fixedAssets", asset.id, "openingBalance", Number(e.target.value))}
                        className={numInputClass}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={asset.additionUpTo180Days || ""}
                        onChange={(e) => updateListItem("fixedAssets", asset.id, "additionUpTo180Days", Number(e.target.value))}
                        className={numInputClass}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={asset.additionAfter180Days || ""}
                        onChange={(e) => updateListItem("fixedAssets", asset.id, "additionAfter180Days", Number(e.target.value))}
                        className={numInputClass}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        value={asset.sales || ""}
                        onChange={(e) => updateListItem("fixedAssets", asset.id, "sales", Number(e.target.value))}
                        className={numInputClass}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => removeListItem("fixedAssets", asset.id)}
                        className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
