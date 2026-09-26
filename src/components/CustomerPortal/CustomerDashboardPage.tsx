import React, { useState } from 'react';
import {
  Car,
  Receipt,
  User,
  LogOut,
  Plus,
  Edit2,
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  Home,
} from 'lucide-react';
import { Customer, CustomerVehicle, Transaction, AuthUser, CustomerMembership, MembershipUsage } from '../../types/pos';
import { formatCurrency, formatPaymentMethodName } from '../../data/constants';
import { formatVehicleDescription } from '../../data/customerData';
import { formatMembershipStatusBadge } from '../../data/membershipData';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageToggle } from '../LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';

interface CustomerDashboardPageProps {
  user: AuthUser;
  customer: Customer | null;
  vehicles: CustomerVehicle[];
  transactions: Transaction[];
  membership?: CustomerMembership | null;
  membershipUsages?: MembershipUsage[];
  onOpenAddVehicle: () => void;
  onOpenEditVehicle: (vehicle: CustomerVehicle) => void;
  onOpenTransactionReceipt: (transaction: Transaction) => void;
  onNavigateHome: () => void;
  onNavigateMemberships?: () => void;
  onCancelMembership?: (membershipId: string) => void;
  onLogout: () => void;
}

export const CustomerDashboardPage: React.FC<CustomerDashboardPageProps> = ({
  user,
  customer,
  vehicles,
  transactions,
  membership = null,
  membershipUsages = [],
  onOpenAddVehicle,
  onOpenEditVehicle,
  onOpenTransactionReceipt,
  onNavigateHome,
  onNavigateMemberships,
  onCancelMembership,
  onLogout,
}) => {
  const { t, formatDate, formatDateTime } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'membership' | 'vehicles' | 'history'>('overview');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Filter vehicles belonging to this customer
  const customerVehicles = vehicles.filter((v) => v.customerId === user.customerId);

  // Filter transactions belonging to this customer ONLY (Strict privacy constraint)
  const customerTransactions = transactions.filter(
    (t) => t.customerId && t.customerId === user.customerId
  );

  const activeTxs = customerTransactions.filter((t) => t.status !== 'voided');
  const totalSpent = activeTxs.reduce((sum, t) => sum + t.total, 0);

  const lastVisit = customerTransactions.length > 0
    ? [...customerTransactions].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0]
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-blue-600 selection:text-white flex flex-col transition-colors duration-200">
      {/* Top Customer Portal Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 dark:from-cyan-400 dark:to-blue-600 flex items-center justify-center text-white dark:text-slate-950 font-bold shadow-md cursor-pointer hover:scale-105 transition-transform"
              title={t('nav.backToHome')}
            >
              <Sparkles className="w-5 h-5 text-white dark:text-slate-950" />
            </button>
            <div>
              <span className="font-extrabold text-base text-slate-900 dark:text-white block">
                {t('dashboard.portalTitle')}
              </span>
              <span className="text-[11px] text-blue-600 dark:text-cyan-400 font-medium">
                {t('dashboard.myAccount')}
              </span>
            </div>
          </div>

          {/* Navigation, Language, Theme & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle variant="segmented" />
            <ThemeToggle variant="compact" />

            <button
              type="button"
              onClick={onNavigateHome}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t('nav.home')}</span>
            </button>

            {onNavigateMemberships && (
              <button
                type="button"
                onClick={onNavigateMemberships}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 bg-blue-50 dark:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('nav.memberships')}</span>
              </button>
            )}

            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">{user.name}</span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800/60 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        {/* Welcome Greeting Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 dark:from-slate-800 dark:via-slate-800/90 dark:to-blue-950/60 text-white border border-blue-500/20 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-cyan-400/10 border border-white/30 dark:border-cyan-400/30 text-white dark:text-cyan-400 text-xs font-bold">
              <Sparkles className="w-3 h-3" />
              <span>Verified Customer Profile</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Welcome back, {customer?.firstName || user.name}!
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 dark:text-slate-300 max-w-xl">
              Manage your registered vehicles, view itemized wash receipts, and speed through checkout
              at any of our express lanes.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAddVehicle}
            className="self-start md:self-auto px-5 py-3 bg-white hover:bg-slate-100 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-blue-500 dark:hover:from-cyan-300 dark:hover:to-blue-400 text-slate-900 dark:text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-blue-600 dark:text-slate-950" />
            <span>+ Add New Vehicle</span>
          </button>
        </div>

        {/* 4 Overview Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Membership Status Card */}
          <div
            onClick={() => setActiveTab('membership')}
            className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 space-y-1 shadow-xs transition-all hover:border-blue-400 dark:hover:border-cyan-500 cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>My Membership</span>
              <Sparkles className="w-4 h-4 text-cyan-500" />
            </div>
            {membership && membership.status === 'active' ? (
              <>
                <div className="text-xl font-black text-slate-900 dark:text-white truncate">
                  {membership.planNameSnapshot}
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span>● Active</span>
                  <span className="text-slate-400 font-normal">· {membership.remainingWashes} of {membership.includedWashes} washes</span>
                </p>
              </>
            ) : (
              <>
                <div className="text-lg font-black text-slate-700 dark:text-slate-300">
                  No Active Plan
                </div>
                <p className="text-xs text-blue-600 dark:text-cyan-400 font-semibold hover:underline">
                  Join Membership Club →
                </p>
              </>
            )}
          </div>

          {/* Vehicles Count */}
          <div
            onClick={() => setActiveTab('vehicles')}
            className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 space-y-1 shadow-xs transition-all hover:border-blue-400 dark:hover:border-cyan-500 cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>My Vehicles</span>
              <Car className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{customerVehicles.length}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Registered cars on profile</p>
          </div>

          {/* Visits Count */}
          <div
            onClick={() => setActiveTab('history')}
            className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 space-y-1 shadow-xs transition-all hover:border-blue-400 dark:hover:border-cyan-500 cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Total Washes</span>
              <Receipt className="w-4 h-4 text-indigo-600 dark:text-blue-400" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{customerTransactions.length}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Visits to express station</p>
          </div>

          {/* Total Spent */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 space-y-1 shadow-xs transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Total Spent</span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-blue-600 dark:text-cyan-400 font-mono-numbers">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Lifetime wash volume</p>
          </div>
        </div>

        {/* Dashboard Tabs: My Profile, My Membership, My Vehicles, Wash History */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 transition-colors overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-blue-600 dark:bg-cyan-400 text-white dark:text-slate-950 font-black shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t('dashboard.tabOverview')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('membership')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'membership'
                  ? 'bg-blue-600 dark:bg-cyan-400 text-white dark:text-slate-950 font-black shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('dashboard.tabMembership')}</span>
              {membership && membership.status === 'active' && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vehicles')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'vehicles'
                  ? 'bg-blue-600 dark:bg-cyan-400 text-white dark:text-slate-950 font-black shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t('dashboard.tabVehicles')} ({customerVehicles.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-blue-600 dark:bg-cyan-400 text-white dark:text-slate-950 font-black shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t('dashboard.tabHistory')} ({customerTransactions.length})
            </button>
          </div>

          {/* TAB 1: Profile Details */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 space-y-4 shadow-xs transition-colors">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Customer Profile Information</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">Account ID:</span>
                    <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">{customer?.id || user.customerId || 'CUS-NEW'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">Full Name:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{customer?.firstName} {customer?.lastName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">Email Address:</span>
                    <span className="text-slate-900 dark:text-white">{user.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">Phone Number:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{customer?.phone || 'Not provided'}</span>
                  </div>
                  {customer?.notes && (
                    <div className="py-2">
                      <span className="text-slate-500 dark:text-slate-400 block mb-1">Customer Preferences:</span>
                      <p className="text-slate-700 dark:text-slate-300 italic">{customer.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Last Visit Highlights */}
              <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 space-y-4 shadow-xs transition-colors">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Recent Activity</span>
                </h3>

                {lastVisit ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-cyan-400">
                        {lastVisit.receiptNumber}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(lastVisit.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{lastVisit.service.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Vehicle: {lastVisit.vehicleDescriptionAtSale || lastVisit.vehicleType.name}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(lastVisit.total)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenTransactionReceipt(lastVisit)}
                        className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Receipt</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    No visit recorded yet. Visit our wash lane anytime!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: My Membership */}
          {activeTab === 'membership' && (
            <div className="space-y-6">
              {membership && membership.status === 'active' ? (
                /* Active Membership Details Card */
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white border border-blue-800/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
                    <div className="relative z-10 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t('dashboard.activeMembershipTitle')}</span>
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            {membership.planNameSnapshot}
                          </h2>
                          <p className="text-xs text-blue-200">
                            {t('dashboard.memberId')}: <span className="font-mono font-bold text-white">{membership.id}</span> ·{' '}
                            {membership.billingFrequency === 'monthly' ? t('dashboard.monthlyPass') : t('dashboard.yearlyPass')}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                            {formatCurrency(membership.priceAtSignup)}
                          </span>
                          <span className="text-xs text-blue-200 block">
                            / {membership.billingFrequency}
                          </span>
                        </div>
                      </div>

                      {/* Remaining Washes Visual Bar */}
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                            Included Wash Pass Allocation
                          </span>
                          <span className="text-sm font-black text-cyan-300 font-mono">
                            {membership.remainingWashes} of {membership.includedWashes} Washes Left
                          </span>
                        </div>

                        <div className="w-full h-3.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, (membership.remainingWashes / membership.includedWashes) * 100)
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-200 pt-1">
                          <span>
                            Next renewal: <strong className="text-white">{new Date(membership.nextBillingDate).toLocaleDateString()}</strong>
                          </span>
                          <span>
                            Service covered: <strong className="text-white">{membership.includedServiceName}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Benefits & Inclusions */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span>Included Washes</span>
                          </div>
                          <p className="text-blue-200 text-[11px]">
                            {membership.includedWashes} {membership.includedServiceName}s every {membership.billingFrequency}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <span>Add-On Savings</span>
                          </div>
                          <p className="text-blue-200 text-[11px]">
                            {membership.addOnDiscountPercent || 10}% member discount on all add-on upgrades
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-blue-400" />
                            <span>Express Lane Priority</span>
                          </div>
                          <p className="text-blue-200 text-[11px]">
                            Speedy cashier lookup with your member name or vehicle plate
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
                        {onNavigateMemberships && (
                          <button
                            type="button"
                            onClick={onNavigateMemberships}
                            className="text-xs text-cyan-300 hover:text-cyan-200 font-bold underline cursor-pointer"
                          >
                            Browse other membership plans →
                          </button>
                        )}

                        {onCancelMembership && (
                          <div>
                            {!showCancelConfirm ? (
                              <button
                                type="button"
                                onClick={() => setShowCancelConfirm(true)}
                                className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                              >
                                Cancel Membership
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 p-2 bg-rose-950/80 border border-rose-500/60 rounded-xl text-xs">
                                <span className="text-rose-200">Confirm cancel?</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onCancelMembership(membership.id);
                                    setShowCancelConfirm(false);
                                  }}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg cursor-pointer"
                                >
                                  Yes, Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowCancelConfirm(false)}
                                  className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                                >
                                  Keep Plan
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Usage History for this Customer */}
                  <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 space-y-4 shadow-xs">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-500" />
                      <span>Membership Wash Usage History</span>
                    </h3>

                    {membershipUsages.filter((u) => u.customerId === user.customerId || u.membershipId === membership.id).length > 0 ? (
                      <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                        {membershipUsages
                          .filter((u) => u.customerId === user.customerId || u.membershipId === membership.id)
                          .map((usage) => (
                            <div key={usage.id} className="py-3 flex items-center justify-between">
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {usage.serviceName}
                                </div>
                                <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                                  {usage.vehicleDescription || 'Standard Vehicle'} · {new Date(usage.date).toLocaleString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold rounded-full font-mono text-[11px]">
                                  FREE (Covered by Pass)
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400 py-3 italic">
                        No membership washes used yet this billing cycle. Visit our wash lane anytime to redeem!
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* No Active Membership: Upsell Promotion Card */
                <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
                    <Sparkles className="w-8 h-8" />
                  </div>

                  <div className="max-w-md mx-auto space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      Save More with a Car Wash Membership
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Join our Wash Club to receive 4 exterior washes every month, 10% off selected add-ons, and express lane priority.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white">Monthly & Yearly</div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">Flexible plans to match how often you drive</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white">Member Discounts</div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">10% off ceramic coatings, hot wax, and add-ons</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white">Cancel Anytime</div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">No contracts, no hassle, manage online</p>
                    </div>
                  </div>

                  {onNavigateMemberships && (
                    <button
                      type="button"
                      onClick={onNavigateMemberships}
                      className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>View Available Membership Plans</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: My Vehicles */}
          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Your Saved Vehicles</h3>
                <button
                  type="button"
                  onClick={onOpenAddVehicle}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Vehicle</span>
                </button>
              </div>

              {customerVehicles.length === 0 ? (
                <div className="p-10 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-3 shadow-xs">
                  <Car className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">No vehicles added yet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add your vehicle to speed up lane lookup and keep an organized service history.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenAddVehicle}
                    className="mt-2 px-4 py-2 bg-blue-600 dark:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    + Register Your First Car
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customerVehicles.map((veh) => (
                    <div
                      key={veh.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-3 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {formatVehicleDescription(veh)}
                          </h4>
                          <span className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 block">
                            ID: {veh.id}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenEditVehicle(veh)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Edit vehicle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <div className="flex justify-between">
                          <span>License Plate:</span>
                          <span className="font-mono text-slate-900 dark:text-white font-bold">
                            {veh.licensePlate || 'None'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Category:</span>
                          <span className="text-slate-900 dark:text-white">
                            {veh.vehicleTypeId === 'suv_truck' ? 'SUV / Truck' : 'Car'}
                          </span>
                        </div>
                        {veh.color && (
                          <div className="flex justify-between">
                            <span>Color:</span>
                            <span className="text-slate-900 dark:text-white">{veh.color}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Wash History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Your Wash History</h3>

              {customerTransactions.length === 0 ? (
                <div className="p-10 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-2 shadow-xs">
                  <Receipt className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">No wash transactions recorded yet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    When you purchase a wash at our express station, your itemized receipts will appear
                    here.
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-xs transition-colors">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px]">
                          <th className="py-3 px-4">Receipt #</th>
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3">Vehicle</th>
                          <th className="py-3 px-3">Service</th>
                          <th className="py-3 px-3">Add-ons</th>
                          <th className="py-3 px-4 text-right">Total</th>
                          <th className="py-3 px-3">Payment</th>
                          <th className="py-3 px-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {customerTransactions.map((tx) => (
                          <tr
                            key={tx.id}
                            onClick={() => onOpenTransactionReceipt(tx)}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-cyan-400">
                              {tx.receiptNumber}
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                              {new Date(tx.timestamp).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-3 text-slate-900 dark:text-white truncate max-w-[150px]">
                              {tx.vehicleDescriptionAtSale || tx.vehicleType.name}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                              {tx.service.name}
                            </td>
                            <td className="py-3 px-3 text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                              {tx.addOns.length > 0
                                ? tx.addOns.map((a) => a.name).join(', ')
                                : 'None'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {formatCurrency(tx.total)}
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                              {formatPaymentMethodName(tx.paymentMethod)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="text-xs text-blue-600 dark:text-cyan-400 font-bold hover:underline">
                                View
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
