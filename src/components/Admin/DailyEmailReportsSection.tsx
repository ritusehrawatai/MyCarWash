import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Settings2,
  ShieldAlert,
  Loader2,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  Globe,
  RefreshCw,
  FileText,
  UserCheck,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DailyReportEmailConfig, DeliveryLogRecord } from '../../types/reports';
import { Transaction, BusinessInfo } from '../../types/pos';
import { UserAccount } from '../../services/authService';
import {
  calculateDailyReport,
  formatCurrencyValue,
  formatDateInTimezone,
} from '../../services/reportCalculationService';
import { useLanguage } from '../../context/LanguageContext';

interface DailyEmailReportsSectionProps {
  businessInfo: BusinessInfo;
  transactions: Transaction[];
  accounts: UserAccount[];
  currentUserId?: string;
}

const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US - New York)' },
  { value: 'America/Chicago', label: 'Central Time (US - Chicago)' },
  { value: 'America/Denver', label: 'Mountain Time (US - Denver)' },
  { value: 'America/Phoenix', label: 'Arizona (US - Phoenix)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US - Los Angeles)' },
  { value: 'America/Anchorage', label: 'Alaska Time (US - Anchorage)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (US - Honolulu)' },
  { value: 'Europe/London', label: 'GMT / London' },
  { value: 'Europe/Madrid', label: 'CET / Madrid' },
  { value: 'Asia/Kolkata', label: 'IST (India)' },
  { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
  { value: 'Australia/Sydney', label: 'AEST (Sydney)' },
];

export const DailyEmailReportsSection: React.FC<DailyEmailReportsSectionProps> = ({
  businessInfo,
  transactions,
  accounts,
}) => {
  const { t } = useLanguage();

  // Server state
  const [config, setConfig] = useState<DailyReportEmailConfig>({
    enabled: true,
    recipientEmails: ['admin@carwash.com'],
    deliveryTime: '23:59',
    timezone: 'America/New_York',
    includeZeroWashEmployees: false,
    maxDetailedRecordsInEmail: 50,
  });

  const [serverStatus, setServerStatus] = useState<{
    serverTimeUtc?: string;
    businessTime?: string;
    businessDate?: string;
    targetReportDate?: string;
    timezone?: string;
    hasSmtpConfigured?: boolean;
    hasGoogleAppsScriptConfigured?: boolean;
  }>({});

  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  // Test email state
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Manual report trigger state
  const [manualDate, setManualDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [isSendingManual, setIsSendingManual] = useState(false);
  const [manualResult, setManualResult] = useState<{ success: boolean; message: string } | null>(null);

  // Retrying state
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);

  // Recipient input string for editing (comma-separated)
  const [recipientInput, setRecipientInput] = useState('admin@carwash.com');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Load configuration and logs from server
  const loadServerData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Config
      const configRes = await fetch('/api/reports/config');
      if (configRes.ok) {
        const data = await configRes.json();
        if (data.config) {
          setConfig(data.config);
          setRecipientInput((data.config.recipientEmails || ['admin@carwash.com']).join(', '));
          if (!testEmailAddress && data.config.recipientEmails?.[0]) {
            setTestEmailAddress(data.config.recipientEmails[0]);
          }
        }
        if (data.serverStatus) {
          setServerStatus(data.serverStatus);
          if (data.serverStatus.businessDate) {
            setManualDate(data.serverStatus.businessDate);
          }
        }
      }

      // 2. Fetch Logs
      const logsRes = await fetch('/api/reports/logs');
      if (logsRes.ok) {
        const data = await logsRes.json();
        if (Array.isArray(data.logs)) {
          setDeliveryLogs(data.logs);
        }
      }
    } catch (err) {
      console.warn('Error loading email reports data from server:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServerData();
  }, []);

  // Save Configuration Handler
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    // Parse recipient emails
    const emails = recipientInput
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      setSaveErrorMsg('At least one recipient email address is required.');
      setIsSaving(false);
      return;
    }

    // Validate email format
    for (const email of emails) {
      if (!email.includes('@') || !email.includes('.')) {
        setSaveErrorMsg(`Invalid email format: "${email}". Please provide a valid address.`);
        setIsSaving(false);
        return;
      }
    }

    const updatedConfig: DailyReportEmailConfig = {
      ...config,
      recipientEmails: emails,
    };

    try {
      const res = await fetch('/api/reports/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update configuration');
      }

      setConfig(data.config || updatedConfig);
      setSaveSuccessMsg('Daily report email configuration saved successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
      loadServerData();
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Error saving configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // Send Test Email Handler
  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestResult(null);

    const target = testEmailAddress.trim() || config.recipientEmails[0] || 'admin@carwash.com';

    try {
      const res = await fetch('/api/reports/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: target }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `Test email dispatched successfully to ${target}!`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to send test email.',
        });
      }
      loadServerData();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error while attempting to send test email.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Send Manual Daily Report Handler
  const handleSendManual = async () => {
    setIsSendingManual(true);
    setManualResult(null);

    try {
      const res = await fetch('/api/reports/send-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: manualDate }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setManualResult({
          success: true,
          message: `Daily report for ${manualDate} dispatched successfully!`,
        });
      } else {
        setManualResult({
          success: false,
          message: data.error || (data.results?.[0]?.log?.errorDetail) || 'Failed to dispatch daily report.',
        });
      }
      loadServerData();
    } catch (err: any) {
      setManualResult({
        success: false,
        message: err.message || 'Network error while generating daily report.',
      });
    } finally {
      setIsSendingManual(false);
    }
  };

  // Retry Failed Delivery Handler
  const handleRetryLog = async (logId: string) => {
    setRetryingLogId(logId);
    try {
      const res = await fetch('/api/reports/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccessMsg('Report delivery retried successfully!');
      } else {
        setSaveErrorMsg(data.error || 'Retry attempt failed.');
      }
      loadServerData();
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Network error during retry.');
    } finally {
      setRetryingLogId(null);
    }
  };

  // Compute live preview of manual date's transactions
  const previewReport = calculateDailyReport(
    transactions,
    accounts,
    manualDate,
    config.timezone,
    businessInfo.businessName || 'AquaShine'
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide uppercase mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>Automated End-of-Day Dispatch</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Daily Employee Service Reports
          </h2>
          <p className="mt-2 text-cyan-100 text-sm leading-relaxed">
            Automatically compile and email a complete end-of-day car wash breakdown to the Admin. Includes individual employee wash tallies, package breakdowns, sales totals, and detailed service records.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md">
              <span className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
              <strong>{config.enabled ? 'Daily Dispatch: ACTIVE' : 'Daily Dispatch: PAUSED'}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md">
              <Clock className="w-3.5 h-3.5" />
              <span>Time: <strong>{config.deliveryTime}</strong> ({config.timezone})</span>
            </span>
            {serverStatus.businessTime && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md">
                <span>Current Time: {serverStatus.businessTime}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Configuration & Schedule Form */}
      <form onSubmit={handleSaveConfig} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delivery Schedule & Recipients
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure when and to whom the end-of-day employee report is delivered
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {config.enabled ? 'Enabled' : 'Disabled'}
            </span>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600 relative"></div>
          </label>
        </div>

        {saveSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {saveErrorMsg && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{saveErrorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Recipient Emails */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Admin Recipient Email Address(es) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              placeholder="admin@carwash.com, manager@carwash.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              required
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Comma-separated list of Admin email addresses authorized to receive daily employee reports.
            </p>
          </div>

          {/* Delivery Time */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Daily Delivery Time (Local Business Time) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="time"
                value={config.deliveryTime}
                onChange={(e) => setConfig({ ...config, deliveryTime: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Default is <strong>23:59</strong> (11:59 PM). Post-midnight schedules (e.g. 00:15) automatically report on the completed previous business day.
            </p>
          </div>

          {/* Business Timezone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Business Timezone <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={config.timezone}
                onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label} ({tz.value})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Determines business day cutoffs independent of cloud server physical timezone.
            </p>
          </div>

          {/* Google Apps Script Web App URL (Option 2) */}
          <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Google Apps Script Web App URL (Option 2: Free Email Relay)
              </label>
              <button
                type="button"
                onClick={() => setIsGuideOpen((prev) => !prev)}
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Info className="w-3.5 h-3.5" />
                <span>{isGuideOpen ? 'Hide Setup Steps' : 'How to get this URL (Step-by-Step)'}</span>
                {isGuideOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            <input
              type="url"
              value={config.googleAppsScriptUrl || ''}
              onChange={(e) => setConfig({ ...config, googleAppsScriptUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Paste your Google Apps Script Web App URL here. Once saved, reports and test emails will be delivered automatically using your Google account quota (100 free emails/day) with zero subscription fees.
            </p>

            {/* Collapsible Step-by-Step Setup Guide */}
            {isGuideOpen && (
              <div className="mt-3 p-4 bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-900 dark:text-cyan-200">
                    Option 2: Free 3-Minute Google Apps Script Setup
                  </span>
                  <a
                    href="https://script.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 dark:text-cyan-300 hover:underline"
                  >
                    <span>Open script.google.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300">
                  <li>
                    Open <strong>script.google.com</strong> and click <strong>+ New project</strong>.
                  </li>
                  <li>
                    Open the file <strong><code>google-apps-script/Code.gs</code></strong> in this project, copy all the code, and paste it into the Apps Script editor.
                  </li>
                  <li>
                    Click the blue <strong>Deploy</strong> button (top-right) &rarr; <strong>New deployment</strong>.
                  </li>
                  <li>
                    Click the gear icon (⚙️) next to <em>Select type</em> and pick <strong>Web app</strong>.
                  </li>
                  <li>
                    Set <strong>Execute as:</strong> <code>Me</code> and <strong>Who has access:</strong> <code>Anyone</code>.
                  </li>
                  <li>
                    Click <strong>Deploy</strong>, grant permission to your Google Account, copy the generated <strong>Web app URL</strong>, and paste it into the field above!
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Transport Status Banner */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Email Transport Configuration Status:
            </span>
            <div className="flex items-center gap-2">
              {serverStatus.hasSmtpConfigured ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px]">
                  SMTP Active
                </span>
              ) : serverStatus.hasGoogleAppsScriptConfigured ? (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold text-[10px]">
                  Google Apps Script Active
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[10px]">
                  Requires SMTP or Apps Script URL
                </span>
              )}
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            The background scheduler runs persistently on the backend independently of browser sessions. For production dispatch, set <code>SMTP_HOST</code>/<code>SMTP_USER</code>/<code>SMTP_PASS</code> or <code>GOOGLE_APPS_SCRIPT_URL</code> in environment variables.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Save Email Schedule Settings</span>
          </button>
        </div>
      </form>

      {/* Two Column Section: Test Email & Manual Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Email Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Send Test Email
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify transport credentials and preview report layout immediately
              </p>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Target Test Email Address
            </label>
            <input
              type="email"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="admin@carwash.com"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <button
            type="button"
            onClick={handleSendTest}
            disabled={isSendingTest}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Send Test Report Email Now</span>
          </button>
        </div>

        {/* Manual Report Generation Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Manual Report Generation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trigger on-demand email dispatch for any specific business date
              </p>
            </div>
          </div>

          {manualResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                manualResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {manualResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{manualResult.message}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Business Date
              </label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={handleSendManual}
              disabled={isSendingManual}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSendingManual ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Generate & Email</span>
            </button>
          </div>

          {/* Quick Date Snapshot */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Washes</div>
              <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                {previewReport.totalCompletedWashes}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Sales</div>
              <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                {formatCurrencyValue(previewReport.totalServiceSales)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Attendants</div>
              <div className="font-extrabold text-blue-600 dark:text-cyan-400 text-sm">
                {previewReport.activeAttendantsCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Tracking & Audit Logs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Report Delivery History & Audit Logs
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {deliveryLogs.length} Records
            </span>
          </div>

          <button
            type="button"
            onClick={loadServerData}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {deliveryLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
            No report delivery attempts recorded yet. Deliveries will appear here as scheduled or test emails are dispatched.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">Report Date</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Trigger</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Attempts</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {deliveryLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {log.reportDate}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {log.recipient}
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {log.triggerType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          Sent
                        </span>
                      ) : log.status === 'failed' ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                          title={log.errorDetail || 'Delivery failed'}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Pending
                        </span>
                      )}
                      {log.errorDetail && (
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 max-w-xs truncate" title={log.errorDetail}>
                          {log.errorDetail}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">
                      {log.attemptCount}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.lastAttemptAt).toLocaleTimeString()} · {new Date(log.lastAttemptAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {log.status === 'failed' && (
                        <button
                          type="button"
                          onClick={() => handleRetryLog(log.id)}
                          disabled={retryingLogId === log.id}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-[10px] transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          {retryingLogId === log.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          <span>Retry</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
