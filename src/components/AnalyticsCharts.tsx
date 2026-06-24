import { Language } from "../types";
import { AccountingReport } from "../utils/accountingMath";
import { translations } from "../utils/translations";
import { Scale, TrendingUp, DollarSign, Briefcase, Award } from "lucide-react";

interface AnalyticsChartsProps {
  report: AccountingReport;
  language: Language;
  privacyMode?: boolean;
}

export default function AnalyticsCharts({ report, language, privacyMode }: AnalyticsChartsProps) {
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
    grossProfit,
    netProfit,
    totalIndirectExpenses,
    totalFixedAssetsVal,
    totalInvestments,
    totalCurrentAssets,
    totalLiabilities,
    totalAssets,
    calculatedFixedAssets,
  } = report;

  // Let's safe-guard sales division
  const salesVal = report.netProfit > 0 ? (grossProfit * 2.5) : 100000; // approximation if sales is 0
  const salesActual = grossProfit + totalIndirectExpenses - netProfit; // Derived or direct
  
  // Calculate percentage margins
  const gpMargin = salesActual > 0 ? (grossProfit / salesActual) * 100 : 0;
  const npMargin = salesActual > 0 ? (netProfit / salesActual) * 100 : 0;
  const expenseRatio = salesActual > 0 ? (totalIndirectExpenses / salesActual) * 100 : 0;

  // Balance status Tilt calculation for SVG scale
  // tilt angle should range between -15deg and 15deg depending on difference
  const diff = totalLiabilities - totalAssets;
  const maxDiffRange = Math.max(totalLiabilities, totalAssets, 10000) * 0.1; // 10% tolerance is max tilt
  const tiltAngle = Math.max(-15, Math.min(15, (diff / (maxDiffRange || 1)) * 15));

  // Sort and get top assets for horizontal bar charts
  const sortedAssets = [...calculatedFixedAssets]
    .sort((a, b) => b.closingBalance - a.closingBalance)
    .slice(0, 5);

  const maxAssetVal = Math.max(...sortedAssets.map((a) => a.closingBalance), 1);

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Profit */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
              {language === "en" ? "Gross Profit (सकल लाभ)" : "सकल लाभ"}
            </p>
            <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{formatCurrency(grossProfit)}</p>
            <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
              <span>{gpMargin.toFixed(1)}% {language === "en" ? "Margin" : "मार्जिन"}</span>
            </p>
          </div>
        </div>

        {/* Card 2: Net Profit */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
              {language === "en" ? "Net Profit (शुद्ध लाभ)" : "शुद्ध लाभ"}
            </p>
            <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{formatCurrency(netProfit)}</p>
            <p className="text-[10px] text-teal-600 font-medium flex items-center gap-0.5 mt-0.5">
              <span>{npMargin.toFixed(1)}% {language === "en" ? "Net Margin" : "शुद्ध मार्जिन"}</span>
            </p>
          </div>
        </div>

        {/* Card 3: Total Depreciation */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
              {language === "en" ? "Total Depreciation (मूल्यह्रास)" : "कुल मूल्यह्रास"}
            </p>
            <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{formatCurrency(report.totalDepreciation)}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              {calculatedFixedAssets.length} {language === "en" ? "Assets depreciated" : "संपत्तियों पर मूल्यह्रास"}
            </p>
          </div>
        </div>

        {/* Card 4: Operating Expenses */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Briefcase size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
              {language === "en" ? "Indirect Expenses" : "अप्रत्यक्ष व्यय"}
            </p>
            <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{formatCurrency(totalIndirectExpenses)}</p>
            <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
              {expenseRatio.toFixed(1)}% {language === "en" ? "Opex Ratio" : "व्यय अनुपात"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart A: Interactive Balance scale */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-2xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
            <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Scale size={14} className="text-indigo-500" />
              {language === "en" ? "Dual-Balance Indicator Scale" : "तुलन पत्र संतुलन स्केल"}
            </h4>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
              report.isBalanced ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            }`}>
              {report.isBalanced ? "BALANCED" : "TILTED"}
            </span>
          </div>

          {/* Interactive SVG Balance scale */}
          <div className="relative w-full max-w-[260px] h-[160px] flex justify-center items-end mt-4">
            <svg viewBox="0 0 200 150" className="w-full h-full">
              {/* Stand Base */}
              <path d="M70 140 L130 140 L120 130 L80 130 Z" fill="#475569" />
              <rect x="95" y="40" width="10" height="90" fill="#64748b" />
              <circle cx="100" cy="40" r="8" fill="#475569" />

              {/* Tilted Balance Beam */}
              <g transform={`rotate(${tiltAngle} 100 40)`}>
                <line x1="30" y1="40" x2="170" y2="40" stroke="#334155" strokeWidth="4" />
                <circle cx="100" cy="40" r="4" fill="#cbd5e1" />

                {/* Left pan strings and basket */}
                <line x1="30" y1="40" x2="15" y2="90" stroke="#94a3b8" strokeWidth="1" />
                <line x1="30" y1="40" x2="45" y2="90" stroke="#94a3b8" strokeWidth="1" />
                <path d="M10 90 L50 90 A20 20 0 0 1 10 90 Z" fill="#94a3b8" opacity="0.9" />
                <circle cx="30" cy="100" r="6" fill="#1e293b" />
                
                {/* Right pan strings and basket */}
                <line x1="170" y1="40" x2="155" y2="90" stroke="#94a3b8" strokeWidth="1" />
                <line x1="170" y1="40" x2="185" y2="90" stroke="#94a3b8" strokeWidth="1" />
                <path d="M150 90 L190 90 A20 20 0 0 1 150 90 Z" fill="#94a3b8" opacity="0.9" />
                <circle cx="170" cy="100" r="6" fill="#0f766e" />
              </g>
            </svg>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 mt-4 text-center">
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">{t.liabilities}</p>
              <p className="text-xs font-bold font-mono text-slate-700 mt-0.5">{formatCurrency(totalLiabilities)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">{t.assets}</p>
              <p className="text-xs font-bold font-mono text-teal-800 mt-0.5">{formatCurrency(totalAssets)}</p>
            </div>
          </div>
        </div>

        {/* Chart B: Top Asset allocation breakdown */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
              <Briefcase size={14} className="text-emerald-500" />
              {language === "en" ? "Fixed Assets WDV Share" : "अचल संपत्ति मूल्य हिस्सेदारी"}
            </h4>
            
            <div className="space-y-3.5">
              {sortedAssets.map((asset) => {
                const pct = (asset.closingBalance / maxAssetVal) * 100;
                return (
                  <div key={asset.id} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-medium text-slate-700">
                        {language === "en" ? asset.nameEn : asset.nameHi}
                      </span>
                      <span className="font-mono text-slate-500 font-semibold">
                        {formatCurrency(asset.closingBalance)}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(3, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 mt-4 flex justify-between items-center text-[10px] text-slate-500">
            <span>{language === "en" ? "Total Fixed Assets Value" : "कुल अचल संपत्ति मूल्य"}:</span>
            <strong className="font-mono text-slate-700 text-xs">{formatCurrency(totalFixedAssetsVal)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
