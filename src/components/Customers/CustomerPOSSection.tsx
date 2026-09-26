import React from 'react';
import { User, UserPlus, Search, Car, Plus, X, Check, Sparkles } from 'lucide-react';
import { Customer, CustomerVehicle, POSVehicleType, CustomerMembership } from '../../types/pos';
import { formatVehicleDescription } from '../../data/customerData';
import { useLanguage } from '../../context/LanguageContext';

interface CustomerPOSSectionProps {
  selectedCustomer: Customer | null;
  selectedCustomerVehicle: CustomerVehicle | null;
  customerVehicles: CustomerVehicle[];
  activeMembership?: CustomerMembership | null;
  onOpenFindCustomer: () => void;
  onOpenNewCustomer: () => void;
  onOpenAddVehicle: () => void;
  onSelectCustomerVehicle: (vehicle: CustomerVehicle) => void;
  onClearCustomer: () => void;
  onClearCustomerVehicle: () => void;
  vehicleTypes: POSVehicleType[];
}

export const CustomerPOSSection: React.FC<CustomerPOSSectionProps> = ({
  selectedCustomer,
  selectedCustomerVehicle,
  customerVehicles,
  activeMembership,
  onOpenFindCustomer,
  onOpenNewCustomer,
  onOpenAddVehicle,
  onSelectCustomerVehicle,
  onClearCustomer,
  onClearCustomerVehicle,
  vehicleTypes,
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-3 transition-colors duration-200">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
              {t('pos.customerAndVehicle')} ({t('pos.optionalBadge')})
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('pos.customerHelp')}
            </p>
          </div>
        </div>

        {/* Guest Status Indicator */}
        {!selectedCustomer && !selectedCustomerVehicle && (
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
            {t('pos.guestCustomer')}
          </span>
        )}
      </div>

      {/* When NO customer is selected */}
      {!selectedCustomer && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Continue as Guest indicator / button */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('pos.guestCustomer')}</span>
          </div>

          {/* Find Customer Button */}
          <button
            type="button"
            onClick={onOpenFindCustomer}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t('pos.findCustomer')}</span>
          </button>

          {/* Add Customer Button */}
          <button
            type="button"
            onClick={onOpenNewCustomer}
            className="px-3.5 py-2 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t('pos.newCustomer')}</span>
          </button>

          {/* Add Standalone Vehicle Button (No Customer Profile Needed) */}
          {!selectedCustomerVehicle && (
            <button
              type="button"
              onClick={onOpenAddVehicle}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <Car className="w-3.5 h-3.5" />
              <span>{t('pos.addVehicle')}</span>
            </button>
          )}
        </div>
      )}

      {/* When Standalone Vehicle is attached without customer */}
      {!selectedCustomer && selectedCustomerVehicle && (
        <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  {formatVehicleDescription(selectedCustomerVehicle)}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                  {t('pos.standardVehicle')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('customers.categoryLabel')}:{' '}
                {vehicleTypes.find((vt) => vt.id === selectedCustomerVehicle.vehicleTypeId)?.name ||
                  'Car'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClearCustomerVehicle}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t('pos.clearVehicle')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* When Customer IS selected */}
      {selectedCustomer && (
        <div className="space-y-3 pt-1">
          {/* Customer Badge Row */}
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {selectedCustomer.firstName[0] || 'C'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {selectedCustomer.id}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  {selectedCustomer.phone && <span>{selectedCustomer.phone}</span>}
                  {selectedCustomer.email && (
                    <span className="hidden sm:inline text-slate-400 dark:text-slate-500">· {selectedCustomer.email}</span>
                  )}
                  {selectedCustomer.notes && (
                    <span className="hidden md:inline italic text-slate-500 dark:text-slate-400">· "{selectedCustomer.notes}"</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenFindCustomer}
                className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {t('common.edit')}
              </button>
              <button
                type="button"
                onClick={onClearCustomer}
                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={t('pos.clearCustomer')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Membership Badge */}
          {activeMembership && activeMembership.status === 'active' && (
            <div className="p-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-blue-600 text-white shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="font-extrabold text-blue-900 dark:text-cyan-300">
                    {t('customers.activeMemberBadge')} · {activeMembership.planNameSnapshot}
                  </span>
                  <span className="hidden sm:inline text-slate-500 dark:text-slate-400 ml-1.5">
                    ({activeMembership.billingFrequency === 'monthly' ? t('dashboard.monthlyPass') : t('dashboard.yearlyPass')})
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[11px] border border-emerald-300 dark:border-emerald-800">
                {t('pos.washesLeftOf', { remaining: activeMembership.remainingWashes, total: activeMembership.includedWashes })}
              </span>
            </div>
          )}

          {/* Vehicle Dropdown / Selector for this customer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 flex-1">
              <Car className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {t('receipt.vehicle')}:
              </span>

              {customerVehicles.length > 0 ? (
                <select
                  value={selectedCustomerVehicle?.id || ''}
                  onChange={(e) => {
                    const found = customerVehicles.find((v) => v.id === e.target.value);
                    if (found) onSelectCustomerVehicle(found);
                  }}
                  className="w-full sm:w-auto flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  {customerVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {formatVehicleDescription(v)}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400 italic">{t('dashboard.noVehiclesRegistered')}</span>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenAddVehicle}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('dashboard.addVehicleButton')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
