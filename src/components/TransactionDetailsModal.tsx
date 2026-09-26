import React, { useState } from 'react';
import {
  X,
  Printer,
  Ban,
  Car,
  Truck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Banknote,
  Layers,
  AlertTriangle,
  Lock,
  User,
  Sparkles,
} from 'lucide-react';
import { Transaction, UserRole } from '../types/pos';
import { formatCurrency, formatPaymentMethodName } from '../data/constants';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintReceipt: (transaction: Transaction) => void;
  onVoidTransaction: (transactionId: string) => void;
  userRole?: UserRole;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onPrintReceipt,
  onVoidTransaction,
  userRole = 'admin',
}) => {
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);

  if (!isOpen || !transaction) return null;

  const isVoided = transaction.status === 'voided';
  const isAdmin = userRole === 'admin';

  const dateObj = new Date(transaction.timestamp);
  const formattedDateTime = dateObj.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const handleConfirmVoid = () => {
    onVoidTransaction(transaction.id);
    setShowVoidConfirm(false);
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'DEBIT_CARD':
        return <CreditCard className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'CREDIT_CARD':
      case 'CARD':
        return <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'MEMBERSHIP':
        return <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      default:
        return <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in duration-150 transition-colors duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                {transaction.receiptNumber}
              </h3>
              {isVoided ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  <Ban className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  <span>Voided</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Completed</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span>{formattedDateTime}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Void confirmation banner if requested */}
        {showVoidConfirm && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Are you sure you want to void this transaction?</p>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  This transaction will remain in history as "Voided" and will be deducted from today's sales and payment totals. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowVoidConfirm(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-xs cursor-pointer"
              >
                Yes, Void Transaction
              </button>
            </div>
          </div>
        )}

        {/* Content Details */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Customer Profile Box (if attached or Guest) */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Customer
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {transaction.customerNameAtSale || 'Guest Customer'}
                </span>
              </div>
            </div>

            {transaction.customerId && (
              <span className="text-[11px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                {transaction.customerId}
              </span>
            )}
          </div>

          {/* Membership Pass Badge if applied */}
          {transaction.membershipPlanName && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 rounded-xl p-3 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500 shrink-0" />
                <div>
                  <span className="font-extrabold text-blue-900 dark:text-cyan-300">
                    Member Pass: {transaction.membershipPlanName}
                  </span>
                  {transaction.isMembershipWash && (
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      Included wash allocation redeemed
                    </span>
                  )}
                </div>
              </div>
              {transaction.membershipDiscount !== undefined && transaction.membershipDiscount > 0 && (
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  -{formatCurrency(transaction.membershipDiscount)}
                </span>
              )}
            </div>
          )}

          {/* Service Section */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-700 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              Wash Service
            </span>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-base">
                  {transaction.service.name}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Primary wash package</p>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-base">
                {formatCurrency(transaction.service.price)}
              </span>
            </div>
          </div>

          {/* Vehicle Section */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-700 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              Vehicle Information
            </span>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {transaction.vehicleType.id?.toLowerCase().includes('truck') ||
                  transaction.vehicleType.id?.toLowerCase().includes('suv') ? (
                    <Truck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  ) : (
                    <Car className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  )}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {transaction.vehicleDescriptionAtSale || transaction.vehicleType.name}
                  </span>
                </div>
                {transaction.vehicleDescriptionAtSale && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Category: {transaction.vehicleType.name}
                  </p>
                )}
              </div>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300 text-sm">
                {transaction.vehicleType.surcharge > 0
                  ? `+${formatCurrency(transaction.vehicleType.surcharge)} (Surcharge)`
                  : '$0.00 (Standard)'}
              </span>
            </div>
          </div>

          {/* Add-ons Section */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Optional Add-ons
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-numbers">
                {transaction.addOns.length} selected
              </span>
            </div>

            {transaction.addOns.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {transaction.addOns.map((addon) => (
                  <div key={addon.id} className="flex items-center justify-between text-xs pl-1">
                    <span className="text-slate-800 dark:text-slate-200 font-medium">+ {addon.name}</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      +{formatCurrency(addon.price)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">No add-ons purchased</p>
            )}
          </div>

          {/* Financial Breakdown */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs font-mono">
            {transaction.membershipPlanName && (
              <div className="flex justify-between items-center text-xs text-blue-700 dark:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-950/40 p-2 rounded">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-500" />
                  <span>Pass: {transaction.membershipPlanName}</span>
                </span>
                {transaction.isMembershipWash && (
                  <span className="font-bold text-[10px] bg-cyan-200 dark:bg-cyan-800 text-cyan-900 dark:text-cyan-100 px-1.5 py-0.5 rounded">
                    Included Wash
                  </span>
                )}
              </div>
            )}
            {transaction.membershipDiscount !== undefined && transaction.membershipDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Member Savings:</span>
                <span>-{formatCurrency(transaction.membershipDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="text-slate-900 dark:text-slate-200">{formatCurrency(transaction.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tax ({(transaction.taxRate * 100).toFixed(2)}%)</span>
              <span className="text-slate-900 dark:text-slate-200">{formatCurrency(transaction.taxAmount)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline font-bold text-base text-slate-900 dark:text-white">
              <span className="font-sans">Total</span>
              <span className={isVoided ? 'line-through text-slate-400 dark:text-slate-500' : 'text-blue-600 dark:text-blue-400'}>
                {formatCurrency(transaction.total)}
              </span>
            </div>

            {transaction.paymentMethod === 'CASH' && transaction.cashTendered !== undefined && (
              <div className="pt-1.5 mt-1 border-t border-dashed border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Cash Tendered:</span>
                  <span className="text-slate-900 dark:text-white">{formatCurrency(transaction.cashTendered)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>Change Due:</span>
                  <span>{formatCurrency(transaction.changeDue || 0)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method & Status */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-700 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Payment Method
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                {getPaymentIcon(transaction.paymentMethod)}
                <span>{formatPaymentMethodName(transaction.paymentMethod)}</span>
                {transaction.cardRef && (
                  <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    ({transaction.cardRef})
                  </span>
                )}
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Transaction Status
              </span>
              <span
                className={`font-bold ${isVoided ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}
              >
                {isVoided ? 'Voided' : 'Completed'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Void button area */}
          <div>
            {!isVoided ? (
              isAdmin ? (
                <button
                  type="button"
                  onClick={() => setShowVoidConfirm(true)}
                  disabled={showVoidConfirm}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Void Transaction</span>
                </button>
              ) : (
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Admin role required to void</span>
                </div>
              )
            ) : (
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <Ban className="w-3.5 h-3.5" />
                <span>Transaction is already voided</span>
              </span>
            )}
          </div>

          {/* Right action buttons: Print & Close */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onPrintReceipt(transaction)}
              className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
