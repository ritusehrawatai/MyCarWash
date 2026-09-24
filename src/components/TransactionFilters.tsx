import React from 'react';
import { Search, X, Calendar, Filter } from 'lucide-react';
import { PaymentMethod, TransactionStatus } from '../types/pos';

export type DateFilterOption = 'all' | 'today' | 'yesterday' | 'week' | 'custom';
export type PaymentFilterOption = 'ALL' | PaymentMethod;
export type StatusFilterOption = 'ALL' | TransactionStatus;

interface TransactionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateFilter: DateFilterOption;
  onDateFilterChange: (option: DateFilterOption) => void;
  customDate: string;
  onCustomDateChange: (date: string) => void;
  paymentFilter: PaymentFilterOption;
  onPaymentFilterChange: (option: PaymentFilterOption) => void;
  statusFilter: StatusFilterOption;
  onStatusFilterChange: (option: StatusFilterOption) => void;
  onResetFilters: () => void;
  activeFilterCount: number;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  customDate,
  onCustomDateChange,
  paymentFilter,
  onPaymentFilterChange,
  statusFilter,
  onStatusFilterChange,
  onResetFilters,
  activeFilterCount,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
      {/* Search Input Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search transactions (receipt #, service, vehicle, payment)..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-slate-900 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filters ({activeFilterCount})</span>
          </button>
        )}
      </div>

      {/* Filter Controls Row */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Date Range</span>
          </label>
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'week', label: 'This Week' },
                { id: 'custom', label: 'Custom' },
                { id: 'all', label: 'All' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onDateFilterChange(opt.id)}
                className={`flex-1 min-w-[50px] py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap text-center ${
                  dateFilter === opt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Custom Date Picker */}
          {dateFilter === 'custom' && (
            <div className="pt-1.5">
              <input
                type="date"
                value={customDate}
                onChange={(e) => onCustomDateChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono-numbers focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}
        </div>

        {/* Payment Method Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Payment Method</span>
          </label>
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl">
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'CASH', label: 'Cash' },
                { id: 'CARD', label: 'Card' },
                { id: 'OTHER', label: 'Other' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onPaymentFilterChange(opt.id)}
                className={`flex-1 min-w-[50px] py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap text-center ${
                  paymentFilter === opt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Status</span>
          </label>
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl">
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'completed', label: 'Completed' },
                { id: 'voided', label: 'Voided' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onStatusFilterChange(opt.id)}
                className={`flex-1 min-w-[50px] py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap text-center ${
                  statusFilter === opt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
