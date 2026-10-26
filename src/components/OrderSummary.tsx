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
  Tag,
  AlertCircle,
  Wifi,
  Radio,
} from 'lucide-react';
import {
  WashService,
  VehicleType,
  AddOn,
  PaymentMethod,
  Customer,
  CustomerVehicle,
  CustomerMembership,
  WelcomePromoCode,
} from '../types/pos';
import { formatCurrency } from '../data/constants';
import { formatVehicleDescription } from '../data/customerData';
import { StripeTerminalModal } from './Terminal/StripeTerminalModal';
import { TerminalPaymentResult } from '../services/stripeTerminalService';
import { useLanguage } from '../context/LanguageContext';
import { validatePromoCodeForOrder, getEffectivePromoStatus } from '../services/promoService';

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
  onSelectPaymentMethod: (method: PaymentMethod | null) => void;
  onCompleteSale: (
    cashTendered?: number,
    changeDue?: number,
    cardRef?: string,
    isMembershipRedeemed?: boolean,
    membershipDiscount?: number,
    promoCode?: string,
    promoDiscountPercent?: number,
    promoDiscountAmount?: number,
    terminalDetails?: {
      stripePaymentIntentId?: string;
      stripeReaderId?: string;
      cardBrand?: string;
      cardLast4?: string;
      cardEntryMethod?: 'contactless' | 'chip' | 'swipe' | 'manual';
      terminalAuthCode?: string;
    }
  ) => void;
  onResetOrder: () => void;
  promoCodes?: WelcomePromoCode[];
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
  promoCodes = [],
}) => {
  const { t } = useLanguage();

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<WelcomePromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Clear or reset promo code if selected customer changes or is removed
  useEffect(() => {
    if (appliedPromo && appliedPromo.customerId !== selectedCustomer?.id) {
      setAppliedPromo(null);
      setPromoError(null);
    }
  }, [selectedCustomer, appliedPromo]);

  // Check if selected customer has an available welcome promo code
  const customerAvailablePromo = React.useMemo(() => {
    if (!selectedCustomer || !promoCodes) return null;
    return (
      promoCodes.find(
        (p) =>
          p.customerId === selectedCustomer.id &&
          getEffectivePromoStatus(p) === 'available'
      ) || null
    );
  }, [selectedCustomer, promoCodes]);

  // Calculations
  const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
  const rawSubtotal = selectedService.price + selectedVehicle.surcharge + addOnsTotal;

  // Membership Benefits Calculations
  const isMemberActive = Boolean(activeMembership && activeMembership.status === 'active');
  const isServiceEligibleForPlan = Boolean(
    activeMembership &&
    (selectedService.id === activeMembership.includedServiceId ||
      (selectedService.name &&
        activeMembership.includedServiceName &&
        selectedService.name.trim().toLowerCase() === activeMembership.includedServiceName.trim().toLowerCase()))
  );

  const canRedeemWash = Boolean(
    isMemberActive &&
    activeMembership &&
    activeMembership.remainingWashes > 0 &&
    isServiceEligibleForPlan &&
    isRedeemingMembershipWash
  );

  // If customer is actually redeeming a free membership wash, promo discount cannot be combined
  useEffect(() => {
    if (canRedeemWash && appliedPromo) {
      setAppliedPromo(null);
      setPromoError(t('promo.errorMembershipConflict'));
    }
  }, [canRedeemWash, appliedPromo, t]);

  const washDiscount = canRedeemWash ? selectedService.price : 0;

  const addOnDiscountPercent = (isMemberActive && activeMembership?.addOnDiscountPercent) || 0;
  const addOnDiscount = addOnDiscountPercent > 0
    ? Math.round(addOnsTotal * (addOnDiscountPercent / 100) * 100) / 100
    : 0;

  const totalMembershipDiscount = washDiscount + addOnDiscount;

  // Promo Discount Calculation (15% applied to subtotal before tax)
  const promoDiscountPercent = appliedPromo && !canRedeemWash ? appliedPromo.discountPercent : 0;
  const promoDiscountAmount = promoDiscountPercent > 0
    ? Math.round(rawSubtotal * (promoDiscountPercent / 100) * 100) / 100
    : 0;

  const totalDiscounts = totalMembershipDiscount + promoDiscountAmount;
  const subtotal = Math.max(0, rawSubtotal - totalDiscounts);
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = subtotal + taxAmount;

  // Membership Pass is ONLY valid as a payment tender if the customer has remaining washes,
  // the selected wash service is eligible for their enrolled plan,
  // is redeeming the wash, AND the entire order total is $0.00.
  // If remaining washes are 0, service is not covered by plan, or there is a remaining balance,
  // payment must be made via Cash or Card.
  const canPayWithMembershipPass = Boolean(
    isMemberActive &&
    activeMembership &&
    activeMembership.remainingWashes > 0 &&
    isServiceEligibleForPlan &&
    canRedeemWash &&
    total === 0
  );

  // Handler to apply promo code
  const handleApplyPromoCode = (codeToApply?: string) => {
    setPromoError(null);
    const code = (codeToApply || promoInput).trim();
    if (!code) {
      setPromoError(t('promo.errorInvalidCode'));
      return;
    }

    const validation = validatePromoCodeForOrder(
      code,
      selectedCustomer,
      promoCodes,
      {
        isRedeemingMembershipWash: canRedeemWash,
        alreadyAppliedCode: appliedPromo?.code,
      }
    );

    if (!validation.isValid) {
      setPromoError(validation.errorMessage || t('promo.errorInvalidCode'));
      return;
    }

    setAppliedPromo(validation.promoCode || null);
    setPromoInput('');
    setPromoError(null);
  };

  const handleRemovePromoCode = () => {
    setAppliedPromo(null);
    setPromoError(null);
  };

  // Synchronize paymentMethod with membership eligibility and balance
  useEffect(() => {
    // If paymentMethod is MEMBERSHIP but membership pass cannot pay (e.g. 0 washes left or balance > $0),
    // clear paymentMethod so cashier must tender via Cash or Card
    if (paymentMethod === 'MEMBERSHIP' && !canPayWithMembershipPass) {
      onSelectPaymentMethod(null);
    } else if (canPayWithMembershipPass && total === 0 && paymentMethod !== 'MEMBERSHIP') {
      // Auto-select Membership Pass if wash is 100% covered by pass with $0 balance
      onSelectPaymentMethod('MEMBERSHIP');
    }
  }, [canPayWithMembershipPass, total, paymentMethod, onSelectPaymentMethod]);

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
    if (paymentMethod === 'MEMBERSHIP' && !canPayWithMembershipPass) return;
    if (paymentMethod === 'CASH') {
      const tendered = cashTendered !== null && cashTendered >= total ? cashTendered : total;
      const change = tendered - total;
      onCompleteSale(
        tendered,
        change,
        undefined,
        canRedeemWash,
        totalMembershipDiscount,
        appliedPromo?.code,
        appliedPromo ? appliedPromo.discountPercent : undefined,
        appliedPromo ? promoDiscountAmount : undefined
      );
    } else {
      onCompleteSale(
        undefined,
        undefined,
        undefined,
        canRedeemWash,
        totalMembershipDiscount,
        appliedPromo?.code,
        appliedPromo ? appliedPromo.discountPercent : undefined,
        appliedPromo ? promoDiscountAmount : undefined
      );
    }
  };

  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);

  // Handler for card completion via Stripe Terminal in-person card reader
  const handleTerminalPaymentSuccess = (result: TerminalPaymentResult) => {
    setIsTerminalModalOpen(false);
    onCompleteSale(
      undefined,
      undefined,
      result.maskedCard,
      canRedeemWash,
      totalMembershipDiscount,
      appliedPromo?.code,
      appliedPromo ? appliedPromo.discountPercent : undefined,
      appliedPromo ? promoDiscountAmount : undefined,
      {
        stripePaymentIntentId: result.paymentIntentId,
        stripeReaderId: result.readerId,
        cardBrand: result.cardBrand,
        cardLast4: result.cardLast4,
        cardEntryMethod: result.cardEntryMethod,
        terminalAuthCode: result.terminalAuthCode,
      }
    );
  };

  const handleReset = () => {
    setAppliedPromo(null);
    setPromoError(null);
    setPromoInput('');
    setIsTerminalModalOpen(false);
    onResetOrder();
  };

  const isCardSelected = paymentMethod === 'CARD_PRESENT' || paymentMethod === 'CARD' || paymentMethod === 'DEBIT_CARD' || paymentMethod === 'CREDIT_CARD';

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
            onClick={handleReset}
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
              isServiceEligibleForPlan ? (
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
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px] uppercase tracking-wide">
                      {t('pos.planMismatchTitle')}
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
                      {t('pos.planMismatchDesc', {
                        service: activeMembership.includedServiceName || activeMembership.includedServiceId,
                      })}
                    </p>
                  </div>
                </div>
              )
            ) : (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                {t('pos.allWashesUsed')}
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

        {/* 15% Welcome Promo Discount Input Section */}
        <div className="py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Tag className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
              <span>{t('promo.title')}</span>
            </span>
            {appliedPromo && (
              <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-cyan-300 px-2 py-0.5 rounded-full">
                15% OFF
              </span>
            )}
          </div>

          {appliedPromo ? (
            <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 dark:text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                  <span className="font-mono">{appliedPromo.code}</span>
                </span>
                <button
                  type="button"
                  onClick={handleRemovePromoCode}
                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  {t('promo.removeCode')}
                </button>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {t('promo.termsNotice')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Quick 1-click apply banner if selected customer has available promo code */}
              {customerAvailablePromo && (
                <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block text-[11px] font-bold text-cyan-900 dark:text-cyan-200 truncate">
                      {t('promo.welcomeDiscountTitle')}
                    </span>
                    <span className="block font-mono text-[10px] text-cyan-700 dark:text-cyan-400 truncate">
                      {customerAvailablePromo.code}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyPromoCode(customerAvailablePromo.code)}
                    disabled={canRedeemWash}
                    className="shrink-0 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {t('promo.applyAvailableCode')}
                  </button>
                </div>
              )}

              {/* Promo input field */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value.toUpperCase());
                    if (promoError) setPromoError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyPromoCode();
                    }
                  }}
                  disabled={canRedeemWash}
                  placeholder={t('promo.enterPromoCode')}
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 dark:text-white disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => handleApplyPromoCode()}
                  disabled={canRedeemWash}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {t('promo.applyCode')}
                </button>
              </div>

              {promoError && (
                <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <span>{promoError}</span>
                </div>
              )}
            </div>
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

          {promoDiscountAmount > 0 && (
            <div className="flex justify-between text-blue-600 dark:text-cyan-400 font-semibold text-xs">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-blue-500 dark:text-cyan-400" />
                <span>{t('promo.welcomeDiscountBadge')} ({appliedPromo?.code})</span>
              </span>
              <span>-{formatCurrency(promoDiscountAmount)}</span>
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
          <div className={`grid gap-2 ${isMemberActive ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {/* MEMBERSHIP PASS (when member active) */}
            {isMemberActive && (
              <button
                type="button"
                onClick={() => {
                  if (canPayWithMembershipPass) {
                    onSelectPaymentMethod('MEMBERSHIP');
                    setCashTendered(null);
                  }
                }}
                disabled={!canPayWithMembershipPass}
                title={
                  !canPayWithMembershipPass
                    ? activeMembership?.remainingWashes === 0
                      ? t('pos.allWashesUsed')
                      : !isServiceEligibleForPlan
                      ? t('pos.planMismatchPassDisabled', {
                          service: activeMembership?.includedServiceName || 'enrolled plan service',
                        })
                      : t('pos.passOnlyForZeroBalance')
                    : undefined
                }
                className={`py-3.5 px-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all font-bold text-xs select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  !canPayWithMembershipPass
                    ? 'opacity-40 bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                    : paymentMethod === 'MEMBERSHIP'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-1 ring-blue-600 cursor-pointer'
                    : 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 hover:border-cyan-300 cursor-pointer'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${!canPayWithMembershipPass ? 'text-slate-400 dark:text-slate-600' : 'text-cyan-400'}`} />
                <span>{t('pos.membershipPass')}</span>
                {!canPayWithMembershipPass && (
                  <span className="text-[10px] font-semibold text-rose-500 dark:text-rose-400 leading-none">
                    {activeMembership?.remainingWashes === 0
                      ? t('pos.zeroWashesLeftBadge')
                      : !isServiceEligibleForPlan
                      ? t('pos.planMismatchBadge')
                      : t('pos.balanceDueBadge')}
                  </span>
                )}
              </button>
            )}

            {/* CASH */}
            <button
              type="button"
              onClick={() => onSelectPaymentMethod('CASH')}
              className={`py-3.5 px-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer font-bold text-xs select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                paymentMethod === 'CASH'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-1 ring-blue-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-750'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span>{t('pos.cash')}</span>
            </button>

            {/* PAY BY CARD (Stripe Terminal In-Person Reader) */}
            <button
              type="button"
              onClick={() => {
                onSelectPaymentMethod('CARD_PRESENT');
                setCashTendered(null);
                setIsTerminalModalOpen(true);
              }}
              className={`py-3.5 px-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer font-bold text-xs select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                paymentMethod === 'CARD_PRESENT'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-1 ring-blue-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-750'
              }`}
            >
              <div className="flex items-center gap-1">
                <CreditCard className="w-5 h-5" />
                <Wifi className="w-3.5 h-3.5 rotate-90 text-blue-400" />
              </div>
              <span>{t('pos.payByCard')}</span>
            </button>
          </div>

          {/* Card Reader Status & Launch Card (when Pay by Card is selected) */}
          {paymentMethod === 'CARD_PRESENT' && (
            <div className="mt-3 p-3.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2 text-xs">
              <div className="flex items-center justify-between text-blue-900 dark:text-blue-200 font-bold">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Stripe Terminal Physical Reader</span>
                </span>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-blue-200/80 dark:bg-blue-900 text-blue-800 dark:text-blue-300 font-extrabold">
                  Card Present
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Accepts contactless tap (Apple Pay, Google Pay, contactless cards), EMV chip, and swipe.
              </p>
              <button
                type="button"
                onClick={() => setIsTerminalModalOpen(true)}
                className="w-full mt-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse text-white" />
                <span>Prompt Customer on Card Reader — {formatCurrency(total)}</span>
              </button>
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

      {/* Action Area: Checkout Complete or Prompt */}
      <div className="mt-6 pt-2">
        {paymentMethod === 'CARD_PRESENT' ? (
          <button
            type="button"
            onClick={() => setIsTerminalModalOpen(true)}
            className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50"
          >
            <CreditCard className="w-5 h-5" />
            <span>Pay on Card Reader — {formatCurrency(total)}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : paymentMethod ? (
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

      {/* Stripe Terminal In-Person Card Reader Modal */}
      <StripeTerminalModal
        isOpen={isTerminalModalOpen}
        amountDue={total}
        service={selectedService}
        vehicleType={selectedVehicle}
        addOns={selectedAddOns}
        discountAmount={(totalMembershipDiscount || 0) + (promoDiscountAmount || 0)}
        taxRate={taxRate}
        customerName={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : undefined}
        customerPhone={selectedCustomer?.phone}
        onPaymentSuccess={handleTerminalPaymentSuccess}
        onCancel={() => setIsTerminalModalOpen(false)}
      />
    </div>
  );
};
