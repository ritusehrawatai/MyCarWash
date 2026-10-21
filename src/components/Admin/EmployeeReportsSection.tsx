import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  Filter,
  DollarSign,
  Car,
  TrendingUp,
  Ban,
  CheckCircle2,
  Sparkles,
  Printer,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Transaction, POSServiceItem, UserRole } from '../../types/pos';
import { UserAccount } from '../../services/authService';
import { formatCurrency } from '../../data/constants';
import { useLanguage } from '../../context/LanguageContext';

export type ReportDateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom';

interface EmployeeReportsSectionProps {
  transactions: Transaction[];
  accounts: UserAccount[];
  services: POSServiceItem[];
  onSelectTransaction: (tx: Transaction) => void;
  onPrintReceipt?: (tx: Transaction) => void;
}

export const EmployeeReportsSection: React.FC<EmployeeReportsSectionProps> = ({
  transactions,
  accounts,
  services,
  onSelectTransaction,
  onPrintReceipt,
}) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? 'es-ES' : 'en-US';

  // Filters
  const [dateFilter, setDateFilter] = useState<ReportDateFilter>('month');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'completed' | 'voided'>('ALL');

  // Staff accounts map for fast lookup
  const staffMap = useMemo(() => {
    const map = new Map<string, UserAccount>();
    accounts.forEach((a) => {
      map.set(a.id, a);
      if (a.employeeId) {
        map.set(a.employeeId.toUpperCase(), a);
      }
    });
    return map;
  }, [accounts]);

  // All distinct staff who have accounts or appear in historical transactions
  const allReportEmployees = useMemo(() => {
    const empSet = new Map<string, { id: string; name: string; employeeId: string; role: string; active: boolean }>();

    // Add all existing staff accounts
    accounts.forEach((a) => {
      if (a.role === 'admin' || a.role === 'cashier') {
        empSet.set(a.id, {
          id: a.id,
          name: a.name,
          employeeId: a.employeeId || 'ID',
          role: a.role,
          active: a.active !== false,
        });
      }
    });

    // Also include any historical attendants from transactions who might be deactivated or unlisted
    transactions.forEach((tx) => {
      if (tx.serviceAttendantId && !empSet.has(tx.serviceAttendantId)) {
        empSet.set(tx.serviceAttendantId, {
          id: tx.serviceAttendantId,
          name: tx.serviceAttendantName || 'Attendant',
          employeeId: tx.serviceAttendantEmployeeId || 'ID',
          role: tx.serviceAttendantRole || 'cashier',
          active: false,
        });
      }
    });

    return Array.from(empSet.values());
  }, [accounts, transactions]);

  // Wash packages list for filtering
  const washPackages = useMemo(() => {
    return services.filter((s) => s.type === 'wash');
  }, [services]);

  // Filtered transactions calculation
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    return transactions.filter((tx) => {
      const txDate = new Date(tx.timestamp);
      const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());

      // 1. Date Filter
      if (dateFilter === 'today') {
        if (txDay.getTime() !== today.getTime()) return false;
      } else if (dateFilter === 'yesterday') {
        if (txDay.getTime() !== yesterday.getTime()) return false;
      } else if (dateFilter === 'week') {
        if (txDay < weekAgo || txDay > today) return false;
      } else if (dateFilter === 'month') {
        if (txDay < monthAgo || txDay > today) return false;
      } else if (dateFilter === 'custom') {
        if (startDate) {
          const start = new Date(`${startDate}T00:00:00`);
          if (txDay < start) return false;
        }
        if (endDate) {
          const end = new Date(`${endDate}T23:59:59`);
          if (txDay > end) return false;
        }
      }

      // 2. Employee Filter (Attendant)
      if (employeeFilter !== 'ALL') {
        const matchesAttendantId = tx.serviceAttendantId === employeeFilter;
        const matchesEmployeeId = tx.serviceAttendantEmployeeId === employeeFilter;
        if (!matchesAttendantId && !matchesEmployeeId) {
          return false;
        }
      }

      // 3. Wash Package Filter
      if (serviceFilter !== 'ALL') {
        if (tx.service.id !== serviceFilter && tx.service.name !== serviceFilter) {
          return false;
        }
      }

      // 4. Status Filter
      if (statusFilter !== 'ALL') {
        const txStatus = tx.status || 'completed';
        if (txStatus !== statusFilter) return false;
      }

      return true;
    });
  }, [transactions, dateFilter, startDate, endDate, employeeFilter, serviceFilter, statusFilter]);

  // Compute Aggregate Metrics
  const aggregateMetrics = useMemo(() => {
    const completed = filteredTransactions.filter((tx) => tx.status !== 'voided');
    const voided = filteredTransactions.filter((tx) => tx.status === 'voided');

    const totalCompletedWashes = completed.length;
    const totalSales = completed.reduce((sum, tx) => sum + tx.total, 0);
    const averageTicket = totalCompletedWashes > 0 ? totalSales / totalCompletedWashes : 0;

    // Distinct attendants who performed washes
    const distinctAttendants = new Set<string>();
    completed.forEach((tx) => {
      const key = tx.serviceAttendantId || tx.serviceAttendantEmployeeId || tx.serviceAttendantName;
      if (key) distinctAttendants.add(key);
    });

    const voidedCount = voided.length;
    const voidedAmount = voided.reduce((sum, tx) => sum + tx.total, 0);

    return {
      totalCompletedWashes,
      totalSales,
      averageTicket,
      activeAttendantsCount: distinctAttendants.size,
      voidedCount,
      voidedAmount,
    };
  }, [filteredTransactions]);

  // Compute Employee Breakdown Metrics
  const employeeBreakdowns = useMemo(() => {
    interface AttendantStat {
      employeeId: string;
      name: string;
      role: string;
      active: boolean;
      completedWashes: number;
      totalSales: number;
      packageBreakdown: Map<string, { count: number; sales: number }>;
      voidedCount: number;
      voidedAmount: number;
      processedAsCashierCount: number;
    }

    const statMap = new Map<string, AttendantStat>();

    // Helper to get or create entry
    const getStatEntry = (id: string, name: string, empId: string, role: string, active: boolean) => {
      if (!statMap.has(id)) {
        statMap.set(id, {
          employeeId: empId,
          name,
          role,
          active,
          completedWashes: 0,
          totalSales: 0,
          packageBreakdown: new Map(),
          voidedCount: 0,
          voidedAmount: 0,
          processedAsCashierCount: 0,
        });
      }
      return statMap.get(id)!;
    };

    // If a specific employee is filtered, ensure they are present in list
    if (employeeFilter !== 'ALL') {
      const matched = allReportEmployees.find(
        (e) => e.id === employeeFilter || e.employeeId === employeeFilter
      );
      if (matched) {
        getStatEntry(matched.id, matched.name, matched.employeeId, matched.role, matched.active);
      }
    } else {
      // Initialize with all report employees
      allReportEmployees.forEach((e) => {
        getStatEntry(e.id, e.name, e.employeeId, e.role, e.active);
      });
    }

    filteredTransactions.forEach((tx) => {
      // Find attendant identifier
      let attendantKey = tx.serviceAttendantId;
      if (!attendantKey && tx.serviceAttendantEmployeeId) {
        const found = allReportEmployees.find((e) => e.employeeId === tx.serviceAttendantEmployeeId);
        attendantKey = found?.id;
      }

      if (!attendantKey) {
        attendantKey = 'unassigned';
      }

      const attendantName = tx.serviceAttendantName || 'Unassigned Attendant';
      const attendantEmpId = tx.serviceAttendantEmployeeId || 'EMP-N/A';
      const attendantRole = tx.serviceAttendantRole || 'cashier';
      const staffAccount = staffMap.get(attendantKey);
      const isActive = staffAccount ? staffAccount.active !== false : true;

      const stat = getStatEntry(attendantKey, attendantName, attendantEmpId, attendantRole, isActive);

      if (tx.status === 'voided') {
        stat.voidedCount += 1;
        stat.voidedAmount += tx.total;
      } else {
        // Completed wash
        stat.completedWashes += 1;
        stat.totalSales += tx.total;

        // Package breakdown
        const pkgName = tx.service.name || 'Wash';
        const currentPkg = stat.packageBreakdown.get(pkgName) || { count: 0, sales: 0 };
        currentPkg.count += 1;
        currentPkg.sales += tx.total;
        stat.packageBreakdown.set(pkgName, currentPkg);
      }

      // Track cashier processing
      if (tx.processedById && statMap.has(tx.processedById)) {
        statMap.get(tx.processedById)!.processedAsCashierCount += 1;
      }
    });

    const list = Array.from(statMap.values());

    // Sort by completed washes desc, then total sales desc
    list.sort((a, b) => b.completedWashes - a.completedWashes || b.totalSales - a.totalSales);
    return list;
  }, [filteredTransactions, allReportEmployees, employeeFilter, staffMap]);

  const handleResetFilters = () => {
    setDateFilter('month');
    setEmployeeFilter('ALL');
    setServiceFilter('ALL');
    setStatusFilter('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Printable Report Header (Screen visible + Print) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-900/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Employee-Wise Service Reports
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Performance analytics for car wash services performed by Cashier/Attendant staff.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Date Range Filter */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Date Period
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as ReportDateFilter)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days (Month)</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          {/* 2. Employee Attendant Filter */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Employee (Attendant)
            </label>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white cursor-pointer"
            >
              <option value="ALL">All Employees</option>
              {allReportEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} · {emp.employeeId} ({emp.role === 'admin' ? 'Admin' : 'Attendant'}
                  {!emp.active ? ' - Inactive' : ''})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Wash Package Filter */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Wash Package
            </label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white cursor-pointer"
            >
              <option value="ALL">All Wash Packages</option>
              {washPackages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} ({formatCurrency(pkg.price)})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Status Filter */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Transaction Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'completed' | 'voided')}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white cursor-pointer"
            >
              <option value="ALL">All Transactions</option>
              <option value="completed">Completed Only</option>
              <option value="voided">Voided / Cancelled Only</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Pickers (if custom selected) */}
        {dateFilter === 'custom' && (
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 text-xs">
            <div className="w-full sm:w-auto flex items-center gap-2">
              <span className="font-semibold text-slate-500">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
              />
            </div>
            <div className="w-full sm:w-auto flex items-center gap-2">
              <span className="font-semibold text-slate-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer flex items-center gap-1 sm:ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: Completed Washes */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Completed Washes</span>
            <Car className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {aggregateMetrics.totalCompletedWashes}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Non-voided services
          </p>
        </div>

        {/* Metric 2: Total Service Sales */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-blue-200 dark:border-blue-900/60 shadow-xs bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20">
          <div className="flex items-center justify-between text-blue-800 dark:text-blue-300 text-xs font-semibold">
            <span>Attributed Sales</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black text-blue-600 dark:text-cyan-400 font-mono">
            {formatCurrency(aggregateMetrics.totalSales)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Total completed revenue
          </p>
        </div>

        {/* Metric 3: Average Service Value */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Average Ticket</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {formatCurrency(aggregateMetrics.averageTicket)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Per completed wash
          </p>
        </div>

        {/* Metric 4: Attendants Active */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Active Attendants</span>
            <Users className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {aggregateMetrics.activeAttendantsCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            With services in period
          </p>
        </div>

        {/* Metric 5: Voided / Cancelled (Strictly separated) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-rose-200 dark:border-rose-900/60 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs font-semibold">
            <span>Voided / Cancelled</span>
            <Ban className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-1.5 text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {aggregateMetrics.voidedCount}
          </div>
          <p className="text-[11px] text-rose-500/80 dark:text-rose-400/80 mt-0.5">
            {formatCurrency(aggregateMetrics.voidedAmount)} (excluded from totals)
          </p>
        </div>
      </div>

      {/* Employee Breakdown Cards & Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Employee Service Performance</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-600 dark:text-slate-400">
              {employeeBreakdowns.length}
            </span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Sorted by total completed washes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employeeBreakdowns.map((emp) => {
            const avg = emp.completedWashes > 0 ? emp.totalSales / emp.completedWashes : 0;
            const packageEntries = Array.from(emp.packageBreakdown.entries());

            return (
              <div
                key={emp.employeeId + emp.name}
                className="bg-slate-50/70 dark:bg-slate-850 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-3.5 hover:shadow-md transition-shadow"
              >
                {/* Employee Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {emp.name}
                      </h4>
                      {!emp.active && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                        {emp.employeeId}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {emp.role === 'admin' ? 'Admin' : 'Cashier / Attendant'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 block">
                      {emp.completedWashes} washes
                    </span>
                  </div>
                </div>

                {/* Sales & Avg metrics */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-750 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total Sales
                    </span>
                    <span className="text-base font-black text-blue-600 dark:text-cyan-400 font-mono">
                      {formatCurrency(emp.totalSales)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Avg / Service
                    </span>
                    <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                      {formatCurrency(avg)}
                    </span>
                  </div>
                </div>

                {/* Package Breakdown Pills */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Wash Package Breakdown:
                  </span>
                  {packageEntries.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {packageEntries.map(([pkgName, data]) => (
                        <span
                          key={pkgName}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                        >
                          <span className="font-extrabold text-blue-600 dark:text-cyan-400">
                            {data.count}×
                          </span>
                          <span>{pkgName}</span>
                          <span className="text-slate-400 text-[10px]">
                            ({formatCurrency(data.sales)})
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No washes in this date range</span>
                  )}
                </div>

                {/* Voided Washes (if any) */}
                {emp.voidedCount > 0 && (
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs text-rose-800 dark:text-rose-300">
                    <span className="flex items-center gap-1 font-semibold">
                      <Ban className="w-3.5 h-3.5 text-rose-500" />
                      <span>{emp.voidedCount} Voided / Cancelled</span>
                    </span>
                    <span className="font-mono font-bold">
                      {formatCurrency(emp.voidedAmount)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {employeeBreakdowns.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-500 dark:text-slate-400">
              No employee performance data found for the selected filter period.
            </div>
          )}
        </div>
      </div>

      {/* Detailed Attributed Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Detailed Attributed Transactions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredTransactions.length} transaction records with employee attribution
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-3">Date / Time</th>
                <th className="py-3 px-3">Service Attendant</th>
                <th className="py-3 px-3">Register Cashier</th>
                <th className="py-3 px-3">Customer / Vehicle</th>
                <th className="py-3 px-4">Wash Package</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.map((tx) => {
                const isVoided = tx.status === 'voided';
                const dateObj = new Date(tx.timestamp);
                const formattedTime = dateObj.toLocaleTimeString(dateLocale, {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });
                const formattedDate = dateObj.toLocaleDateString(dateLocale, {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <tr
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className={`transition-colors cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/60 ${
                      isVoided ? 'bg-rose-50/20 dark:bg-rose-950/20 text-slate-400' : ''
                    }`}
                  >
                    {/* Receipt # */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {tx.receiptNumber}
                    </td>

                    {/* Date / Time */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      <span className="block font-medium">{formattedDate}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{formattedTime}</span>
                    </td>

                    {/* Service Attendant */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {tx.serviceAttendantName || 'Unassigned'}
                          </span>
                          {tx.serviceAttendantEmployeeId && (
                            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              {tx.serviceAttendantEmployeeId}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Register Cashier */}
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[120px]">
                        {tx.processedByName || 'Register'}
                      </span>
                      {tx.processedByRole && (
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          {tx.processedByRole}
                        </span>
                      )}
                    </td>

                    {/* Customer / Vehicle */}
                    <td className="py-3 px-3 max-w-[150px]">
                      <span className="font-semibold text-slate-900 dark:text-white block truncate">
                        {tx.customerNameAtSale || 'Guest'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                        {tx.vehicleDescriptionAtSale || tx.vehicleType.name}
                      </span>
                    </td>

                    {/* Wash Package */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {tx.service.name}
                      </span>
                      {tx.addOns.length > 0 && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-[140px]">
                          +{tx.addOns.map((a) => a.name).join(', ')}
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                      {formatCurrency(tx.total)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {isVoided ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                          <Ban className="w-3 h-3 text-rose-600" />
                          <span>Voided</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Completed</span>
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(tx);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 cursor-pointer"
                        title="View transaction details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500 dark:text-slate-400">
                    No transactions match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
