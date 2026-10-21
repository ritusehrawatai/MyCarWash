import { Transaction } from '../types/pos';
import { UserAccount } from './authService';
import {
  DailyReportSummary,
  EmployeeReportBreakdown,
  DetailedServiceRecord,
} from '../types/reports';

/**
 * Convert any Date to a YYYY-MM-DD string in a specific timezone using Intl.DateTimeFormat
 */
export function formatDateInTimezone(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    // Fallback if timezone string is invalid
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Format a timestamp to a local readable time string in a specific timezone
 */
export function formatTimeInTimezone(date: Date, timeZone: string): string {
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

/**
 * Helper to format currency
 */
export function formatCurrencyValue(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Calculate the daily employee-wise service report data matching in-app EmployeeReportsSection rules
 */
export function calculateDailyReport(
  transactions: Transaction[],
  accounts: UserAccount[],
  targetDateStr: string, // YYYY-MM-DD
  timeZone: string,
  businessName: string = 'AquaShine'
): DailyReportSummary {
  // 1. Staff map for quick lookup
  const staffMap = new Map<string, UserAccount>();
  accounts.forEach((a) => {
    staffMap.set(a.id, a);
    if (a.employeeId) {
      staffMap.set(a.employeeId.toUpperCase(), a);
    }
  });

  // 2. Filter transactions matching the target date in the specified timezone
  const dateTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.timestamp);
    const txDateStr = formatDateInTimezone(txDate, timeZone);
    return txDateStr === targetDateStr;
  });

  // 3. Separate completed vs voided/cancelled
  const completedTx = dateTransactions.filter((tx) => tx.status !== 'voided');
  const voidedTx = dateTransactions.filter((tx) => tx.status === 'voided');

  const totalCompletedWashes = completedTx.length;
  const totalServiceSales = completedTx.reduce((sum, tx) => sum + (tx.total || 0), 0);
  const averageTicketValue = totalCompletedWashes > 0 ? totalServiceSales / totalCompletedWashes : 0;
  const totalVoidedCount = voidedTx.length;
  const totalVoidedAmount = voidedTx.reduce((sum, tx) => sum + (tx.total || 0), 0);

  // 4. Employee breakdown
  const statMap = new Map<
    string,
    {
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
  >();

  // Add all active staff accounts so they are accounted for
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

  // Populate stats from date transactions
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

    // Processed by cashier tracking
    if (tx.processedById && statMap.has(tx.processedById)) {
      statMap.get(tx.processedById)!.processedAsCashierCount += 1;
    }
  });

  // Format breakdowns array
  const employeeBreakdowns: EmployeeReportBreakdown[] = Array.from(statMap.values())
    .map((s) => ({
      employeeId: s.employeeId,
      name: s.name,
      role: s.role,
      active: s.active,
      completedWashes: s.completedWashes,
      totalSales: s.totalSales,
      averageServiceValue: s.completedWashes > 0 ? s.totalSales / s.completedWashes : 0,
      packageBreakdown: Array.from(s.packageBreakdown.entries()).map(([name, data]) => ({
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

  // 5. Detailed service records
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
      addOns: (tx.addOns || []).map((a) => a.name),
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

/**
 * Generate a beautifully styled, high-converting HTML report for email
 */
export function generateReportHtml(
  report: DailyReportSummary,
  appUrl?: string,
  maxDetailedRecords: number = 50
): string {
  const currency = formatCurrencyValue;

  // Filter to active attendants or employees with activity
  const activeEmployees = report.employeeBreakdowns.filter(
    (e) => e.completedWashes > 0 || e.voidedCount > 0
  );

  // If no one had activity, show all staff
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
    .meta-bar { background: #f0fdf4; border-bottom: 1px solid #dcfce7; padding: 12px 28px; font-size: 13px; color: #166534; font-weight: 600; display: flex; justify-content: space-between; }
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
    <!-- Header -->
    <div class="header">
      <h1>${escapeHtml(report.businessName)}</h1>
      <p>Daily Employee Service Report · Business Date: <strong>${report.businessDate}</strong></p>
    </div>

    <!-- Meta Bar -->
    <div class="meta-bar">
      <span>Timezone: ${escapeHtml(report.timezone)}</span>
      <span>Generated: ${new Date(report.generatedAt).toLocaleString('en-US', { timeZone: report.timezone })}</span>
    </div>

    <div class="content">
      <!-- Section A: Daily Summary -->
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

      <!-- Section B: Employee-Wise Performance -->
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

      <!-- Section C: Detailed Service Records -->
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

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 6px 0; font-weight: 600;">${escapeHtml(report.businessName)} · Automated End-of-Day Operations Report</p>
      <p style="margin: 0;">This email was automatically generated and sent to configured Administrators. To adjust delivery schedule or recipient preferences, log in to the POS Admin Settings.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate a clean plain-text version for email clients without HTML support
 */
export function generateReportPlainText(
  report: DailyReportSummary,
  appUrl?: string
): string {
  const currency = formatCurrencyValue;
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

function escapeHtml(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
