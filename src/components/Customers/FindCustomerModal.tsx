import React, { useState } from 'react';
import { Search, X, User, Phone, Mail, Car, ChevronRight, UserPlus, Sparkles } from 'lucide-react';
import { Customer, CustomerVehicle, CustomerMembership } from '../../types/pos';
import { useLanguage } from '../../context/LanguageContext';

interface FindCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onOpenNewCustomer: () => void;
  customers: Customer[];
  vehicles: CustomerVehicle[];
  memberships?: CustomerMembership[];
}

export const FindCustomerModal: React.FC<FindCustomerModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  onOpenNewCustomer,
  customers,
  vehicles,
  memberships = [],
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filter customers by name, phone, or email
  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const id = c.id.toLowerCase();

    // Also search vehicles of this customer (e.g. license plate or model)
    const custVehicles = vehicles.filter((v) => v.customerId === c.id);
    const vehicleMatch = custVehicles.some(
      (v) =>
        (v.licensePlate && v.licensePlate.toLowerCase().includes(query)) ||
        (v.make && v.make.toLowerCase().includes(query)) ||
        (v.model && v.model.toLowerCase().includes(query))
    );

    return fullName.includes(query) || phone.includes(query) || email.includes(query) || id.includes(query) || vehicleMatch;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in duration-150 flex flex-col max-h-[85vh] transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">{t('pos.findCustomer')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('customers.searchPlaceholder')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Add Customer shortcut */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('customers.searchPlaceholder')}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenNewCustomer();
            }}
            className="px-3 py-2 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ {t('common.actions')}</span>
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800 space-y-1">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <User className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('customers.noTransactionsYet')}</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewCustomer();
                }}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
              >
                {t('customers.addCustomerButton')}
              </button>
            </div>
          ) : (
            filteredCustomers.map((c) => {
              const custVehicles = vehicles.filter((v) => v.customerId === c.id && v.active !== false);

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectCustomer(c);
                    onClose();
                  }}
                  className="p-3 rounded-xl hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">
                        {c.firstName} {c.lastName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {c.id}
                      </span>
                      {(() => {
                        const activeMem = memberships.find((m) => m.customerId === c.id && m.status === 'active');
                        if (!activeMem) return null;
                        return (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                            <Sparkles className="w-3 h-3 text-cyan-500" />
                            <span>{activeMem.planNameSnapshot} ({activeMem.remainingWashes} left)</span>
                          </span>
                        );
                      })()}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </span>
                      )}
                      {c.email && (
                        <span className="flex items-center gap-1 hidden sm:inline-flex">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{c.email}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                        <Car className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>
                          {custVehicles.length} {custVehicles.length === 1 ? 'vehicle' : 'vehicles'}
                        </span>
                      </span>
                    </div>

                    {/* Vehicles preview chips */}
                    {custVehicles.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {custVehicles.map((v) => (
                          <span
                            key={v.id}
                            className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md font-mono"
                          >
                            {v.year} {v.make} {v.model} {v.licensePlate ? `[${v.licensePlate}]` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-700 dark:text-slate-200 shadow-xs">
                      {t('common.confirm')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
