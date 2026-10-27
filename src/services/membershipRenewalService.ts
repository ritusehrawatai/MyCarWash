import { CustomerMembership, MembershipPlan, Transaction, MembershipStatus, MembershipUsage } from '../types/pos';
import { calculateNextBillingDate, generateMembershipId } from '../data/membershipData';
import { generateReceiptNumber } from '../data/constants';

export interface RenewalValidationResult {
  canRenew: boolean;
  status: 'allowed' | 'blocked_cancelled' | 'blocked_expired' | 'blocked_disabled' | 'not_due';
  errorMessage?: string;
  nextBillingDate?: string;
}

export interface RenewalProcessResult {
  success: boolean;
  membership?: CustomerMembership;
  transaction?: Transaction;
  error?: string;
}

/**
 * Validates whether a membership is eligible for automatic renewal or recurring billing.
 * Cancelled and Expired memberships are strictly blocked from future charges or renewals.
 */
export function validateMembershipRenewal(
  membership: CustomerMembership,
  currentDate: Date = new Date()
): RenewalValidationResult {
  // 1. Cancelled memberships must never trigger future recurring charges or renewals
  if (membership.status === 'cancelled') {
    return {
      canRenew: false,
      status: 'blocked_cancelled',
      errorMessage: 'Cancelled membership cannot trigger future recurring charges or renewals.',
    };
  }

  // 2. Expired memberships must never trigger future recurring charges or renewals
  if (membership.status === 'expired') {
    return {
      canRenew: false,
      status: 'blocked_expired',
      errorMessage: 'Expired membership cannot trigger future recurring charges or renewals.',
    };
  }

  // Check if expiration date has already passed
  if (membership.expirationDate && new Date(membership.expirationDate).getTime() <= currentDate.getTime()) {
    return {
      canRenew: false,
      status: 'blocked_expired',
      errorMessage: 'Membership has passed its expiration date and cannot be renewed automatically.',
    };
  }

  // 3. Auto-renew flag disabled
  if (membership.autoRenew === false) {
    return {
      canRenew: false,
      status: 'blocked_disabled',
      errorMessage: 'Automatic renewal is disabled for this membership.',
    };
  }

  // 4. Check if renewal is due
  const nextBilling = new Date(membership.nextBillingDate);
  if (currentDate.getTime() < nextBilling.getTime()) {
    return {
      canRenew: false,
      status: 'not_due',
      errorMessage: `Renewal is not due yet. Next scheduled billing date is ${nextBilling.toLocaleDateString()}.`,
      nextBillingDate: membership.nextBillingDate,
    };
  }

  return {
    canRenew: true,
    status: 'allowed',
    nextBillingDate: membership.nextBillingDate,
  };
}

/**
 * Cancels a membership and permanently stops recurring billing and Stripe subscriptions
 */
export async function cancelMembershipAndSubscription(
  membership: CustomerMembership
): Promise<CustomerMembership> {
  const now = new Date().toISOString();

  // If a Stripe subscription ID is present, cancel it on the server
  if (membership.stripeSubscriptionId) {
    try {
      await fetch('/api/memberships/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId: membership.id,
          stripeSubscriptionId: membership.stripeSubscriptionId,
        }),
      });
    } catch (err) {
      console.warn('[MembershipRenewalService] Could not reach Stripe subscription cancel endpoint:', err);
    }
  }

  return {
    ...membership,
    status: 'cancelled',
    autoRenew: false,
    cancelledAt: now,
    updatedAt: now,
  };
}

/**
 * Replaces existing active memberships with a newly purchased active membership.
 * Immediately cancels previous active memberships and guarantees that the customer has ONLY ONE active membership.
 */
export function replaceExistingMemberships(
  allMemberships: CustomerMembership[],
  newMembership: CustomerMembership
): CustomerMembership[] {
  const now = new Date().toISOString();

  // Cancel any existing active membership for this customer
  const updatedExisting = allMemberships.map((m) => {
    if (
      m.customerId === newMembership.customerId &&
      m.id !== newMembership.id &&
      m.status === 'active'
    ) {
      return {
        ...m,
        status: 'cancelled' as MembershipStatus,
        autoRenew: false,
        cancelledAt: now,
        updatedAt: now,
      };
    }
    return m;
  });

  // Idempotency: prevent duplicates if callback was retried
  const alreadyExists = updatedExisting.some((m) => m.id === newMembership.id);
  if (alreadyExists) {
    return updatedExisting.map((m) =>
      m.id === newMembership.id ? { ...newMembership, status: 'active' as MembershipStatus } : m
    );
  }

  return [newMembership, ...updatedExisting];
}

/**
 * Calculates remaining washes safely:
 * - If unlimited (-1 or >= 999), returns -1
 * - Otherwise computes Math.max(0, includedWashes - washesUsed)
 * - Guarantees non-negative result
 */
export function calculateRemainingWashes(
  includedWashes: number,
  washesUsed: number
): number {
  if (includedWashes === -1 || includedWashes >= 999) {
    return -1; // Unlimited
  }
  return Math.max(0, includedWashes - Math.max(0, washesUsed));
}

/**
 * Retrieves ONLY the customer's current active membership.
 * Never returns cancelled or expired memberships.
 */
export function getCustomerActiveMembership(
  allMemberships: CustomerMembership[],
  customerId: string
): CustomerMembership | null {
  if (!customerId) return null;
  return (
    allMemberships.find(
      (m) =>
        m.customerId === customerId &&
        m.status === 'active' &&
        (!m.expirationDate || new Date(m.expirationDate).getTime() > Date.now())
    ) || null
  );
}

/**
 * Returns ONLY the usages associated with the customer's current active membership.
 * Filters out all usages from previous cancelled, expired, or replaced plans.
 */
export function getActivePlanUsages(
  allUsages: MembershipUsage[],
  activeMembershipId: string | null | undefined
): MembershipUsage[] {
  if (!activeMembershipId) return [];
  return allUsages.filter((u) => u.membershipId === activeMembershipId);
}

/**
 * Restores a wash allowance when a transaction is voided or cancelled.
 */
export function restoreWashOnVoid(
  memberships: CustomerMembership[],
  usages: MembershipUsage[],
  voidedTxId: string,
  membershipId?: string
): { updatedMemberships: CustomerMembership[]; updatedUsages: MembershipUsage[] } {
  const updatedUsages = usages.filter((u) => u.transactionId !== voidedTxId);

  const updatedMemberships = memberships.map((m) => {
    if (m.id === membershipId) {
      const restored = Math.min(m.includedWashes, (m.remainingWashes || 0) + 1);
      return {
        ...m,
        remainingWashes: restored,
        updatedAt: new Date().toISOString(),
      };
    }
    return m;
  });

  return { updatedMemberships, updatedUsages };
}

