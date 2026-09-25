import React from 'react';
import {
  Banknote,
  CreditCard,
  Layers,
  Car,
  Truck,
  CheckCircle2,
  Ban,
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { Transaction } from '../types/pos';
import { formatCurrency, formatPaymentMethodName } from '../data/constants';

interface TransactionsTableProps {
  transactions: Transaction[];
  onSelectTransaction: (transaction: Transaction) => void;
  onStartNewWash: () => void;
  hasFiltersActive: boolean;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  onSelectTransaction,
  onStartNewWash,
  hasFiltersActive,
}) => {
  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <Banknote className="w-3.5 h-3.5 text-emerald-600" />;
      case 'DEBIT_CARD':
        return <CreditCard className="w-3.5 h-3.5 text-sky-600" />;
      case 'CREDIT_CARD':
      case 'CARD':
        return <CreditCard className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'voided') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <Ban className="w-3 h-3 text-rose-600" />
          <span>Voided</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>Completed</span>
      </span>
    );
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 sm:p-14 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="max-w-sm space-y-1">
          <h3 className="text-lg font-bold text-slate-900">
            {hasFiltersActive ? 'No matching transactions found' : 'No transactions yet'}
          </h3>
          <p className="text-xs text-slate-700">
            {hasFiltersActive
              ? 'Try adjusting your search query, date range, or status filters.'
              : 'Complete your first walk-in car wash sale on the POS screen to record a transaction.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onStartNewWash}
          className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Start New Wash</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Desktop / Large Tablet: POS Data Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase font-bold tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Receipt #</th>
              <th className="py-3.5 px-3">Date</th>
              <th className="py-3.5 px-3">Time</th>
              <th className="py-3.5 px-4">Service</th>
              <th className="py-3.5 px-3">Vehicle</th>
              <th className="py-3.5 px-4">Add-ons</th>
              <th className="py-3.5 px-4 text-right">Total</th>
              <th className="py-3.5 px-4">Payment</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const isVoided = tx.status === 'voided';
              const dateObj = new Date(tx.timestamp);
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const formattedTime = dateObj.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });

              return (
                <tr
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className={`group transition-colors cursor-pointer select-none ${
                    isVoided
                      ? 'bg-rose-50/20 hover:bg-rose-50/40 text-slate-600'
                      : 'hover:bg-blue-50/40 text-slate-800'
                  }`}
                >
                  {/* Receipt # */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {tx.receiptNumber}
                  </td>

                  {/* Date */}
                  <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                    {formattedDate}
                  </td>

                  {/* Time */}
                  <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                    {formattedTime}
                  </td>

                  {/* Service */}
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">{tx.service.name}</span>
                    <span className="text-slate-600 block text-[10px] font-mono">
                      {formatCurrency(tx.service.price)}
                    </span>
                  </td>

                  {/* Vehicle */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                      {tx.vehicleType.id === 'suv_truck' ? (
                        <Truck className="w-3.5 h-3.5 text-slate-700" />
                      ) : (
                        <Car className="w-3.5 h-3.5 text-slate-700" />
                      )}
                      <span>{tx.vehicleType.name}</span>
                    </span>
                  </td>

                  {/* Add-ons */}
                  <td className="py-3 px-4 max-w-[180px]">
                    {tx.addOns.length > 0 ? (
                      <div className="truncate text-slate-700" title={tx.addOns.map((a) => a.name).join(', ')}>
                        {tx.addOns.map((a) => a.name).join(', ')}
                      </div>
                    ) : (
                      <span className="text-slate-600 italic">None</span>
                    )}
                  </td>

                  {/* Total */}
                  <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-sm">
                    <span
                      className={
                        isVoided
                          ? 'line-through text-slate-600'
                          : 'text-slate-900 group-hover:text-blue-600'
                      }
                    >
                      {formatCurrency(tx.total)}
                    </span>
                  </td>

                  {/* Payment */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                      {getPaymentIcon(tx.paymentMethod)}
                      <span>{formatPaymentMethodName(tx.paymentMethod)}</span>
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {getStatusBadge(tx.status || 'completed')}
                  </td>

                  {/* Arrow */}
                  <td className="py-3 px-3 text-right">
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all inline" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile / Small Screens: Clean POS Cards */}
      <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
        {transactions.map((tx) => {
          const isVoided = tx.status === 'voided';
          const dateObj = new Date(tx.timestamp);
          const formattedDate = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          const formattedTime = dateObj.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });

          return (
            <div
              key={tx.id}
              onClick={() => onSelectTransaction(tx)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none space-y-2.5 ${
                isVoided
                  ? 'bg-rose-50/30 border-rose-200'
                  : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 shadow-xs'
              }`}
            >
              {/* Card Header: Receipt # and Status */}
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-slate-900">
                  {tx.receiptNumber}
                </span>
                {getStatusBadge(tx.status || 'completed')}
              </div>

              {/* Service & Total */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{tx.service.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 mt-0.5">
                    {tx.vehicleType.id === 'suv_truck' ? (
                      <Truck className="w-3.5 h-3.5 text-slate-700" />
                    ) : (
                      <Car className="w-3.5 h-3.5 text-slate-700" />
                    )}
                    <span>{tx.vehicleType.name}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-lg font-extrabold font-mono ${
                      isVoided ? 'line-through text-slate-600' : 'text-blue-600'
                    }`}
                  >
                    {formatCurrency(tx.total)}
                  </span>
                </div>
              </div>

              {/* Add-ons list if any */}
              {tx.addOns.length > 0 && (
                <p className="text-xs text-slate-700 line-clamp-1">
                  Add-ons: <span className="font-medium">{tx.addOns.map((a) => a.name).join(', ')}</span>
                </p>
              )}

              {/* Card Footer: Timestamp and Payment */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-600" />
                    <span>{formattedDate}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span>{formattedTime}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-semibold">
                  {getPaymentIcon(tx.paymentMethod)}
                  <span>{formatPaymentMethodName(tx.paymentMethod)}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 ml-1" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
