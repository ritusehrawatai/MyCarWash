import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Car,
  Star,
  Lock,
  ArrowLeft,
  AlertCircle,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { MembershipPlan, BusinessInfo, AuthUser, BillingFrequency } from '../../types/pos';
import { formatCurrency } from '../../data/constants';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageToggle } from '../LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';

interface MembershipsPageProps {
  membershipPlans: MembershipPlan[];
  businessInfo: BusinessInfo;
  currentUser: AuthUser | null;
  onNavigateHome: () => void;
  onNavigateSignUp: () => void;
  onNavigateCustomerLogin: () => void;
  onNavigateAdminLogin: () => void;
  onSelectPlanToJoin: (plan: MembershipPlan) => void;
}

export const MembershipsPage: React.FC<MembershipsPageProps> = ({
  membershipPlans,
  businessInfo,
  currentUser,
  onNavigateHome,
  onNavigateSignUp,
  onNavigateCustomerLogin,
  onNavigateAdminLogin,
  onSelectPlanToJoin,
}) => {
  const { t } = useLanguage();
  const [billingFilter, setBillingFilter] = useState<'all' | 'monthly' | 'yearly'>('all');
  const [loginPromptPlan, setLoginPromptPlan] = useState<MembershipPlan | null>(null);

  // Filter only active plans
  const activePlans = membershipPlans.filter((p) => p.active);
  const displayedPlans = activePlans.filter((p) => {
    if (billingFilter === 'all') return true;
    return p.billingFrequency === billingFilter;
  });

  const handleJoinClick = (plan: MembershipPlan) => {
    if (!currentUser || currentUser.role !== 'customer') {
      // Require customer login/signup
      setLoginPromptPlan(plan);
    } else {
      // Logged in customer: launch checkout modal
      onSelectPlanToJoin(plan);
    }
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
              title="Return to Home"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </button>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white block">
                {businessInfo.businessName || 'ShineExpress Car Wash'}
              </span>
              <span className="text-[11px] text-blue-600 dark:text-cyan-400 font-semibold tracking-wider uppercase block">
                Membership Club
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={onNavigateHome}
              className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
            >
              {t('nav.home')}
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
            >
              {t('nav.services')}
            </button>
            <span className="text-blue-600 dark:text-cyan-400 font-bold border-b-2 border-blue-600 dark:border-cyan-400 pb-1">
              {t('nav.memberships')}
            </span>
            <button
              type="button"
              onClick={onNavigateAdminLogin}
              className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('nav.adminLogin')}</span>
            </button>
          </nav>

          {/* Controls & Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <LanguageToggle variant="segmented" />
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

      {/* 2. Hero Section */}
      <section className="pt-12 pb-16 sm:pt-16 sm:pb-20 bg-gradient-to-b from-blue-50/60 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800/80 text-center px-4 transition-colors duration-200">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-cyan-400 text-xs font-bold tracking-wide uppercase">
            <Star className="w-3.5 h-3.5 fill-blue-600 dark:fill-cyan-400" />
            <span>Wash Pass Membership Club</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">
            Membership Plans
          </h1>

          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium">
            Save more with a car wash membership.
          </p>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Enjoy guaranteed monthly wash allocations, member-only add-on discounts, and priority express lane access with transparent pricing.
          </p>

          {/* Billing Frequency Filter Toggle */}
          <div className="pt-4 flex items-center justify-center">
            <div className="inline-flex items-center p-1.5 bg-slate-200/70 dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-inner">
              <button
                type="button"
                onClick={() => setBillingFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  billingFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Plans
              </button>
              <button
                type="button"
                onClick={() => setBillingFilter('monthly')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  billingFilter === 'monthly'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Monthly Plans
              </button>
              <button
                type="button"
                onClick={() => setBillingFilter('yearly')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingFilter === 'yearly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Yearly Plans</span>
                <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${billingFilter === 'yearly' ? 'bg-white text-blue-600' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'}`}>
                  Save ~17%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Membership Cards Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1">
        {displayedPlans.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Car className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No membership plans available</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Check back soon or ask station attendant about upcoming membership packages.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedPlans.map((plan) => {
              const isYearly = plan.billingFrequency === 'yearly';
              const isPopular = plan.badge === 'Popular' || plan.badge === 'Best Value';

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative ${
                    isPopular
                      ? 'bg-gradient-to-b from-blue-50/80 to-white dark:from-slate-800/90 dark:to-slate-900/90 border-2 border-blue-600 dark:border-cyan-400/80 shadow-xl shadow-blue-500/10 dark:shadow-cyan-500/10 -translate-y-1'
                      : 'bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 dark:bg-cyan-400 text-white dark:text-slate-950 shadow-md">
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {plan.name}
                      </h3>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {plan.billingFrequency}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 min-h-[36px] leading-relaxed">
                      {plan.description}
                    </p>

                    {/* Price Block */}
                    <div className="my-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-slate-900 dark:text-white font-mono-numbers">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {isYearly ? '/ year' : '/ month'}
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                        {plan.includedWashes} {plan.includedServiceName}s {isYearly ? '/ month' : '/ month'}
                      </span>
                    </div>

                    {/* Included Benefits List */}
                    <ul className="space-y-3 pt-2 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>{plan.includedWashes} Included Washes</strong> per month ({plan.includedServiceName})
                        </span>
                      </li>
                      {plan.addOnBenefitDescription && (
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                          <span>{plan.addOnBenefitDescription}</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                        <span>Fast express lane drive-through</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                        <span>Online receipt tracking in customer portal</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                        <span>Cancel anytime with 1-click</span>
                      </li>
                    </ul>
                  </div>

                  {/* Join Button */}
                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={() => handleJoinClick(plan)}
                      className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isPopular
                          ? 'bg-blue-600 hover:bg-blue-500 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 shadow-md'
                          : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                      }`}
                    >
                      <span>Join Membership</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    {plan.terms && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2 italic">
                        {plan.terms}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Why Join Membership Section */}
        <section className="mt-20 pt-16 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
              Member Privileges
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 dark:text-white">
              Why Join the Club?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              The easiest way to keep your ride clean, polished, and protected every week.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Guaranteed Savings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Save over 40% compared to purchasing single washes at the kiosk. Wash up to 4 times per month without paying per visit.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Instant Lane Recognition</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Cashiers immediately identify your active membership and apply your included wash for $0.00 in under 10 seconds.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Zero Lock-In Contracts</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Enjoy complete freedom. You can easily cancel or pause your membership anytime directly inside your online customer dashboard.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 5. Login Prompt Modal for Anonymous Users */}
      {loginPromptPlan && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <LogIn className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-950 dark:text-white">
                Account Required
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Please log in or create a customer account to join a membership.
              </p>
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
                Selected Plan: <strong>{loginPromptPlan.name}</strong> ({formatCurrency(loginPromptPlan.price)} / {loginPromptPlan.billingFrequency})
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setLoginPromptPlan(null);
                  onNavigateCustomerLogin();
                }}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In as Customer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginPromptPlan(null);
                  onNavigateSignUp();
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create New Account</span>
              </button>

              <button
                type="button"
                onClick={() => setLoginPromptPlan(null)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Footer */}
      <footer className="bg-white dark:bg-slate-900 py-8 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {businessInfo.businessName || 'Car Wash POS'}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onNavigateHome}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Back to Home
            </button>
            <button
              type="button"
              onClick={onNavigateAdminLogin}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Staff Station Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
