import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Clock, 
  ClipboardList, 
  KeyRound, 
  ShieldAlert, 
  Trash2, 
  X, 
  AlertCircle,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { SecurityConfig, AuditLogEntry, hashPasscode } from "../utils/securityCrypto";
import { translations } from "../utils/translations";
import { Language } from "../types";

interface SecurityManagerProps {
  language: Language;
  securityConfig: SecurityConfig;
  onConfigChange: (config: SecurityConfig, pin?: string) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  auditLogs: AuditLogEntry[];
  onAddAuditLog: (actionEn: string, actionHi: string, type: "auth" | "data" | "security" | "backup") => void;
  onClearAuditLogs: () => void;
  onUnlockSuccess: (pin: string) => void;
}

export default function SecurityManager({
  language,
  securityConfig,
  onConfigChange,
  isLocked,
  setIsLocked,
  auditLogs,
  onAddAuditLog,
  onClearAuditLogs,
  onUnlockSuccess
}: SecurityManagerProps) {
  const t = translations[language];
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [setupPIN, setSetupPIN] = useState<string>("");
  const [setupConfirmPIN, setSetupConfirmPIN] = useState<string>("");
  const [setupQuestion, setSetupQuestion] = useState<string>("");
  const [setupAnswer, setSetupAnswer] = useState<string>("");
  const [setupError, setSetupError] = useState<string>("");

  const [inputPIN, setInputPIN] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [showRecovery, setShowRecovery] = useState<boolean>(false);
  const [recoveryAnswerInput, setRecoveryAnswerInput] = useState<string>("");
  const [recoveryError, setRecoveryError] = useState<string>("");

  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Auto-lock timer and activity tracking
  const lastActivityRef = useRef<number>(Date.now());

  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Activity tracking for auto-lock
  useEffect(() => {
    if (!securityConfig.isEnabled || securityConfig.autoLockMinutes <= 0 || isLocked) return;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Track common user interactions
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("mousedown", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    // Periodically check for inactivity
    const interval = setInterval(() => {
      const inactiveMs = Date.now() - lastActivityRef.current;
      const thresholdMs = securityConfig.autoLockMinutes * 60 * 1000;
      if (inactiveMs >= thresholdMs) {
        setIsLocked(true);
        onAddAuditLog(
          "Inactivity auto-lock triggered",
          "अक्रियता के कारण ऑटो-लॉक सक्रिय हुआ",
          "auth"
        );
      }
    }, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      clearInterval(interval);
    };
  }, [securityConfig.isEnabled, securityConfig.autoLockMinutes, isLocked]);

  // Unlock verification
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredHash = hashPasscode(inputPIN);
    if (enteredHash === securityConfig.passcodeHash) {
      onUnlockSuccess(inputPIN);
      setInputPIN("");
      setLoginError("");
      setShowRecovery(false);
      onAddAuditLog(
        "Client ledger unlocked successfully",
        "क्लाइंट लेजर को सफलतापूर्वक अनलॉक किया गया",
        "auth"
      );
    } else {
      setLoginError(t.incorrectPasscode);
      onAddAuditLog(
        "Failed unlock attempt: incorrect PIN",
        "अनलॉक करने का विफल प्रयास: गलत पिन",
        "auth"
      );
    }
  };

  // Setup security
  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPIN.length < 4 || setupPIN.length > 8) {
      setSetupError(language === "en" ? "PIN must be between 4 and 8 digits." : "पिन 4 से 8 अंकों के बीच होना चाहिए।");
      return;
    }
    if (setupPIN !== setupConfirmPIN) {
      setSetupError(language === "en" ? "PIN codes do not match." : "पिन कोड मेल नहीं खाते हैं।");
      return;
    }
    if (!setupQuestion.trim() || !setupAnswer.trim()) {
      setSetupError(language === "en" ? "Please fill the recovery question and answer." : "कृपया रिकवरी प्रश्न और उत्तर भरें।");
      return;
    }

    const newConfig: SecurityConfig = {
      isEnabled: true,
      passcodeHash: hashPasscode(setupPIN),
      securityQuestion: setupQuestion.trim(),
      securityAnswerHash: hashPasscode(setupAnswer.trim().toLowerCase()),
      autoLockMinutes: securityConfig.autoLockMinutes,
      isPrivacyModeActive: securityConfig.isPrivacyModeActive
    };

    onConfigChange(newConfig, setupPIN);
    setShowSetupModal(false);
    setSetupPIN("");
    setSetupConfirmPIN("");
    setSetupQuestion("");
    setSetupAnswer("");
    setSetupError("");
    triggerToast(t.successSecuritySetup, "success");
    onAddAuditLog(
      "Master passcode security enabled",
      "मास्टर पासकोड सुरक्षा सक्षम की गई",
      "security"
    );
  };

  // Recovery verification
  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredAnswerHash = hashPasscode(recoveryAnswerInput.trim().toLowerCase());
    if (enteredAnswerHash === securityConfig.securityAnswerHash) {
      // Correct recovery answer - disable security so they can access and reset
      const resetConfig: SecurityConfig = {
        isEnabled: false,
        passcodeHash: "",
        securityQuestion: "",
        securityAnswerHash: "",
        autoLockMinutes: 5,
        isPrivacyModeActive: false
      };
      onConfigChange(resetConfig);
      setIsLocked(false);
      setRecoveryAnswerInput("");
      setRecoveryError("");
      setShowRecovery(false);
      triggerToast(language === "en" ? "PIN bypassed! Security reset successfully." : "पिन बायपास! सुरक्षा सफलतापूर्वक रीसेट हो गई।", "success");
      onAddAuditLog(
        "Security bypassed via correct recovery answer",
        "सही रिकवरी उत्तर के माध्यम से सुरक्षा को बायपास किया गया",
        "security"
      );
    } else {
      setRecoveryError(language === "en" ? "Incorrect recovery answer." : "गलत रिकवरी उत्तर।");
      onAddAuditLog(
        "Failed recovery attempt: incorrect answer",
        "विफल रिकवरी प्रयास: गलत उत्तर",
        "security"
      );
    }
  };

  // Disable security
  const handleDisableSecurity = () => {
    if (!window.confirm(language === "en" ? "Are you sure you want to disable passcode security? Your data will be stored in clear text." : "क्या आप वाकई पासकोड सुरक्षा अक्षम करना चाहते हैं? आपका डेटा सामान्य टेक्स्ट में संग्रहीत किया जाएगा।")) return;
    
    const disabledConfig: SecurityConfig = {
      isEnabled: false,
      passcodeHash: "",
      securityQuestion: "",
      securityAnswerHash: "",
      autoLockMinutes: 5,
      isPrivacyModeActive: false
    };
    onConfigChange(disabledConfig);
    triggerToast(t.successSecurityDisabled, "success");
    onAddAuditLog(
      "Master passcode security disabled",
      "मास्टर पासकोड सुरक्षा अक्षम की गई",
      "security"
    );
  };

  // Change privacy mode directly
  const handleTogglePrivacyMode = () => {
    const updated = {
      ...securityConfig,
      isPrivacyModeActive: !securityConfig.isPrivacyModeActive
    };
    onConfigChange(updated);
    onAddAuditLog(
      `Privacy masking mode turned ${updated.isPrivacyModeActive ? "ON" : "OFF"}`,
      `गोपनीयता मास्किंग मोड ${updated.isPrivacyModeActive ? "चालू" : "बंद"} किया गया`,
      "security"
    );
  };

  // Change auto-lock minutes
  const handleAutoLockChange = (mins: number) => {
    const updated = {
      ...securityConfig,
      autoLockMinutes: mins
    };
    onConfigChange(updated);
    onAddAuditLog(
      `Auto-lock timeout updated to ${mins} mins`,
      `ऑटो-लॉक टाइमआउट ${mins} मिनट पर अपडेट किया गया`,
      "security"
    );
  };

  return (
    <div id="security-manager-root" className="w-full">
      {/* Toast Alert */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-lg transition-all animate-bounce ${
          notification.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {notification.type === "success" ? <CheckCircle size={14} className="text-emerald-500" /> : <AlertCircle size={14} className="text-rose-500" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* 1. SECURE LOCK SCREEN (FULLSCREEN OVERLAY) */}
      {isLocked && securityConfig.isEnabled && (
        <div className="fixed inset-0 bg-slate-900/98 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-800 space-y-6 animate-fade-in">
            
            {/* Header Lock Icon */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-4 bg-rose-50 rounded-full text-rose-600 border border-rose-100 animate-pulse">
                <Lock size={32} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {language === "en" ? "Confidential Ledger Locked" : "गोपनीय बही-खाता लॉक है"}
              </h2>
              <p className="text-xs text-slate-400 max-w-xs">
                {t.enterPasscode}
              </p>
            </div>

            {/* Input Form or Recovery Screen */}
            {!showRecovery ? (
              <form onSubmit={handleUnlock} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 block">
                    {language === "en" ? "Enter Master PIN" : "मास्टर पिन दर्ज करें"}
                  </label>
                  <input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={8}
                    value={inputPIN}
                    onChange={(e) => setInputPIN(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center tracking-[1.5em] text-lg font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="••••"
                    autoFocus
                  />
                </div>

                {loginError && (
                  <div className="flex items-center gap-1.5 p-2.5 bg-rose-50 text-rose-800 text-[11px] font-semibold rounded-lg border border-rose-100">
                    <AlertCircle size={13} className="shrink-0 text-rose-600" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!inputPIN}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Unlock size={14} />
                  <span>{t.unlockApp}</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecovery(true);
                      setRecoveryError("");
                      setRecoveryAnswerInput("");
                    }}
                    className="text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold transition-colors"
                  >
                    {language === "en" ? "Forgot Master PIN / Recover?" : "मास्टर पिन भूल गए / रिकवर करें?"}
                  </button>
                </div>
              </form>
            ) : (
              // Verification Question Recovery Form
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                    {t.recoveryQuestion}
                  </span>
                  <p className="text-xs font-semibold text-slate-800">
                    {securityConfig.securityQuestion}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">
                    {t.recoveryAnswer}
                  </label>
                  <input
                    type="text"
                    value={recoveryAnswerInput}
                    onChange={(e) => setRecoveryAnswerInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-xs text-slate-800"
                    placeholder={language === "en" ? "Answer to recovery question..." : "रिकवरी प्रश्न का उत्तर..."}
                    required
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-400 font-medium">
                    {t.recoveryTip}
                  </p>
                </div>

                {recoveryError && (
                  <div className="flex items-center gap-1.5 p-2.5 bg-rose-50 text-rose-800 text-[11px] font-semibold rounded-lg border border-rose-100">
                    <AlertCircle size={13} className="shrink-0 text-rose-600" />
                    <span>{recoveryError}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRecovery(false)}
                    className="w-1/2 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    {language === "en" ? "Back" : "वापस"}
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    {language === "en" ? "Verify Recovery" : "सत्यापित करें"}
                  </button>
                </div>
              </form>
            )}

            {/* Privacy note */}
            <div className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
              🔒 {t.securityTip}
            </div>
          </div>
        </div>
      )}

      {/* 2. SETUP SECURITY MODAL */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-fade-in text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="text-amber-500" size={18} />
                <span>{t.setPasscode}</span>
              </h3>
              <button 
                onClick={() => setShowSetupModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSetupSubmit} className="space-y-4 text-xs">
              {setupError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} className="text-rose-600 shrink-0" />
                  <span>{setupError}</span>
                </div>
              )}

              {/* PIN code input */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">{t.passcodeLabel}</label>
                  <input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={8}
                    required
                    value={setupPIN}
                    onChange={(e) => setSetupPIN(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 1234"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    {language === "en" ? "Confirm PIN" : "पिन की पुष्टि करें"}
                  </label>
                  <input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={8}
                    required
                    value={setupConfirmPIN}
                    onChange={(e) => setSetupConfirmPIN(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 1234"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              {/* Recovery details */}
              <div className="space-y-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1">
                    <HelpCircle size={13} className="text-indigo-500" />
                    <span>{t.recoveryQuestion}</span>
                  </label>
                  <select
                    value={setupQuestion}
                    onChange={(e) => setSetupQuestion(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="">-- Select recovery question --</option>
                    <option value="What is your first CA/Professional Registration number?">
                      {language === "en" ? "What is your first CA/Professional Registration number?" : "आपकी पहली CA/व्यावसायिक पंजीकरण संख्या क्या है?"}
                    </option>
                    <option value="What is the name of your first premium corporate client?">
                      {language === "en" ? "What is the name of your first premium corporate client?" : "आपके पहले प्रीमियम कॉर्पोरेट ग्राहक का नाम क्या है?"}
                    </option>
                    <option value="What city did you register your ledger firm in?">
                      {language === "en" ? "What city did you register your ledger firm in?" : "आपने अपनी लेजर फर्म को किस शहर में पंजीकृत किया था?"}
                    </option>
                    <option value="What was your first accounting software?">
                      {language === "en" ? "What was your first accounting software?" : "आपका पहला अकाउंटिंग सॉफ्टवेयर कौन सा था?"}
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">{t.recoveryAnswer}</label>
                  <input
                    type="text"
                    required
                    value={setupAnswer}
                    onChange={(e) => setSetupAnswer(e.target.value)}
                    placeholder="Secret recovery answer (case-insensitive)"
                    className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    ⚠️ Keep this recovery answer safe! It acts as your override key.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSetupModal(false)}
                  className="w-1/2 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-all cursor-pointer"
                >
                  {language === "en" ? "Cancel" : "रद्द करें"}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all cursor-pointer"
                >
                  {language === "en" ? "Activate PIN" : "पिन सक्रिय करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. SETTINGS UI PANEL (Can be placed in sidebar, dashboard, or active panel) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs p-4.5 space-y-4">
        
        {/* Module Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-emerald-600 shrink-0" size={17} />
            <h3 className="text-xs font-extrabold text-slate-900 tracking-tight">
              {t.securitySettings}
            </h3>
          </div>
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
            securityConfig.isEnabled 
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" 
              : "bg-slate-50 text-slate-400 border border-slate-200/50"
          }`}>
            {securityConfig.isEnabled ? "Secure" : "Unsecured"}
          </span>
        </div>

        <p className="text-[11px] text-slate-400 leading-normal">
          {t.securityDesc}
        </p>

        {/* Security Controls */}
        <div className="space-y-3.5 pt-1.5 text-xs">
          
          {/* Master PIN status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 block">
                {securityConfig.isEnabled ? t.securityEnabled : t.securityDisabled}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {securityConfig.isEnabled ? "Local Storage ledger is scrambled" : "Stored in plain JSON state"}
              </span>
            </div>
            
            {securityConfig.isEnabled ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsLocked(true)}
                  className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold text-[10px] transition-colors border border-rose-200/50 cursor-pointer flex items-center gap-1"
                  title={t.lockApp}
                >
                  <Lock size={11} />
                  <span>Lock</span>
                </button>
                <button
                  onClick={handleDisableSecurity}
                  className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                  title={t.disableSecurity}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setSetupError("");
                  setSetupPIN("");
                  setSetupConfirmPIN("");
                  setSetupQuestion("");
                  setSetupAnswer("");
                  setShowSetupModal(true);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs cursor-pointer flex items-center gap-1"
              >
                <KeyRound size={12} />
                <span>{language === "en" ? "Setup PIN" : "पिन सेट करें"}</span>
              </button>
            )}
          </div>

          {/* Privacy mode toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
            <div className="space-y-0.5 pr-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                {securityConfig.isPrivacyModeActive ? <EyeOff size={13} className="text-amber-500" /> : <Eye size={13} className="text-slate-400" />}
                <span>{t.privacyMode}</span>
              </span>
              <span className="text-[10px] text-slate-400 block leading-tight">
                {t.privacyModeDesc}
              </span>
            </div>
            <button
              onClick={handleTogglePrivacyMode}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                securityConfig.isPrivacyModeActive ? 'bg-amber-500' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  securityConfig.isPrivacyModeActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto Lock timer */}
          {securityConfig.isEnabled && (
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Clock size={13} className="text-indigo-500" />
                <span>{t.autoLockTimer}</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px] font-bold">
                {[0, 1, 5, 15].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleAutoLockChange(mins)}
                    className={`py-1 rounded-md border text-center transition-all cursor-pointer ${
                      securityConfig.autoLockMinutes === mins
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    {mins === 0 ? "Off" : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. CHRONOLOGICAL AUDIT LOG */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <ClipboardList size={13} className="text-slate-500" />
                <span>{t.auditLogs}</span>
              </span>
              {auditLogs.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm(language === "en" ? "Clear all local security audit logs?" : "क्या सभी स्थानीय सुरक्षा ऑडिट लॉग साफ़ करें?")) {
                      onClearAuditLogs();
                    }
                  }}
                  className="text-[9px] font-bold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  {language === "en" ? "Clear Logs" : "लॉग्स साफ़ करें"}
                </button>
              )}
            </div>
            
            <p className="text-[10px] text-slate-400">
              {t.auditLogsDesc}
            </p>

            <div className="max-h-36 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100/60 bg-slate-50/20 text-[10px] font-mono p-1">
              {auditLogs.length === 0 ? (
                <div className="text-center py-4 text-slate-400 font-sans">
                  No logs recorded. Security actions will appear here.
                </div>
              ) : (
                [...auditLogs].reverse().map((log) => (
                  <div key={log.id} className="p-1.5 flex flex-col gap-0.5 text-[9px] hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className={`px-1 py-0.2 rounded-sm font-bold text-[8px] uppercase ${
                        log.type === "auth" ? "bg-rose-50 text-rose-600 border border-rose-100/50" :
                        log.type === "data" ? "bg-amber-50 text-amber-700 border border-amber-100/50" :
                        log.type === "security" ? "bg-emerald-50 text-emerald-700 border border-emerald-100/50" :
                        "bg-indigo-50 text-indigo-700 border border-indigo-100/50"
                      }`}>
                        {log.type}
                      </span>
                      <span className="text-slate-400 text-[8px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-normal font-sans font-medium">
                      {language === "en" ? log.actionEn : log.actionHi}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
