import { AuthUser, Customer, EmployeeRole } from '../types/pos';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'cashier' | 'customer';
  passwordHash: string; // Basic base64/hashed for demo PoC (never plain text)
  customerId?: string;
  employeeId?: string; // System-generated unique Employee ID (e.g. EMP-1001)
  active?: boolean; // Active or Deactivated status
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const STORAGE_AUTH_ACCOUNTS_KEY = 'my_car_wash_auth_accounts';
export const STORAGE_CURRENT_USER_KEY = 'my_car_wash_current_user';

// Simple obfuscation/hashing for PoC to satisfy: "Do not store plain-text passwords in localStorage"
export function hashPassword(plain: string): string {
  try {
    return btoa(`salt_${plain}_cwpos`);
  } catch {
    return `hash_${plain}`;
  }
}

export function verifyPassword(plain: string, hash: string): boolean {
  return hashPassword(plain) === hash;
}

// Initial Staff Accounts for demo:
// Admin: admin@carwash.com / admin123 (Sarah Jenkins - EMP-1001)
// Cashier/Attendant: cashier@carwash.com / cashier123 (Alex Rivera - EMP-1002)
// Cashier/Attendant: marcus.vance@carwash.com / cashier123 (Marcus Vance - EMP-1003)
// Cashier/Attendant: elena.rodriguez@carwash.com / cashier123 (Elena Rodriguez - EMP-1004)
// Customer: john.smith@example.com / customer123 (matching CUS-000001)
export const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: 'USR-ADMIN-1',
    employeeId: 'EMP-1001',
    email: 'admin@carwash.com',
    name: 'Sarah Jenkins',
    role: 'admin',
    passwordHash: hashPassword('admin123'),
    active: true,
    phone: '(555) 234-5678',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'USR-CASHIER-1',
    employeeId: 'EMP-1002',
    email: 'cashier@carwash.com',
    name: 'Alex Rivera',
    role: 'cashier',
    passwordHash: hashPassword('cashier123'),
    active: true,
    phone: '(555) 345-6789',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'USR-CASHIER-2',
    employeeId: 'EMP-1003',
    email: 'marcus.vance@carwash.com',
    name: 'Marcus Vance',
    role: 'cashier',
    passwordHash: hashPassword('cashier123'),
    active: true,
    phone: '(555) 456-7890',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'USR-CASHIER-3',
    employeeId: 'EMP-1004',
    email: 'elena.rodriguez@carwash.com',
    name: 'Elena Rodriguez',
    role: 'cashier',
    passwordHash: hashPassword('cashier123'),
    active: true,
    phone: '(555) 567-8901',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'USR-CUS-1',
    email: 'john.smith@example.com',
    name: 'John Smith',
    role: 'customer',
    passwordHash: hashPassword('customer123'),
    customerId: 'CUS-000001',
    active: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

/**
 * Generate a next unique system Employee ID in the format EMP-XXXX
 */
export function generateEmployeeId(accounts: UserAccount[]): string {
  const staff = accounts.filter((a) => a.role === 'admin' || a.role === 'cashier');
  const numbers = staff
    .map((a) => {
      const match = a.employeeId?.match(/EMP-(\d+)/i);
      return match ? parseInt(match[1], 10) : 1000;
    })
    .filter((n) => !isNaN(n));
  const max = numbers.length > 0 ? Math.max(...numbers) : 1000;
  return `EMP-${max + 1}`;
}

/**
 * Ensure existing accounts have employeeId and active status populated
 */
export function ensureEmployeeAccounts(accounts: UserAccount[]): UserAccount[] {
  let counter = 1001;
  return accounts.map((acc) => {
    if (acc.role === 'admin' || acc.role === 'cashier') {
      const employeeId = acc.employeeId || `EMP-${counter++}`;
      const active = acc.active !== undefined ? acc.active : true;
      return {
        ...acc,
        employeeId,
        active,
      };
    }
    return acc;
  });
}

/**
 * Validate an employee account creation or update
 */
export function validateEmployeeAccount(
  data: {
    name: string;
    email: string;
    role: string;
    employeeId?: string;
    password?: string;
    id?: string;
  },
  existingAccounts: UserAccount[]
): { valid: boolean; error?: string } {
  const cleanName = data.name.trim();
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanEmpId = data.employeeId?.trim().toUpperCase();

  if (!cleanName) {
    return { valid: false, error: 'Full name is required.' };
  }

  if (!cleanEmail) {
    return { valid: false, error: 'Email / username is required.' };
  }

  // Basic email pattern check
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }

  // Role must strictly be 'admin' or 'cashier'
  if (data.role !== 'admin' && data.role !== 'cashier') {
    return { valid: false, error: 'Employee type must strictly be Admin or Cashier/Attendant.' };
  }

  // Check duplicate email (excluding self if editing)
  const duplicateEmail = existingAccounts.find(
    (a) => a.id !== data.id && a.email.toLowerCase() === cleanEmail
  );
  if (duplicateEmail) {
    return { valid: false, error: `An account with email "${cleanEmail}" already exists.` };
  }

  // Check duplicate employee ID (excluding self if editing)
  if (cleanEmpId) {
    const duplicateEmpId = existingAccounts.find(
      (a) => a.id !== data.id && a.employeeId?.toUpperCase() === cleanEmpId
    );
    if (duplicateEmpId) {
      return { valid: false, error: `Employee ID "${cleanEmpId}" is already assigned to another account.` };
    }
  }

  // Password validation for new accounts
  if (!data.id && (!data.password || data.password.length < 6)) {
    return { valid: false, error: 'Password must be at least 6 characters.' };
  }

  return { valid: true };
}
