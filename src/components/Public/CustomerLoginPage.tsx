import React, { useState } from 'react';
import { Sparkles, LogIn, ArrowLeft, AlertCircle, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { AuthUser } from '../../types/pos';
import { UserAccount, verifyPassword } from '../../services/authService';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageToggle } from '../LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';

interface CustomerLoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  onNavigateSignUp: () => void;
  onNavigateHome: () => void;
  existingAccounts: UserAccount[];
}

export const CustomerLoginPage: React.FC<CustomerLoginPageProps> = ({
  onLoginSuccess,
  onNavigateSignUp,
  onNavigateHome,
  existingAccounts,
}) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('john.smith@example.com');
  const [password, setPassword] = useState('customer123');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const account = existingAccounts.find(
      (a) => a.email.toLowerCase() === cleanEmail && a.role === 'customer'
    );

    if (!account) {
      setErrorMessage(t('auth.invalidCredentials'));
      return;
    }

    if (!verifyPassword(password, account.passwordHash)) {
      setErrorMessage(t('auth.invalidCredentials'));
      return;
    }

    // Login successful
    const authUser: AuthUser = {
      id: account.id,
      email: account.email,
      name: account.name,
      role: 'customer',
      customerId: account.customerId,
    };

    onLoginSuccess(authUser);
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
            <LogIn className="w-6 h-6 text-white dark:text-slate-950 font-bold" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('auth.customerSignIn')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('auth.accessAccount')}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-2xl space-y-5 transition-colors duration-200">
          {/* Quick Demo Preset Note */}
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl text-blue-900 dark:text-blue-200 text-xs">
            <span className="font-bold">{t('auth.demoAccounts')}:</span>
            <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
              Email: <code className="font-mono font-bold text-blue-900 dark:text-cyan-300">john.smith@example.com</code> / Pass: <code className="font-mono font-bold text-blue-900 dark:text-cyan-300">customer123</code>
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {t('common.email')}
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

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {t('common.password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.enterPassword')}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{t('auth.customerSignIn')}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>

          {/* Switch to Sign Up */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700/80 text-center text-xs text-slate-500 dark:text-slate-400">
            <span>{t('auth.noAccountYet')} </span>
            <button
              type="button"
              onClick={onNavigateSignUp}
              className="text-blue-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer"
            >
              {t('auth.signUpNow')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
