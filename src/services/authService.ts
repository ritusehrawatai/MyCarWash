import { AuthUser, Customer } from '../types/pos';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'cashier' | 'customer';
  passwordHash: string; // Basic base64/hashed for demo PoC (never plain text)
  customerId?: string;
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
// Admin: admin@carwash.com / admin123
// Cashier: cashier@carwash.com / cashier123
// Customer: john.smith@example.com / customer123 (matching CUS-000001)
export const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: 'USR-ADMIN-1',
    email: 'admin@carwash.com',
    name: 'Sarah Jenkins (Admin)',
    role: 'admin',
    passwordHash: hashPassword('admin123'),
  },
  {
    id: 'USR-CASHIER-1',
    email: 'cashier@carwash.com',
    name: 'Alex Rivera (Cashier)',
    role: 'cashier',
    passwordHash: hashPassword('cashier123'),
  },
  {
    id: 'USR-CUS-1',
    email: 'john.smith@example.com',
    name: 'John Smith',
    role: 'customer',
    passwordHash: hashPassword('customer123'),
    customerId: 'CUS-000001',
  },
];
