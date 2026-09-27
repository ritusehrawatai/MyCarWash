import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Car,
  Plus,
  Edit2,
  Calendar,
  Clock,
  ChevronRight,
  Receipt,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Customer, CustomerVehicle, Transaction, UserRole, CustomerMembership } from '../../types/pos';
import { formatCurrency, formatPaymentMethodName, formatLocalizedPaymentMethod } from '../../data/constants';
import { formatVehicleDescription } from '../../data/customerData';
import { useLanguage } from '../../context/LanguageContext';

interface CustomerProfileModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  vehicles: CustomerVehicle[];
  transactions: Transaction[];
  membership?: CustomerMembership | null;
  onOpenAddVehicle: (customerId: string) => void;
  onOpenEditVehicle: (vehicle: CustomerVehicle) => void;
  onToggleVehicleActive: (vehicle: CustomerVehicle) => void;
  onOpenTransactionDetails: (transaction: Transaction) => void;
  onUpdateCustomer: (customer: Customer) => void;
  userRole?: UserRole;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  customer,
  isOpen,
  onClose,
  vehicles,
  transactions,
  membership = null,
  onOpenAddVehicle,
  onOpenEditVehicle,
  onToggleVehicleActive,
  onOpenTransactionDetails,
  onUpdateCustomer,
  userRole = 'admin',
}) => {
  const { t, language } = useLanguage();
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNotes, setEditNotes] = useState('');

  if (!isOpen || !customer) return null;

  const handleStartEdit = () => {
    setEditFirst(customer.firstName);
    setEditLast(customer.lastName);
    setEditPhone(customer.phone || '');
    setEditEmail(customer.email || '');
    setEditNotes(customer.notes || '');
    setIsEditingInfo(true);
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Customer = {
      ...customer,
      firstName: editFirst.trim() || customer.firstName,
      lastName: editLast.trim() || customer.lastName,
      phone: editPhone.trim(),
      email: editEmail.trim(),
      notes: editNotes.trim(),
      updatedAt: new Date().toISOString(),
    };
    onUpdateCustomer(updated);
    setIsEditingInfo(false);
  };

  // Vehicles belonging to this customer
  const customerVehicles = vehicles.filter((v) => v.customerId === customer.id);

  // Transactions belonging to this customer
  const customerTransactions = transactions.filter((t) => t.customerId === customer.id);

  const totalSpent = customerTransactions
    .filter((t) => t.status !== 'voided')
    .reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in duration-150 flex flex-col max-h-[90vh] transition-colors">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              {customer.firstName[0] || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                  {customer.firstName} {customer.lastName}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {customer.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('customers.profileSummary', { vehicles: customerVehicles.length, visits: customerTransactions.length })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Section 1: Customer Information & Stats */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('customers.customerInfoTitle')}
              </h4>
              {!isEditingInfo ? (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{t('customers.editProfile')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
              )}
            </div>

            {!isEditingInfo ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold block">{t('customers.phoneCol')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono-numbers">
                    {customer.phone || t('customers.noPhoneProvided')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold block">{t('customers.emailCol')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {customer.email || t('customers.noEmailProvided')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold block">{t('customers.totalSpentCol')}</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono-numbers text-sm">
                    {formatCurrency(totalSpent)}
                  </span>
                </div>
                {customer.notes && (
                  <div className="sm:col-span-3 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold block">{t('customers.notesLabel')}</span>
                    <p className="text-slate-700 dark:text-slate-300 text-xs italic">{customer.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveInfo} className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      {t('customers.firstNameLabel')}
                    </label>
                    <input
                      type="text"
                      value={editFirst}
                      onChange={(e) => setEditFirst(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      {t('customers.lastNameLabel')}
                    </label>
                    <input
                      type="text"
                      value={editLast}
                      onChange={(e) => setEditLast(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      {t('customers.phoneLabel')}
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      {t('customers.emailLabel')}
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    {t('customers.notesLabel')}
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Section: Membership Pass (if active or enrolled) */}
          {membership && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl space-y-2.5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-950 dark:text-white flex items-center gap-2">
                      <span>{membership.planNameSnapshot}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        membership.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {membership.status === 'active' ? t('common.active') : t('common.inactive')}
                      </span>
                    </h4>
                    <p className="text-[11px] text-blue-700 dark:text-cyan-300">
                      ID: <span className="font-mono font-bold">{membership.id}</span> · {membership.billingFrequency === 'monthly' ? t('pos.monthlyPass') : t('pos.yearlyPass')}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-blue-900 dark:text-cyan-300 font-mono">
                    {membership.remainingWashes} / {membership.includedWashes}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{t('pos.washesLeft')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-blue-200/60 dark:border-blue-800/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{t('pos.rateAtSignup')}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {formatCurrency(membership.priceAtSignup)} / {membership.billingFrequency === 'monthly' ? t('memberships.monthly') : t('memberships.yearly')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{t('pos.nextRenewal')}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {new Date(membership.nextBillingDate).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{t('pos.serviceCovered')}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {membership.includedServiceName}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Vehicles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{t('customers.savedVehiclesCount', { count: customerVehicles.length })}</span>
              </h4>

              <button
                type="button"
                onClick={() => onOpenAddVehicle(customer.id)}
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ {t('pos.addVehicle')}</span>
              </button>
            </div>

            {customerVehicles.length === 0 ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
                {t('customers.noVehiclesRegistered')}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {customerVehicles.map((v) => {
                  const isReferencedInTx = transactions.some((t) => t.vehicleId === v.id);

                  return (
                    <div
                      key={v.id}
                      className={`p-3 rounded-xl border transition-all ${
                        v.active === false
                          ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-white block">
                            {formatVehicleDescription(v)}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">
                            ID: {v.id} · {v.vehicleTypeId === 'suv_truck' ? 'SUV/Truck' : 'Car'}
                          </span>
                          {v.notes && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 italic mt-0.5">{v.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenEditVehicle(v)}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            title={t('customers.editVehicleTitle')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleVehicleActive(v)}
                            className={`text-[10px] px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                              v.active !== false
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                            }`}
                            title={
                              isReferencedInTx
                                ? t('customers.toggleActiveRecordProtected')
                                : t('customers.toggleActiveStatus')
                            }
                          >
                            {v.active !== false ? t('common.active') : t('common.inactive')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Customer Transaction History */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{t('customers.visitHistoryCount', { count: customerTransactions.length })}</span>
            </h4>

            {customerTransactions.length === 0 ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
                {t('customers.noPastTransactions')}
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">{t('transactions.receiptCol')}</th>
                      <th className="py-2.5 px-3">{t('receipt.date')}</th>
                      <th className="py-2.5 px-3">{t('receipt.vehicle')}</th>
                      <th className="py-2.5 px-3">{t('receipt.service')}</th>
                      <th className="py-2.5 px-3 text-right">{t('receipt.total')}</th>
                      <th className="py-2.5 px-3">{t('transactions.paymentCol')}</th>
                      <th className="py-2.5 px-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {customerTransactions.map((tx) => {
                      const isVoided = tx.status === 'voided';
                      const dateObj = new Date(tx.timestamp);
                      const formattedDate = dateObj.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });

                      return (
                        <tr
                          key={tx.id}
                          onClick={() => onOpenTransactionDetails(tx)}
                          className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {tx.receiptNumber}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{formattedDate}</td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                            {tx.vehicleDescriptionAtSale || tx.vehicleType.name}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {tx.service.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-right">
                            <span className={isVoided ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}>
                              {formatCurrency(tx.total)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {formatLocalizedPaymentMethod(tx.paymentMethod, t)}
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 inline" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

