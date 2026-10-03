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
  ArrowLeft,
  AlertCircle,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { MembershipPlan, BusinessInfo, AuthUser, BillingFrequency } from '../../types/pos';
import { formatCurrency } from '../../data/constants';
import { useLanguage } from '../../context/LanguageContext';
import { PublicHeader } from './PublicHeader';

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
      <PublicHeader
        businessInfo={businessInfo}
        activeNav="memberships"
        onNavigateHome={onNavigateHome}
        onNavigateMemberships={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateCustomerLogin={onNavigateCustomerLogin}
        onNavigateSignUp={onNavigateSignUp}
        currentUser={currentUser}
      />

      {/* 2. Hero Section */}
      <section className="pt-12 pb-16 sm:pt-16 sm:pb-20 bg-gradient-to-b from-blue-50/60 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800/80 text-center px-4 transition-colors duration-200">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-cyan-400 text-xs font-bold tracking-wide uppercase">
            <Star className="w-3.5 h-3.5 fill-blue-600 dark:fill-cyan-400" />
            <span>{t('memberships.passClubBadge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">
            {t('memberships.membershipPlansTitle')}
          </h1>

          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium">
            {t('memberships.saveMoreSubtitle')}
          </p>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            {t('memberships.membershipsHeroDesc')}
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
                {t('memberships.allPlans')}
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
                {t('memberships.monthlyPlans')}
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
                <span>{t('memberships.yearlyPlans')}</span>
                <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${billingFilter === 'yearly' ? 'bg-white text-blue-600' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'}`}>
                  {t('memberships.saveYearlyPercent')}
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
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('memberships.noPlansAvailable')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('memberships.checkBackSoon')}
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
                        {plan.billingFrequency === 'monthly' ? t('dashboard.monthlyPass') : t('dashboard.yearlyPass')}
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
                          {isYearly ? t('memberships.perYear') : t('memberships.perMonth')}
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                        {plan.includedWashes} {plan.includedServiceName}s {isYearly ? t('memberships.perMonth') : t('memberships.perMonth')}
                      </span>
                    </div>

                    {/* Included Benefits List */}
                    <ul className="space-y-3 pt-2 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>{t('dashboard.includedWashesDesc', { count: plan.includedWashes, frequency: isYearly ? t('dashboard.yearlyPass') : t('dashboard.monthlyPass') })}</strong> ({plan.includedServiceName})
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
                        <span>{t('memberships.fastExpressLane')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                        <span>{t('memberships.onlineReceiptTracking')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                        <span>{t('memberships.cancelAnytime1Click')}</span>
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
                      <span>{t('memberships.joinMembership')}</span>
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
              {t('memberships.memberPrivileges')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 dark:text-white">
              {t('memberships.whyJoinTheClub')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {t('memberships.whyJoinSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{t('memberships.guaranteedSavings')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('memberships.guaranteedSavingsDesc')}
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{t('memberships.instantLaneRecognition')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('memberships.instantLaneRecognitionDesc')}
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{t('memberships.zeroLockIn')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('memberships.zeroLockInDesc')}
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
                {t('memberships.accountRequiredTitle')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {t('memberships.accountRequiredDesc')}
              </p>
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
                {t('memberships.selectedPlan')}: <strong>{loginPromptPlan.name}</strong> ({formatCurrency(loginPromptPlan.price)} / {loginPromptPlan.billingFrequency === 'monthly' ? t('dashboard.monthlyPass') : t('dashboard.yearlyPass')})
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
                <span>{t('memberships.logInAsCustomer')}</span>
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
                <span>{t('memberships.createNewAccount')}</span>
              </button>

              <button
                type="button"
                onClick={() => setLoginPromptPlan(null)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Footer */}
      <footer className="bg-white dark:bg-slate-900 py-8 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {businessInfo.businessName || 'Car Wash POS'}. {t('common.allRightsReserved')}</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onNavigateHome}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {t('nav.backToHome')}
            </button>
            <button
              type="button"
              onClick={onNavigateAdminLogin}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {t('memberships.staffStationLogin')}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
