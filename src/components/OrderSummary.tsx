import React, { useState } from 'react';
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
} from 'lucide-react';
import { WashService, VehicleType, AddOn, PaymentMethod } from '../types/pos';
import { formatCurrency } from '../data/constants';

interface OrderSummaryProps {
  selectedService: WashService;
  selectedVehicle: VehicleType;
  selectedAddOns: AddOn[];
  taxRate: number;
  paymentMethod: PaymentMethod | null;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  onCompleteSale: (cashTendered?: number, changeDue?: number) => void;
  onResetOrder: () => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  selectedService,
  selectedVehicle,
  selectedAddOns,
  taxRate,
  paymentMethod,
  onSelectPaymentMethod,
  onCompleteSale,
  onResetOrder,
}) => {
  // Calculations
  const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
  const subtotal = selectedService.price + selectedVehicle.surcharge + addOnsTotal;
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = subtotal + taxAmount;

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

  const handleComplete = () => {
    if (!paymentMethod) return;
    if (paymentMethod === 'CASH') {
      const tendered = cashTendered !== null && cashTendered >= total ? cashTendered : total;
      const change = tendered - total;
      onCompleteSale(tendered, change);
    } else {
      onCompleteSale();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 sm:p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Current Order</h2>
          </div>
          <button
            type="button"
            onClick={onResetOrder}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-red-700 transition-colors px-2 py-1 rounded hover:bg-slate-100"
            title="Reset to default"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>Reset</span>
          </button>
        </div>

        {/* Itemized breakdown */}
        <div className="py-4 space-y-3 border-b border-slate-100">
          {/* Wash Service */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">{selectedService.name}</p>
              <p className="text-xs text-slate-700">Primary wash package</p>
            </div>
            <span className="text-sm font-bold text-slate-900 font-mono-numbers">
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
                <Truck className="w-3.5 h-3.5 text-slate-700" />
              ) : (
                <Car className="w-3.5 h-3.5 text-slate-700" />
              )}
              <span className="text-sm text-slate-700">
                Vehicle: <strong className="text-slate-900">{selectedVehicle.name}</strong>
              </span>
            </div>
            <span className="text-sm text-slate-700 font-mono-numbers">
              {selectedVehicle.surcharge > 0 ? (
                `+${formatCurrency(selectedVehicle.surcharge)}`
              ) : (
                <span className="text-slate-600">$0.00</span>
              )}
            </span>
          </div>

          {/* Add-ons */}
          {selectedAddOns.length > 0 ? (
            <div className="space-y-1.5 pt-1 border-t border-dashed border-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Add-ons ({selectedAddOns.length}):
              </span>
              {selectedAddOns.map((addon) => (
                <div key={addon.id} className="flex items-center justify-between pl-2">
                  <div className="flex items-center gap-1.5">
                    <PlusCircle className="w-3 h-3 text-blue-600" />
                    <span className="text-xs text-slate-700">{addon.name}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900 font-mono-numbers">
                    +{formatCurrency(addon.price)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600 italic">No add-ons selected</p>
          )}
        </div>

        {/* Pricing Math */}
        <div className="py-4 space-y-2 border-b border-slate-100 font-mono-numbers text-sm">
          <div className="flex justify-between text-slate-700">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Tax ({(taxRate * 100).toFixed(2)}%)</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>

          <div className="pt-2 flex justify-between items-baseline border-t border-slate-200">
            <span className="text-base font-bold text-slate-900 font-sans">Total</span>
            <span className="text-3xl font-extrabold text-blue-600 tracking-tight">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="pt-4 space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* CASH */}
            <button
              type="button"
              onClick={() => onSelectPaymentMethod('CASH')}
              className={`py-3.5 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer font-bold text-xs sm:text-sm select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                paymentMethod === 'CASH'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-1 ring-blue-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span>CASH</span>
            </button>

            {/* CARD */}
            <button
              type="button"
              onClick={() => {
                onSelectPaymentMethod('CARD');
                setCashTendered(null);
              }}
              className={`py-3.5 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer font-bold text-xs sm:text-sm select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                paymentMethod === 'CARD'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-1 ring-blue-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>CARD</span>
            </button>

            {/* OTHER */}
            <button
              type="button"
              onClick={() => {
                onSelectPaymentMethod('OTHER');
                setCashTendered(null);
              }}
              className={`py-3.5 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer font-bold text-xs sm:text-sm select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                paymentMethod === 'OTHER'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-1 ring-blue-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span>OTHER</span>
            </button>
          </div>

          {/* Cash Tender Helper (only when CASH is selected) */}
          {paymentMethod === 'CASH' && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                <span>Quick Cash Tender:</span>
                {cashTendered !== null && cashTendered >= total && (
                  <span className="text-emerald-700 font-bold font-mono-numbers">
                    Change: {formatCurrency(changeDue)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickBills.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setCashTendered(amount)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors font-mono-numbers ${
                      cashTendered === amount
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {amount === total ? 'Exact' : `$${amount}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Area: COMPLETE SALE Button */}
      <div className="mt-6 pt-2">
        {paymentMethod ? (
          <button
            type="button"
            onClick={handleComplete}
            className="w-full py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/50 animate-pulse"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>COMPLETE SALE — {formatCurrency(total)}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-full py-3.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-center text-sm font-semibold flex items-center justify-center gap-2 select-none">
            <span>Select Payment Method to Complete</span>
          </div>
        )}
      </div>
    </div>
  );
};
