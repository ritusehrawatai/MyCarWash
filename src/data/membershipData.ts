import { MembershipPlan, CustomerMembership, MembershipUsage, BillingFrequency } from '../types/pos';

export const STORAGE_MEMBERSHIPS_KEY = 'my_car_wash_memberships';
export const STORAGE_MEMBERSHIP_PLANS_KEY = 'my_car_wash_membership_plans';
export const STORAGE_MEMBERSHIP_USAGES_KEY = 'my_car_wash_membership_usages';

export const DEFAULT_MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'plan_basic_monthly',
    name: 'Basic Monthly',
    description: 'Perfect for regular commuters who want a consistent, spot-free exterior wash.',
    billingFrequency: 'monthly',
    price: 29.99,
    includedServiceId: 'basic',
    includedServiceName: 'Basic Wash',
    includedWashes: 4,
    addOnBenefitDescription: 'Member pricing on selected add-ons',
    addOnDiscountPercent: 10,
    active: true,
    terms: 'Billed monthly. Unused washes do not roll over to subsequent months.',
    badge: 'Starter',
  },
  {
    id: 'plan_basic_yearly',
    name: 'Basic Yearly',
    description: 'Save big with an annual pass for 4 Basic Washes every single month.',
    billingFrequency: 'yearly',
    price: 299.99,
    includedServiceId: 'basic',
    includedServiceName: 'Basic Wash',
    includedWashes: 4,
    addOnBenefitDescription: 'Member pricing on selected add-ons',
    addOnDiscountPercent: 10,
    active: true,
    terms: 'Billed annually. 2 months free equivalent savings compared to monthly plan.',
    badge: 'Save 17%',
  },
  {
    id: 'plan_premium_monthly',
    name: 'Premium Monthly',
    description: 'Our most popular wash plan with clear-coat protectant, ceramic gloss, and add-on savings.',
    billingFrequency: 'monthly',
    price: 39.99,
    includedServiceId: 'premium',
    includedServiceName: 'Premium Wash',
    includedWashes: 4,
    addOnBenefitDescription: '10% off selected add-ons',
    addOnDiscountPercent: 10,
    active: true,
    terms: 'Billed monthly. Cancel anytime with 1-click in your customer portal.',
    badge: 'Popular',
  },
  {
    id: 'plan_premium_yearly',
    name: 'Premium Yearly',
    description: 'Ultimate showroom shine year-round with ceramic protection and priority express lanes.',
    billingFrequency: 'yearly',
    price: 399.99,
    includedServiceId: 'premium',
    includedServiceName: 'Premium Wash',
    includedWashes: 4,
    addOnBenefitDescription: '10% off selected add-ons',
    addOnDiscountPercent: 10,
    active: true,
    terms: 'Billed annually. Includes 4 Premium Washes each month with 10% add-on discount.',
    badge: 'Best Value',
  },
];

export const INITIAL_MEMBERSHIPS: CustomerMembership[] = [
  {
    id: 'MEM-000001',
    customerId: 'CUS-000001',
    customerName: 'John Smith',
    customerEmail: 'john.smith@example.com',
    planId: 'plan_premium_monthly',
    planNameSnapshot: 'Premium Monthly',
    billingFrequency: 'monthly',
    priceAtSignup: 39.99,
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    nextBillingDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    expirationDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    includedWashes: 4,
    remainingWashes: 3,
    includedServiceId: 'premium',
    includedServiceName: 'Premium Wash',
    addOnDiscountPercent: 10,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const INITIAL_MEMBERSHIP_USAGES: MembershipUsage[] = [
  {
    id: 'USG-000001',
    membershipId: 'MEM-000001',
    customerId: 'CUS-000001',
    customerName: 'John Smith',
    vehicleId: 'VEH-000001',
    vehicleDescription: '2023 White Toyota Camry [ABC123]',
    transactionId: 'TX-INITIAL-01',
    serviceId: 'premium',
    serviceName: 'Premium Wash',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    remainingWashes: 3,
    discountAmount: 25.0,
  },
];

export function generateMembershipId(existingMemberships: CustomerMembership[]): string {
  const count = existingMemberships.length + 1;
  return `MEM-${count.toString().padStart(6, '0')}`;
}

export function generateUsageId(existingUsages: MembershipUsage[]): string {
  const count = existingUsages.length + 1;
  return `USG-${count.toString().padStart(6, '0')}`;
}

export function calculateNextBillingDate(startDate: string, frequency: BillingFrequency): string {
  const d = new Date(startDate);
  if (frequency === 'monthly') {
    d.setMonth(d.getMonth() + 1);
  } else {
    d.setFullYear(d.getFullYear() + 1);
  }
  return d.toISOString();
}

export function formatBillingFrequency(frequency: BillingFrequency): string {
  return frequency === 'monthly' ? 'Monthly' : 'Yearly';
}

export function formatMembershipStatusBadge(status: string): { label: string; bgClass: string; textClass: string } {
  switch (status.toLowerCase()) {
    case 'active':
      return {
        label: 'ACTIVE',
        bgClass: 'bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800',
        textClass: 'text-emerald-800 dark:text-emerald-300',
      };
    case 'cancelled':
      return {
        label: 'CANCELLED',
        bgClass: 'bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800',
        textClass: 'text-amber-800 dark:text-amber-300',
      };
    case 'expired':
      return {
        label: 'EXPIRED',
        bgClass: 'bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800',
        textClass: 'text-rose-800 dark:text-rose-300',
      };
    default:
      return {
        label: 'PENDING',
        bgClass: 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
        textClass: 'text-slate-800 dark:text-slate-300',
      };
  }
}
