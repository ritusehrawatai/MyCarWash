import React from 'react';
import {
  Sparkles,
  ReceiptText,
  Clock,
  Settings2,
  PlusCircle,
  Users,
  LogOut,
  Home,
} from 'lucide-react';
import { UserRole, AuthUser } from '../types/pos';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../context/LanguageContext';

export type NavTab = 'pos' | 'customers' | 'memberships' | 'transactions' | 'settings';

interface HeaderProps {
  businessName: string;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  transactionCount: number;
  customerCount?: number;
  membershipCount?: number;
  taxRate: number;
  userRole: UserRole;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  businessName,
  activeTab,
  onSelectTab,
  transactionCount,
  customerCount = 0,
  membershipCount = 0,
  taxRate,
  userRole,
  currentUser,
  onLogout,
  onNavigateHome,
}) => {
  const { t, formatTime } = useLanguage();
  const [time, setTime] = React.useState<string>(() => formatTime(new Date()));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatTime(new Date()));
    }, 10000);
    return () => clearInterval(timer);
  }, [formatTime]);

  return (
    <header className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark / Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs cursor-pointer hover:bg-blue-500 transition-colors"
            title={t('nav.home')}
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {businessName || 'My Car Wash'}
              </h1>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  userRole === 'admin'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {userRole === 'admin' ? t('auth.roleAdmin') : t('auth.roleCashier')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Express Register · Lane 1
            </p>
          </div>
        </div>

        {/* Zone 2: Primary Navigation Tabs (Role-Based Filtering) */}
        <nav className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto transition-colors">
          {/* New Wash: Available to Cashier & Admin */}
          <button
            type="button"
            onClick={() => onSelectTab('pos')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pos'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('nav.pos')}</span>
          </button>

          {/* Customers: Available to Cashier & Admin */}
          <button
            type="button"
            onClick={() => onSelectTab('customers')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'customers'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('nav.customers')}</span>
            {customerCount > 0 && (
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-extrabold ${
                  activeTab === 'customers'
                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {customerCount}
              </span>
            )}
          </button>

          {/* Memberships: Admin only */}
          {userRole === 'admin' && (
            <button
              type="button"
              onClick={() => onSelectTab('memberships')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'memberships'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span>{t('nav.memberships')}</span>
              {membershipCount > 0 && (
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-extrabold ${
                    activeTab === 'memberships'
                      ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {membershipCount}
                </span>
              )}
            </button>
          )}

          {/* Transactions: Available to Cashier & Admin */}
          <button
            type="button"
            onClick={() => onSelectTab('transactions')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>{t('nav.transactions')}</span>
            {transactionCount > 0 && (
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-extrabold ${
                  activeTab === 'transactions'
                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {transactionCount}
              </span>
            )}
          </button>

          {/* Settings Tab - Admin only */}
          {userRole === 'admin' && (
            <button
              type="button"
              onClick={() => onSelectTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              <span>{t('nav.settings')}</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Language Toggle, Theme Toggle, User Info, Links & Logout */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Global Language Toggle */}
          <LanguageToggle variant="segmented" />

          {/* Theme Toggle in Main Header */}
          <ThemeToggle variant="compact" />

          {/* Public Home Link */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{t('nav.home')}</span>
          </button>

          {/* Tax info badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <span>{t('common.tax')}:</span>
            <span className="font-mono font-bold">{(taxRate * 100).toFixed(2)}%</span>
          </div>

          {/* Time display */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-mono px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{time}</span>
          </div>

          {/* Staff Name Badge & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            {currentUser && (
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {currentUser.name}
              </span>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title={t('nav.logout')}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

