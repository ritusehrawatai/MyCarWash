import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// DATA STRUCTURES & INTERFACES
// ============================================================================

export interface DailyReportEmailConfig {
  enabled: boolean;
  recipientEmails: string[];
  deliveryTime: string; // "23:59"
  timezone: string; // "America/New_York"
  includeZeroWashEmployees: boolean;
  maxDetailedRecordsInEmail: number;
  googleAppsScriptUrl?: string;
  smtpConfig?: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    from?: string;
    secure?: boolean;
  };
}

export interface DeliveryLogRecord {
  id: string;
  reportDate: string; // YYYY-MM-DD
  recipient: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed';
  attemptCount: number;
  createdAt: string;
  lastAttemptAt: string;
  sentAt?: string;
  errorDetail?: string;
  triggerType: 'scheduled' | 'manual' | 'retry';
  summary?: {
    totalCompletedWashes: number;
    totalServiceSales: number;
    activeAttendantsCount: number;
    voidedCount: number;
  };
}

export interface EmployeeReportBreakdown {
  employeeId: string;
  name: string;
  role: string;
  active: boolean;
  completedWashes: number;
  totalSales: number;
  averageServiceValue: number;
  packageBreakdown: Array<{
    packageName: string;
    count: number;
    sales: number;
  }>;
  voidedCount: number;
  voidedAmount: number;
  processedAsCashierCount: number;
}

export interface DetailedServiceRecord {
  transactionId: string;
  receiptNumber: string;
  timestamp: string;
  formattedTime: string;
  serviceAttendantId?: string;
  serviceAttendantName: string;
  serviceAttendantEmployeeId: string;
  processedByName: string;
  serviceName: string;
  vehicleType: string;
  addOns: string[];
  totalAmount: number;
  paymentMethod: string;
  status: 'completed' | 'voided';
}

export interface DailyReportSummary {
  businessName: string;
  businessDate: string; // YYYY-MM-DD
  generatedAt: string; // ISO
  timezone: string;
  totalCompletedWashes: number;
  totalServiceSales: number;
  averageTicketValue: number;
  activeAttendantsCount: number;
  totalVoidedCount: number;
  totalVoidedAmount: number;
  employeeBreakdowns: EmployeeReportBreakdown[];
  detailedRecords: DetailedServiceRecord[];
  totalDetailedRecordsCount: number;
}

export interface SyncedPosData {
  transactions: any[];
  accounts: any[];
  businessInfo: any;
  lastSyncedAt: string;
}

// ============================================================================
// DEFAULT INITIAL SERVER DATA
// ============================================================================

const DEFAULT_ACCOUNTS = [
  {
    id: 'USR-ADMIN-1',
    employeeId: 'EMP-1001',
    email: 'admin@carwash.com',
    name: 'Sarah Jenkins',
    role: 'admin',
    active: true,
  },
  {
    id: 'USR-CASHIER-1',
    employeeId: 'EMP-1002',
    email: 'cashier@carwash.com',
    name: 'Alex Rivera',
    role: 'cashier',
    active: true,
  },
  {
    id: 'USR-CASHIER-2',
    employeeId: 'EMP-1003',
    email: 'marcus.vance@carwash.com',
    name: 'Marcus Vance',
    role: 'cashier',
    active: true,
  },
  {
    id: 'USR-CASHIER-3',
    employeeId: 'EMP-1004',
    email: 'elena.rodriguez@carwash.com',
    name: 'Elena Rodriguez',
    role: 'cashier',
    active: true,
  },
];

const DEFAULT_CONFIG: DailyReportEmailConfig = {
  enabled: true,
  recipientEmails: ['admin@carwash.com'],
  deliveryTime: '23:59',
  timezone: 'America/New_York',
  includeZeroWashEmployees: false,
  maxDetailedRecordsInEmail: 50,
};

// ============================================================================
// FILE-BASED PERSISTENT STORAGE
// ============================================================================

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'report_config.json');
const LOGS_FILE = path.join(DATA_DIR, 'report_delivery_logs.json');
const POS_DATA_FILE = path.join(DATA_DIR, 'server_pos_data.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getReportConfig(): DailyReportEmailConfig {
  ensureDataDir();
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (err) {
    console.error('[ServerStorage] Error reading config file:', err);
  }
  return DEFAULT_CONFIG;
}

function saveReportConfig(config: DailyReportEmailConfig): void {
  ensureDataDir();
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ServerStorage] Error writing config file:', err);
  }
}

function getDeliveryLogs(): DeliveryLogRecord[] {
  ensureDataDir();
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('[ServerStorage] Error reading logs file:', err);
  }
  return [];
}

function recordDeliveryLog(log: DeliveryLogRecord): void {
  ensureDataDir();
  try {
    const logs = getDeliveryLogs();
    const existingIndex = logs.findIndex((l) => l.id === log.id);
    if (existingIndex >= 0) {
      logs[existingIndex] = log;
    } else {
      logs.unshift(log); // newest first
    }
    const trimmed = logs.slice(0, 100);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ServerStorage] Error writing logs file:', err);
  }
}

function isReportAlreadySent(reportDate: string, recipient: string): boolean {
  const logs = getDeliveryLogs();
  return logs.some(
    (l) =>
      l.reportDate === reportDate &&
      l.recipient.toLowerCase().trim() === recipient.toLowerCase().trim() &&
      l.status === 'sent'
  );
}

function getSyncedPosData(): SyncedPosData {
  ensureDataDir();
  try {
    if (fs.existsSync(POS_DATA_FILE)) {
      const data = fs.readFileSync(POS_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.transactions) && Array.isArray(parsed.accounts)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('[ServerStorage] Error reading POS data file:', err);
  }

  // Generate sensible baseline transactions for today
  const now = new Date();
  const baselineTx = [
    {
      id: `tx_${now.getTime()}_1`,
      receiptNumber: 'CW-100231',
      timestamp: new Date(now.getTime() - 4 * 3600000).toISOString(),
      status: 'completed',
      serviceAttendantId: 'USR-CASHIER-1',
      serviceAttendantName: 'Alex Rivera',
      serviceAttendantEmployeeId: 'EMP-1002',
      serviceAttendantRole: 'cashier',
      processedById: 'USR-CASHIER-1',
      processedByName: 'Alex Rivera',
      service: { id: 'deluxe', name: 'Deluxe Wash', price: 20 },
      vehicleType: { id: 'car', name: 'Car', surcharge: 0 },
      addOns: [{ id: 'tire_shine', name: 'Tire Shine', price: 5 }],
      subtotal: 25,
      taxRate: 0.0825,
      taxAmount: 2.06,
      total: 27.06,
      paymentMethod: 'CREDIT_CARD',
    },
    {
      id: `tx_${now.getTime()}_2`,
      receiptNumber: 'CW-100232',
      timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
      status: 'completed',
      serviceAttendantId: 'USR-CASHIER-2',
      serviceAttendantName: 'Marcus Vance',
      serviceAttendantEmployeeId: 'EMP-1003',
      serviceAttendantRole: 'cashier',
      processedById: 'USR-CASHIER-1',
      processedByName: 'Alex Rivera',
      service: { id: 'premium', name: 'Premium Wash', price: 25 },
      vehicleType: { id: 'suv_truck', name: 'SUV / Truck', surcharge: 5 },
      addOns: [{ id: 'hot_wax', name: 'Hot Wax', price: 5 }],
      subtotal: 35,
      taxRate: 0.0825,
      taxAmount: 2.89,
      total: 37.89,
      paymentMethod: 'CASH',
    },
    {
      id: `tx_${now.getTime()}_3`,
      receiptNumber: 'CW-100233',
      timestamp: new Date(now.getTime() - 1 * 3600000).toISOString(),
      status: 'completed',
      serviceAttendantId: 'USR-CASHIER-3',
      serviceAttendantName: 'Elena Rodriguez',
      serviceAttendantEmployeeId: 'EMP-1004',
      serviceAttendantRole: 'cashier',
      processedById: 'USR-ADMIN-1',
      processedByName: 'Sarah Jenkins',
      service: { id: 'full', name: 'Full Service', price: 35 },
      vehicleType: { id: 'car', name: 'Car', surcharge: 0 },
      addOns: [],
      subtotal: 35,
      taxRate: 0.0825,
      taxAmount: 2.89,
      total: 37.89,
      paymentMethod: 'DEBIT_CARD',
    },
  ];

  return {
    transactions: baselineTx,
    accounts: DEFAULT_ACCOUNTS,
    businessInfo: { businessName: 'AquaShine' },
    lastSyncedAt: new Date().toISOString(),
  };
}

function saveSyncedPosData(transactions: any[], accounts: any[], businessInfo: any): void {
  ensureDataDir();
  try {
    const payload: SyncedPosData = {
      transactions,
      accounts: accounts && accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS,
      businessInfo: businessInfo || { businessName: 'AquaShine' },
      lastSyncedAt: new Date().toISOString(),
    };
    fs.writeFileSync(POS_DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ServerStorage] Error writing POS data file:', err);
  }
}

// ============================================================================
// DATE, TIME & REPORT CALCULATION HELPERS
// ============================================================================

function formatDateInTimezone(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function formatTimeInTimezone(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return formatter.format(date);
  } catch {
    return date.toLocaleTimeString();
  }
}

function getTimeInTimezone(timeZone: string, date: Date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(date);

    let year = '',
      month = '',
      day = '',
      hour = 0,
      minute = 0;
    for (const part of parts) {
      if (part.type === 'year') year = part.value;
      if (part.type === 'month') month = part.value;
      if (part.type === 'day') day = part.value;
      if (part.type === 'hour') hour = parseInt(part.value, 10);
      if (part.type === 'minute') minute = parseInt(part.value, 10);
    }

    const dateStr = `${year}-${month}-${day}`;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return { hour, minute, dateStr, timeStr };
  } catch {
    const fallbackDateStr = date.toISOString().slice(0, 10);
    const hour = date.getHours();
    const minute = date.getMinutes();
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return { hour, minute, dateStr: fallbackDateStr, timeStr };
  }
}

function getTargetReportDate(timeZone: string, deliveryHour: number, currentDate: Date = new Date()): string {
  if (deliveryHour < 6) {
    const yesterday = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    return formatDateInTimezone(yesterday, timeZone);
  }
  return formatDateInTimezone(currentDate, timeZone);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function escapeHtml(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function calculateDailyReport(
  transactions: any[],
  accounts: any[],
  targetDateStr: string,
  timeZone: string,
  businessName: string = 'AquaShine'
): DailyReportSummary {
  const staffMap = new Map<string, any>();
  accounts.forEach((a) => {
    staffMap.set(a.id, a);
    if (a.employeeId) {
      staffMap.set(a.employeeId.toUpperCase(), a);
    }
  });

  const dateTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.timestamp);
    const txDateStr = formatDateInTimezone(txDate, timeZone);
    return txDateStr === targetDateStr;
  });

  const completedTx = dateTransactions.filter((tx) => tx.status !== 'voided');
  const voidedTx = dateTransactions.filter((tx) => tx.status === 'voided');

  const totalCompletedWashes = completedTx.length;
  const totalServiceSales = completedTx.reduce((sum, tx) => sum + (tx.total || 0), 0);
  const averageTicketValue = totalCompletedWashes > 0 ? totalServiceSales / totalCompletedWashes : 0;
  const totalVoidedCount = voidedTx.length;
  const totalVoidedAmount = voidedTx.reduce((sum, tx) => sum + (tx.total || 0), 0);

  const statMap = new Map<string, any>();

  accounts.forEach((acc) => {
    if (acc.role === 'admin' || acc.role === 'cashier') {
      statMap.set(acc.id, {
        employeeId: acc.employeeId || 'ID',
        name: acc.name,
        role: acc.role,
        active: acc.active !== false,
        completedWashes: 0,
        totalSales: 0,
        packageBreakdown: new Map(),
        voidedCount: 0,
        voidedAmount: 0,
        processedAsCashierCount: 0,
      });
    }
  });

  dateTransactions.forEach((tx) => {
    let attendantKey = tx.serviceAttendantId;
    if (!attendantKey && tx.serviceAttendantEmployeeId) {
      const match = accounts.find((a) => a.employeeId === tx.serviceAttendantEmployeeId);
      attendantKey = match?.id;
    }
    if (!attendantKey) {
      attendantKey = 'unassigned';
    }

    if (!statMap.has(attendantKey)) {
      statMap.set(attendantKey, {
        employeeId: tx.serviceAttendantEmployeeId || 'EMP-N/A',
        name: tx.serviceAttendantName || 'Unassigned Attendant',
        role: tx.serviceAttendantRole || 'cashier',
        active: false,
        completedWashes: 0,
        totalSales: 0,
        packageBreakdown: new Map(),
        voidedCount: 0,
        voidedAmount: 0,
        processedAsCashierCount: 0,
      });
    }

    const stat = statMap.get(attendantKey)!;

    if (tx.status === 'voided') {
      stat.voidedCount += 1;
      stat.voidedAmount += tx.total || 0;
    } else {
      stat.completedWashes += 1;
      stat.totalSales += tx.total || 0;

      const pkgName = tx.service?.name || 'Standard Wash';
      const currentPkg = stat.packageBreakdown.get(pkgName) || { count: 0, sales: 0 };
      currentPkg.count += 1;
      currentPkg.sales += tx.total || 0;
      stat.packageBreakdown.set(pkgName, currentPkg);
    }

    if (tx.processedById && statMap.has(tx.processedById)) {
      statMap.get(tx.processedById)!.processedAsCashierCount += 1;
    }
  });

  const employeeBreakdowns: EmployeeReportBreakdown[] = Array.from(statMap.values())
    .map((s: any) => ({
      employeeId: s.employeeId,
      name: s.name,
      role: s.role,
      active: s.active,
      completedWashes: s.completedWashes,
      totalSales: s.totalSales,
      averageServiceValue: s.completedWashes > 0 ? s.totalSales / s.completedWashes : 0,
      packageBreakdown: Array.from(s.packageBreakdown.entries()).map(([name, data]: any) => ({
        packageName: name,
        count: data.count,
        sales: data.sales,
      })),
      voidedCount: s.voidedCount,
      voidedAmount: s.voidedAmount,
      processedAsCashierCount: s.processedAsCashierCount,
    }))
    .sort((a, b) => b.completedWashes - a.completedWashes || b.totalSales - a.totalSales);

  const activeAttendantsCount = employeeBreakdowns.filter((e) => e.completedWashes > 0).length;

  const sortedTx = [...dateTransactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const detailedRecords: DetailedServiceRecord[] = sortedTx.map((tx) => {
    const txDate = new Date(tx.timestamp);
    return {
      transactionId: tx.id,
      receiptNumber: tx.receiptNumber,
      timestamp: tx.timestamp,
      formattedTime: formatTimeInTimezone(txDate, timeZone),
      serviceAttendantId: tx.serviceAttendantId,
      serviceAttendantName: tx.serviceAttendantName || 'Attendant',
      serviceAttendantEmployeeId: tx.serviceAttendantEmployeeId || 'EMP-N/A',
      processedByName: tx.processedByName || 'Cashier',
      serviceName: tx.service?.name || 'Wash Service',
      vehicleType: tx.vehicleType?.name || 'Car',
      addOns: (tx.addOns || []).map((a: any) => a.name),
      totalAmount: tx.total || 0,
      paymentMethod: tx.paymentMethod,
      status: tx.status,
    };
  });

  return {
    businessName,
    businessDate: targetDateStr,
    generatedAt: new Date().toISOString(),
    timezone: timeZone,
    totalCompletedWashes,
    totalServiceSales,
    averageTicketValue,
    activeAttendantsCount,
    totalVoidedCount,
    totalVoidedAmount,
    employeeBreakdowns,
    detailedRecords,
    totalDetailedRecordsCount: detailedRecords.length,
  };
}

function generateReportHtml(
  report: DailyReportSummary,
  appUrl?: string,
  maxDetailedRecords: number = 50
): string {
  const currency = formatCurrency;
  const activeEmployees = report.employeeBreakdowns.filter(
    (e) => e.completedWashes > 0 || e.voidedCount > 0
  );
  const displayEmployees = activeEmployees.length > 0 ? activeEmployees : report.employeeBreakdowns;
  const recordsToShow = report.detailedRecords.slice(0, maxDetailedRecords);
  const hasMoreRecords = report.detailedRecords.length > maxDetailedRecords;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.businessName} - Daily Employee Service Report - ${report.businessDate}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; line-height: 1.5; }
    .container { max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 32px 28px; text-align: left; }
    .header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .meta-bar { background: #f0fdf4; border-bottom: 1px solid #dcfce7; padding: 12px 28px; font-size: 13px; color: #166534; font-weight: 600; }
    .content { padding: 28px; }
    .section-title { font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 14px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; }
    .summary-grid { display: table; width: 100%; border-spacing: 12px; margin-left: -12px; margin-right: -12px; }
    .summary-cell { display: table-cell; width: 33.33%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
    .stat-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px; }
    .stat-value { font-size: 24px; font-weight: 900; color: #0284c7; margin-top: 4px; }
    .stat-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 12px 0; }
    th { background: #f1f5f9; color: #475569; font-weight: 700; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    tr:nth-child(even) td { background-color: #fafafa; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .badge-primary { background: #e0f2fe; color: #0369a1; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .emp-name { font-weight: 700; color: #0f172a; }
    .emp-id { font-family: monospace; font-size: 11px; color: #64748b; }
    .tag { display: inline-block; background: #e2e8f0; color: #334155; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin: 2px 2px 2px 0; font-weight: 600; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; }
    .btn { display: inline-block; background: #0284c7; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 13px; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(report.businessName)}</h1>
      <p>Daily Employee Service Report · Business Date: <strong>${report.businessDate}</strong></p>
    </div>

    <div class="meta-bar">
      <span>Timezone: ${escapeHtml(report.timezone)}</span> | 
      <span>Generated: ${new Date(report.generatedAt).toLocaleString('en-US', { timeZone: report.timezone })}</span>
    </div>

    <div class="content">
      <div class="section-title">Daily Operations Summary</div>
      <div class="summary-grid">
        <div class="summary-cell">
          <div class="stat-label">Completed Washes</div>
          <div class="stat-value">${report.totalCompletedWashes}</div>
          <div class="stat-sub">${report.activeAttendantsCount} Active Attendants</div>
        </div>
        <div class="summary-cell">
          <div class="stat-label">Total Service Sales</div>
          <div class="stat-value" style="color: #059669;">${currency(report.totalServiceSales)}</div>
          <div class="stat-sub">Avg. Ticket: ${currency(report.averageTicketValue)}</div>
        </div>
        <div class="summary-cell">
          <div class="stat-label">Cancelled / Voided</div>
          <div class="stat-value" style="color: #dc2626;">${report.totalVoidedCount}</div>
          <div class="stat-sub">${currency(report.totalVoidedAmount)} Voided Sales</div>
        </div>
      </div>

      <div class="section-title">Employee-Wise Performance</div>
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Washes</th>
            <th>Service Breakdown</th>
            <th style="text-align: right;">Total Sales</th>
            <th style="text-align: right;">Avg / Wash</th>
          </tr>
        </thead>
        <tbody>
          ${displayEmployees.map((emp) => `
            <tr>
              <td>
                <div class="emp-name">${escapeHtml(emp.name)}</div>
                <div class="emp-id">${escapeHtml(emp.employeeId)} · <span class="badge ${emp.role === 'admin' ? 'badge-primary' : 'badge-success'}">${escapeHtml(emp.role)}</span></div>
              </td>
              <td>
                <strong style="font-size: 14px; color: #0284c7;">${emp.completedWashes}</strong>
                ${emp.voidedCount > 0 ? `<div style="font-size: 10px; color: #dc2626;">(${emp.voidedCount} voided)</div>` : ''}
              </td>
              <td>
                ${emp.packageBreakdown.length > 0 ? emp.packageBreakdown.map((p) => `<span class="tag">${escapeHtml(p.packageName)}: ${p.count}</span>`).join(' ') : '<span style="color: #94a3b8; font-style: italic;">No washes</span>'}
              </td>
              <td style="text-align: right; font-weight: 700; color: #0f172a;">
                ${currency(emp.totalSales)}
              </td>
              <td style="text-align: right; color: #475569;">
                ${currency(emp.averageServiceValue)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-title">Detailed Service Records (${report.totalDetailedRecordsCount} Total)</div>
      ${recordsToShow.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Receipt</th>
              <th>Attendant</th>
              <th>Package & Vehicle</th>
              <th>Status</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${recordsToShow.map((rec) => `
              <tr>
                <td style="white-space: nowrap; font-size: 12px; color: #475569;">${rec.formattedTime}</td>
                <td><span style="font-family: monospace; font-size: 11px; font-weight: bold; color: #0369a1;">${escapeHtml(rec.receiptNumber)}</span></td>
                <td>
                  <div style="font-weight: 600;">${escapeHtml(rec.serviceAttendantName)}</div>
                  <div style="font-size: 10px; color: #94a3b8;">${escapeHtml(rec.serviceAttendantEmployeeId)}</div>
                </td>
                <td>
                  <div><strong>${escapeHtml(rec.serviceName)}</strong></div>
                  <div style="font-size: 11px; color: #64748b;">${escapeHtml(rec.vehicleType)}${rec.addOns.length > 0 ? ` · ${escapeHtml(rec.addOns.join(', '))}` : ''}</div>
                </td>
                <td>
                  <span class="badge ${rec.status === 'completed' ? 'badge-success' : 'badge-danger'}">
                    ${rec.status === 'completed' ? 'Completed' : 'Voided'}
                  </span>
                </td>
                <td style="text-align: right; font-weight: 700;">
                  ${currency(rec.totalAmount)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${hasMoreRecords ? `
          <p style="text-align: center; color: #64748b; font-size: 12px; margin: 16px 0;">
            Showing first ${maxDetailedRecords} of ${report.totalDetailedRecordsCount} service transactions.
          </p>
        ` : ''}
      ` : `
        <p style="color: #64748b; text-align: center; padding: 24px;">No car wash service records recorded on ${report.businessDate}.</p>
      `}

      ${appUrl ? `
        <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <a href="${appUrl}" class="btn" target="_blank" rel="noopener noreferrer">View Full Interactive Report in POS</a>
        </div>
      ` : ''}
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0; font-weight: 600;">${escapeHtml(report.businessName)} · Automated End-of-Day Operations Report</p>
      <p style="margin: 0;">This email was automatically generated and sent to configured Administrators.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateReportPlainText(report: DailyReportSummary, appUrl?: string): string {
  const currency = formatCurrency;
  const lines: string[] = [];

  lines.push('================================================================');
  lines.push(`${report.businessName.toUpperCase()}`);
  lines.push(`DAILY EMPLOYEE SERVICE REPORT`);
  lines.push(`Business Date: ${report.businessDate}`);
  lines.push(`Timezone: ${report.timezone}`);
  lines.push(`Generated: ${new Date(report.generatedAt).toLocaleString('en-US', { timeZone: report.timezone })}`);
  lines.push('================================================================\n');

  lines.push('A. DAILY SUMMARY');
  lines.push('----------------------------------------------------------------');
  lines.push(`• Total Completed Car Washes: ${report.totalCompletedWashes}`);
  lines.push(`• Total Service Sales: ${currency(report.totalServiceSales)}`);
  lines.push(`• Average Ticket Value: ${currency(report.averageTicketValue)}`);
  lines.push(`• Active Service Attendants: ${report.activeAttendantsCount}`);
  lines.push(`• Cancelled / Voided Washes: ${report.totalVoidedCount} (${currency(report.totalVoidedAmount)})\n`);

  lines.push('B. EMPLOYEE-WISE PERFORMANCE');
  lines.push('----------------------------------------------------------------');
  report.employeeBreakdowns.forEach((emp) => {
    lines.push(`• ${emp.name} (${emp.employeeId}) [${emp.role.toUpperCase()}]`);
    lines.push(`  - Completed Washes: ${emp.completedWashes}`);
    lines.push(`  - Total Sales: ${currency(emp.totalSales)}`);
    lines.push(`  - Average Service Value: ${currency(emp.averageServiceValue)}`);
    if (emp.packageBreakdown.length > 0) {
      const pkgs = emp.packageBreakdown.map((p) => `${p.packageName}: ${p.count}`).join(', ');
      lines.push(`  - Services Breakdown: ${pkgs}`);
    }
    if (emp.voidedCount > 0) {
      lines.push(`  - Voided: ${emp.voidedCount} (${currency(emp.voidedAmount)})`);
    }
    lines.push('');
  });

  lines.push('C. RECENT SERVICE TRANSACTIONS');
  lines.push('----------------------------------------------------------------');
  const previewRecords = report.detailedRecords.slice(0, 20);
  previewRecords.forEach((r) => {
    lines.push(
      `[${r.formattedTime}] ${r.receiptNumber} | ${r.serviceAttendantName} (${r.serviceAttendantEmployeeId}) | ${r.serviceName} (${r.vehicleType}) | ${currency(r.totalAmount)} | ${r.status.toUpperCase()}`
    );
  });

  if (report.detailedRecords.length > 20) {
    lines.push(`\n... and ${report.detailedRecords.length - 20} more transactions.`);
  }

  if (appUrl) {
    lines.push(`\nView detailed report in POS: ${appUrl}`);
  }

  lines.push('\n================================================================');
  lines.push('End of Report');

  return lines.join('\n');
}

// ============================================================================
// EMAIL DISPATCH TRANSPORT
// ============================================================================

async function dispatchReportEmail(options: {
  recipient: string;
  subject: string;
  htmlBody: string;
  plainBody: string;
  config: DailyReportEmailConfig;
  businessName?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { recipient, subject, htmlBody, plainBody, config, businessName = 'AquaShine' } = options;

  // 1. Check for SMTP credentials
  const smtpHost = process.env.SMTP_HOST || config.smtpConfig?.host;
  const smtpPort = parseInt(process.env.SMTP_PORT || String(config.smtpConfig?.port || 587), 10);
  const smtpUser = process.env.SMTP_USER || config.smtpConfig?.user;
  const smtpPass = process.env.SMTP_PASS || config.smtpConfig?.pass;
  const smtpFrom = process.env.SMTP_FROM || config.smtpConfig?.from || `"${businessName}" <reports@carwash.com>`;
  const smtpSecure = process.env.SMTP_SECURE === 'true' || config.smtpConfig?.secure === true || smtpPort === 465;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to: recipient,
        subject,
        text: plainBody,
        html: htmlBody,
      });

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error('[EmailTransport] SMTP send error:', err);
      return { success: false, error: `SMTP delivery failed: ${err.message || String(err)}` };
    }
  }

  // 2. Check for Google Apps Script Web App URL
  const scriptUrl =
    config.googleAppsScriptUrl ||
    process.env.GOOGLE_APPS_SCRIPT_URL ||
    process.env.VITE_GOOGLE_APPS_SCRIPT_URL;

  if (scriptUrl && scriptUrl.trim() !== '') {
    try {
      const payload = {
        type: 'daily_service_report',
        action: 'daily_service_report',
        recipient,
        subject,
        htmlBody,
        plainBody,
        businessName,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(scriptUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Google Apps Script HTTP error ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      let json: any = {};
      try {
        json = JSON.parse(text);
      } catch {
        // Fallback for HTML redirects
      }

      if (json.status === 'error') {
        throw new Error(json.message || 'Google Apps Script reported an error');
      }

      return { success: true, messageId: json.messageId || `gas_${Date.now()}` };
    } catch (err: any) {
      console.error('[EmailTransport] Google Apps Script relay error:', err);
      return { success: false, error: `Google Apps Script relay failed: ${err.message || String(err)}` };
    }
  }

  return {
    success: false,
    error: 'No email transport configured. Please configure SMTP in .env or provide your Google Apps Script Web App URL in Settings.',
  };
}

async function executeReportDelivery(
  targetDateStr: string,
  recipient: string,
  triggerType: 'scheduled' | 'manual' | 'retry',
  existingLogId?: string
): Promise<{ success: boolean; log: DeliveryLogRecord }> {
  const config = getReportConfig();
  const posData = getSyncedPosData();
  const businessName = posData.businessInfo?.businessName || 'AquaShine';

  const reportData = calculateDailyReport(
    posData.transactions,
    posData.accounts,
    targetDateStr,
    config.timezone,
    businessName
  );

  const appUrl = process.env.APP_URL || '';
  const subject = `${businessName} POS – Daily Employee Service Report – ${targetDateStr}`;
  const htmlBody = generateReportHtml(reportData, appUrl, config.maxDetailedRecordsInEmail);
  const plainBody = generateReportPlainText(reportData, appUrl);

  const logId = existingLogId || `log_${targetDateStr}_${recipient.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
  const existingLog = existingLogId ? getDeliveryLogs().find((l) => l.id === existingLogId) : null;
  const attemptCount = (existingLog?.attemptCount || 0) + 1;

  const initialLog: DeliveryLogRecord = {
    id: logId,
    reportDate: targetDateStr,
    recipient,
    subject,
    status: 'pending',
    attemptCount,
    createdAt: existingLog?.createdAt || new Date().toISOString(),
    lastAttemptAt: new Date().toISOString(),
    triggerType,
    summary: {
      totalCompletedWashes: reportData.totalCompletedWashes,
      totalServiceSales: reportData.totalServiceSales,
      activeAttendantsCount: reportData.activeAttendantsCount,
      voidedCount: reportData.totalVoidedCount,
    },
  };

  recordDeliveryLog(initialLog);

  const dispatchResult = await dispatchReportEmail({
    recipient,
    subject,
    htmlBody,
    plainBody,
    config,
    businessName,
  });

  const updatedLog: DeliveryLogRecord = {
    ...initialLog,
    status: dispatchResult.success ? 'sent' : 'failed',
    sentAt: dispatchResult.success ? new Date().toISOString() : undefined,
    errorDetail: dispatchResult.success ? undefined : dispatchResult.error,
  };

  recordDeliveryLog(updatedLog);

  return { success: dispatchResult.success, log: updatedLog };
}

async function sendTestReportEmail(recipient: string): Promise<{ success: boolean; error?: string }> {
  const config = getReportConfig();
  const posData = getSyncedPosData();
  const businessName = posData.businessInfo?.businessName || 'AquaShine';
  const todayStr = formatDateInTimezone(new Date(), config.timezone);

  const reportData = calculateDailyReport(
    posData.transactions,
    posData.accounts,
    todayStr,
    config.timezone,
    businessName
  );

  const appUrl = process.env.APP_URL || '';
  const subject = `${businessName} POS – Test Daily Employee Service Report – ${todayStr}`;
  const htmlBody = generateReportHtml(reportData, appUrl, 10);
  const plainBody = generateReportPlainText(reportData, appUrl);

  const result = await dispatchReportEmail({
    recipient,
    subject,
    htmlBody,
    plainBody,
    config,
    businessName,
  });

  const testLog: DeliveryLogRecord = {
    id: `test_${Date.now()}`,
    reportDate: todayStr,
    recipient,
    subject,
    status: result.success ? 'sent' : 'failed',
    attemptCount: 1,
    createdAt: new Date().toISOString(),
    lastAttemptAt: new Date().toISOString(),
    sentAt: result.success ? new Date().toISOString() : undefined,
    errorDetail: result.error,
    triggerType: 'manual',
    summary: {
      totalCompletedWashes: reportData.totalCompletedWashes,
      totalServiceSales: reportData.totalServiceSales,
      activeAttendantsCount: reportData.activeAttendantsCount,
      voidedCount: reportData.totalVoidedCount,
    },
  };
  recordDeliveryLog(testLog);

  return { success: result.success, error: result.error };
}

// ============================================================================
// BACKGROUND SCHEDULER
// ============================================================================

let schedulerInterval: NodeJS.Timeout | null = null;
let isJobRunning = false;
let lastEvaluatedMinute = '';

async function checkScheduleTick() {
  if (isJobRunning) return;
  isJobRunning = true;

  try {
    const config = getReportConfig();
    if (!config.enabled) return;

    const { timeStr, dateStr, hour } = getTimeInTimezone(config.timezone);
    const minuteKey = `${dateStr}_${timeStr}`;

    if (minuteKey === lastEvaluatedMinute) return;

    const scheduledTime = (config.deliveryTime || '23:59').trim();
    if (timeStr === scheduledTime) {
      lastEvaluatedMinute = minuteKey;
      console.log(`[Scheduler] Triggering scheduled daily report at ${timeStr} (${config.timezone})`);

      const targetReportDate = getTargetReportDate(config.timezone, hour, new Date());
      const recipients = config.recipientEmails && config.recipientEmails.length > 0
        ? config.recipientEmails
        : ['admin@carwash.com'];

      for (const recipient of recipients) {
        const cleanRecipient = recipient.trim();
        if (!cleanRecipient || !cleanRecipient.includes('@')) continue;

        if (isReportAlreadySent(targetReportDate, cleanRecipient)) {
          console.log(`[Scheduler] Report for ${targetReportDate} to ${cleanRecipient} already sent. Skipping.`);
          continue;
        }

        try {
          const res = await executeReportDelivery(targetReportDate, cleanRecipient, 'scheduled');
          console.log(`[Scheduler] Delivery result for ${cleanRecipient}:`, res.success ? 'SUCCESS' : 'FAILED');
        } catch (err) {
          console.error(`[Scheduler] Error sending report to ${cleanRecipient}:`, err);
        }
      }
    }

    // Check failed deliveries retry
    const logs = getDeliveryLogs();
    const now = Date.now();
    for (const log of logs) {
      if (log.status === 'failed' && log.attemptCount < 3 && log.triggerType === 'scheduled') {
        const lastAttempt = new Date(log.lastAttemptAt).getTime();
        if (now - lastAttempt > 10 * 60 * 1000) {
          if (isReportAlreadySent(log.reportDate, log.recipient)) continue;
          console.log(`[Scheduler] Retrying failed report delivery for ${log.recipient} (${log.reportDate})`);
          await executeReportDelivery(log.reportDate, log.recipient, 'retry', log.id);
        }
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error in checkScheduleTick:', err);
  } finally {
    isJobRunning = false;
  }
}

function startReportScheduler() {
  if (schedulerInterval) clearInterval(schedulerInterval);
  console.log('[Scheduler] Daily Report Background Scheduler running (30s interval)...');
  setTimeout(() => checkScheduleTick(), 5000);
  schedulerInterval = setInterval(checkScheduleTick, 30000);
}

// ============================================================================
// EXPRESS APP & API ROUTES
// ============================================================================

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json({ limit: '10mb' }));

app.get('/api/reports/config', (req, res) => {
  try {
    const config = getReportConfig();
    const serverTimeUtc = new Date().toISOString();
    const businessTime = getTimeInTimezone(config.timezone);
    const targetReportDate = getTargetReportDate(config.timezone, businessTime.hour);

    res.json({
      config,
      serverStatus: {
        serverTimeUtc,
        businessTime: businessTime.timeStr,
        businessDate: businessTime.dateStr,
        targetReportDate,
        timezone: config.timezone,
        hasSmtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
        hasGoogleAppsScriptConfigured: Boolean(
          config.googleAppsScriptUrl ||
          process.env.GOOGLE_APPS_SCRIPT_URL ||
          process.env.VITE_GOOGLE_APPS_SCRIPT_URL
        ),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch config' });
  }
});

app.post('/api/reports/config', (req, res) => {
  try {
    const newConfig = req.body;
    if (!newConfig || typeof newConfig !== 'object') {
      return res.status(400).json({ error: 'Invalid configuration payload' });
    }

    if (Array.isArray(newConfig.recipientEmails)) {
      newConfig.recipientEmails = newConfig.recipientEmails.map((e: string) => String(e).trim()).filter(Boolean);
      for (const email of newConfig.recipientEmails) {
        if (!email.includes('@') || !email.includes('.')) {
          return res.status(400).json({ error: `Invalid email address: ${email}` });
        }
      }
    }

    saveReportConfig(newConfig);
    console.log('[Server] Daily report configuration saved');
    res.json({ success: true, config: getReportConfig() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save config' });
  }
});

app.get('/api/reports/logs', (req, res) => {
  try {
    res.json({ logs: getDeliveryLogs() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch logs' });
  }
});

app.post('/api/reports/send-test', async (req, res) => {
  try {
    const { recipient } = req.body;
    const config = getReportConfig();
    const targetRecipient = recipient?.trim() || config.recipientEmails[0] || 'admin@carwash.com';

    if (!targetRecipient || !targetRecipient.includes('@')) {
      return res.status(400).json({ error: 'Valid recipient email address is required' });
    }

    console.log(`[Server] Dispatching test report email to ${targetRecipient}...`);
    const result = await sendTestReportEmail(targetRecipient);
    res.json(result);
  } catch (err: any) {
    console.error('[Server] Test email error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to send test email' });
  }
});

app.post('/api/reports/send-daily', async (req, res) => {
  try {
    const { date, recipient } = req.body;
    const config = getReportConfig();
    const businessTime = getTimeInTimezone(config.timezone);
    const targetDate = date?.trim() || businessTime.dateStr;

    const recipients = recipient?.trim()
      ? [recipient.trim()]
      : config.recipientEmails && config.recipientEmails.length > 0
      ? config.recipientEmails
      : ['admin@carwash.com'];

    const results = [];
    for (const r of recipients) {
      if (!r || !r.includes('@')) continue;
      const result = await executeReportDelivery(targetDate, r, 'manual');
      results.push(result);
    }

    res.json({
      success: results.some((r) => r.success),
      results,
      targetDate,
    });
  } catch (err: any) {
    console.error('[Server] Manual report dispatch error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to send daily report' });
  }
});

app.post('/api/reports/retry', async (req, res) => {
  try {
    const { logId } = req.body;
    if (!logId) {
      return res.status(400).json({ error: 'logId is required for retry' });
    }

    const logs = getDeliveryLogs();
    const log = logs.find((l) => l.id === logId);
    if (!log) {
      return res.status(404).json({ error: 'Delivery log record not found' });
    }

    console.log(`[Server] Manually retrying report delivery for log ${logId} (${log.recipient})...`);
    const result = await executeReportDelivery(log.reportDate, log.recipient, 'retry', log.id);
    res.json(result);
  } catch (err: any) {
    console.error('[Server] Retry error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to retry delivery' });
  }
});

app.post('/api/reports/sync-pos', (req, res) => {
  try {
    const { transactions, accounts, businessInfo } = req.body;
    if (Array.isArray(transactions) && Array.isArray(accounts)) {
      saveSyncedPosData(transactions, accounts, businessInfo || {});
      return res.json({ success: true, count: transactions.length });
    }
    res.status(400).json({ error: 'transactions and accounts arrays are required' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to sync POS data' });
  }
});

// ============================================================================
// SERVER INITIALIZATION (DEV VITE / PROD STATIC)
// ============================================================================

async function startServer() {
  startReportScheduler();

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn('[Server] dist directory not found. Please run npm run build.');
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Server] AquaShine POS running on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start server:', err);
  process.exit(1);
});
