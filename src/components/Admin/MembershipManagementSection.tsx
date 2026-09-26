import React, { useState } from 'react';
import {
  Users,
  CreditCard,
  Plus,
  Edit2,
  Ban,
  CheckCircle2,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  Sparkles,
  Search,
  X,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  MembershipPlan,
  CustomerMembership,
  MembershipUsage,
  POSServiceItem,
  BillingFrequency,
} from '../../types/pos';
import { formatCurrency } from '../../data/constants';
import { formatMembershipStatusBadge } from '../../data/membershipData';

interface MembershipManagementSectionProps {
  plans: MembershipPlan[];
  memberships: CustomerMembership[];
  usages: MembershipUsage[];
  services: POSServiceItem[];
  onSavePlan: (plan: MembershipPlan) => void;
  onTogglePlanActive: (planId: string) => void;
  onCancelMembership: (membershipId: string) => void;
}

export const MembershipManagementSection: React.FC<MembershipManagementSectionProps> = ({
  plans,
  memberships,
  usages,
  services,
  onSavePlan,
  onTogglePlanActive,
  onCancelMembership,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'usages'>('overview');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'monthly' | 'yearly' | 'cancelled' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Plan Edit / Create Modal state
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  // Admin Cancel Membership confirm state
  const [cancellingMembership, setCancellingMembership] = useState<CustomerMembership | null>(null);

  // Wash services eligible for membership inclusion
  const washServices = services.filter((s) => s.type === 'wash');

  // Metrics calculations
  const activeMembers = memberships.filter((m) => m.status === 'active');
  const monthlyMembers = activeMembers.filter((m) => m.billingFrequency === 'monthly');
  const yearlyMembers = activeMembers.filter((m) => m.billingFrequency === 'yearly');
  const cancelledMembers = memberships.filter((m) => m.status === 'cancelled');
  const expiredMembers = memberships.filter((m) => m.status === 'expired');
  const totalRevenue = memberships.reduce((sum, m) => sum + (m.priceAtSignup || 0), 0);

  // Filter memberships list
  const filteredMemberships = memberships.filter((m) => {
    // Status filter
    if (statusFilter === 'active' && m.status !== 'active') return false;
    if (statusFilter === 'cancelled' && m.status !== 'cancelled') return false;
    if (statusFilter === 'expired' && m.status !== 'expired') return false;
    if (statusFilter === 'monthly' && m.billingFrequency !== 'monthly') return false;
    if (statusFilter === 'yearly' && m.billingFrequency !== 'yearly') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.customerName.toLowerCase().includes(q);
      const matchId = m.id.toLowerCase().includes(q);
      const matchCustId = m.customerId.toLowerCase().includes(q);
      const matchPlan = m.planNameSnapshot.toLowerCase().includes(q);
      return matchName || matchId || matchCustId || matchPlan;
    }
    return true;
  });

  const handleOpenCreatePlan = () => {
    const newPlan: MembershipPlan = {
      id: `plan_${Date.now()}`,
      name: '',
      description: '',
      billingFrequency: 'monthly',
      price: 29.99,
      includedServiceId: washServices[0]?.id || 'basic',
      includedServiceName: washServices[0]?.name || 'Basic Wash',
      includedWashes: 4,
      addOnBenefitDescription: '10% off selected add-ons',
      addOnDiscountPercent: 10,
      active: true,
      terms: 'Billed monthly. Cancel anytime.',
    };
    setEditingPlan(newPlan);
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: MembershipPlan) => {
    setEditingPlan({ ...plan });
    setIsPlanModalOpen(true);
  };

  const handleSavePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !editingPlan.name.trim()) return;

    // Resolve included service name
    const foundService = washServices.find((s) => s.id === editingPlan.includedServiceId);
    const updatedPlan: MembershipPlan = {
      ...editingPlan,
      includedServiceName: foundService ? foundService.name : editingPlan.includedServiceName,
      updatedAt: new Date().toISOString(),
    };

    onSavePlan(updatedPlan);
    setIsPlanModalOpen(false);
    setEditingPlan(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Admin Membership Dashboard Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Active Members */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Active</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono-numbers">
            {activeMembers.length}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Active Subscribers</p>
        </div>

        {/* Monthly Members */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Monthly</span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono-numbers">
            {monthlyMembers.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Monthly Billing</p>
        </div>

        {/* Yearly Members */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Yearly</span>
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono-numbers">
            {yearlyMembers.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Annual Passes</p>
        </div>

        {/* Cancelled Members */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Cancelled</span>
            <Ban className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono-numbers">
            {cancelledMembers.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Preserved Records</p>
        </div>

        {/* Expired Members */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Expired</span>
            <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono-numbers">
            {expiredMembers.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Past Due / Ended</p>
        </div>

        {/* Membership Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono-numbers">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Signups Value</p>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Customer Memberships ({memberships.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Membership Plans ({plans.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('usages')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'usages'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Redemptions History ({usages.length})
          </button>
        </div>

        {activeTab === 'plans' && (
          <button
            type="button"
            onClick={handleOpenCreatePlan}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Plan</span>
          </button>
        )}
      </div>

      {/* TAB 1: CUSTOMER MEMBERSHIPS DIRECTORY */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memberships by ID, customer name, or plan..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'monthly', label: 'Monthly' },
                  { id: 'yearly', label: 'Yearly' },
                  { id: 'cancelled', label: 'Cancelled' },
                  { id: 'expired', label: 'Expired' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Memberships Table */}
          {filteredMemberships.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">No memberships match the criteria</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Try changing your search term or filter.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px]">
                      <th className="py-3.5 px-4">Membership ID</th>
                      <th className="py-3.5 px-3">Customer</th>
                      <th className="py-3.5 px-4">Plan Name</th>
                      <th className="py-3.5 px-3">Billing</th>
                      <th className="py-3.5 px-3 text-right">Price</th>
                      <th className="py-3.5 px-3 text-center">Remaining Washes</th>
                      <th className="py-3.5 px-3">Next Billing</th>
                      <th className="py-3.5 px-3 text-center">Status</th>
                      <th className="py-3.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredMemberships.map((m) => {
                      const badge = formatMembershipStatusBadge(m.status);
                      const isCancelled = m.status === 'cancelled';

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-cyan-400">
                            {m.id}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {m.customerName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {m.customerId}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                            {m.planNameSnapshot}
                          </td>
                          <td className="py-3.5 px-3 capitalize text-slate-600 dark:text-slate-300">
                            {m.billingFrequency}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(m.priceAtSignup)}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                              {m.remainingWashes} / {m.includedWashes}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                            {new Date(m.nextBillingDate).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${badge.bgClass} ${badge.textClass}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            {m.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => setCancellingMembership(m)}
                                className="px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-lg border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MEMBERSHIP PLANS CONFIGURATION (ADMIN CAN CREATE, EDIT, ACTIVATE/DEACTIVATE) */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((p) => {
              const isUsedByCustomer = memberships.some((m) => m.planId === p.id);

              return (
                <div
                  key={p.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 space-y-4 flex flex-col justify-between shadow-xs transition-all ${
                    p.active
                      ? 'border-slate-200 dark:border-slate-800'
                      : 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        p.active
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                      }`}>
                        {p.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        {p.billingFrequency.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {p.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {p.description}
                    </p>

                    <div className="my-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono-numbers">
                        {formatCurrency(p.price)}
                      </span>
                      <span className="text-xs text-slate-500">
                        /{p.billingFrequency}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Included:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {p.includedWashes} {p.includedServiceName}s
                        </span>
                      </div>
                      {p.addOnDiscountPercent && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Add-on Discount:</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {p.addOnDiscountPercent}% off
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditPlan(p)}
                      className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Plan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onTogglePlanActive(p.id)}
                      className={`py-2 px-3 font-bold text-xs rounded-xl transition-colors cursor-pointer ${
                        p.active
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                      }`}
                      title={p.active ? 'Deactivate plan' : 'Activate plan'}
                    >
                      {p.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MEMBERSHIP USAGES & REDEMPTIONS AUDIT */}
      {activeTab === 'usages' && (
        <div className="space-y-4">
          {usages.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <Sparkles className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">No membership redemptions recorded yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                When cashiers apply a customer's included membership wash during POS checkout, redemptions will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px]">
                      <th className="py-3.5 px-4">Redemption ID</th>
                      <th className="py-3.5 px-3">Date</th>
                      <th className="py-3.5 px-3">Customer</th>
                      <th className="py-3.5 px-4">Membership ID</th>
                      <th className="py-3.5 px-3">Service Applied</th>
                      <th className="py-3.5 px-3">Vehicle</th>
                      <th className="py-3.5 px-3 text-center">Remaining Washes</th>
                      <th className="py-3.5 px-4 text-right">Value Covered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {usages.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {u.id}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {new Date(u.date).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {u.customerName || u.customerId}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-blue-600 dark:text-cyan-400 font-bold">
                          {u.membershipId}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {u.serviceName}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                          {u.vehicleDescription || 'Standard Vehicle'}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {u.remainingWashes} left
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(u.discountAmount)}
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

      {/* PLAN EDIT / CREATE MODAL */}
      {isPlanModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg text-slate-950 dark:text-white">
                {editingPlan.name ? `Edit Plan: ${editingPlan.name}` : 'Create Membership Plan'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsPlanModalOpen(false);
                  setEditingPlan(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlanSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  placeholder="e.g. Deluxe Monthly Wash Club"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  placeholder="Short tagline explaining benefits..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Billing Frequency
                  </label>
                  <select
                    value={editingPlan.billingFrequency}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        billingFrequency: e.target.value as BillingFrequency,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingPlan.price}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Included Service
                  </label>
                  <select
                    value={editingPlan.includedServiceId}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, includedServiceId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    {washServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({formatCurrency(s.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Included Washes / Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={editingPlan.includedWashes}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        includedWashes: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Add-on Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingPlan.addOnDiscountPercent || 0}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        addOnDiscountPercent: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Badge Tag (optional)
                  </label>
                  <input
                    type="text"
                    value={editingPlan.badge || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, badge: e.target.value })}
                    placeholder="Popular / Best Value"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsPlanModalOpen(false);
                    setEditingPlan(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN CANCEL MEMBERSHIP CONFIRMATION DIALOG */}
      {cancellingMembership && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 text-amber-600">
              <Ban className="w-5 h-5" />
              <h3 className="font-extrabold text-base text-slate-950 dark:text-white">
                Cancel Customer Membership?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to cancel the membership for <strong>{cancellingMembership.customerName}</strong> ({cancellingMembership.id})?
              The record will be preserved with status <strong>Cancelled</strong>.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancellingMembership(null)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelMembership(cancellingMembership.id);
                  setCancellingMembership(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer"
              >
                Yes, Cancel Membership
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
