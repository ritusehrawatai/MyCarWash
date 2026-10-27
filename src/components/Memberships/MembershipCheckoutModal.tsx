import React, { useState, useMemo, useEffect } from 'react';
import {
  CreditCard,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { MembershipPlan, Customer, AuthUser, CustomerMembership, Transaction } from '../../types/pos';
import { formatCurrency, generateReceiptNumber } from '../../data/constants';
import { calculateNextBillingDate, generateMembershipId } from '../../data/membershipData';
import { processCardPayment } from '../../services/paymentService';
import { useLanguage } from '../../context/LanguageContext';

interface MembershipCheckoutModalProps {
  plan: MembershipPlan | null;
  customer: Customer | null;
  user: AuthUser | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSuccess: (membership: CustomerMembership, transaction: Transaction) => void;
  existingMemberships: CustomerMembership[];
}

export const MembershipCheckoutModal: React.FC<MembershipCheckoutModalProps> = ({
  plan,
  customer,
  user,
  isOpen,
  onClose,
  onConfirmSuccess,
  existingMemberships,
}) => {
  const { t, formatDate } = useLanguage();
  // Test Card state (Transient in memory only, NEVER stored)
  const [testCardNumber, setTestCardNumber] = useState('4000 1234 5678 9010');
  const [testExpiry, setTestExpiry] = useState('12/28');
  const [testCvv, setTestCvv] = useState('123');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const customerId = customer?.id || user?.customerId || 'CUS-GUEST';

  // Find if customer currently has an active membership
  const existingActiveMembership = useMemo(() => {
    return (
      existingMemberships.find(
        (m) => m.customerId === customerId && m.status === 'active'
      ) || null
    );
  }, [existingMemberships, customerId]);

  // Confirmation gate for replacing an active membership
  const [hasConfirmedReplacement, setHasConfirmedReplacement] = useState(false);

  // Reset replacement gate whenever modal opens, customer changes, or plan changes
  useEffect(() => {
    setHasConfirmedReplacement(false);
    setErrorMessage(null);
  }, [isOpen, plan?.id, customerId]);

  if (!isOpen || !plan) return null;

  const customerName = customer
    ? `${customer.firstName} ${customer.lastName}`
    : user?.name || t('pos.guestCustomer');

  const startDate = new Date();
  const nextBillingDateStr = calculateNextBillingDate(startDate.toISOString(), plan.billingFrequency);
  const nextBillingDate = new Date(nextBillingDateStr);

  const formattedStartDate = formatDate(startDate, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedNextBillingDate = formatDate(nextBillingDate, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!testCardNumber.trim() || !testExpiry.trim() || !testCvv.trim()) {
      setErrorMessage(t('memberships.testCardDetailsRequired'));
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate test payment
      const paymentResult = await processCardPayment(plan.price, 'Credit Card', {
        cardNumber: testCardNumber,
        expiryDate: testExpiry,
        cvv: testCvv,
        simulateFailure: false,
      });

      setIsProcessing(false);

      if (!paymentResult.success) {
        setErrorMessage(paymentResult.errorMessage || t('memberships.demoPaymentFailed'));
        return;
      }

      // 1. Generate unique Membership ID
      const newMembershipId = generateMembershipId(existingMemberships);

      // 2. Create CustomerMembership record with plan snapshot
      const newMembership: CustomerMembership = {
        id: newMembershipId,
        customerId,
        customerName,
        customerEmail: customer?.email || user?.email,
        planId: plan.id,
        planNameSnapshot: plan.name,
        billingFrequency: plan.billingFrequency,
        priceAtSignup: plan.price,
        startDate: startDate.toISOString(),
        nextBillingDate: nextBillingDateStr,
        expirationDate: nextBillingDateStr,
        status: 'active',
        includedWashes: plan.includedWashes,
        remainingWashes: plan.includedWashes,
        includedServiceId: plan.includedServiceId,
        includedServiceName: plan.includedServiceName,
        addOnDiscountPercent: plan.addOnDiscountPercent,
        autoRenew: true,
        createdAt: startDate.toISOString(),
        updatedAt: startDate.toISOString(),
      };

      // 3. Create Transaction record in existing ledger
      const txId = `TX-${Date.now()}`;
      const receiptNumber = generateReceiptNumber();
      const membershipTransaction: Transaction = {
        id: txId,
        receiptNumber,
        timestamp: startDate.toISOString(),
        status: 'completed',
        customerId,
        customerNameAtSale: customerName,
        membershipId: newMembershipId,
        membershipPlanName: plan.name,
        transactionType: 'membership_signup',
        billingPeriod: plan.billingFrequency === 'monthly' ? 'Monthly' : 'Annual',
        service: {
          id: plan.includedServiceId,
          name: `${plan.name} (${plan.billingFrequency === 'monthly' ? (t('admin.metricMonthlyMembers')) : (t('admin.metricYearlyMembers'))})`,
          price: plan.price,
        },
        vehicleType: {
          id: 'membership',
          name: t('receipt.memberPass'),
          surcharge: 0,
        },
        addOns: [],
        subtotal: plan.price,
        taxRate: 0,
        taxAmount: 0,
        total: plan.price,
        paymentMethod: 'MEMBERSHIP',
        cardRef: paymentResult.maskedCard || '**** 9010',
      };

      // Wipe transient card fields
      setTestCardNumber('');
      setTestExpiry('');
      setTestCvv('');

      onConfirmSuccess(newMembership, membershipTransaction);
    } catch {
      setIsProcessing(false);
      setErrorMessage(t('memberships.unexpectedError'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in duration-150 transition-colors duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-white shadow-xs ${existingActiveMembership && !hasConfirmedReplacement ? 'bg-amber-600' : 'bg-blue-600'}`}>
              {existingActiveMembership && !hasConfirmedReplacement ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {existingActiveMembership && !hasConfirmedReplacement
                  ? 'Membership Replacement'
                  : t('memberships.confirmMembership')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {existingActiveMembership && !hasConfirmedReplacement
                  ? 'Confirmation required before changing active plan'
                  : t('memberships.reviewTerms')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: STEP 1 - Replacement Confirmation (when active membership already exists) */}
        {existingActiveMembership && !hasConfirmedReplacement ? (
          <div className="p-6 space-y-5">
            {/* Required Confirmation Callout Message */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2.5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Active Membership Replacement
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 font-medium leading-relaxed">
                    “Your existing membership will be cancelled and replaced with the new membership plan. The new plan will become active with a new charge and expiry date based on the selected plan. No further charges or renewals will occur for the cancelled plan. Are you sure you want to proceed?”
                  </p>
                </div>
              </div>
            </div>

            {/* Side-by-side Plan Impact Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Current Active Plan
                </span>
                <p className="font-extrabold text-slate-900 dark:text-white">
                  {existingActiveMembership.planNameSnapshot}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  {formatCurrency(existingActiveMembership.priceAtSignup)} / {existingActiveMembership.billingFrequency}
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold pt-1">
                  ✕ Will be cancelled upon payment
                </p>
              </div>

              <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400 block">
                  New Replacement Plan
                </span>
                <p className="font-extrabold text-blue-950 dark:text-white">
                  {plan.name}
                </p>
                <p className="text-[11px] text-blue-700 dark:text-cyan-300 font-bold">
                  {formatCurrency(plan.price)} / {plan.billingFrequency}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                  ✓ Will become active with new charge
                </p>
              </div>
            </div>

            {/* Confirm and Cancel Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => setHasConfirmedReplacement(true)}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2 - Payment and Checkout Form */
          <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
            {/* If replacing existing plan, reminder badge */}
            {existingActiveMembership && (
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-cyan-500" />
                <span>
                  Replacing <strong>{existingActiveMembership.planNameSnapshot}</strong> upon payment confirmation.
                </span>
              </div>
            )}

            {/* Plan Summary Box */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400 block">
                    {t('memberships.selectedPlan')}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                    {plan.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-blue-700 dark:text-cyan-400 font-mono-numbers block">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {plan.billingFrequency === 'monthly' ? t('memberships.perMonth') : t('memberships.perYear')}
                  </span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-blue-200/60 dark:border-blue-800/60 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{t('memberships.customerName')}:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{t('memberships.billingFrequency')}:</span>
                  <span className="font-semibold capitalize text-slate-900 dark:text-white">
                    {plan.billingFrequency === 'monthly' ? t('memberships.billingMonthly') : t('memberships.billingYearly')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{t('memberships.startDate')}:</span>
                  <span>{formattedStartDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{t('memberships.nextBillingDate')}:</span>
                  <span className="font-bold text-blue-700 dark:text-cyan-400">{formattedNextBillingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{t('memberships.includedWashes')}:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {plan.billingFrequency === 'monthly'
                      ? t('memberships.washesPerMonth', { count: plan.includedWashes, service: plan.includedServiceName })
                      : t('memberships.washesPerYear', { count: plan.includedWashes, service: plan.includedServiceName })}
                  </span>
                </div>
                {plan.addOnBenefitDescription && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t('memberships.addOnBenefit')}:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{plan.addOnBenefitDescription}</span>
                  </div>
                )}
              </div>
            </div>

            {/* DEMO PAYMENT NOTICE */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">{t('memberships.demoPaymentTitle')}:</span>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                  {t('memberships.demoPaymentNoticeDetailed')}
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl">
                {errorMessage}
              </div>
            )}

            {/* Test Card Payment Form */}
            <form onSubmit={handleProcessCheckout} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  {t('memberships.testCardNumber')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={isProcessing}
                    value={testCardNumber}
                    onChange={(e) => setTestCardNumber(e.target.value)}
                    placeholder="4000 1234 5678 9010"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    {t('memberships.expiration')}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isProcessing}
                    value={testExpiry}
                    onChange={(e) => setTestExpiry(e.target.value)}
                    placeholder="12/28"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    {t('memberships.cvv')}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isProcessing}
                    value={testCvv}
                    onChange={(e) => setTestCvv(e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Terms Preview */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                {t('memberships.termsNotice')}
              </p>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('memberships.processingPayment')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('memberships.confirmMembershipButton', { price: formatCurrency(plan.price) })}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={onClose}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
