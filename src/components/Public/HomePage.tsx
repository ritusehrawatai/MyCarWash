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
} from 'lucide-react';
import { POSServiceItem, BusinessInfo } from '../../types/pos';
import { formatCurrency } from '../../data/constants';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageToggle } from '../LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';

interface HomePageProps {
  services: POSServiceItem[];
  businessInfo: BusinessInfo;
  onNavigateSignUp: () => void;
  onNavigateCustomerLogin: () => void;
  onNavigateAdminLogin: () => void;
  onNavigateMemberships?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  services,
  businessInfo,
  onNavigateSignUp,
  onNavigateCustomerLogin,
  onNavigateAdminLogin,
  onNavigateMemberships,
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
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-24 lg:pb-32 bg-gradient-to-b from-blue-50/60 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-500/10 dark:bg-blue-600/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-cyan-400 text-xs font-bold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('home.heroBadge')}</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-950 dark:text-white tracking-tight leading-none uppercase">
                {t('home.heroTitleLine1')} <br />
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 dark:from-cyan-400 dark:via-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                  {t('home.heroTitleLine2')}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {t('home.heroSubtitle')}
              </p>

              {/* Call-to-actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 flex-wrap">
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
                    className="w-full sm:w-auto px-7 py-3.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-cyan-300 font-extrabold text-sm sm:text-base rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    <span>{t('home.ctaMemberships')}</span>
                  </button>
                )}

                <a
                  href="#services"
                  className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-sm sm:text-base rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <span>{t('home.ctaServices')}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>

              {/* Feature Highlights */}
              <div className="pt-6 grid grid-cols-3 gap-3 border-t border-slate-200 dark:border-slate-800/80 text-left">
                <div>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white block">3 Mins</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Express Wash Lane</span>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white block">100%</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Spot-Free Finish</span>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-cyan-400 block">Walk-In</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">No Appointment</span>
                </div>
              </div>
            </div>

            {/* Right Visual Image Card (Clean glossy vehicle) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 shadow-2xl shadow-blue-900/20 group">
                <img
                  src="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1000&q=80"
                  alt="Shiny pristine luxury vehicle with glossy finish"
                  className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-700 opacity-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Floating Overlay Badge */}
                <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-cyan-500/20 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Ceramic Gloss Shield
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Triple Foam Carnauba Polish</p>
                    </div>
                  </div>
                  <div className="flex items-center text-amber-500 dark:text-amber-400 text-xs font-bold gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500 dark:text-amber-400" />
                    <span>5.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Services & Pricing Section (Synchronized directly with Settings) */}
      <section id="services" className="py-20 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-cyan-400">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Our Wash Packages
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Select the service package that fits your vehicle's needs. All prices are synchronized live
              from our station register.
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
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">/ wash</span>
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
                    Get Started
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
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">Optional Express Add-ons</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Available on any wash at the kiosk or bay</p>
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
              The Shine Difference
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Why Choose Us
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Built from the ground up for vehicle protection, fast turnaround, and uncompromising
              cleanliness.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Fast Service</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Express tunnel lanes get you in, cleaned, dried, and back on the road in under 3
                minutes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Professional Car Care</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Gentle closed-cell foam technology and pH-balanced cleansers protect your vehicle's
                paint.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Droplets className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Quality Cleaning</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Reverse osmosis purified rinse ensures zero water spots, while high-velocity air dryers
                wipe moisture away.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Convenient Walk-In</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                No appointments required. Simply drive up to any lane, select your wash, and experience
                the shine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Call To Action Banner */}
      <section className="py-16 bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-5 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Ready to make your car shine?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto">
            Create your free customer account to save your vehicles, track your wash history, and speed
            up checkout at the lane.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onNavigateSignUp}
              className="px-8 py-3.5 bg-white text-slate-950 font-extrabold text-sm sm:text-base rounded-2xl shadow-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              Sign Up Now
            </button>
            <button
              type="button"
              onClick={onNavigateCustomerLogin}
              className="px-6 py-3.5 bg-blue-900/40 hover:bg-blue-900/60 border border-white/20 text-white font-bold text-sm sm:text-base rounded-2xl transition-all cursor-pointer"
            >
              Existing Customer Login
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
            <div className="space-y-2">
              <span className="font-bold uppercase tracking-wider text-slate-300 block">Contact & Visit</span>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{businessInfo.address || '123 Main Street'}</span>
              </p>
              <p className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{businessInfo.phone || '(555) 123-4567'}</span>
              </p>
            </div>

            {/* Portal Links (Staff vs Customer) */}
            <div className="space-y-2">
              <span className="font-bold uppercase tracking-wider text-slate-300 block">Access Portals</span>
              <div className="flex flex-col gap-1.5">
                {onNavigateMemberships && (
                  <button
                    type="button"
                    onClick={onNavigateMemberships}
                    className="text-left text-cyan-400 hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View Membership Plans</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onNavigateCustomerLogin}
                  className="text-left text-cyan-400 hover:underline cursor-pointer"
                >
                  → Customer Account Portal
                </button>
                <button
                  type="button"
                  onClick={onNavigateAdminLogin}
                  className="text-left text-slate-400 hover:text-white hover:underline cursor-pointer"
                >
                  → Administration & Cashier Login
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
