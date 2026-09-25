import React, { useState, useMemo } from 'react';
import { TodaySummary } from './TodaySummary';
import {
  TransactionFilters,
  DateFilterOption,
  PaymentFilterOption,
  StatusFilterOption,
} from './TransactionFilters';
import { TransactionsTable } from './TransactionsTable';
import { TransactionDetailsModal } from './TransactionDetailsModal';
import { Transaction, UserRole } from '../types/pos';

interface TransactionsPageProps {
  transactions: Transaction[];
  onVoidTransaction: (transactionId: string) => void;
  onPrintReceipt: (transaction: Transaction) => void;
  onStartNewWash: () => void;
  userRole?: UserRole;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  onVoidTransaction,
  onPrintReceipt,
  onStartNewWash,
  userRole = 'admin',
}) => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('today');
  const [customDate, setCustomDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterOption>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('ALL');

  // Details Modal
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Active filter count (excluding default 'today' date filter or count any non-default)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim() !== '') count++;
    if (dateFilter !== 'all') count++;
    if (paymentFilter !== 'ALL') count++;
    if (statusFilter !== 'ALL') count++;
    return count;
  }, [searchQuery, dateFilter, paymentFilter, statusFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setPaymentFilter('ALL');
    setStatusFilter('ALL');
  };

  // Filtered transactions calculation
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return transactions.filter((tx) => {
      const txDate = new Date(tx.timestamp);
      const txDateOnly = new Date(txDate);
      txDateOnly.setHours(0, 0, 0, 0);

      // 1. Date Filter
      if (dateFilter === 'today') {
        if (txDateOnly.getTime() !== today.getTime()) return false;
      } else if (dateFilter === 'yesterday') {
        if (txDateOnly.getTime() !== yesterday.getTime()) return false;
      } else if (dateFilter === 'week') {
        if (txDateOnly.getTime() < weekAgo.getTime() || txDateOnly.getTime() > today.getTime()) {
          return false;
        }
      } else if (dateFilter === 'custom') {
        if (customDate) {
          const customDateObj = new Date(`${customDate}T00:00:00`);
          if (txDateOnly.toDateString() !== customDateObj.toDateString()) {
            return false;
          }
        }
      }

      // 2. Payment Method Filter
      if (paymentFilter !== 'ALL') {
        if (paymentFilter === 'DEBIT_CARD') {
          if (tx.paymentMethod !== 'DEBIT_CARD') return false;
        } else if (paymentFilter === 'CREDIT_CARD') {
          // Allow CREDIT_CARD or legacy CARD records
          if (tx.paymentMethod !== 'CREDIT_CARD' && tx.paymentMethod !== 'CARD') return false;
        } else if (tx.paymentMethod !== paymentFilter) {
          return false;
        }
      }

      // 3. Status Filter
      const txStatus = tx.status || 'completed';
      if (statusFilter !== 'ALL' && txStatus !== statusFilter) {
        return false;
      }

      // 4. Search Query (Receipt #, Service Name, Payment, Vehicle Type)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const receiptMatch = tx.receiptNumber.toLowerCase().includes(query);
        const serviceMatch = tx.service.name.toLowerCase().includes(query);
        const paymentMatch = tx.paymentMethod.toLowerCase().includes(query);
        const vehicleMatch = tx.vehicleType.name.toLowerCase().includes(query);
        const addOnsMatch = tx.addOns.some((a) => a.name.toLowerCase().includes(query));

        // Friendly payment terms match
        const debitMatch = query.includes('debit') && tx.paymentMethod === 'DEBIT_CARD';
        const creditMatch = query.includes('credit') && (tx.paymentMethod === 'CREDIT_CARD' || tx.paymentMethod === 'CARD');
        const cardMatch = query.includes('card') && (tx.paymentMethod === 'DEBIT_CARD' || tx.paymentMethod === 'CREDIT_CARD' || tx.paymentMethod === 'CARD');

        if (!receiptMatch && !serviceMatch && !paymentMatch && !vehicleMatch && !addOnsMatch && !debitMatch && !creditMatch && !cardMatch) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, dateFilter, customDate, paymentFilter, statusFilter, searchQuery]);

  // Keep selectedTransaction in sync if voided
  const currentSelected = useMemo(() => {
    if (!selectedTransaction) return null;
    return transactions.find((t) => t.id === selectedTransaction.id) || selectedTransaction;
  }, [selectedTransaction, transactions]);

  return (
    <div className="space-y-6">
      {/* 2. Today's Summary */}
      <TodaySummary transactions={transactions} />

      {/* 3 & 4. Search and Filters */}
      <TransactionFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        customDate={customDate}
        onCustomDateChange={setCustomDate}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={setPaymentFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onResetFilters={handleResetFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* 1 & 10. Completed Transactions Table / Responsive Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-800">
            Transactions ({filteredTransactions.length} of {transactions.length})
          </h3>
          <span className="text-xs text-slate-700">Click any row to view details or void</span>
        </div>

        <TransactionsTable
          transactions={filteredTransactions}
          onSelectTransaction={(tx) => setSelectedTransaction(tx)}
          onStartNewWash={onStartNewWash}
          hasFiltersActive={activeFilterCount > 0}
        />
      </div>

      {/* 5, 6, 7. Transaction Details Modal (with Print Receipt and Void actions) */}
      <TransactionDetailsModal
        transaction={currentSelected}
        isOpen={!!currentSelected}
        onClose={() => setSelectedTransaction(null)}
        onPrintReceipt={(tx) => {
          setSelectedTransaction(null);
          onPrintReceipt(tx);
        }}
        onVoidTransaction={(id) => {
          onVoidTransaction(id);
        }}
        userRole={userRole}
      />
    </div>
  );
};
