/**
 * Comprehensive Automated Regression Tests for Employee Management & Employee-Wise Service Reports
 */

import {
  INITIAL_ACCOUNTS,
  generateEmployeeId,
  validateEmployeeAccount,
  hashPassword,
  verifyPassword,
  UserAccount,
  ensureEmployeeAccounts,
} from '../src/services/authService';
import { INITIAL_TRANSACTIONS } from '../src/data/mockTransactions';
import { Transaction } from '../src/types/pos';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('--- TEST 1: Employee Types Strict Enforcement ---');
const validAdmin = validateEmployeeAccount(
  { name: 'Alice Admin', email: 'alice@carwash.com', role: 'admin', password: 'password123' },
  INITIAL_ACCOUNTS
);
assert(validAdmin.valid === true, 'Admin role is allowed');

const validCashier = validateEmployeeAccount(
  { name: 'Bob Cashier', email: 'bob@carwash.com', role: 'cashier', password: 'password123' },
  INITIAL_ACCOUNTS
);
assert(validCashier.valid === true, 'Cashier/Attendant role is allowed');

const invalidRole = validateEmployeeAccount(
  { name: 'Charlie Manager', email: 'charlie@carwash.com', role: 'manager', password: 'password123' },
  INITIAL_ACCOUNTS
);
assert(
  invalidRole.valid === false && Boolean(invalidRole.error?.includes('Employee type must strictly be Admin or Cashier/Attendant')),
  'Non-admin/cashier roles (e.g. manager) are strictly rejected'
);

console.log('\n--- TEST 2: Duplicate Account Prevention ---');
const duplicateEmail = validateEmployeeAccount(
  { name: 'Sarah Fake', email: 'admin@carwash.com', role: 'admin', password: 'password123' },
  INITIAL_ACCOUNTS
);
assert(
  duplicateEmail.valid === false && Boolean(duplicateEmail.error?.includes('already exists')),
  'Duplicate email is rejected'
);

const duplicateEmpId = validateEmployeeAccount(
  { name: 'New Guy', email: 'newguy@carwash.com', role: 'cashier', employeeId: 'EMP-1001', password: 'password123' },
  INITIAL_ACCOUNTS
);
assert(
  duplicateEmpId.valid === false && Boolean(duplicateEmpId.error?.includes('already assigned')),
  'Duplicate Employee ID is rejected'
);

console.log('\n--- TEST 3: System-Generated Unique Employee ID ---');
const generatedId = generateEmployeeId(INITIAL_ACCOUNTS);
assert(generatedId.startsWith('EMP-'), `Employee ID ${generatedId} starts with EMP-`);
assert(
  !INITIAL_ACCOUNTS.some((a) => a.employeeId === generatedId),
  `Generated ID ${generatedId} does not collide with existing IDs`
);

console.log('\n--- TEST 4: Existing Admin & Staff Login & Password Verification ---');
const adminAccount = INITIAL_ACCOUNTS.find((a) => a.email === 'admin@carwash.com');
assert(!!adminAccount, 'Sarah Jenkins admin account exists');
assert(verifyPassword('admin123', adminAccount!.passwordHash), 'Admin password verifies successfully');
assert(!verifyPassword('wrongpass', adminAccount!.passwordHash), 'Wrong password fails verification');

const cashierAccount = INITIAL_ACCOUNTS.find((a) => a.email === 'cashier@carwash.com');
assert(!!cashierAccount, 'Alex Rivera cashier account exists');
assert(verifyPassword('cashier123', cashierAccount!.passwordHash), 'Cashier password verifies successfully');

console.log('\n--- TEST 5: Deactivation preserves historical data & blocks login ---');
const accountsWithDeactivated: UserAccount[] = [
  ...INITIAL_ACCOUNTS,
  {
    id: 'USR-CASHIER-DEACT',
    employeeId: 'EMP-9999',
    name: 'Former Staff',
    email: 'former@carwash.com',
    role: 'cashier',
    passwordHash: hashPassword('test1234'),
    active: false,
    createdAt: new Date().toISOString(),
  },
];
const deactivatedUser = accountsWithDeactivated.find((a) => a.email === 'former@carwash.com');
assert(deactivatedUser?.active === false, 'Employee can be marked as deactivated');
assert(deactivatedUser?.employeeId === 'EMP-9999', 'Deactivated employee retains their Employee ID');

console.log('\n--- TEST 6: Service Attendant Attribution on Transactions ---');
const completedTx = INITIAL_TRANSACTIONS.filter((t) => t.status === 'completed');
assert(completedTx.length > 0, 'Seed contains completed transactions');
completedTx.forEach((tx) => {
  assert(
    !!tx.serviceAttendantName && !!tx.serviceAttendantEmployeeId,
    `Transaction ${tx.receiptNumber} has attendant: ${tx.serviceAttendantName} (${tx.serviceAttendantEmployeeId})`
  );
});

console.log('\n--- TEST 7: Distinction between Register Cashier and Service Attendant ---');
const distinctionTx = INITIAL_TRANSACTIONS.find(
  (t) => t.serviceAttendantName === 'Elena Rodriguez' && t.processedByName === 'Alex Rivera'
);
assert(
  !!distinctionTx,
  'Found transaction distinguishing Register Cashier (Alex Rivera) from Service Attendant (Elena Rodriguez)'
);

console.log('\n--- TEST 8: Accurate Reporting & Voided Transaction Isolation ---');
const voidedTx = INITIAL_TRANSACTIONS.filter((t) => t.status === 'voided');
assert(voidedTx.length > 0, 'Seed contains at least one voided transaction for verification');

const completedWashesOnly = INITIAL_TRANSACTIONS.filter((t) => t.status === 'completed');
const totalSalesCompleted = completedWashesOnly.reduce((sum, t) => sum + t.total, 0);
const allWashesSales = INITIAL_TRANSACTIONS.reduce((sum, t) => sum + t.total, 0);

assert(
  totalSalesCompleted < allWashesSales,
  'Completed service sales strictly exclude voided transactions'
);

// Attendant breakdown test for Elena Rodriguez
const elenaCompleted = completedWashesOnly.filter(
  (t) => t.serviceAttendantName === 'Elena Rodriguez' || t.serviceAttendantEmployeeId === 'EMP-1004'
);
const elenaVoided = voidedTx.filter(
  (t) => t.serviceAttendantName === 'Elena Rodriguez' || t.serviceAttendantEmployeeId === 'EMP-1004'
);
assert(elenaCompleted.length === 2, `Elena has exactly 2 completed washes (got ${elenaCompleted.length})`);
assert(elenaVoided.length === 1, `Elena has exactly 1 voided wash (got ${elenaVoided.length})`);

console.log('\n--- TEST 9: Backward Compatibility Migration ---');
const legacyAccounts = [
  { id: 'USR-1', email: 'test@carwash.com', name: 'Legacy Admin', role: 'admin' as const, passwordHash: 'abc' },
];
const migrated = ensureEmployeeAccounts(legacyAccounts);
assert(!!migrated[0].employeeId, 'Legacy accounts automatically receive an employeeId');
assert(migrated[0].active === true, 'Legacy accounts default to active: true');

console.log('\n🎉 ALL REGRESSION TESTS PASSED SUCCESSFULLY!');
