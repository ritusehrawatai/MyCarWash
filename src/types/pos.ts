export type ServiceId = string;
export type VehicleTypeId = string;
export type AddOnId = string;

export type ServiceType = 'wash' | 'addon';

export interface POSServiceItem {
  id: string;
  name: string;
  price: number;
  type: ServiceType;
  active: boolean;
  description?: string;
  badge?: string;
  features?: string[];
}

export interface POSVehicleType {
  id: string;
  name: string;
  surcharge: number;
  active: boolean;
  description?: string;
}

export interface BusinessInfo {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  receiptFooter: string;
}

export type BillingFrequency = 'monthly' | 'yearly';
export type MembershipStatus = 'active' | 'cancelled' | 'expired' | 'pending';

export interface MembershipPlan {
  id: string; // e.g. 'plan_basic_monthly'
  name: string; // e.g. 'Basic Monthly'
  description: string;
  billingFrequency: BillingFrequency;
  price: number;
  includedServiceId: string; // references POSServiceItem (e.g. 'basic', 'premium')
  includedServiceName: string;
  includedWashes: number; // e.g. 4
  addOnBenefitDescription?: string; // e.g. "Member pricing on selected add-ons"
  addOnDiscountPercent?: number; // e.g. 10 for 10%
  active: boolean;
  terms?: string;
  badge?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerMembership {
  id: string; // e.g. MEM-000001
  customerId: string;
  customerName: string;
  customerEmail?: string;
  planId: string;
  planNameSnapshot: string;
  billingFrequency: BillingFrequency;
  priceAtSignup: number;
  startDate: string; // ISO date string
  nextBillingDate: string; // ISO date string
  expirationDate: string; // ISO date string
  status: MembershipStatus;
  includedWashes: number;
  remainingWashes: number;
  includedServiceId: string;
  includedServiceName: string;
  addOnDiscountPercent?: number;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
}

export interface MembershipUsage {
  id: string; // e.g. USG-000001
  membershipId: string;
  customerId: string;
  customerName?: string;
  vehicleId?: string;
  vehicleDescription?: string;
  transactionId: string;
  serviceId: string;
  serviceName: string;
  date: string;
  remainingWashes: number;
  discountAmount: number;
}

export interface POSSettings {
  business: BusinessInfo;
  services: POSServiceItem[];
  vehicleTypes: POSVehicleType[];
  membershipPlans?: MembershipPlan[];
  taxRate: number;
}

// Retain legacy aliases for backward compatibility with existing components
export type WashService = POSServiceItem;
export type VehicleType = POSVehicleType;
export type AddOn = POSServiceItem;

export type PaymentMethod = 'CASH' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'CARD' | 'MEMBERSHIP' | 'OTHER';

export type TransactionStatus = 'completed' | 'voided';

export type UserRole = 'admin' | 'cashier' | 'customer';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  customerId?: string; // Connected customer profile ID if customer
}

/**
 * Customer Profile
 */
export interface Customer {
  id: string; // e.g. CUS-000001
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Customer / Transaction Vehicle Record
 */
export interface CustomerVehicle {
  id: string; // e.g. VEH-000001
  customerId?: string; // Optional: can be standalone or belong to a customer
  vehicleTypeId: string; // References POSVehicleType (e.g. 'car' or 'suv_truck')
  make: string;
  model: string;
  year?: string;
  color?: string;
  licensePlate?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  receiptNumber: string;
  timestamp: string;
  status: TransactionStatus;
  
  // Customer & Vehicle References (Additive)
  customerId?: string;
  customerNameAtSale?: string;
  vehicleId?: string;
  vehicleDescriptionAtSale?: string; // e.g. "2023 White Toyota Camry [ABC123]"
  vehicleTypeAtSale?: string; // e.g. "Car" or "SUV / Truck"

  // Membership References (Additive)
  membershipId?: string;
  membershipUsageId?: string;
  membershipPlanName?: string;
  isMembershipWash?: boolean;
  membershipDiscount?: number;
  transactionType?: 'wash' | 'membership_signup';
  billingPeriod?: string;

  service: {
    id: string;
    name: string;
    price: number;
  };
  vehicleType: {
    id: string;
    name: string;
    surcharge: number;
  };
  addOns: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cardRef?: string; // Optional masked card ref provided by test-payment system (e.g. "**** 1234")
  cashTendered?: number;
  changeDue?: number;
  voidedAt?: string;
}
