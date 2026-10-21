import { EmployeeRole, TransactionStatus, PaymentMethod } from './pos';

export interface EmployeeReportBreakdown {
  employeeId: string;
  name: string;
  role: EmployeeRole | string;
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
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
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
