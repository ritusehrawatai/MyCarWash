import React, { useState } from 'react';
import { UserPlus, ArrowLeft, AlertCircle, CheckCircle2, Mail, Lock, User, Phone, Tag, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Customer, AuthUser, BusinessInfo, WelcomePromoCode } from '../../types/pos';
import { UserAccount } from '../../services/authService';
import { generateCustomerId, cleanPhoneNumber } from '../../data/customerData';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageToggle } from '../LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';
import { createWelcomePromoCode, sendWelcomeDiscountEmail } from '../../services/promoService';
import { getEnquiryEndpoint } from '../../services/enquiryService';

interface CustomerSignUpPageProps {
  onSignUpSuccess: (
    user: AuthUser,
    customer: Customer,
    promoCode: WelcomePromoCode,
    passwordPlain: string
  ) => void;
  onNavigateLogin: (prefillEmail?: string) => void;
  onNavigateHome: () => void;
  existingAccounts: UserAccount[];
  existingCustomers: Customer[];
  existingPromoCodes?: WelcomePromoCode[];
  businessInfo?: BusinessInfo;
}

export const CustomerSignUpPage: React.FC<CustomerSignUpPageProps> = ({
  onSignUpSuccess,
  onNavigateLogin,
  onNavigateHome,
  existingAccounts,
  existingCustomers,
  existingPromoCodes = [],
  businessInfo,
}) => {
  const { t, language } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Required fields check
    if (!trimmedFirst || !trimmedLast || !trimmedPhone || !trimmedEmail || !password) {
      setErrorMessage(t('auth.fillRequiredFields'));
      return;
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage(t('auth.validEmailError'));
      return;
    }

    // 3. Password match check
    if (password !== confirmPassword) {
      setErrorMessage(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t('auth.passwordMinLength'));
      return;
    }

    // 4. Check for duplicate account with this email
    const duplicateEmail = existingAccounts.some(
      (acc) => acc.email.toLowerCase() === trimmedEmail
    );
    if (duplicateEmail) {
      setErrorMessage(t('auth.emailExistsError'));
      return;
    }

    // 5. Connect to existing Customer profile by email/phone or create a new one
    let targetCustomer = existingCustomers.find(
      (c) =>
        (c.email && c.email.toLowerCase() === trimmedEmail) ||
        (trimmedPhone && cleanPhoneNumber(c.phone) === cleanPhoneNumber(trimmedPhone))
    );

    if (!targetCustomer) {
      targetCustomer = {
        id: generateCustomerId(existingCustomers),
        firstName: trimmedFirst,
        lastName: trimmedLast,
        phone: trimmedPhone,
        email: trimmedEmail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // 6. Generate 15% First-Signup Welcome Discount Promo Code (Unique, valid 3 months)
    const newPromoCode = createWelcomePromoCode(
      targetCustomer.id,
      `${trimmedFirst} ${trimmedLast}`,
      trimmedEmail,
      existingPromoCodes
    );

    // 7. Dispatch Welcome Discount Email via Google Apps Script
    const endpointUrl = getEnquiryEndpoint(businessInfo);
    if (!endpointUrl || !endpointUrl.trim()) {
      newPromoCode.emailDeliveryStatus = 'not_configured';
      newPromoCode.emailDeliveryDetail = 'Google Apps Script Web App URL is not configured in Settings.';
    } else {
      try {
        const res = await sendWelcomeDiscountEmail({
          endpointUrl,
          businessName: businessInfo?.businessName || 'My Car Wash',
          customerName: `${trimmedFirst} ${trimmedLast}`,
          customerEmail: trimmedEmail,
          promoCode: newPromoCode.code,
          discountPercent: 15,
          expirationDate: new Date(newPromoCode.expiresAt).toLocaleDateString(),
          language: language || 'en',
        });
        newPromoCode.emailDeliveryStatus = res.status;
        newPromoCode.emailDeliveryDetail = res.detail;
        if (res.status === 'sent') {
          newPromoCode.emailSentAt = new Date().toISOString();
        }
      } catch (err: any) {
        newPromoCode.emailDeliveryStatus = 'failed';
        newPromoCode.emailDeliveryDetail = err?.message || 'Welcome email dispatch error.';
      }
    }

    // 8. Every account created through public Sign Up MUST have role = 'customer'
    const newAuthUser: AuthUser = {
      id: `USR-${Date.now()}`,
      email: trimmedEmail,
      name: `${trimmedFirst} ${trimmedLast}`,
      role: 'customer', // STRICT: Never Admin or Cashier
      customerId: targetCustomer.id,
    };

    // Store in localStorage for fast pre-fill on login page
    try {
      localStorage.setItem('my_car_wash_last_customer_email', trimmedEmail);
    } catch {
      // Ignore
    }

    onSignUpSuccess(newAuthUser, targetCustomer, newPromoCode, password);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-blue-600 transition-colors duration-200 relative">
      {/* Top Controls Bar */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('nav.backToHome')}</span>
        </button>
        <div className="flex items-center gap-2">
          <LanguageToggle variant="compact" />
          <ThemeToggle variant="compact" />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mt-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 dark:from-cyan-400 dark:to-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 mb-3">
            <UserPlus className="w-6 h-6 text-white dark:text-slate-950 font-bold" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('auth.customerSignUp')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('auth.joinClub')}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-2xl space-y-5 transition-colors duration-200">
          {/* Welcome Promo Discount Incentive Callout */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 dark:bg-cyan-400 text-white dark:text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
              <Tag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-black text-blue-900 dark:text-cyan-200">
                {t('promo.welcomeDiscountBadge')}
              </span>
              <span className="block text-[11px] text-slate-600 dark:text-slate-300">
                {t('promo.termsNotice')}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              {errorMessage === t('auth.emailExistsError') && (
                <button
                  type="button"
                  onClick={() => onNavigateLogin(email.trim())}
                  className="shrink-0 underline font-bold hover:text-rose-950 dark:hover:text-white cursor-pointer ml-2"
                >
                  {t('auth.signInNow')}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  {t('customers.firstNameLabel')} <span className="text-blue-600 dark:text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  {t('customers.lastNameLabel')} <span className="text-blue-600 dark:text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {t('customers.phoneLabel')} <span className="text-blue-600 dark:text-cyan-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {t('customers.emailLabel')} <span className="text-blue-600 dark:text-cyan-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {t('common.password')} <span className="text-blue-600 dark:text-cyan-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.enterPassword')}
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {t('common.confirmPassword')} <span className="text-blue-600 dark:text-cyan-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.enterPassword')}
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1"
                  tabIndex={-1}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{t('auth.customerSignUp')}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>

          {/* Switch to Login */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700/80 text-center text-xs text-slate-500 dark:text-slate-400">
            <span>{t('auth.alreadyHaveAccount')} </span>
            <button
              type="button"
              onClick={() => onNavigateLogin(email.trim())}
              className="text-blue-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer"
            >
              {t('auth.signInNow')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
