import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Banknote,
  Layers,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Car,
  Truck,
  PlusCircle,
  Receipt,
  User,
  Sparkles,
} from 'lucide-react';
import { WashService, VehicleType, AddOn, PaymentMethod, Customer, CustomerVehicle, CustomerMembership } from '../types/pos';
import { formatCurrency } from '../data/constants';
import { formatVehicleDescription } from '../data/customerData';
import { CardPaymentPanel } from './CardPaymentPanel';
import { useLanguage } from '../context/LanguageContext';

interface OrderSummaryProps {
  selectedService: WashService;
  selectedVehicle: VehicleType;
  selectedAddOns: AddOn[];
  selectedCustomer?: Customer | null;
  selectedCustomerVehicle?: CustomerVehicle | null;
  activeMembership?: CustomerMembership | null;
  isRedeemingMembershipWash?: boolean;
  onToggleRedeemMembershipWash?: (redeem: boolean) => void;
  taxRate: number;
  paymentMethod: PaymentMethod | null;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  onCompleteSale: (
    cashTendered?: number,
    changeDue?: number,
    cardRef?: string,
    isMembershipRedeemed?: boolean,
    membershipDiscount?: number
  ) => void;
  onResetOrder: () => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  selectedService,
  selectedVehicle,
  selectedAddOns,
  selectedCustomer,
  selectedCustomerVehicle,
  activeMembership,
  isRedeemingMembershipWash = false,
  onToggleRedeemMembershipWash,
  taxRate,
  paymentMethod,
  onSelectPaymentMethod,
  onCompleteSale,
  onResetOrder,
}) => {
  const { t } = useLanguage();

  // Calculations
  const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
  const rawSubtotal = selectedService.price + selectedVehicle.surcharge + addOnsTotal;

  // Membership Benefits Calculations
  const isMemberActive = Boolean(activeMembership && activeMembership.status === 'active');
  const canRedeemWash = Boolean(
    isMemberActive &&
    activeMembership &&
    activeMembership.remainingWashes > 0 &&
    isRedeemingMembershipWash
  );

  const washDiscount = canRedeemWash ? selectedService.price : 0;

  const addOnDiscountPercent = (isMemberActive && activeMembership?.addOnDiscountPercent) || 0;
  const addOnDiscount = addOnDiscountPercent > 0
    ? Math.round(addOnsTotal * (addOnDiscountPercent / 100) * 100) / 100
    : 0;

  const totalMembershipDiscount = washDiscount + addOnDiscount;
  const subtotal = Math.max(0, rawSubtotal - totalMembershipDiscount);
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = subtotal + taxAmount;

  // Automatically select MEMBERSHIP payment method if total is $0.00
  useEffect(() => {
    if (total === 0 && canRedeemWash && paymentMethod !== 'MEMBERSHIP') {
      onSelectPaymentMethod('MEMBERSHIP');
    }
  }, [total, canRedeemWash, paymentMethod, onSelectPaymentMethod]);

  // Cash tender helpers
  const [cashTendered, setCashTendered] = useState<number | null>(null);

  // Quick tender suggestions (Exact, round tens above total)
  const quickBills = React.useMemo(() => {
    const suggestions = new Set<number>();
    suggestions.add(total);
    const ceilTen = Math.ceil(total / 10) * 10;
    if (ceilTen > total) suggestions.add(ceilTen);
    if (ceilTen + 10 > total) suggestions.add(ceilTen + 10);
    if (total <= 20) suggestions.add(20);
    if (total <= 50) suggestions.add(50);
    if (total <= 100) suggestions.add(100);
    return Array.from(suggestions).sort((a, b) => a - b).slice(0, 4);
  }, [total]);

  const changeDue = cashTendered !== null && cashTendered >= total ? cashTendered - total : 0;

  // Handler for cash / other / membership complete
  const handleCompleteNonCard = () => {
    if (!paymentMethod) return;
    if (paymentMethod === 'CASH') {
      const tendered = cashTendered !== null && cashTendered >= total ? cashTendered : total;
      const change = tendered - total;
      onCompleteSale(tendered, change, undefined, canRedeemWash, totalMembershipDiscount);
    } else {
      onCompleteSale(undefined, undefined, undefined, canRedeemWash, totalMembershipDiscount);
    }
  };

  // Handler for card completion from CardPaymentPanel
  const handleCardPaymentSuccess = (maskedCard?: string) => {
    onCompleteSale(undefined, undefined, maskedCard, canRedeemWash, totalMembershipDiscount);
  };

  const isCardSelected = paymentMethod === 'DEBIT_CARD' || paymentMethod === 'CREDIT_CARD';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-5 sm:p-6 flex flex-col justify-between h-full transition-colors duration-200">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('pos.currentOrder')}</h2>
          </div>
          <button
            type="button"
            onClick={onResetOrder}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title={t('pos.resetDefault')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('common.reset')}</span>
          </button>
        </div>

        {/* Customer & Vehicle Info Snapshot if attached */}
        {(selectedCustomer || selectedCustomerVehicle) && (
          <div className="py-2.5 px-3 my-2 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 rounded-xl text-xs space-y-1">
            {selectedCustomer && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                  <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{selectedCustomer.firstName} {selectedCustomer.lastName}</span>
                </span>
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{selectedCustomer.id}</span>
              </div>
            )}
            {selectedCustomerVehicle && (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] truncate">
                <Car className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{formatVehicleDescription(selectedCustomerVehicle)}</span>
              </div>
            )}
          </div>
        )}

        {/* Active Member Benefits & Wash Redemption Box */}
        {isMemberActive && activeMembership && (
          <div className="p-3 my-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span>{activeMembership.planNameSnapshot}</span>
              </div>
              <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {t('pos.washesLeftOf', { remaining: activeMembership.remainingWashes, total: activeMembership.includedWashes })}
              </span>
            </div>

            {activeMembership.remainingWashes > 0 ? (
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRedeemingMembershipWash}
                  onChange={(e) => onToggleRedeemMembershipWash?.(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
                />
                <span>{t('pos.redeemMembershipWash')}</span>
              </label>
            ) : (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                {t('dashboard.noMembershipUsages')}
              </p>
            )}

            {addOnDiscountPercent > 0 && selectedAddOns.length > 0 && (
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-between">
                <span>{t('pos.addOnDiscountApplied', { percent: addOnDiscountPercent })}:</span>
                <span>-{formatCurrency(addOnDiscount)}</span>
              </div>
            )}
          </div>
        )}

        {/* Itemized breakdown */}
        <div className="py-4 space-y-3 border-b border-slate-100 dark:border-slate-800">
          {/* Wash Service */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedService.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.typeWash')}</p>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono-numbers">
              {formatCurrency(selectedService.price)}
            </span>
          </div>

          {/* Vehicle Type */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1.5">
              {selectedVehicle.id?.toLowerCase().includes('truck') ||
              selectedVehicle.id?.toLowerCase().includes('suv') ||
              selectedVehicle.name?.toLowerCase().includes('truck') ||
              selectedVehicle.name?.toLowerCase().includes('suv') ? (
                <Truck className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              ) : (
                <Car className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              )}
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {t('customers.categoryLabel')}: <strong className="text-slate-900 dark:text-white">{selectedVehicle.name}</strong>
              </span>
            </div>
            <span className="text-sm text-slate-700 dark:text-slate-300 font-mono-numbers">
              {selectedVehicle.surcharge > 0 ? (
                `+${formatCurrency(selectedVehicle.surcharge)}`
              ) : (
                <span className="text-slate-400 dark:text-slate-500">$0.00</span>
              )}
            </span>
          </div>

          {/* Add-ons */}
          {selectedAddOns.length > 0 ? (
            <div className="space-y-1.5 pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {t('receipt.addOns')} ({selectedAddOns.length}):
              </span>
              {selectedAddOns.map((addon) => (
                <div key={addon.id} className="flex items-center justify-between pl-2">
                  <div className="flex items-center gap-1.5">
                    <PlusCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-slate-700 dark:text-slate-300">{addon.name}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900 dark:text-white font-mono-numbers">
                    +{formatCurrency(addon.price)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">{t('pos.noAddOnsSelected')}</p>
          )}
        </div>

        {/* Pricing Math */}
        <div className="py-4 space-y-2 border-b border-slate-100 dark:border-slate-800 font-mono-numbers text-sm">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>{t('common.subtotal')}</span>
            <span className="text-slate-900 dark:text-slate-200">{formatCurrency(rawSubtotal)}</span>
          </div>

          {washDiscount > 0 && (
            <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-500" />
                <span>{t('receipt.memberPass')}</span>
              </span>
              <span>-{formatCurrency(washDiscount)}</span>
            </div>
          )}

          {addOnDiscount > 0 && (
            <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
              <span>{t('pos.addOnDiscountApplied', { percent: addOnDiscountPercent })}</span>
              <span>-{formatCurrency(addOnDiscount)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>{t('common.tax')} ({(taxRate * 100).toFixed(2)}%)</span>
            <span className="text-slate-900 dark:text-slate-200">{formatCurrency(taxAmount)}</span>
          </div>

          <div className="pt-2 flex justify-between items-baseline border-t border-slate-200 dark:border-slate-800">
            <span className="text-base font-bold text-slate-900 dark:text-white font-sans">{t('common.total')}</span>
            <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="pt-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              {t('pos.selectPaymentMethod')}
            </label>
            {total === 0 && canRedeemWash && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{t('pos.washCoveredByPass')}</span>
              </span>
            )}
          </div>
          <div className={`grid gap-2 ${isMemberActive ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
            {/* MEMBERSHIP (when member active) */}
            {isMemberActive && (
              <button
                type="button"
                onClick={() => {
                  onSelectPaymentMethod('MEMBERSHIP');
                  setCashTendered(null);
                }}
                className={`py-3 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer font-bold text-xs select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  paymentMethod === 'MEMBERSHIP'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-1 ring-blue-600'
                    : 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 hover:border-cyan-300'
                }`}
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>{t('pos.membershipPass')}</span>
              </button>
            )}

            {/* CASH */}
            <button
              type="button"
              onClick={() => onSelectPaymentMethod('CASH')}
              className={`py-3 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer font-bold text-xs select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                paymentMethod === 'CASH'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-1 ring-blue-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-750'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>{t('pos.cash')}</span>
            </button>

            {/* DEBIT CARD */}
            <button
              type="button"
              onClick={() => {
                onSelectPaymentMethod('DEBIT_CARD');
                setCashTendered(null);
              }}
              className={`py-3 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer font-bold text-xs select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                paymentMethod === 'DEBIT_CARD'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-1 ring-blue-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-750'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>{t('pos.debitCard')}</span>
            </button>

            {/* CREDIT CARD */}
            <button
              type="button"
              onClick={() => {
                onSelectPaymentMethod('CREDIT_CARD');
                setCashTendered(null);
              }}
              className={`py-3 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer font-bold text-xs select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                paymentMethod === 'CREDIT_CARD'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-1 ring-blue-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-750'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>{t('pos.creditCard')}</span>
            </button>

            {/* OTHER */}
            <button
              type="button"
              onClick={() => {
                onSelectPaymentMethod('OTHER');
                setCashTendered(null);
              }}
              className={`py-3 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer font-bold text-xs select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                paymentMethod === 'OTHER'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-1 ring-blue-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-750'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t('pos.other')}</span>
            </button>
          </div>

          {/* Card Payment Panel (when Debit or Credit Card is selected) */}
          {isCardSelected && (
            <div className="mt-3">
              <CardPaymentPanel
                cardType={paymentMethod === 'DEBIT_CARD' ? t('pos.debitCard') : t('pos.creditCard')}
                amountDue={total}
                onPaymentSuccess={handleCardPaymentSuccess}
                onCancel={() => {
                  onSelectPaymentMethod('CASH');
                }}
              />
            </div>
          )}

          {/* Cash Tender Helper (only when CASH is selected) */}
          {paymentMethod === 'CASH' && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-medium">
                <span>{t('pos.cashTendered')}:</span>
                {cashTendered !== null && cashTendered >= total && (
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono-numbers">
                    {t('pos.changeDue')}: {formatCurrency(changeDue)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickBills.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setCashTendered(amount)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors font-mono-numbers cursor-pointer ${
                      cashTendered === amount
                        ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {amount === total ? t('pos.exactAmount') : `$${amount}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Area: Non-card payment complete or prompt */}
      {!isCardSelected && (
        <div className="mt-6 pt-2">
          {paymentMethod ? (
            <button
              type="button"
              onClick={handleCompleteNonCard}
              className="w-full py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{t('pos.completeSale')} — {formatCurrency(total)}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-full py-3.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-center text-sm font-semibold flex items-center justify-center gap-2 select-none">
              <span>{t('pos.selectPaymentMethod')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
