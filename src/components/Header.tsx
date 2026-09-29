import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ReceiptText,
  Clock,
  Settings2,
  PlusCircle,
  Users,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Percent,
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
  const [time, setTime] = useState<string>(() => formatTime(new Date()));

  // Dropdown & Mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Live timer update
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatTime(new Date()));
    }, 10000);
    return () => clearInterval(timer);
  }, [formatTime]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setIsMoreMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreMenuOpen(false);
        setIsProfileMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle Tab Selection
  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setIsMoreMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Check if an item inside "More" is currently active
  const isMoreItemActive = activeTab === 'memberships' || activeTab === 'settings';

  return (
    <header className="no-print w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      {/* ========================================================= */}
      {/* LEVEL 1: TOP BAR (Branding, User/Utilities & Top-Right)   */}
      {/* ========================================================= */}
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* LEFT: Brand Logo, Business Name, Role Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-xs cursor-pointer hover:opacity-95 transition-opacity shrink-0"
              title={businessName || 'My Car Wash'}
              aria-label={businessName || 'My Car Wash'}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="text-xs sm:text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[220px] md:max-w-[260px] text-left hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
                  title={businessName || 'My Car Wash'}
                >
                  {businessName || 'My Car Wash'}
                </button>
                <span
                  className={`text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                    userRole === 'admin'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {userRole === 'admin' ? t('auth.roleAdmin') : t('auth.roleCashier')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden lg:block leading-none mt-0.5">
                Express Register · Lane 1
              </p>
            </div>
          </div>

          {/* RIGHT: Utilities, User Profile, and Top-Right Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Tax Info Badge (Desktop >= 1280px) */}
            <div className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400">{t('common.tax')}:</span>
              <span className="font-mono font-bold">{(taxRate * 100).toFixed(2)}%</span>
            </div>

            {/* Live Clock Display (Desktop >= 1536px) */}
            <div className="hidden 2xl:flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-mono px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              <span>{time}</span>
            </div>

            {/* Desktop User Info & Logout (Desktop >= 1024px) */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              {currentUser && (
                <div className="text-right leading-tight max-w-[130px] xl:max-w-[170px] truncate">
                  <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser.name}
                  </span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                    {userRole === 'admin' ? t('auth.roleAdmin') : t('auth.roleCashier')}
                  </span>
                </div>
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

            {/* Tablet User Account Menu Dropdown (768px - 1023px) */}
            <div className="hidden md:flex lg:hidden relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
                className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title={currentUser?.name || t('nav.userAccount')}
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {isProfileMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 py-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-fade-in"
                >
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {currentUser?.name || 'Administrator'}
                    </p>
                    <p className="text-[10px] text-blue-600 dark:text-cyan-400 font-semibold uppercase mt-0.5">
                      {userRole === 'admin' ? t('auth.roleAdmin') : t('auth.roleCashier')}
                    </p>
                  </div>

                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t('common.tax')}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {(taxRate * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t('home.time')}</span>
                      </span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{time}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={onLogout}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Subtle Divider before Top-Right Corner Controls (Desktop & Tablet) */}
            <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 sm:mx-1" />

            {/* ========================================================= */}
            {/* TOP-RIGHT CORNER UTILITY AREA (ALWAYS VISIBLE OUTSIDE MENU)*/}
            {/* ========================================================= */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" aria-label="Language and theme">
              {/* EN | ES Language Toggle (1-tap direct selection) */}
              <LanguageToggle variant="segmented" showGlobe={true} className="shrink-0" />

              {/* Light / Dark Mode Toggle */}
              <ThemeToggle variant="compact" className="shrink-0" />

              {/* Mobile Hamburger Toggle Button (< 768px) */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle navigation menu"
                className="md:hidden p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LEVEL 2: MAIN NAVIGATION BAR (Tablet & Desktop >= 768px)  */}
      {/* ========================================================= */}
      <div className="hidden md:block w-full bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/80 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-11 sm:h-12 flex items-center justify-between gap-3">
          {/* Full Desktop (>= 1280px): All 5 tabs visible cleanly */}
          <nav
            aria-label="Main Navigation"
            className="hidden xl:flex items-center gap-1 p-0.5 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs"
          >
            {/* New Wash */}
            <button
              type="button"
              onClick={() => handleNavClick('pos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'pos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>{t('nav.pos')}</span>
            </button>

            {/* Customers */}
            <button
              type="button"
              onClick={() => handleNavClick('customers')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'customers'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>{t('nav.customers')}</span>
              {customerCount > 0 && (
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.2 rounded font-extrabold ${
                    activeTab === 'customers'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {customerCount}
                </span>
              )}
            </button>

            {/* Memberships (Admin only) */}
            {userRole === 'admin' && (
              <button
                type="button"
                onClick={() => handleNavClick('memberships')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'memberships'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{t('nav.memberships')}</span>
                {membershipCount > 0 && (
                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.2 rounded font-extrabold ${
                      activeTab === 'memberships'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {membershipCount}
                  </span>
                )}
              </button>
            )}

            {/* Transactions */}
            <button
              type="button"
              onClick={() => handleNavClick('transactions')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ReceiptText className="w-4 h-4 shrink-0" />
              <span>{t('nav.transactions')}</span>
              {transactionCount > 0 && (
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.2 rounded font-extrabold ${
                    activeTab === 'transactions'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {transactionCount}
                </span>
              )}
            </button>

            {/* Settings (Admin only) */}
            {userRole === 'admin' && (
              <button
                type="button"
                onClick={() => handleNavClick('settings')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Settings2 className="w-4 h-4 shrink-0" />
                <span>{t('nav.settings')}</span>
              </button>
            )}
          </nav>

          {/* Tablet & Narrow Laptop (768px - 1279px): Primary 3 + "More ▾" dropdown */}
          <nav
            aria-label="Compact Navigation"
            className="flex xl:hidden items-center gap-1 p-0.5 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs"
          >
            {/* New Wash */}
            <button
              type="button"
              onClick={() => handleNavClick('pos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'pos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>{t('nav.pos')}</span>
            </button>

            {/* Customers */}
            <button
              type="button"
              onClick={() => handleNavClick('customers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'customers'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>{t('nav.customers')}</span>
              {customerCount > 0 && (
                <span
                  className={`text-[10px] font-mono px-1 py-0.2 rounded font-extrabold ${
                    activeTab === 'customers'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {customerCount}
                </span>
              )}
            </button>

            {/* Transactions */}
            <button
              type="button"
              onClick={() => handleNavClick('transactions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ReceiptText className="w-4 h-4 shrink-0" />
              <span>{t('nav.transactions')}</span>
              {transactionCount > 0 && (
                <span
                  className={`text-[10px] font-mono px-1 py-0.2 rounded font-extrabold ${
                    activeTab === 'transactions'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {transactionCount}
                </span>
              )}
            </button>

            {/* "More ▾" Dropdown for Admin secondary items */}
            {userRole === 'admin' && (
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                  aria-expanded={isMoreMenuOpen}
                  aria-haspopup="true"
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isMoreItemActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isMoreMenuOpen
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>
                    {activeTab === 'memberships'
                      ? t('nav.memberships')
                      : activeTab === 'settings'
                      ? t('nav.settings')
                      : t('nav.more')}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isMoreMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isMoreMenuOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-52 py-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-fade-in"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {t('nav.adminMenu')}
                    </div>

                    {/* Memberships */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleNavClick('memberships')}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-colors cursor-pointer text-left ${
                        activeTab === 'memberships'
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-cyan-400'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-500 shrink-0" />
                        <span>{t('nav.memberships')}</span>
                      </span>
                      {membershipCount > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-extrabold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-cyan-300">
                          {membershipCount}
                        </span>
                      )}
                    </button>

                    {/* Settings */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleNavClick('settings')}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold transition-colors cursor-pointer text-left ${
                        activeTab === 'settings'
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-cyan-400'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Settings2 className="w-4 h-4 shrink-0 text-slate-500" />
                      <span>{t('nav.settings')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Quick Register / System Status Info on Right of Nav Bar */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <span>Express Register · Lane 1</span>
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE NAVIGATION DRAWER & OVERLAY (< 768px)               */}
      {/* (Language and Theme toggles are NOT inside this drawer)    */}
      {/* ========================================================= */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-4 shadow-xl animate-fade-in transition-colors max-h-[calc(100vh-64px)] overflow-y-auto"
        >
          {/* User Account Card */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser?.name || 'Administrator'}
                </p>
                <p className="text-[10px] text-blue-600 dark:text-cyan-400 font-semibold uppercase">
                  {userRole === 'admin' ? t('auth.roleAdmin') : t('auth.roleCashier')}
                </p>
              </div>
            </div>
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                userRole === 'admin'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
              }`}
            >
              {userRole === 'admin' ? t('auth.roleAdmin') : t('auth.roleCashier')}
            </span>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="px-1 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t('nav.quickActions')}
            </div>

            {/* New Wash */}
            <button
              type="button"
              onClick={() => handleNavClick('pos')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'pos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <PlusCircle className="w-4 h-4" />
                <span>{t('nav.pos')}</span>
              </span>
            </button>

            {/* Customers */}
            <button
              type="button"
              onClick={() => handleNavClick('customers')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>{t('nav.customers')}</span>
              </span>
              {customerCount > 0 && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-extrabold ${
                    activeTab === 'customers'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {customerCount}
                </span>
              )}
            </button>

            {/* Memberships (Admin only) */}
            {userRole === 'admin' && (
              <button
                type="button"
                onClick={() => handleNavClick('memberships')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'memberships'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>{t('nav.memberships')}</span>
                </span>
                {membershipCount > 0 && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-extrabold ${
                      activeTab === 'memberships'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {membershipCount}
                  </span>
                )}
              </button>
            )}

            {/* Transactions */}
            <button
              type="button"
              onClick={() => handleNavClick('transactions')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'transactions'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ReceiptText className="w-4 h-4" />
                <span>{t('nav.transactions')}</span>
              </span>
              {transactionCount > 0 && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-extrabold ${
                    activeTab === 'transactions'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {transactionCount}
                </span>
              )}
            </button>

            {/* Settings (Admin only) */}
            {userRole === 'admin' && (
              <button
                type="button"
                onClick={() => handleNavClick('settings')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Settings2 className="w-4 h-4" />
                  <span>{t('nav.settings')}</span>
                </span>
              </button>
            )}
          </div>

          {/* Quick Info Bar in Mobile Menu */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Percent className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('common.tax')}: <strong className="text-slate-800 dark:text-slate-200 font-mono">{(taxRate * 100).toFixed(2)}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{time}</span>
            </div>
          </div>

          {/* Log Out Button */}
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              onLogout();
            }}
            className="w-full py-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      )}
    </header>
  );
};
