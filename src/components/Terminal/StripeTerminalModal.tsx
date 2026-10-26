import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Loader2,
  ShieldCheck,
  Radio,
  Sparkles,
  Smartphone,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  TerminalReader,
  fetchTerminalReaders,
  createTerminalPaymentIntent,
  processPaymentIntentOnReader,
  cancelReaderAction,
  fetchPaymentIntentStatus,
  simulateTerminalPayment,
  TerminalPaymentResult,
} from '../../services/stripeTerminalService';
import { formatCurrency } from '../../data/constants';
import { POSServiceItem, POSVehicleType } from '../../types/pos';
import { useLanguage } from '../../context/LanguageContext';

export interface StripeTerminalModalProps {
  isOpen: boolean;
  amountDue: number;
  service: POSServiceItem;
  vehicleType: POSVehicleType;
  addOns: POSServiceItem[];
  discountAmount?: number;
  taxRate?: number;
  customerName?: string;
  customerPhone?: string;
  onPaymentSuccess: (result: TerminalPaymentResult) => void;
  onCancel: () => void;
}

type TerminalStep =
  | 'loading_readers'
  | 'creating_intent'
  | 'waiting_for_card'
  | 'processing'
  | 'succeeded'
  | 'declined'
  | 'error';

export const StripeTerminalModal: React.FC<StripeTerminalModalProps> = ({
  isOpen,
  amountDue,
  service,
  vehicleType,
  addOns,
  discountAmount = 0,
  taxRate = 0.0825,
  customerName,
  customerPhone,
  onPaymentSuccess,
  onCancel,
}) => {
  const { t } = useLanguage();

  const [readers, setReaders] = useState<TerminalReader[]>([]);
  const [selectedReaderId, setSelectedReaderId] = useState<string>('');
  const [step, setStep] = useState<TerminalStep>('loading_readers');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(true);
  const [approvedDetails, setApprovedDetails] = useState<any>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const pollIntervalRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Initialize and load available readers on modal open
  useEffect(() => {
    if (!isOpen) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setStep('loading_readers');
      setPaymentIntentId(null);
      setErrorMessage(null);
      setApprovedDetails(null);
      return;
    }

    let isCancelled = false;
    async function loadReadersAndInit() {
      try {
        setStep('loading_readers');
        setErrorMessage(null);
        const data = await fetchTerminalReaders();
        if (isCancelled) return;

        setReaders(data.readers);
        setIsSimulated(data.isSimulated);

        const activeReader =
          data.readers.find((r) => r.status === 'online') || data.readers[0];

        if (!activeReader) {
          setStep('error');
          setErrorMessage('No card readers found. Please configure a reader in Settings.');
          return;
        }

        setSelectedReaderId(activeReader.id);
        // Automatically start checkout on selected reader
        initiatePaymentOnReader(activeReader.id);
      } catch (err: any) {
        if (isCancelled) return;
        setStep('error');
        setErrorMessage(err.message || 'Unable to connect to Stripe Terminal.');
      }
    }

    loadReadersAndInit();

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  // Initiate Payment Intent and dispatch to Reader
  const initiatePaymentOnReader = async (readerId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setStep('creating_intent');
    setErrorMessage(null);

    try {
      // 1. Create trusted server-side PaymentIntent
      const intentRes = await createTerminalPaymentIntent({
        transactionRef: `CW-${Date.now()}`,
        service: { id: service.id, name: service.name, price: service.price },
        vehicleType: { id: vehicleType.id, name: vehicleType.name, surcharge: vehicleType.surcharge },
        addOns: addOns.map((a) => ({ id: a.id, name: a.name, price: a.price })),
        discountAmount,
        taxRate,
        customerName,
        customerPhone,
      });

      if (!isMountedRef.current) return;
      setPaymentIntentId(intentRes.paymentIntentId);
      setIsSimulated(intentRes.isSimulated);

      // 2. Dispatch to physical / smart reader
      await processPaymentIntentOnReader(readerId, intentRes.paymentIntentId);

      if (!isMountedRef.current) return;
      setStep('waiting_for_card');

      // 3. Start polling reader & payment intent status
      startStatusPolling(intentRes.paymentIntentId);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setStep('error');
      setErrorMessage(err.message || 'Failed to dispatch payment to card reader.');
    }
  };

  // Poll server for payment confirmation
  const startStatusPolling = (piId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusData = await fetchPaymentIntentStatus(piId);
        if (!isMountedRef.current) return;

        if (statusData.status === 'succeeded') {
          clearInterval(pollIntervalRef.current);
          setStep('succeeded');
          const details: TerminalPaymentResult = {
            success: true,
            paymentIntentId: statusData.id,
            readerId: selectedReaderId,
            amount: statusData.amount || amountDue,
            cardBrand: statusData.cardBrand || 'visa',
            cardLast4: statusData.cardLast4 || '4242',
            cardEntryMethod: statusData.cardEntryMethod || 'contactless',
            terminalAuthCode: statusData.terminalAuthCode || 'AUTH-OK',
            maskedCard: statusData.maskedCard || `${(statusData.cardBrand || 'CARD').toUpperCase()} •••• ${statusData.cardLast4 || '4242'}`,
            isSimulated: statusData.isSimulated,
          };
          setApprovedDetails(details);
          // Wait briefly to show approval checkmark, then complete sale
          setTimeout(() => {
            if (isMountedRef.current) {
              onPaymentSuccess(details);
            }
          }, 1200);
        } else if (statusData.status === 'canceled') {
          clearInterval(pollIntervalRef.current);
          setStep('error');
          setErrorMessage('Payment was cancelled on the reader.');
        } else if (statusData.status === 'processing') {
          setStep('processing');
        }
      } catch (e) {
        // Continue polling on transient check failure
      }
    }, 1500);
  };

  // Safe Cashier Cancellation
  const handleCancel = async () => {
    setIsCancelling(true);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    if (selectedReaderId) {
      try {
        await cancelReaderAction(selectedReaderId);
      } catch (e) {
        console.warn('Reader cancel warning:', e);
      }
    }

    setIsCancelling(false);
    onCancel();
  };

  // Safe Cashier Retry
  const handleRetry = () => {
    if (selectedReaderId) {
      initiatePaymentOnReader(selectedReaderId);
    }
  };

  // Test Mode simulation actions
  const handleSimulateAction = async (
    outcome: 'approved_contactless' | 'approved_chip' | 'approved_swipe' | 'declined'
  ) => {
    if (!paymentIntentId || !selectedReaderId) return;

    if (outcome === 'declined') {
      setStep('processing');
      try {
        const res = await simulateTerminalPayment(selectedReaderId, paymentIntentId, 'declined');
        setStep('declined');
        setErrorMessage(res.error || 'The card was declined: Insufficient funds.');
      } catch (err: any) {
        setStep('declined');
        setErrorMessage(err.message || 'The card was declined.');
      }
    } else {
      setStep('processing');
      try {
        const res = await simulateTerminalPayment(selectedReaderId, paymentIntentId, outcome);
        if (res.success) {
          setStep('succeeded');
          const details: TerminalPaymentResult = {
            success: true,
            paymentIntentId,
            readerId: selectedReaderId,
            amount: amountDue,
            cardBrand: res.cardBrand || 'visa',
            cardLast4: res.cardLast4 || '4242',
            cardEntryMethod: res.cardEntryMethod || 'contactless',
            terminalAuthCode: res.terminalAuthCode || 'AUTH-429812',
            maskedCard: res.maskedCard || 'VISA •••• 4242',
            isSimulated: true,
          };
          setApprovedDetails(details);
          setTimeout(() => {
            if (isMountedRef.current) {
              onPaymentSuccess(details);
            }
          }, 1200);
        } else {
          setStep('error');
          setErrorMessage(res.error || 'Failed to simulate payment authorization');
        }
      } catch (err: any) {
        setStep('error');
        setErrorMessage(err.message || 'Simulation error');
      }
    }
  };

  if (!isOpen) return null;

  const currentReader = readers.find((r) => r.id === selectedReaderId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 transition-all flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Stripe Terminal</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Card Present
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                In-person contactless, chip & swipe reader
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isCancelling}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reader selector pill */}
        <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span className="font-medium">Reader:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {currentReader ? currentReader.label : 'Connecting...'}
            </span>
          </div>

          {readers.length > 1 && (
            <div className="relative">
              <select
                value={selectedReaderId}
                onChange={(e) => {
                  setSelectedReaderId(e.target.value);
                  initiatePaymentOnReader(e.target.value);
                }}
                disabled={step === 'processing' || step === 'succeeded'}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg py-1 px-2 pr-6 appearance-none font-semibold cursor-pointer"
              >
                {readers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-2 pointer-events-none text-slate-400" />
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="p-6 sm:p-8 flex flex-col items-center text-center">
          {/* Amount Display */}
          <div className="mb-6">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
              Amount Due
            </span>
            <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight font-mono-numbers">
              {formatCurrency(amountDue)}
            </div>
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
              <span>{service.name}</span>
              <span>•</span>
              <span>{vehicleType.name}</span>
              {customerName && (
                <>
                  <span>•</span>
                  <span>{customerName}</span>
                </>
              )}
            </div>
          </div>

          {/* Dynamic Step Display */}
          {step === 'loading_readers' && (
            <div className="py-8 flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Finding available card reader...
              </p>
              <p className="text-xs text-slate-500 mt-1">Connecting to Stripe Terminal</p>
            </div>
          )}

          {step === 'creating_intent' && (
            <div className="py-8 flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Initializing payment on reader...
              </p>
              <p className="text-xs text-slate-500 mt-1">Prompting terminal for {formatCurrency(amountDue)}</p>
            </div>
          )}

          {step === 'waiting_for_card' && (
            <div className="py-4 flex flex-col items-center w-full">
              {/* Animated Reader Visual */}
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xl shadow-blue-500/10">
                  <CreditCard className="w-12 h-12" />
                </div>
                {/* Contactless Waves Indicator */}
                <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center animate-bounce shadow-md">
                  <Wifi className="w-5 h-5 rotate-90" />
                </div>
              </div>

              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Please Tap, Insert, or Swipe Card
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                Ask the customer to present contactless card, Apple Pay, Google Pay, or insert chip on the card reader.
              </p>

              <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-blue-500" /> Tap
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-500" /> Chip
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-cyan-500" /> Mobile Wallet
                </span>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-8 flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Loader2 className="w-9 h-9 text-blue-600 animate-spin" />
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-500 absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Authorizing Payment...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Card presented. Communicating securely with bank. Do not remove card.
              </p>
            </div>
          )}

          {step === 'succeeded' && (
            <div className="py-6 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 animate-in zoom-in-75">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h4 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                Payment Approved!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {approvedDetails?.maskedCard || 'Card Present'} • Auth: {approvedDetails?.terminalAuthCode || 'AUTH-OK'}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold mt-2">
                Completing wash transaction...
              </p>
            </div>
          )}

          {step === 'declined' && (
            <div className="py-6 flex flex-col items-center w-full">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
                <XCircle className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-rose-600 dark:text-rose-400">
                Card Declined
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-sm">
                {errorMessage || 'The card was declined by the issuer. Please ask the customer for another card or cash.'}
              </p>
            </div>
          )}

          {step === 'error' && (
            <div className="py-6 flex flex-col items-center w-full">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Reader Communication Error
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-sm">
                {errorMessage || 'Unable to complete transaction on reader.'}
              </p>
            </div>
          )}

          {/* Test Mode / Fast Simulation Actions */}
          {(step === 'waiting_for_card' || step === 'declined' || step === 'error') && (
            <div className="w-full mt-6 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-left">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Reader Card Simulator</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  Test & Hardware Mode
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                Simulate customer card presentation on the terminal:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateAction('approved_contactless')}
                  className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Wifi className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tap Card (Visa)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateAction('approved_chip')}
                  className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Insert Chip (EMV)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateAction('approved_swipe')}
                  className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-400 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  <span>Swipe Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateAction('declined')}
                  className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 text-xs font-bold text-rose-600 dark:text-rose-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Simulate Decline</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isCancelling || step === 'succeeded'}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isCancelling ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <span>Cancel Payment</span>
            )}
          </button>

          {(step === 'declined' || step === 'error') && (
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry on Reader</span>
            </button>
          )}

          {step === 'waiting_for_card' && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Awaiting Customer Card...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
