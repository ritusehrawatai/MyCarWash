import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Droplets,
  Clock,
  Car,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Star,
  Award,
  PhoneCall,
  MapPin,
  Lock,
  Mail,
  Tag,
} from 'lucide-react';
import { POSServiceItem, BusinessInfo } from '../../types/pos';
import { formatCurrency } from '../../data/constants';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageToggle } from '../LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';
import { HeroSlideshow } from './HeroSlideshow';

interface HomePageProps {
  services: POSServiceItem[];
  businessInfo: BusinessInfo;
  onNavigateSignUp: () => void;
  onNavigateCustomerLogin: () => void;
  onNavigateAdminLogin: () => void;
  onNavigateMemberships?: () => void;
  onNavigateEnquiry?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  services,
  businessInfo,
  onNavigateSignUp,
  onNavigateCustomerLogin,
  onNavigateAdminLogin,
  onNavigateMemberships,
  onNavigateEnquiry,
}) => {
  const { t } = useLanguage();
  const washPackages = services.filter((s) => s.type === 'wash' && s.active);
  const addOns = services.filter((s) => s.type === 'addon' && s.active);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-blue-600 selection:text-white flex flex-col transition-colors duration-200">
      {/* 1. Public Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white block">
                {businessInfo.businessName || 'ShineExpress Car Wash'}
              </span>
              <span className="text-[11px] text-blue-600 dark:text-cyan-400 font-semibold tracking-wider uppercase block">
                Express Wash & Detailing
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#services" className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">
              {t('nav.services')}
            </a>
            {onNavigateMemberships && (
              <button
                type="button"
                onClick={onNavigateMemberships}
                className="hover:text-blue-600 dark:hover:text-cyan-400 font-bold transition-colors cursor-pointer flex items-center gap-1.5 text-blue-600 dark:text-cyan-400"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('nav.memberships')}</span>
              </button>
            )}
            <a href="#why-us" className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">
              {t('nav.whyChooseUs')}
            </a>
            <a href="#location" className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">
              {t('nav.locationHours')}
            </a>
            <button
              type="button"
              onClick={onNavigateAdminLogin}
              className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('nav.adminLogin')}</span>
            </button>
          </nav>

          {/* Action Buttons, Language Toggle & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Global Language Toggle */}
            <LanguageToggle variant="segmented" />

            {/* Theme Toggle Button */}
            <ThemeToggle variant="compact" />

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
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:pt-12 sm:pb-18 lg:pt-14 lg:pb-22 bg-gradient-to-b from-blue-50/60 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-500/10 dark:bg-blue-600/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12 items-center">
            {/* Left Content - Generous 7-column allocation so headline never overflows */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-5 text-center lg:text-left min-w-0">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-cyan-400 text-xs font-bold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('home.heroBadge')}</span>
              </div>

              {/* Headline - Guaranteed single horizontal line on desktop without overflowing into slideshow */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[clamp(1.15rem,1.75vw,2.05rem)] font-black text-slate-950 dark:text-white tracking-tight uppercase leading-tight whitespace-normal lg:whitespace-nowrap">
                <span>{t('home.heroTitleLine1')} </span>
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 dark:from-cyan-400 dark:via-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                  {t('home.heroTitleLine2')}
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t('home.heroSubtitle')}
              </p>

              {/* Call-to-actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={onNavigateSignUp}
                  className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  <span>{t('home.ctaSignUp')}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                {onNavigateMemberships && (
                  <button
                    type="button"
                    onClick={onNavigateMemberships}
                    className="w-full sm:w-auto px-6 py-3.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-cyan-300 font-extrabold text-sm sm:text-base rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    <span>{t('home.ctaMemberships')}</span>
                  </button>
                )}

                <a
                  href="#services"
                  className="w-full sm:w-auto px-5 py-3.5 bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-sm sm:text-base rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <span>{t('home.ctaServices')}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>

              {/* Feature Highlights */}
              <div className="pt-5 grid grid-cols-3 gap-3 border-t border-slate-200 dark:border-slate-800/80 text-left">
                <div>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white block">{t('home.expressLane3Min')}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('home.expressLaneLabel')}</span>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white block">100%</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('home.spotFreeFinish')}</span>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-cyan-400 block">{t('home.noAppointment')}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('home.convenientWalkIn')}</span>
                </div>
              </div>
            </div>

            {/* Right Visual Hero Area: Wide Horizontal 16:9 Slideshow - strictly isolated in 5 columns */}
            <div className="lg:col-span-5 xl:col-span-5 relative w-full min-w-0">
              <HeroSlideshow />
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 Promotional Banner: 15% Welcome Discount */}
      <section className="relative z-20 -mt-7 sm:-mt-9 lg:-mt-11 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 dark:from-slate-900 dark:via-blue-950/80 dark:to-cyan-950/70 border-2 border-blue-400/50 dark:border-cyan-500/40 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden transition-all duration-300 hover:shadow-cyan-500/20">
          {/* Subtle ambient lighting effects */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-cyan-400/20 dark:bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-64 h-64 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
            {/* Visual Focus: Prominent 15% OFF Block */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center text-center sm:text-left gap-4 sm:gap-6 w-full lg:w-auto">
              <div className="shrink-0 flex items-center justify-center">
                <div className="px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl bg-white/15 dark:bg-cyan-400/15 backdrop-blur-md border border-white/30 dark:border-cyan-400/30 text-center shadow-inner">
                  <span className="block text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none text-white dark:text-cyan-300 font-mono-numbers">
                    15%
                  </span>
                  <span className="block text-xs sm:text-sm font-black uppercase tracking-widest text-cyan-200 dark:text-cyan-400 mt-1">
                    OFF
                  </span>
                </div>
              </div>

              {/* Text Messaging */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-cyan-400/20 text-white dark:text-cyan-200 text-[11px] font-extrabold tracking-wide uppercase">
                  <Tag className="w-3.5 h-3.5 text-cyan-200 dark:text-cyan-400" />
                  <span>{t('home.promoBannerBadge')}</span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight uppercase leading-tight">
                  {t('home.promoBannerTitle')}
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 dark:text-slate-200 font-medium max-w-xl leading-relaxed">
                  {t('home.promoBannerSubtitle')}
                </p>
                <p className="text-[11px] text-blue-200/90 dark:text-slate-400 pt-0.5">
                  {t('home.promoBannerTerms')}
                </p>
              </div>
            </div>

            {/* Clear CTA Button */}
            <div className="shrink-0 w-full lg:w-auto flex items-center justify-center lg:justify-end">
              <button
                type="button"
                onClick={onNavigateSignUp}
                className="w-full sm:w-auto px-7 sm:px-9 py-4 bg-white hover:bg-slate-100 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-blue-500 dark:hover:from-cyan-300 dark:hover:to-blue-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 group hover:scale-[1.03]"
              >
                <span>{t('home.promoBannerCta')}</span>
                <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Services & Pricing Section (Synchronized directly with Settings) */}
      <section id="services" className="py-20 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-cyan-400">
              {t('home.transparentPricing')}
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              {t('home.ourWashPackages')}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              {t('home.washPackagesDesc')}
            </p>
          </div>

          {/* Wash Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {washPackages.map((pkg, idx) => {
              const isBest = pkg.badge === 'Best Value' || pkg.badge === 'Popular' || idx === 2;
              return (
                <div
                  key={pkg.id}
                  className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative ${
                    isBest
                      ? 'bg-gradient-to-b from-blue-50/80 to-white dark:from-slate-800/90 dark:to-slate-900/90 border-2 border-blue-600 dark:border-cyan-400/80 shadow-xl shadow-blue-500/10 dark:shadow-cyan-500/10 -translate-y-1'
                      : 'bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  {pkg.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 dark:bg-cyan-400 text-white dark:text-slate-950 shadow-md">
                      {pkg.badge}
                    </span>
                  )}

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{pkg.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px]">{pkg.description}</p>

                    <div className="my-6">
                      <span className="text-4xl font-black text-slate-900 dark:text-white font-mono-numbers">
                        {formatCurrency(pkg.price)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">{t('memberships.perWash')}</span>
                    </div>

                    {pkg.features && pkg.features.length > 0 && (
                      <ul className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                        {pkg.features.map((feat: string, fIdx: number) => (
                          <li key={fIdx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={onNavigateSignUp}
                    className={`mt-8 w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      isBest
                        ? 'bg-blue-600 hover:bg-blue-500 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 font-black shadow-md'
                        : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-transparent'
                    }`}
                  >
                    {t('home.getStarted')}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add-on Services Bar */}
          {addOns.length > 0 && (
            <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{t('home.optionalAddOns')}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('home.availableOnAnyWash')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {addOns.map((addon) => (
                  <div
                    key={addon.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block">{addon.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{addon.description}</span>
                    </div>
                    <span className="text-base font-extrabold text-blue-600 dark:text-cyan-400 font-mono-numbers ml-3">
                      +{formatCurrency(addon.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Why Choose Us Section */}
      <section id="why-us" className="py-20 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-cyan-400">
              {t('home.shineDifference')}
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              {t('nav.whyChooseUs')}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              {t('home.whySubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('home.fastService')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('home.fastServiceDesc')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('home.professionalCare')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('home.professionalCareDesc')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Droplets className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('home.qualityCleaning')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('home.qualityCleaningDesc')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('home.convenientWalkIn')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('home.convenientWalkInDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Call To Action Banner */}
      <section className="py-16 bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-5 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            {t('home.readyToShine')}
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto">
            {t('home.readyToShineDesc')}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onNavigateSignUp}
              className="px-8 py-3.5 bg-white text-slate-950 font-extrabold text-sm sm:text-base rounded-2xl shadow-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              {t('auth.signUpNow')}
            </button>
            <button
              type="button"
              onClick={onNavigateCustomerLogin}
              className="px-6 py-3.5 bg-blue-900/40 hover:bg-blue-900/60 border border-white/20 text-white font-bold text-sm sm:text-base rounded-2xl transition-all cursor-pointer"
            >
              {t('auth.signInNow')}
            </button>
          </div>
        </div>
      </section>

      {/* 6. Location, Hours & Footer */}
      <footer id="location" className="bg-slate-900 dark:bg-slate-950 py-12 border-t border-slate-800 text-xs text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-slate-800/80">
            {/* Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span className="font-extrabold text-base text-white">
                  {businessInfo.businessName || 'ShineExpress'}
                </span>
              </div>
              <p className="text-slate-400">
                {businessInfo.receiptFooter || 'Professional Express Car Wash Services.'}
              </p>
            </div>

            {/* Contact details */}
            <div className="space-y-2.5">
              <span className="font-bold uppercase tracking-wider text-slate-300 block">{t('home.contactAndVisit')}</span>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{businessInfo.address || '123 Main Street'}</span>
              </p>
              <p className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{businessInfo.phone || '(555) 123-4567'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{t('home.open7Days')}</span>
              </p>

              {/* Have a Question? Send an Enquiry Option */}
              {onNavigateEnquiry && (
                <div className="pt-2">
                  <p className="text-[11px] text-slate-400 font-medium mb-1.5">
                    {t('enquiry.haveQuestion')}
                  </p>
                  <button
                    type="button"
                    onClick={onNavigateEnquiry}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:shadow-cyan-500/30 transition-all cursor-pointer group"
                  >
                    <Mail className="w-3.5 h-3.5 text-white" />
                    <span>{t('enquiry.sendEnquiry')}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </div>

            {/* Portal Links (Staff vs Customer) */}
            <div className="space-y-2">
              <span className="font-bold uppercase tracking-wider text-slate-300 block">{t('home.accessPortals')}</span>
              <div className="flex flex-col gap-1.5">
                {onNavigateMemberships && (
                  <button
                    type="button"
                    onClick={onNavigateMemberships}
                    className="text-left text-cyan-400 hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t('home.ctaMemberships')}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onNavigateCustomerLogin}
                  className="text-left text-cyan-400 hover:underline cursor-pointer"
                >
                  → {t('home.customerAccountPortal')}
                </button>
                <button
                  type="button"
                  onClick={onNavigateAdminLogin}
                  className="text-left text-slate-400 hover:text-white hover:underline cursor-pointer"
                >
                  → {t('home.adminCashierLogin')}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <p>© {new Date().getFullYear()} {businessInfo.businessName || 'Car Wash POS'}. {t('home.footerRights')}</p>
            <div className="flex items-center gap-3">
              <LanguageToggle variant="compact" />
              <ThemeToggle variant="compact" />
              <button
                type="button"
                onClick={onNavigateAdminLogin}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                {t('home.staffAdminPortalLink')}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
