import React, { useState } from 'react';
import {
  CreditCard,
  AlertTriangle,
  RotateCcw,
  XCircle,
  HelpCircle,
  Loader2,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency } from '../data/constants';
import { processCardPayment } from '../services/paymentService';

interface CardPaymentPanelProps {
  cardType: 'Debit Card' | 'Credit Card';
  amountDue: number;
  onPaymentSuccess: (maskedCard?: string) => void;
  onCancel: () => void;
}

export const CardPaymentPanel: React.FC<CardPaymentPanelProps> = ({
  cardType,
  amountDue,
  onPaymentSuccess,
  onCancel,
}) => {
  // Test fields state (purely transient in component memory, NEVER stored)
  const [testCardNumber, setTestCardNumber] = useState('');
  const [testExpiry, setTestExpiry] = useState('');
  const [testCvv, setTestCvv] = useState('');
  const [simulateFailure, setSimulateFailure] = useState(false);

  // Processing & Error states
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentFailed, setPaymentFailed] = useState(false);

  // Quick autofill presets for demo testing
  const handleApplyPreset = (type: 'valid' | 'declined') => {
    setErrorMessage(null);
    setPaymentFailed(false);
    if (type === 'valid') {
      setTestCardNumber('4000 1234 5678 9010');
      setTestExpiry('12/28');
      setTestCvv('123');
      setSimulateFailure(false);
    } else {
      setTestCardNumber('4000 0000 0000 0000');
      setTestExpiry('05/27');
      setTestCvv('999');
      setSimulateFailure(true);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPaymentFailed(false);

    // Initial check
    if (!testCardNumber.trim() || !testExpiry.trim() || !testCvv.trim()) {
      setErrorMessage('Please enter valid test card information.');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await processCardPayment(amountDue, cardType, {
        cardNumber: testCardNumber,
        expiryDate: testExpiry,
        cvv: testCvv,
        simulateFailure,
      });

      setIsProcessing(false);

      if (result.success) {
        // Clear transient input fields immediately
        setTestCardNumber('');
        setTestExpiry('');
        setTestCvv('');
        onPaymentSuccess(result.maskedCard);
      } else {
        setPaymentFailed(true);
        setErrorMessage(result.errorMessage || 'Payment Failed. Please try again.');
      }
    } catch {
      setIsProcessing(false);
      setPaymentFailed(true);
      setErrorMessage('Payment Failed. Communication error with test terminal.');
    }
  };

  const handleTryAgain = () => {
    setPaymentFailed(false);
    setErrorMessage(null);
  };

  return (
    <div className="bg-slate-50 border-2 border-blue-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              {cardType} Payment
            </h3>
            <p className="text-xs text-slate-600">Simulated terminal card entry</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Amount Due
          </span>
          <span className="text-base sm:text-lg font-black text-blue-700 font-mono-numbers">
            {formatCurrency(amountDue)}
          </span>
        </div>
      </div>

      {/* Prominent Demo Notice */}
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>DEMO MODE</strong> — Do not enter real card information.
        </span>
      </div>

      {/* Failure State Notification */}
      {paymentFailed && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2">
          <div className="flex items-start gap-2 text-rose-800">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-rose-900">Payment Failed</p>
              <p className="mt-0.5 text-rose-700">
                {errorMessage || 'The card transaction could not be completed.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-rose-200/60">
            <button
              type="button"
              onClick={handleTryAgain}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-rose-300 text-rose-800 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-semibold bg-transparent text-slate-700 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              Change Payment Method
            </button>
          </div>
        </div>
      )}

      {/* Generic Validation Error Notice */}
      {!paymentFailed && errorMessage && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Test Card Form */}
      <form onSubmit={handleProcessPayment} className="space-y-3">
        {/* Test Card Number */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
            Test Card Number <span className="text-slate-500 font-normal">(Demo only)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              disabled={isProcessing}
              value={testCardNumber}
              onChange={(e) => setTestCardNumber(e.target.value)}
              placeholder="e.g. 4000 1234 5678 9010"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
            />
            <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Row: Expiry + CVV */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Test Expiration
            </label>
            <input
              type="text"
              disabled={isProcessing}
              maxLength={7}
              value={testExpiry}
              onChange={(e) => setTestExpiry(e.target.value)}
              placeholder="MM/YY (e.g. 12/28)"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Test CVV
            </label>
            <input
              type="text"
              disabled={isProcessing}
              maxLength={4}
              value={testCvv}
              onChange={(e) => setTestCvv(e.target.value)}
              placeholder="3 or 4 digits"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
            />
          </div>
        </div>

        {/* Quick Autofill Buttons for fast tester verification */}
        <div className="pt-1 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            Quick Demo Presets:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleApplyPreset('valid')}
              className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Fill Valid Test Card
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleApplyPreset('declined')}
              className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-semibold hover:bg-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Simulate Decline
            </button>
          </div>
        </div>

        {/* Action Buttons: Process Test Payment & Cancel */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing payment...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Process Test Payment</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={onCancel}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
