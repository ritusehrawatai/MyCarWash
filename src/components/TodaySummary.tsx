import React from 'react';
import {
  Banknote,
  CreditCard,
  Layers,
  Car,
  Receipt,
  TrendingUp,
  Ban,
} from 'lucide-react';
import { Transaction } from '../types/pos';
import { formatCurrency } from '../data/constants';

interface TodaySummaryProps {
  transactions: Transaction[];
}

export const TodaySummary: React.FC<TodaySummaryProps> = ({ transactions }) => {
  const todayStr = new Date().toDateString();

  // All today's transactions
  const todayTransactions = transactions.filter(
    (t) => new Date(t.timestamp).toDateString() === todayStr
  );

  // Active (non-voided) today's transactions
  const activeToday = todayTransactions.filter((t) => t.status !== 'voided');
  const voidedTodayCount = todayTransactions.filter((t) => t.status === 'voided').length;

  const totalSales = activeToday.reduce((sum, t) => sum + t.total, 0);

  const cashSales = activeToday
    .filter((t) => t.paymentMethod === 'CASH')
    .reduce((sum, t) => sum + t.total, 0);

  // Combine Debit Card, Credit Card, and legacy CARD sales
  const cardSales = activeToday
    .filter(
      (t) =>
        t.paymentMethod === 'DEBIT_CARD' ||
        t.paymentMethod === 'CREDIT_CARD' ||
        t.paymentMethod === 'CARD'
    )
    .reduce((sum, t) => sum + t.total, 0);

  const otherSales = activeToday
    .filter((t) => t.paymentMethod === 'OTHER')
    .reduce((sum, t) => sum + t.total, 0);

  const carsWashed = activeToday.length;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-4 transition-colors duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Today's Summary</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {voidedTodayCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
            <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>{voidedTodayCount} voided today (excluded)</span>
          </div>
        )}
      </div>

      {/* Grid of 6 metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Number of transactions */}
        <div className="bg-slate-50/80 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-medium">
            <span>Transactions</span>
            <Receipt className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono-numbers">
            {activeToday.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Completed today</p>
        </div>

        {/* Metric 2: Total Sales */}
        <div className="bg-blue-50/60 dark:bg-blue-950/40 rounded-xl p-3 border border-blue-200/70 dark:border-blue-800/70">
          <div className="flex items-center justify-between text-blue-800 dark:text-blue-300 text-xs font-semibold">
            <span>Total Sales</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-blue-700 dark:text-blue-400 font-mono-numbers">
            {formatCurrency(totalSales)}
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-300 mt-0.5">Gross net revenue</p>
        </div>

        {/* Metric 3: Cash Sales */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl p-3 border border-emerald-200/70 dark:border-emerald-800/70">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <span>Cash Sales</span>
            <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono-numbers">
            {formatCurrency(cashSales)}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-300 mt-0.5">Collected in drawer</p>
        </div>

        {/* Metric 4: Card Sales */}
        <div className="bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl p-3 border border-indigo-200/70 dark:border-indigo-800/70">
          <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-300 text-xs font-semibold">
            <span>Card Sales</span>
            <CreditCard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-indigo-700 dark:text-indigo-400 font-mono-numbers">
            {formatCurrency(cardSales)}
          </div>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-300 mt-0.5">Debit & Credit volume</p>
        </div>

        {/* Metric 5: Other Payments */}
        <div className="bg-amber-50/60 dark:bg-amber-950/40 rounded-xl p-3 border border-amber-200/70 dark:border-amber-800/70">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <span>Other Payments</span>
            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-amber-700 dark:text-amber-400 font-mono-numbers">
            {formatCurrency(otherSales)}
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-300 mt-0.5">Mobile / Voucher / Fleet</p>
        </div>

        {/* Metric 6: Number of cars washed */}
        <div className="bg-slate-50/80 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-medium">
            <span>Cars Washed</span>
            <Car className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono-numbers">
            {carsWashed}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Vehicles processed</p>
        </div>
      </div>
    </section>
  );
};
