import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Calendar,
  X,
  Sparkles,
} from 'lucide-react';
import { MembershipPlan, Customer, AuthUser, CustomerMembership, Transaction } from '../../types/pos';
import { formatCurrency, generateReceiptNumber } from '../../data/constants';
import { calculateNextBillingDate, generateMembershipId } from '../../data/membershipData';
import { processCardPayment } from '../../services/paymentService';

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
  // Test Card state (Transient in memory only, NEVER stored)
  const [testCardNumber, setTestCardNumber] = useState('4000 1234 5678 9010');
  const [testExpiry, setTestExpiry] = useState('12/28');
  const [testCvv, setTestCvv] = useState('123');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !plan) return null;

  const customerName = customer
    ? `${customer.firstName} ${customer.lastName}`
    : user?.name || 'Valued Customer';
  const customerId = customer?.id || user?.customerId || 'CUS-GUEST';

  const startDate = new Date();
  const nextBillingDateStr = calculateNextBillingDate(startDate.toISOString(), plan.billingFrequency);
  const nextBillingDate = new Date(nextBillingDateStr);

  const formattedStartDate = startDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedNextBillingDate = nextBillingDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!testCardNumber.trim() || !testExpiry.trim() || !testCvv.trim()) {
      setErrorMessage('Please enter valid test card details.');
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
        setErrorMessage(paymentResult.errorMessage || 'Demo payment failed.');
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
          name: `${plan.name} (${plan.billingFrequency === 'monthly' ? 'Monthly' : 'Yearly'})`,
          price: plan.price,
        },
        vehicleType: {
          id: 'membership',
          name: 'Membership Pass',
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
      setErrorMessage('Unexpected error during payment processing. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in duration-150 transition-colors duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Confirm Membership
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review terms and activate your wash pass
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

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Plan Summary Box */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400 block">
                  Selected Plan
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
                  /{plan.billingFrequency}
                </span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-blue-200/60 dark:border-blue-800/60 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Customer Name:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Billing Frequency:</span>
                <span className="font-semibold capitalize text-slate-900 dark:text-white">{plan.billingFrequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Start Date:</span>
                <span>{formattedStartDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Next Billing Date:</span>
                <span className="font-bold text-blue-700 dark:text-cyan-400">{formattedNextBillingDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Included Washes:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {plan.includedWashes} {plan.includedServiceName}s / month
                </span>
              </div>
              {plan.addOnBenefitDescription && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Add-on Benefit:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{plan.addOnBenefitDescription}</span>
                </div>
              )}
            </div>
          </div>

          {/* DEMO PAYMENT NOTICE */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">DEMO PAYMENT:</span>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                This is a simulation checkout. Do not enter real credit or debit card details.
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
                Test Card Number
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
                  Expiration
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
                  CVV
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
              By confirming, you agree to the Membership terms. You can cancel your membership anytime in your customer account.
            </p>

            {/* Buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing payment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Membership — {formatCurrency(plan.price)}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={onClose}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
