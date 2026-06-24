import React, { useState, useEffect } from "react";
import { AccountingData, Language } from "./types";
import { initialAccountingData } from "./sampleData";
import { generateAccountingReport } from "./utils/accountingMath";
import { translations } from "./utils/translations";

import DataEntryForms from "./components/DataEntryForms";
import ReportViewer from "./components/ReportViewer";
import AnalyticsCharts from "./components/AnalyticsCharts";
import PrintReport from "./components/PrintReport";
import SecurityManager from "./components/SecurityManager";
import {
  encryptData,
  decryptData,
  getInitialSecurityConfig,
  SecurityConfig,
  AuditLogEntry
} from "./utils/securityCrypto";

import { 
  FileSpreadsheet, 
  Database, 
  BarChart3, 
  RotateCcw, 
  RefreshCw, 
  Upload, 
  Download, 
  Languages, 
  Info,
  CheckCircle,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff
} from "lucide-react";

const getClearedData = (): AccountingData => ({
  openingStock: 0,
  purchases: 0,
  directExpenses: [],
  sales: 0,
  closingStock: 0,
  indirectExpenses: [],
  indirectIncomes: [],
  capitalOpeningBalance: 0,
  withdrawals: 0,
  taxesPaid: 0,
  securedLoans: [],
  unsecuredLoans: [],
  sundryCreditors: 0,
  dutiesAndTaxes: 0,
  expensesPayable: 0,
  fixedAssets: [
    {
      id: "fa-1",
      nameEn: "Land",
      nameHi: "भूमि",
      rateOfDep: 0,
      openingBalance: 0,
      additionUpTo180Days: 0,
      additionAfter180Days: 0,
      sales: 0,
      depreciation: 0,
      closingBalance: 0
    }
  ],
  investments: [],
  sundryDebtors: 0,
  cashInHand: 0,
  bankAccounts: [],
  loansAndAdvances: 0
});

export default function App() {
  const [language, setLanguage] = useState<Language>("hi");
  const [data, setData] = useState<AccountingData>(initialAccountingData);
  const [activeView, setActiveView] = useState<"entry" | "reports" | "analytics">("entry");
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Security and Access control states
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(getInitialSecurityConfig());
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [activePin, setActivePin] = useState<string>("");
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const t = translations[language];

  // Load from localStorage on initialization
  useEffect(() => {
    // 1. Load security configuration
    const savedSec = localStorage.getItem("standard_accounting_security");
    let activeSec = getInitialSecurityConfig();
    if (savedSec) {
      try {
        activeSec = JSON.parse(savedSec);
        setSecurityConfig(activeSec);
      } catch (err) {
        console.error("Failed to parse security configuration", err);
      }
    }

    // 2. Load audit logs
    const savedLogs = localStorage.getItem("standard_accounting_audit_logs");
    if (savedLogs) {
      try {
        setAuditLogs(JSON.parse(savedLogs));
      } catch (err) {
        console.error("Failed to load audit logs", err);
      }
    }

    // 3. Load accounting ledger data
    if (activeSec.isEnabled) {
      setIsLocked(true);
      setData(getClearedData()); // Do not load plaintext data until unlocked
    } else {
      const saved = localStorage.getItem("standard_accounting_data");
      if (saved) {
        try {
          setData(JSON.parse(saved));
        } catch (err) {
          console.error("Failed to parse saved accounting data", err);
          setData(initialAccountingData);
        }
      } else {
        setData(initialAccountingData);
      }
      setIsLocked(false);
    }
  }, []);

  // Securely save ledger to localStorage with scrambling if enabled
  const handleDataChange = (
    newData: AccountingData, 
    overrideConfig?: SecurityConfig, 
    overridePin?: string
  ) => {
    const activeSec = overrideConfig || securityConfig;
    const pin = overridePin !== undefined ? overridePin : activePin;
    
    setData(newData);
    
    if (activeSec.isEnabled && pin) {
      const rawText = JSON.stringify(newData);
      const scrambled = encryptData(rawText, pin);
      localStorage.setItem("scrambled_accounting_data", scrambled);
      localStorage.removeItem("standard_accounting_data");
    } else {
      localStorage.setItem("standard_accounting_data", JSON.stringify(newData));
      localStorage.removeItem("scrambled_accounting_data");
    }
  };

  // Handle successful login/unlock
  const handleUnlockSuccess = (pin: string) => {
    setActivePin(pin);
    setIsLocked(false);
    
    const scrambled = localStorage.getItem("scrambled_accounting_data");
    if (scrambled) {
      try {
        const decrypted = decryptData(scrambled, pin);
        const parsed = JSON.parse(decrypted);
        setData(parsed);
      } catch (err) {
        console.error("Failed to decrypt saved data", err);
        triggerNotification("Decryption error: Data could be corrupt.", "error");
      }
    } else {
      // If no scrambled data exists, migrate plain standard data or load initial
      const plain = localStorage.getItem("standard_accounting_data");
      if (plain) {
        try {
          const parsed = JSON.parse(plain);
          setData(parsed);
          // scramble it immediately
          const scrambledData = encryptData(plain, pin);
          localStorage.setItem("scrambled_accounting_data", scrambledData);
          localStorage.removeItem("standard_accounting_data");
        } catch (err) {
          setData(initialAccountingData);
        }
      } else {
        setData(initialAccountingData);
      }
    }
  };

  // Change security settings and re-encrypt data if needed
  const handleConfigChange = (newConfig: SecurityConfig) => {
    localStorage.setItem("standard_accounting_security", JSON.stringify(newConfig));
    setSecurityConfig(newConfig);

    // If security is newly disabled, decrypt scrambled and save plain
    if (!newConfig.isEnabled) {
      setActivePin("");
      localStorage.setItem("standard_accounting_data", JSON.stringify(data));
      localStorage.removeItem("scrambled_accounting_data");
    }
  };

  // Audit Logs persistence
  const handleAddAuditLog = (
    actionEn: string, 
    actionHi: string, 
    type: "auth" | "data" | "security" | "backup"
  ) => {
    const newEntry: AuditLogEntry = {
      id: "log-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      actionEn,
      actionHi,
      type
    };
    const updated = [...auditLogs, newEntry].slice(-100); // Keep last 100 logs
    setAuditLogs(updated);
    localStorage.setItem("standard_accounting_audit_logs", JSON.stringify(updated));
  };

  const handleClearAuditLogs = () => {
    setAuditLogs([]);
    localStorage.removeItem("standard_accounting_audit_logs");
  };

  // Trigger temporary toast notifications
  const triggerNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Reset to sample data
  const handleLoadSample = () => {
    handleDataChange(initialAccountingData);
    triggerNotification(t.loadSuccess, "success");
    handleAddAuditLog(
      "Sample ledger data loaded",
      "नमूना बही-खाता डेटा लोड किया गया",
      "data"
    );
  };

  // Reset to empty/zeros
  const handleClearAll = () => {
    const cleared = getClearedData();
    handleDataChange(cleared);
    triggerNotification(t.clearSuccess, "success");
    handleAddAuditLog(
      "Ledger reset to zeros",
      "लेजर को शून्य पर रीसेट किया गया",
      "data"
    );
  };

  // JSON Export
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Accounting_Ledger_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotification("Backup exported successfully!", "success");
    handleAddAuditLog(
      "Client ledger backup exported",
      "ग्राहक लेजर बैकअप निर्यात किया गया",
      "backup"
    );
  };

  // JSON Import
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        // Simple structural validation
        if (typeof parsed.openingStock === "number" && Array.isArray(parsed.fixedAssets)) {
          handleDataChange(parsed);
          triggerNotification("Data restored from backup!", "success");
          handleAddAuditLog(
            "Client ledger restored from backup",
            "बैकअप से ग्राहक लेजर पुनर्स्थापित किया गया",
            "backup"
          );
        } else {
          triggerNotification("Invalid file structure. Backup cannot be restored.", "error");
        }
      } catch (err) {
        triggerNotification("Failed to parse backup file.", "error");
      }
    };
    fileReader.readAsText(file);
    // Reset file input value
    e.target.value = "";
  };

  // Generate Report math
  const report = generateAccountingReport(data);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col font-sans">
      {/* Dynamic Toast Alert */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-xl border text-xs font-semibold shadow-lg transition-all transform animate-bounce ${
          notification.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Navigation Header */}
      <header className="bg-white border-b border-slate-100 shrink-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo and Titles */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-xs">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                {t.appTitle}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                {t.appSubTitle}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 md:self-center">
            {/* Language Switch */}
            <button
              onClick={() => setLanguage(language === "en" ? "hi" : "en")}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Languages size={13} className="text-indigo-500" />
              <span>{t.toggleLang}</span>
            </button>

            {/* Quick backup */}
            <button
              onClick={handleExportJSON}
              title={t.exportData}
              className="p-1.5.5 flex items-center gap-1 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Backup</span>
            </button>

            {/* Quick restore */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors">
              <Upload size={13} />
              <span className="hidden sm:inline">Restore</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>

            {/* Load sample */}
            <button
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>{t.sampleData}</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleClearAll}
              title={t.resetData}
              className="p-2 border border-slate-200 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
            </button>
          </div>

        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Hand: Views and Sidebar info */}
        <div className="w-full lg:w-1/4 shrink-0 space-y-4">
          {/* Navigation Cards */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-3xs space-y-2.5 w-full">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5">
              Statements Navigation
            </h3>
            
            <button
              onClick={() => setActiveView("entry")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeView === "entry"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-transparent text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <Database size={15} />
                <span>{t.tabDataEntry}</span>
              </span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md">Ledger</span>
            </button>

            <button
              onClick={() => setActiveView("reports")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeView === "reports"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-transparent text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet size={15} />
                <span>{t.tabReports}</span>
              </span>
              {report.isBalanced ? (
                <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-md">OK</span>
              ) : (
                <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-md">Diff</span>
              )}
            </button>

            <button
              onClick={() => setActiveView("analytics")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeView === "analytics"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-transparent text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <BarChart3 size={15} />
                <span>{t.tabAnalytics}</span>
              </span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md">Charts</span>
            </button>
          </div>

          {/* Balance sheet brief health widget */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs w-full space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Audit Compliance Status
            </h4>
            
            {report.isBalanced ? (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50">
                <CheckCircle size={15} className="text-emerald-500" />
                <span className="text-xs font-semibold">Tally Check: Balanced</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-100/50">
                <AlertTriangle size={15} className="text-amber-500" />
                <span className="text-xs font-semibold">Tally Check: Unbalanced</span>
              </div>
            )}

            <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-700">Indian Income Tax Tip:</span> Adding asset blocks after Oct 4th (addition &gt; 180 Days) reduces the standard depreciation claim rate by half.
            </div>
          </div>

          {/* Security Control Deck */}
          <SecurityManager
            language={language}
            securityConfig={securityConfig}
            onConfigChange={handleConfigChange}
            isLocked={isLocked}
            setIsLocked={setIsLocked}
            auditLogs={auditLogs}
            onAddAuditLog={handleAddAuditLog}
            onClearAuditLogs={handleClearAuditLogs}
            onUnlockSuccess={handleUnlockSuccess}
          />
        </div>

        {/* Right Hand: Active Form / Report Area */}
        <div className="w-full lg:w-3/4">
          {activeView === "entry" && (
            <DataEntryForms 
              data={data} 
              onChange={handleDataChange} 
              language={language} 
            />
          )}

          {activeView === "reports" && (
            <ReportViewer 
              data={data} 
              report={report} 
              language={language} 
              onPrint={() => setShowPrintModal(true)} 
              onChange={handleDataChange}
              privacyMode={securityConfig.isPrivacyModeActive}
            />
          )}

          {activeView === "analytics" && (
            <AnalyticsCharts 
              report={report} 
              language={language} 
              privacyMode={securityConfig.isPrivacyModeActive}
            />
          )}
        </div>

      </main>

      {/* Print / PDF Fullscreen Modal */}
      {showPrintModal && (
        <PrintReport 
          data={data} 
          report={report} 
          language={language} 
          onClose={() => setShowPrintModal(false)} 
          privacyMode={securityConfig.isPrivacyModeActive}
        />
      )}

      {/* Small Humble Footer */}
      <footer className="bg-white border-t border-slate-100 py-4 px-6 shrink-0 text-center">
        <p className="text-[10px] text-slate-400 font-mono">
          © 2026 Financial Statement Generator — Adheres to Standard CA & Income Tax Depreciation Formats.
        </p>
        <p className="text-[10px] text-amber-600/80 font-semibold font-mono mt-1">
          Created by 204072937
        </p>
      </footer>
    </div>
  );
}
