import React, { useState } from 'react';
import {
  Sparkles,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  MapPin,
  PhoneCall,
  Clock,
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { BusinessInfo, AuthUser } from '../../types/pos';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageToggle } from '../LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';
import {
  TARGET_ENQUIRY_EMAIL,
  EnquiryFormData,
  EnquiryValidationErrors,
  validateEnquiryForm,
  submitEnquiryToAppsScript,
  getEnquiryEndpoint,
  setEnquiryEndpoint,
  isRateLimited,
} from '../../services/enquiryService';

interface EnquiryPageProps {
  businessInfo: BusinessInfo;
  currentUser: AuthUser | null;
  onNavigateHome: () => void;
  onNavigateCustomerLogin: () => void;
  onNavigateSignUp: () => void;
  onNavigateMemberships?: () => void;
}

export const EnquiryPage: React.FC<EnquiryPageProps> = ({
  businessInfo,
  currentUser,
  onNavigateHome,
  onNavigateCustomerLogin,
  onNavigateSignUp,
  onNavigateMemberships,
}) => {
  const { t } = useLanguage();

  // Form State
  const [formData, setFormData] = useState<EnquiryFormData>({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    message: '',
    honeypot: '',
  });

  const [formErrors, setFormErrors] = useState<EnquiryValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Endpoint configuration & Setup guide state
  const [endpointUrl, setEndpointUrlState] = useState<string>(() => getEnquiryEndpoint(businessInfo));
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);
  const [tempEndpointInput, setTempEndpointInput] = useState(endpointUrl);
  const [saveEndpointSuccess, setSaveEndpointSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Field change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error on change
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (submitStatus === 'error') {
      setSubmitStatus('idle');
      setErrorMessage('');
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Spam honeypot check
    if (formData.honeypot && formData.honeypot.trim() !== '') {
      return;
    }

    // Rate limiting check
    if (isRateLimited()) {
      setSubmitStatus('error');
      setErrorMessage(t('enquiry.rateLimitNotice'));
      return;
    }

    // Client-side validation
    const validation = validateEnquiryForm(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    const currentEndpoint = endpointUrl || getEnquiryEndpoint(businessInfo);
    if (!currentEndpoint) {
      setSubmitStatus('error');
      setErrorMessage(t('enquiry.endpointNotConfigured'));
      setIsSetupGuideOpen(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const result = await submitEnquiryToAppsScript(formData, currentEndpoint);

      if (result.success) {
        setSubmitStatus('success');
        setFormData({
          name: currentUser?.name || '',
          email: currentUser?.email || '',
          phone: '',
          message: '',
          honeypot: '',
        });
      } else {
        setSubmitStatus('error');
        setErrorMessage(
          result.errorDetail || (result.messageKey ? t(`enquiry.${result.messageKey}`) : t('enquiry.errorMessage'))
        );
      }
    } catch {
      setSubmitStatus('error');
      setErrorMessage(t('enquiry.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Endpoint locally
  const handleSaveEndpoint = () => {
    if (!tempEndpointInput.trim()) return;
    setEnquiryEndpoint(tempEndpointInput.trim());
    setEndpointUrlState(tempEndpointInput.trim());
    setSaveEndpointSuccess(true);
    setTimeout(() => setSaveEndpointSuccess(false), 3000);
  };

  // Test Endpoint button handler
  const [testingEndpoint, setTestingEndpoint] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });

  const handleTestEndpoint = async () => {
    let url = tempEndpointInput.trim() || endpointUrl.trim();
    if (!url) {
      setTestResult({ status: 'error', message: 'Please enter a Google Apps Script Web App URL first.' });
      return;
    }
    // Auto-fix /edit to /exec
    url = url.replace(/\/edit(\?.*)?$/, '/exec');
    setTestingEndpoint(true);
    setTestResult({ status: 'idle', message: '' });

    try {
      const testUrl = url.includes('?') ? `${url}&test=1` : `${url}?test=1`;
      const res = await fetch(testUrl);
      const data = await res.json();
      if (data && data.status === 'success') {
        setTestResult({
          status: 'success',
          message: data.message || 'Test email dispatched! Check your Gmail inbox and Spam folder.',
        });
      } else {
        setTestResult({
          status: 'error',
          message: data?.message || 'Script responded with an error. Check Apps Script logs.',
        });
      }
    } catch {
      setTestResult({
        status: 'error',
        message:
          'Could not reach script directly. If it asks for Google login, change "Who has access" to "Anyone" under Deploy → Manage deployments in Google Apps Script.',
      });
    } finally {
      setTestingEndpoint(false);
    }
  };

  // Copy code snippet helper
  const handleCopyCode = () => {
    const scriptCode = `var PRIMARY_EMAIL = 'ritusehrawatai@gmail.com';
var SECONDARY_EMAIL = 'ritusehrawat@gmail.com';

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch(err) { data = (e && e.parameter) ? e.parameter : {}; }
    } else if (e && e.parameter) { data = e.parameter; }

    if (data.honeypot && String(data.honeypot).trim() !== '') {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Spam detected' })).setMimeType(ContentService.MimeType.JSON);
    }

    var name = (data.name || 'Website Visitor').toString().trim();
    var email = (data.email || 'no-reply@example.com').toString().trim();
    var phone = (data.phone || 'Not provided').toString().trim();
    var message = (data.message || 'No question provided').toString().trim();
    var submittedAt = (data.timestamp || new Date().toLocaleString()).toString().trim();

    var subject = 'New Car Wash Enquiry from ' + name;
    var plainBody = 'New Car Wash Enquiry\\n\\n' +
      'Name: ' + name + '\\n' +
      'Email: ' + email + '\\n' +
      'Phone: ' + phone + '\\n' +
      'Submitted At: ' + submittedAt + '\\n\\n' +
      'Message:\\n' + message;

    var htmlBody = '<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">' +
      '<h2 style="color: #0284c7; margin-top: 0;">New Car Wash Enquiry</h2>' +
      '<p><strong>Name:</strong> ' + name + '</p>' +
      '<p><strong>Email:</strong> <a href="mailto:' + email + '">' + email + '</a></p>' +
      '<p><strong>Phone:</strong> ' + phone + '</p>' +
      '<p><strong>Submitted:</strong> ' + submittedAt + '</p>' +
      '<div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px; margin-top: 16px; border-radius: 4px;">' +
      '<p style="font-weight: bold; margin-top: 0; color: #1e293b;">Question / Message:</p>' +
      '<p style="white-space: pre-wrap; margin-bottom: 0; color: #334155;">' + message + '</p>' +
      '</div></div>';

    sendNotification(subject, plainBody, htmlBody, email);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Enquiry sent successfully' })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  if (params.test || params.sendTest) {
    try {
      var subject = 'Test Email - Car Wash Enquiry Service';
      var body = 'This is a test email confirming that your Google Apps Script is sending emails successfully!\\n\\nTime: ' + new Date().toLocaleString();
      sendNotification(subject, body, '<div style="font-family: sans-serif; padding: 16px; border: 1px solid #10b981; border-radius: 8px;"><h3 style="color: #059669; margin-top: 0;">Success!</h3><p>' + body + '</p></div>', 'test@example.com');
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Test email successfully dispatched to ' + PRIMARY_EMAIL + ' and ' + SECONDARY_EMAIL })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      Logger.log('doGet test error: ' + err.toString());
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', primaryDestination: PRIMARY_EMAIL, secondaryDestination: SECONDARY_EMAIL })).setMimeType(ContentService.MimeType.JSON);
}

function sendNotification(subject, plainBody, htmlBody, replyToEmail) {
  var recipients = [PRIMARY_EMAIL];
  if (SECONDARY_EMAIL && SECONDARY_EMAIL !== PRIMARY_EMAIL) {
    recipients.push(SECONDARY_EMAIL);
  }

  for (var i = 0; i < recipients.length; i++) {
    var to = recipients[i];
    var options = {
      htmlBody: htmlBody,
      name: 'Car Wash Website Enquiry'
    };
    if (replyToEmail && replyToEmail.indexOf('@') !== -1) {
      options.replyTo = replyToEmail;
    }

    try {
      MailApp.sendEmail(to, subject, plainBody, options);
      Logger.log('MailApp successfully sent to ' + to);
    } catch (err1) {
      Logger.log('MailApp failed for ' + to + ', trying GmailApp: ' + err1.toString());
      try {
        GmailApp.sendEmail(to, subject, plainBody, options);
        Logger.log('GmailApp successfully sent to ' + to);
      } catch (err2) {
        Logger.log('Both MailApp and GmailApp failed for ' + to + ': ' + err2.toString());
        throw err2;
      }
    }
  }
}

// CRITICAL: Run this function once in the Apps Script editor to authorize Google permissions!
function testSendInEditor() {
  var subject = 'Permissions Confirmed - Car Wash Enquiry Test';
  var body = 'Your Google Apps Script has been authorized successfully and can now send customer enquiry emails to your inbox!';
  sendNotification(subject, body, '<div style="font-family: sans-serif; padding: 16px; border: 1px solid #10b981; border-radius: 8px;"><h3 style="color: #059669; margin-top: 0;">Permissions Authorized!</h3><p>' + body + '</p></div>', 'test@example.com');
  Logger.log('Test email dispatched! Check your Gmail inbox and Spam folder at ' + PRIMARY_EMAIL + ' and ' + SECONDARY_EMAIL);
}`;

    navigator.clipboard.writeText(scriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-blue-600 selection:text-white flex flex-col transition-colors duration-200">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 cursor-pointer hover:scale-105 transition-transform"
              title={t('enquiry.backToHome')}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </button>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white block">
                {businessInfo.businessName || 'ShineExpress Car Wash'}
              </span>
              <span className="text-[11px] text-blue-600 dark:text-cyan-400 font-semibold tracking-wider uppercase block">
                {t('enquiry.headerBadge')}
              </span>
            </div>
          </div>

          {/* Action Buttons, Language & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('enquiry.backToHome')}</span>
            </button>

            <LanguageToggle variant="compact" />
            <ThemeToggle variant="compact" />

            {!currentUser ? (
              <button
                type="button"
                onClick={onNavigateCustomerLogin}
                className="px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                {t('nav.login')}
              </button>
            ) : (
              <button
                type="button"
                onClick={onNavigateCustomerLogin}
                className="px-3.5 py-2 text-xs sm:text-sm font-bold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-blue-950/40 rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                {currentUser.name}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Enquiry Section */}
      <main className="flex-1 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb back button on mobile */}
          <div className="mb-6 sm:hidden">
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('enquiry.backToHome')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left Column: Station Contact Info Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/5 transition-colors">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{t('enquiry.contactInfoTitle')}</span>
                </div>

                <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight mb-2">
                  {businessInfo.businessName || 'ShineExpress'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  {t('enquiry.pageSubtitle')}
                </p>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-sm">
                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {businessInfo.address || '123 Main Street'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Metro Express Lane</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {businessInfo.phone || '(555) 123-4567'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Customer Support Line</p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{t('home.open7Days')}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">No appointment required</p>
                    </div>
                  </div>
                </div>

                {/* Email Delivery Target Info Badge */}
                <div className="mt-6 p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40 flex items-start gap-3 text-xs">
                  <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-cyan-300">
                      {t('enquiry.directEmailNotice')}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 font-mono mt-0.5 text-[11px]">
                      {TARGET_ENQUIRY_EMAIL}
                    </p>
                  </div>
                </div>
              </div>

              {/* Memberships promo banner */}
              {onNavigateMemberships && (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-200" />
                    <span className="font-black text-sm uppercase tracking-wider">
                      Wash Club Memberships
                    </span>
                  </div>
                  <p className="text-xs text-blue-100 leading-relaxed">
                    Interested in unlimited monthly washes? Explore our flexible pass packages.
                  </p>
                  <button
                    type="button"
                    onClick={onNavigateMemberships}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-blue-700 font-extrabold text-xs shadow-sm hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <span>{t('home.ctaMemberships')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Enquiry Form Card */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-9 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/5 transition-colors">
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
                    {t('enquiry.pageTitle')}
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {t('enquiry.pageSubtitle')}
                  </p>
                </div>

                {/* Success Banner */}
                {submitStatus === 'success' && (
                  <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 mb-6 space-y-4 animate-fade-in">
                    <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-300 font-extrabold text-base sm:text-lg">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span>{t('enquiry.successTitle')}</span>
                    </div>
                    <p className="text-sm text-emerald-900 dark:text-emerald-200 font-medium">
                      {t('enquiry.successMessage')}
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      {t('enquiry.successDetails')}
                    </p>

                    {/* Troubleshooting callout for why email might not appear */}
                    <div className="p-4 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-emerald-300 dark:border-emerald-800/60 text-xs space-y-2 text-slate-700 dark:text-slate-300">
                      <p className="font-bold text-slate-900 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                        <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Haven&apos;t received the email in your inbox? Here&apos;s why:</span>
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                        <li>
                          <strong>Check Spam &amp; Promotions:</strong> Automated emails from Google Apps Script frequently land in the <em>Spam</em> folder or <em>Promotions / Updates</em> tab.
                        </li>
                        <li>
                          <strong>Permissions Required:</strong> Google requires you to authorize email sending. In <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">script.google.com</a>, select <code>testSendInEditor</code> from the dropdown and click <strong>Run (▶)</strong>, then approve permissions.
                        </li>
                        <li>
                          <strong>&quot;Who has access&quot; must be &quot;Anyone&quot;:</strong> If left as &quot;Only myself&quot;, Google silently blocks the submission. Under <strong>Deploy → Manage deployments → Edit</strong>, set <em>Who has access</em> to <strong>Anyone</strong>.
                        </li>
                        <li>
                          <strong>View Apps Script Logs:</strong> In script.google.com, click <strong>Executions</strong> (on the left menu) to see if the script failed or completed.
                        </li>
                      </ul>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setIsSetupGuideOpen(true)}
                          className="text-xs font-bold text-blue-600 dark:text-cyan-400 underline hover:no-underline inline-flex items-center gap-1"
                        >
                          <span>Open Setup &amp; Test Connection Drawer</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitStatus('idle');
                          setErrorMessage('');
                        }}
                        className="px-4 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-white dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer"
                      >
                        {t('enquiry.sendAnother')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {submitStatus === 'error' && (
                  <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 mb-6 space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm sm:text-base">
                      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>{t('enquiry.errorTitle')}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-medium">
                      {errorMessage || t('enquiry.errorMessage')}
                    </p>
                    <div className="pt-1.5">
                      <button
                        type="button"
                        onClick={() => setIsSetupGuideOpen(true)}
                        className="text-xs font-bold text-blue-600 dark:text-cyan-400 underline hover:no-underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{t('enquiry.viewSetupInstructions')} / {t('enquiry.configureEndpoint')}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* The Form */}
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {/* Invisible Honeypot Field for anti-spam */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="hp_field">Leave this empty</label>
                    <input
                      type="text"
                      id="hp_field"
                      name="honeypot"
                      value={formData.honeypot}
                      onChange={handleInputChange}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {/* Name Field */}
                  <div>
                    <label
                      htmlFor="enquiry_name"
                      className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      {t('enquiry.nameLabel')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="enquiry_name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={t('enquiry.namePlaceholder')}
                      className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-white text-sm transition-all focus:outline-none focus:ring-2 ${
                        formErrors.name
                          ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-200 dark:border-slate-700/80 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800'
                      }`}
                      required
                    />
                    {formErrors.name && (
                      <p className="text-xs text-rose-500 dark:text-rose-400 font-semibold mt-1">
                        {t(`enquiry.${formErrors.name}`)}
                      </p>
                    )}
                  </div>

                  {/* Email & Phone Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email Field */}
                    <div>
                      <label
                        htmlFor="enquiry_email"
                        className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        {t('enquiry.emailLabel')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="enquiry_email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder={t('enquiry.emailPlaceholder')}
                        className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-white text-sm transition-all focus:outline-none focus:ring-2 ${
                          formErrors.email
                            ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-400 bg-rose-50/20'
                            : 'border-slate-200 dark:border-slate-700/80 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800'
                        }`}
                        required
                      />
                      {formErrors.email && (
                        <p className="text-xs text-rose-500 dark:text-rose-400 font-semibold mt-1">
                          {t(`enquiry.${formErrors.email}`)}
                        </p>
                      )}
                    </div>

                    {/* Phone Field (Optional) */}
                    <div>
                      <label
                        htmlFor="enquiry_phone"
                        className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        {t('enquiry.phoneLabel')}{' '}
                        <span className="text-slate-400 font-normal lowercase">
                          {t('enquiry.phoneOptional')}
                        </span>
                      </label>
                      <input
                        type="tel"
                        id="enquiry_phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder={t('enquiry.phonePlaceholder')}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
                      />
                    </div>
                  </div>

                  {/* Message Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="enquiry_message"
                        className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                      >
                        {t('enquiry.messageLabel')} <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formData.message.length} / 2000
                      </span>
                    </div>
                    <textarea
                      id="enquiry_message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder={t('enquiry.messagePlaceholder')}
                      maxLength={2000}
                      className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-white text-sm transition-all focus:outline-none focus:ring-2 resize-y min-h-[120px] ${
                        formErrors.message
                          ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-200 dark:border-slate-700/80 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800'
                      }`}
                      required
                    />
                    {formErrors.message && (
                      <p className="text-xs text-rose-500 dark:text-rose-400 font-semibold mt-1">
                        {t(`enquiry.${formErrors.message}`)}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                          <span>{t('enquiry.submitting')}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-white" />
                          <span>{t('enquiry.submitButton')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* 3. Free Google Apps Script Setup & Config Drawer */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setIsSetupGuideOpen((prev) => !prev)}
                    className="flex items-center justify-between w-full text-left text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-cyan-500" />
                      <span>{t('enquiry.setupGuideTitle')}</span>
                    </span>
                    {isSetupGuideOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {isSetupGuideOpen && (
                    <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4 text-xs animate-fade-in">
                      <p className="text-slate-600 dark:text-slate-300">
                        {t('enquiry.setupGuideDesc')}
                      </p>

                      {/* Endpoint URL Input */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="cfg_endpoint"
                          className="font-bold text-slate-800 dark:text-slate-200 block"
                        >
                          {t('enquiry.webAppUrlLabel')}
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="url"
                            id="cfg_endpoint"
                            value={tempEndpointInput}
                            onChange={(e) => setTempEndpointInput(e.target.value)}
                            placeholder={t('enquiry.webAppUrlPlaceholder')}
                            className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={handleSaveEndpoint}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {t('enquiry.saveEndpoint')}
                          </button>
                          <button
                            type="button"
                            onClick={handleTestEndpoint}
                            disabled={testingEndpoint}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 disabled:opacity-60"
                          >
                            {testingEndpoint ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Testing...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Test &amp; Send Test Email</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Direct browser link if user has entered an endpoint */}
                        {tempEndpointInput.trim() && (
                          <div className="pt-1 flex items-center gap-2 text-[11px]">
                            <a
                              href={tempEndpointInput.trim().replace(/\/edit(\?.*)?$/, '/exec') + '?test=1'}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1 font-semibold"
                            >
                              <span>Test URL directly in browser tab</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <span className="text-slate-400">
                              (If it prompts for Google login, &quot;Who has access&quot; is not set to &quot;Anyone&quot;)
                            </span>
                          </div>
                        )}

                        {saveEndpointSuccess && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('enquiry.endpointSaved')}</span>
                          </p>
                        )}

                        {/* Test Result Message Box */}
                        {testResult.status !== 'idle' && (
                          <div
                            className={`p-3.5 rounded-xl border text-xs space-y-1 animate-fade-in ${
                              testResult.status === 'success'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                            }`}
                          >
                            <p className="font-bold flex items-center gap-1.5">
                              {testResult.status === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                              )}
                              <span>
                                {testResult.status === 'success' ? 'Connection Successful!' : 'Connection / Setup Issue Detected'}
                              </span>
                            </p>
                            <p className="text-[11px] leading-relaxed">{testResult.message}</p>
                          </div>
                        )}
                      </div>

                      {/* Step by step summary */}
                      <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900 dark:text-white">Quick 5-Minute Setup &amp; Fix Guide:</p>
                          <button
                            type="button"
                            onClick={handleCopyCode}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-cyan-300 hover:bg-blue-100 font-bold text-[11px] cursor-pointer"
                          >
                            {copiedCode ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Code Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Google Apps Script Code</span>
                              </>
                            )}
                          </button>
                        </div>

                        <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                          <li>
                            Open{' '}
                            <a
                              href="https://script.google.com"
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 dark:text-cyan-400 underline inline-flex items-center gap-0.5"
                            >
                              <span>script.google.com</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>{' '}
                            and click <strong>+ New project</strong> (or open your existing project).
                          </li>
                          <li>
                            Click the <strong>Copy Google Apps Script Code</strong> button above, paste it into <code>Code.gs</code>, and press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">Ctrl+S</kbd> to save.
                          </li>
                          <li className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200">
                            <strong>CRITICAL (Fixes &quot;No email received&quot;):</strong> In the Apps Script toolbar dropdown (next to &quot;Debug&quot;), select <code>testSendInEditor</code> and click <strong>Run (▶)</strong>.<br />
                            A popup will say <em>&quot;Authorization required&quot;</em>. Click <strong>Review Permissions → Choose your account → Advanced → Go to project (unsafe) → Allow</strong>. A test email will immediately arrive at <code>ritusehrawatai@gmail.com</code> and <code>ritusehrawat@gmail.com</code>!
                          </li>
                          <li>
                            Click <strong>Deploy → Manage deployments</strong> (or <strong>New deployment</strong>). Click the pencil icon to edit, or create a new Web App deployment.
                          </li>
                          <li>
                            Set <em>Execute as</em>: <strong>Me</strong> and <em>Who has access</em>: <strong>Anyone</strong> (Do NOT leave as &quot;Only myself&quot;). If updating an existing deployment, set Version: <strong>New version</strong>.
                          </li>
                          <li>
                            Click <strong>Deploy</strong>, copy the Web App URL (ending in <code>/exec</code>), paste it above, click <strong>Save Endpoint</strong>, and click <strong>Test &amp; Send Test Email</strong>!
                          </li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 text-center">
        <p>© {new Date().getFullYear()} {businessInfo.businessName || 'Car Wash POS'}. {t('home.footerRights')}</p>
      </footer>
    </div>
  );
};
