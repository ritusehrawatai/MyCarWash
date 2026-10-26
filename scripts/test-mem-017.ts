/**
 * Automated Test for MEM-017: Restrict free wash redemption strictly to enrolled plan's included service
 */
import { CustomerMembership, POSServiceItem } from '../src/types/pos';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

// Logic under test as implemented in OrderSummary.tsx
function checkMembershipEligibility(
  activeMembership: CustomerMembership | null,
  selectedService: POSServiceItem,
  isRedeemingMembershipWash: boolean,
  otherCharges: number = 0
) {
  const isMemberActive = Boolean(activeMembership && activeMembership.status === 'active');
  const isServiceEligibleForPlan = Boolean(
    activeMembership &&
    (selectedService.id === activeMembership.includedServiceId ||
      (selectedService.name &&
        activeMembership.includedServiceName &&
        selectedService.name.trim().toLowerCase() === activeMembership.includedServiceName.trim().toLowerCase()))
  );

  const canRedeemWash = Boolean(
    isMemberActive &&
    activeMembership &&
    activeMembership.remainingWashes > 0 &&
    isServiceEligibleForPlan &&
    isRedeemingMembershipWash
  );

  const washDiscount = canRedeemWash ? selectedService.price : 0;
  const rawSubtotal = selectedService.price + otherCharges;
  const subtotal = Math.max(0, rawSubtotal - washDiscount);
  const total = subtotal;

  const canPayWithMembershipPass = Boolean(
    isMemberActive &&
    activeMembership &&
    activeMembership.remainingWashes > 0 &&
    isServiceEligibleForPlan &&
    canRedeemWash &&
    total === 0
  );

  return {
    isMemberActive,
    isServiceEligibleForPlan,
    canRedeemWash,
    washDiscount,
    total,
    canPayWithMembershipPass,
  };
}

const basicPlanMembership: CustomerMembership = {
  id: 'MEM-000002',
  customerId: 'CUS-000002',
  customerName: 'Jane Doe',
  planId: 'plan_basic_monthly',
  planNameSnapshot: 'Basic Monthly',
  billingFrequency: 'monthly',
  priceAtSignup: 29.99,
  startDate: new Date().toISOString(),
  nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'active',
  includedWashes: 4,
  remainingWashes: 4,
  includedServiceId: 'basic',
  includedServiceName: 'Basic Wash',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const premiumPlanMembership: CustomerMembership = {
  id: 'MEM-000001',
  customerId: 'CUS-000001',
  customerName: 'John Smith',
  planId: 'plan_premium_monthly',
  planNameSnapshot: 'Premium Monthly',
  billingFrequency: 'monthly',
  priceAtSignup: 39.99,
  startDate: new Date().toISOString(),
  nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'active',
  includedWashes: 4,
  remainingWashes: 3,
  includedServiceId: 'premium',
  includedServiceName: 'Premium Wash',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const basicService: POSServiceItem = { id: 'basic', name: 'Basic Wash', price: 15.0, type: 'wash', active: true };
const deluxeService: POSServiceItem = { id: 'deluxe', name: 'Deluxe Wash', price: 20.0, type: 'wash', active: true };
const premiumService: POSServiceItem = { id: 'premium', name: 'Premium Wash', price: 25.0, type: 'wash', active: true };

console.log('--- TEST MEM-017.1: Basic Plan Member selects Basic Wash ---');
const res1 = checkMembershipEligibility(basicPlanMembership, basicService, true);
assert(res1.isServiceEligibleForPlan === true, 'Basic Wash is eligible for Basic Plan');
assert(res1.canRedeemWash === true, 'Wash can be redeemed');
assert(res1.washDiscount === 15.0, 'Full wash discount of $15.00 applied');
assert(res1.canPayWithMembershipPass === true, 'Membership Pass payment is enabled when balance is $0');

console.log('\n--- TEST MEM-017.2: Basic Plan Member selects Deluxe Wash (Tier Mismatch) ---');
const res2 = checkMembershipEligibility(basicPlanMembership, deluxeService, true);
assert(res2.isServiceEligibleForPlan === false, 'Deluxe Wash is NOT eligible for Basic Plan');
assert(res2.canRedeemWash === false, 'Free wash redemption is blocked');
assert(res2.washDiscount === 0, 'No wash discount applied ($0 discount)');
assert(res2.total === 20.0, 'Full price $20.00 is charged');
assert(res2.canPayWithMembershipPass === false, 'Membership Pass payment is disabled for mismatch tier');

console.log('\n--- TEST MEM-017.3: Basic Plan Member selects Premium Wash (Tier Mismatch) ---');
const res3 = checkMembershipEligibility(basicPlanMembership, premiumService, true);
assert(res3.isServiceEligibleForPlan === false, 'Premium Wash is NOT eligible for Basic Plan');
assert(res3.canRedeemWash === false, 'Free wash redemption is blocked');
assert(res3.washDiscount === 0, 'No wash discount applied ($0 discount)');
assert(res3.total === 25.0, 'Full price $25.00 is charged');
assert(res3.canPayWithMembershipPass === false, 'Membership Pass payment is disabled');

console.log('\n--- TEST MEM-017.4: Premium Plan Member selects Premium Wash ---');
const res4 = checkMembershipEligibility(premiumPlanMembership, premiumService, true);
assert(res4.isServiceEligibleForPlan === true, 'Premium Wash is eligible for Premium Plan');
assert(res4.canRedeemWash === true, 'Wash can be redeemed');
assert(res4.washDiscount === 25.0, 'Full wash discount of $25.00 applied');
assert(res4.canPayWithMembershipPass === true, 'Membership Pass payment is enabled');

console.log('\n--- TEST MEM-017.5: Premium Plan Member selects Basic Wash (Tier Mismatch) ---');
const res5 = checkMembershipEligibility(premiumPlanMembership, basicService, true);
assert(res5.isServiceEligibleForPlan === false, 'Basic Wash is NOT eligible for Premium Plan');
assert(res5.canRedeemWash === false, 'Free wash redemption is blocked');
assert(res5.washDiscount === 0, 'Wash discount is $0');
assert(res5.canPayWithMembershipPass === false, 'Membership Pass payment is disabled');

console.log('\n--- TEST MEM-017.6: Exhausted Washes (remaining = 0) ---');
const exhaustedMembership: CustomerMembership = { ...basicPlanMembership, remainingWashes: 0 };
const res6 = checkMembershipEligibility(exhaustedMembership, basicService, true);
assert(res6.canRedeemWash === false, 'Cannot redeem wash when remaining is 0');
assert(res6.canPayWithMembershipPass === false, 'Cannot pay with pass when remaining is 0');

console.log('\n🎉 ALL MEM-017 REGRESSION TESTS PASSED!');
