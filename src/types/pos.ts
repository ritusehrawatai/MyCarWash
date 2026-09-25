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

export interface POSSettings {
  business: BusinessInfo;
  services: POSServiceItem[];
  vehicleTypes: POSVehicleType[];
  taxRate: number;
}

// Retain legacy aliases for backward compatibility with existing components
export type WashService = POSServiceItem;
export type VehicleType = POSVehicleType;
export type AddOn = POSServiceItem;

export type PaymentMethod = 'CASH' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'CARD' | 'OTHER';

export type TransactionStatus = 'completed' | 'voided';

export type UserRole = 'admin' | 'cashier';

export interface Transaction {
  id: string;
  receiptNumber: string;
  timestamp: string;
  status: TransactionStatus;
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
