import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, AlertCircle, Mail, Lock } from 'lucide-react';
import { AuthUser } from '../../types/pos';
import { UserAccount, verifyPassword } from '../../services/authService';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageToggle } from '../LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';

interface AdminLoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  onNavigateHome: () => void;
  existingAccounts: UserAccount[];
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onNavigateHome,
  existingAccounts,
}) => {
  const { t } = useLanguage();
  const [identifier, setIdentifier] = useState('admin@carwash.com');
  const [password, setPassword] = useState('admin123');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = identifier.trim().toLowerCase();

    // Find staff account (Admin or Cashier)
    const account = existingAccounts.find((a) => {
      if (a.role !== 'admin' && a.role !== 'cashier') return false;
      return a.email.toLowerCase() === cleanInput || a.id.toLowerCase() === cleanInput;
    });

    if (!account) {
      setErrorMessage(t('auth.invalidCredentials'));
      return;
    }

    if (!verifyPassword(password, account.passwordHash)) {
      setErrorMessage(t('auth.invalidCredentials'));
      return;
    }

    const authUser: AuthUser = {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
    };

    onLoginSuccess(authUser);
  };

  const handleQuickFill = (role: 'admin' | 'cashier') => {
    if (role === 'admin') {
      setIdentifier('admin@carwash.com');
      setPassword('admin123');
    } else {
      setIdentifier('cashier@carwash.com');
      setPassword('cashier123');
    }
    setErrorMessage(null);
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 mb-3">
            <ShieldCheck className="w-7 h-7 text-white font-bold" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('auth.adminStaffSignIn')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('auth.staffNote')}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-2xl space-y-5 transition-colors duration-200">
          {/* Quick Demo Staff Shortcuts */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              {t('auth.demoAccounts')}:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 text-xs font-bold rounded-lg transition-colors text-left cursor-pointer"
              >
                {t('auth.roleAdmin')}
                <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-mono">admin@carwash.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('cashier')}
                className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/50 border border-cyan-200 dark:border-cyan-700 text-cyan-800 dark:text-cyan-200 text-xs font-bold rounded-lg transition-colors text-left cursor-pointer"
              >
                {t('auth.roleCashier')}
                <span className="block text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">cashier@carwash.com</span>
              </button>
            </div>
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
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@carwash.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t('auth.adminStaffSignIn')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
