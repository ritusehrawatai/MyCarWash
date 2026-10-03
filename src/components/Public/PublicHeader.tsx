import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { BusinessInfo, AuthUser } from '../../types/pos';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageToggle } from '../LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';

export interface PublicHeaderProps {
  businessInfo: BusinessInfo;
  activeNav?: 'home' | 'memberships';
  onNavigateHome: () => void;
  onNavigateMemberships?: () => void;
  onNavigateCustomerLogin: () => void;
  onNavigateSignUp: () => void;
  currentUser?: AuthUser | null;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  businessInfo,
  activeNav = 'home',
  onNavigateHome,
  onNavigateMemberships,
  onNavigateCustomerLogin,
  onNavigateSignUp,
  currentUser,
}) => {
  const { t } = useLanguage();

  const handleScrollToSection = (sectionId: string) => {
    if (activeNav === 'home') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onNavigateHome();
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-3 text-left cursor-pointer group"
          title={businessInfo.businessName || 'ShineExpress Car Wash'}
          aria-label={businessInfo.businessName || 'ShineExpress Car Wash'}
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white block group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
              {businessInfo.businessName || 'ShineExpress Car Wash'}
            </span>
            <span className="text-[11px] text-blue-600 dark:text-cyan-400 font-semibold tracking-wider uppercase block">
              Express Wash & Detailing
            </span>
          </div>
        </button>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => handleScrollToSection('services')}
            className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
          >
            {t('nav.services')}
          </button>

          {activeNav === 'memberships' ? (
            <span className="text-blue-600 dark:text-cyan-400 font-bold flex items-center gap-1.5 cursor-default">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('nav.memberships')}</span>
            </span>
          ) : (
            onNavigateMemberships && (
              <button
                type="button"
                onClick={onNavigateMemberships}
                className="hover:text-blue-600 dark:hover:text-cyan-400 font-bold transition-colors cursor-pointer flex items-center gap-1.5 text-blue-600 dark:text-cyan-400"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('nav.memberships')}</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => handleScrollToSection('why-us')}
            className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
          >
            {t('nav.whyChooseUs')}
          </button>

          <button
            type="button"
            onClick={() => handleScrollToSection('location')}
            className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
          >
            {t('nav.locationHours')}
          </button>
        </nav>

        {/* Action Buttons, Language Toggle & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Global Language Toggle */}
          <LanguageToggle variant="segmented" />

          {/* Theme Toggle Button */}
          <ThemeToggle variant="compact" />

          {currentUser?.role === 'customer' ? (
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              {currentUser.name}
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={onNavigateCustomerLogin}
                className="px-3 py-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                {t('nav.login')}
              </button>

              <button
                type="button"
                onClick={onNavigateSignUp}
                className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>{t('nav.signUp')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
