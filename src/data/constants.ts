import { POSServiceItem, POSVehicleType, BusinessInfo, POSSettings } from '../types/pos';

export const BUSINESS_NAME = 'My Car Wash';
export const DEFAULT_TAX_RATE = 0.0825; // 8.25%

export const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  businessName: 'My Car Wash',
  address: '123 Main Street',
  phone: '(555) 123-4567',
  email: 'contact@mycarwash.com',
  receiptFooter: 'Thank you for visiting! Drive safe & shine bright.',
};

export const DEFAULT_SERVICES: POSServiceItem[] = [
  {
    id: 'basic',
    name: 'Basic Wash',
    price: 15,
    type: 'wash',
    active: true,
    description: 'Essential exterior wash, power rinse & spot-free dry',
    features: ['Foam wash', 'Wheel blast', 'Spot-free rinse', 'Power blow dry'],
  },
  {
    id: 'deluxe',
    name: 'Deluxe Wash',
    price: 20,
    type: 'wash',
    active: true,
    description: 'Basic plus triple foam polish & undercarriage flush',
    badge: 'Popular',
    features: ['Everything in Basic', 'Triple foam conditioner', 'Undercarriage wash', 'Rust inhibitor'],
  },
  {
    id: 'premium',
    name: 'Premium Wash',
    price: 25,
    type: 'wash',
    active: true,
    description: 'Deluxe plus clear-coat protectant & ceramic gloss',
    features: ['Everything in Deluxe', 'Ceramic shield protectant', 'Wheel rim scrub', 'Rain repellent seal'],
  },
  {
    id: 'full',
    name: 'Full Service',
    price: 35,
    type: 'wash',
    active: true,
    description: 'Complete exterior luxury wash & hand towel dry finish',
    badge: 'Best Value',
    features: ['Everything in Premium', 'Hand towel dry', 'Air freshener', 'Bug & tar remover'],
  },
  {
    id: 'hot_wax',
    name: 'Hot Wax',
    price: 5,
    type: 'addon',
    active: true,
    description: 'Carnauba hot wax coat for deep mirror shine & water beading',
  },
  {
    id: 'interior_vacuum',
    name: 'Interior Vacuum',
    price: 10,
    type: 'addon',
    active: true,
    description: 'Quick high-power cabin & trunk carpet / mat vacuuming',
  },
  {
    id: 'tire_shine',
    name: 'Tire Shine',
    price: 5,
    type: 'addon',
    active: true,
    description: 'Gloss black tire dressing & rim wipe-down',
  },
];

export const DEFAULT_VEHICLE_TYPES: POSVehicleType[] = [
  {
    id: 'car',
    name: 'Car',
    surcharge: 0,
    active: true,
    description: 'Sedan, Coupe, Hatchback, Compact',
  },
  {
    id: 'suv_truck',
    name: 'SUV / Truck',
    surcharge: 5,
    active: true,
    description: 'SUV, Pickup Truck, Minivan, Van (+$5 surcharge)',
  },
];

export const DEFAULT_SETTINGS: POSSettings = {
  business: DEFAULT_BUSINESS_INFO,
  services: DEFAULT_SERVICES,
  vehicleTypes: DEFAULT_VEHICLE_TYPES,
  taxRate: DEFAULT_TAX_RATE,
};

// Legacy exports for backwards compatibility
export const SERVICES = DEFAULT_SERVICES.filter((s) => s.type === 'wash');
export const ADD_ONS = DEFAULT_SERVICES.filter((s) => s.type === 'addon');
export const VEHICLE_TYPES = DEFAULT_VEHICLE_TYPES;

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CW-${dateStr}-${randomSuffix}`;
}
