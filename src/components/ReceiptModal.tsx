import React from 'react';
import { Printer, PlusCircle, CheckCircle, Car, Truck } from 'lucide-react';
import { Transaction, BusinessInfo } from '../types/pos';
import { formatCurrency, DEFAULT_BUSINESS_INFO, formatPaymentMethodName } from '../data/constants';

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onNewSale?: () => void;
  onClose?: () => void;
  isNewSaleCompletion?: boolean;
  businessInfo?: BusinessInfo;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  isOpen,
  onNewSale,
  onClose,
  isNewSaleCompletion = false,
  businessInfo = DEFAULT_BUSINESS_INFO,
}) => {
  if (!isOpen || !transaction) return null;

  const isVoided = transaction.status === 'voided';

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(transaction.timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className="print-receipt-wrapper bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Banner (Screen only, hidden on print) */}
        {isNewSaleCompletion ? (
          <div className="no-print bg-emerald-600 px-6 py-4 text-white text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">Payment Successful!</h2>
            <p className="text-emerald-100 text-xs mt-0.5">
              Transaction recorded · Receipt generated
            </p>
          </div>
        ) : (
          <div className="no-print bg-slate-800 px-5 py-3 text-white flex items-center justify-between">
            <span className="font-bold text-sm">Receipt Preview</span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-md text-xs font-semibold"
              >
                ✕ Close
              </button>
            )}
          </div>
        )}

        {/* Voided Warning Notice (if voided) */}
        {isVoided && (
          <div className="bg-rose-600 text-white font-bold text-center py-2 px-4 text-xs tracking-wider uppercase flex items-center justify-center gap-1.5">
            <span>⚠️ VOIDED TRANSACTION — NOT VALID</span>
          </div>
        )}

        {/* Printable Receipt Paper Container */}
        <div className="p-6 bg-slate-50/50">
          <div className="print-receipt-container bg-white p-5 rounded-xl border border-slate-200 shadow-xs font-mono text-xs leading-relaxed text-slate-900 relative">
            {/* Watermark for voided receipt */}
            {isVoided && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <span className="text-5xl font-extrabold text-red-600 -rotate-45 border-4 border-red-600 px-4 py-2 uppercase">
                  VOIDED
                </span>
              </div>
            )}

            {/* Business Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h3 className="font-bold text-base tracking-wide uppercase font-sans text-slate-900">
                {businessInfo.businessName || 'My Car Wash'}
              </h3>
              {businessInfo.address && (
                <p className="text-[11px] text-slate-700">{businessInfo.address}</p>
              )}
              {businessInfo.phone && (
                <p className="text-[11px] text-slate-700">Tel: {businessInfo.phone}</p>
              )}
              {businessInfo.email && (
                <p className="text-[10px] text-slate-600">{businessInfo.email}</p>
              )}
              <p className="text-[10px] text-slate-700 mt-1 uppercase">
                {isVoided ? 'VOIDED TRANSACTION RECORD' : 'Walk-in Customer Receipt'}
              </p>
            </div>

            {/* Meta Info */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold text-slate-900">{transaction.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date/Time:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="font-bold text-slate-900">
                  {formatPaymentMethodName(transaction.paymentMethod)}
                </span>
              </div>
              {transaction.cardRef && (
                <div className="flex justify-between text-slate-600">
                  <span>Card:</span>
                  <span className="font-mono">{transaction.cardRef}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-bold ${isVoided ? 'text-red-700' : 'text-slate-900'}`}>
                  {isVoided ? 'VOIDED' : 'PAID'}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
              <div className="font-bold uppercase text-[10px] text-slate-700 tracking-wider">
                Item / Service
              </div>

              {/* Service */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-slate-900">{transaction.service.name}</span>
                </div>
                <span className="font-bold text-slate-900">
                  {formatCurrency(transaction.service.price)}
                </span>
              </div>

              {/* Vehicle Type */}
              <div className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-1">
                  {transaction.vehicleType.id?.toLowerCase().includes('truck') ||
                  transaction.vehicleType.id?.toLowerCase().includes('suv') ? (
                    <Truck className="w-3 h-3 text-slate-700 inline" />
                  ) : (
                    <Car className="w-3 h-3 text-slate-700 inline" />
                  )}
                  Vehicle ({transaction.vehicleType.name})
                </span>
                <span>
                  {transaction.vehicleType.surcharge > 0
                    ? `+${formatCurrency(transaction.vehicleType.surcharge)}`
                    : '$0.00'}
                </span>
              </div>

              {/* Add-ons */}
              {transaction.addOns.map((addon) => (
                <div key={addon.id} className="flex justify-between items-center text-slate-700 pl-2">
                  <span>+ {addon.name}</span>
                  <span>+{formatCurrency(addon.price)}</span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal:</span>
                <span>{formatCurrency(transaction.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Tax ({(transaction.taxRate * 100).toFixed(2)}%):</span>
                <span>{formatCurrency(transaction.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span className={isVoided ? 'line-through text-slate-600' : ''}>
                  {formatCurrency(transaction.total)}
                </span>
              </div>

              {/* Cash tendered & change details if paid in cash */}
              {transaction.paymentMethod === 'CASH' && transaction.cashTendered !== undefined && (
                <div className="pt-1 mt-1 border-t border-dashed border-slate-200 space-y-0.5 text-slate-700">
                  <div className="flex justify-between">
                    <span>Cash Tendered:</span>
                    <span>{formatCurrency(transaction.cashTendered)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Change Due:</span>
                    <span>{formatCurrency(transaction.changeDue || 0)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Barcode / Thanks */}
            <div className="pt-3 text-center space-y-1 text-slate-700">
              <p className="font-bold text-[11px] text-slate-800">
                {isVoided ? '*** TRANSACTION VOIDED ***' : (businessInfo.receiptFooter || 'Thank you for visiting!')}
              </p>
              <div className="mt-2 text-center text-slate-700 tracking-widest text-xs font-mono select-none">
                ||| | |||| || ||| |||| | ||| || ||||
              </div>
            </div>
          </div>
        </div>

        {/* Buttons (Screen only) */}
        <div className="no-print p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl border-2 border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Receipt</span>
          </button>

          {isNewSaleCompletion && onNewSale ? (
            <button
              type="button"
              onClick={onNewSale}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Sale</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose || onNewSale}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <span>Done</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
