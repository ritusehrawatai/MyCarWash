import React, { useState } from 'react';
import {
  CreditCard,
  AlertTriangle,
  RotateCcw,
  XCircle,
  HelpCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency } from '../data/constants';
import { processCardPayment } from '../services/paymentService';
import { useLanguage } from '../context/LanguageContext';

interface CardPaymentPanelProps {
  cardType: string;
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
  const { t } = useLanguage();

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
      setErrorMessage(t('common.required'));
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
        setErrorMessage(result.errorMessage || t('common.error'));
      }
    } catch {
      setIsProcessing(false);
      setPaymentFailed(true);
      setErrorMessage(t('common.error'));
    }
  };

  const handleTryAgain = () => {
    setPaymentFailed(false);
    setErrorMessage(null);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/90 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-150 transition-colors duration-200">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              {cardType} {t('pos.creditCard')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('pos.simulatedCardPayment')}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            {t('common.total')}
          </span>
          <span className="text-base sm:text-lg font-black text-blue-700 dark:text-blue-400 font-mono-numbers">
            {formatCurrency(amountDue)}
          </span>
        </div>
      </div>

      {/* Prominent Demo Notice */}
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-amber-900 dark:text-amber-300 text-xs font-semibold">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong>DEMO</strong> — {t('pos.cardRefNotice')}
        </span>
      </div>

      {/* Failure State Notification */}
      {paymentFailed && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs space-y-2">
          <div className="flex items-start gap-2 text-rose-800 dark:text-rose-200">
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-rose-900 dark:text-rose-200">{t('common.error')}</p>
              <p className="mt-0.5 text-rose-700 dark:text-rose-300">
                {errorMessage || t('common.error')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-rose-200/60 dark:border-rose-800/60">
            <button
              type="button"
              onClick={handleTryAgain}
              className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('common.reset')}</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Generic Validation Error Notice */}
      {!paymentFailed && errorMessage && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Test Card Form */}
      <form onSubmit={handleProcessPayment} className="space-y-3">
        {/* Test Card Number */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            {t('memberships.cardNumber')} <span className="text-slate-500 dark:text-slate-400 font-normal">({t('common.optional')})</span>
          </label>
          <div className="relative">
            <input
              type="text"
              disabled={isProcessing}
              value={testCardNumber}
              onChange={(e) => setTestCardNumber(e.target.value)}
              placeholder="e.g. 4000 1234 5678 9010"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
            />
            <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Row: Expiry + CVV */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              MM/YY
            </label>
            <input
              type="text"
              disabled={isProcessing}
              maxLength={7}
              value={testExpiry}
              onChange={(e) => setTestExpiry(e.target.value)}
              placeholder="MM/YY (12/28)"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              CVV
            </label>
            <input
              type="text"
              disabled={isProcessing}
              maxLength={4}
              value={testCvv}
              onChange={(e) => setTestCvv(e.target.value)}
              placeholder="3 or 4 digits"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
            />
          </div>
        </div>

        {/* Quick Autofill Buttons for fast tester verification */}
        <div className="pt-1 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            {t('auth.demoAccounts')}:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleApplyPreset('valid')}
              className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-semibold hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Demo Auto-Fill
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleApplyPreset('declined')}
              className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-semibold hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors disabled:opacity-50 cursor-pointer"
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
                <span>{t('common.loading')}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>{t('pos.confirmCardPayment')}</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={onCancel}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};
