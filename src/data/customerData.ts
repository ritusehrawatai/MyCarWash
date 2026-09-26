import { Customer, CustomerVehicle } from '../types/pos';

export const STORAGE_CUSTOMERS_KEY = 'my_car_wash_customers';
export const STORAGE_VEHICLES_KEY = 'my_car_wash_vehicles';

/**
 * Seed initial mock customers for demo purposes if store is empty
 */
export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CUS-000001',
    firstName: 'John',
    lastName: 'Smith',
    phone: '(555) 123-4567',
    email: 'john.smith@example.com',
    notes: 'Prefers extra rim wipe-down',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'CUS-000002',
    firstName: 'Sarah',
    lastName: 'Connor',
    phone: '(555) 987-6543',
    email: 'sarah.c@cyberdyne.org',
    notes: 'Always gets Hot Wax',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'CUS-000003',
    firstName: 'Michael',
    lastName: 'Jordan',
    phone: '(555) 232-3232',
    email: 'mj23@chicago.com',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export const INITIAL_VEHICLES: CustomerVehicle[] = [
  {
    id: 'VEH-000001',
    customerId: 'CUS-000001',
    vehicleTypeId: 'car',
    year: '2023',
    make: 'Toyota',
    model: 'Camry',
    color: 'White',
    licensePlate: 'ABC123',
    notes: 'Sedan',
    active: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'VEH-000002',
    customerId: 'CUS-000001',
    vehicleTypeId: 'suv_truck',
    year: '2021',
    make: 'Ford',
    model: 'F-150',
    color: 'Black',
    licensePlate: 'XYZ789',
    notes: 'Pickup truck',
    active: true,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'VEH-000003',
    customerId: 'CUS-000002',
    vehicleTypeId: 'suv_truck',
    year: '2022',
    make: 'Jeep',
    model: 'Grand Cherokee',
    color: 'Silver',
    licensePlate: 'T800-JP',
    active: true,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'VEH-000004',
    customerId: 'CUS-000003',
    vehicleTypeId: 'car',
    year: '2024',
    make: 'Porsche',
    model: '911 Carrera',
    color: 'Red',
    licensePlate: 'GOAT23',
    active: true,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

/**
 * Generate sequential-like Customer ID
 * e.g. CUS-000001, CUS-000002
 */
export function generateCustomerId(existingCustomers: Customer[]): string {
  let highest = 0;
  existingCustomers.forEach((c) => {
    const match = c.id.match(/^CUS-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > highest) highest = num;
    }
  });
  const nextNum = highest + 1;
  return `CUS-${nextNum.toString().padStart(6, '0')}`;
}

/**
 * Generate sequential-like Vehicle ID
 * e.g. VEH-000001, VEH-000002
 */
export function generateVehicleId(existingVehicles: CustomerVehicle[]): string {
  let highest = 0;
  existingVehicles.forEach((v) => {
    const match = v.id.match(/^VEH-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > highest) highest = num;
    }
  });
  const nextNum = highest + 1;
  return `VEH-${nextNum.toString().padStart(6, '0')}`;
}

/**
 * Formats vehicle display string: "2023 White Toyota Camry [ABC123]"
 */
export function formatVehicleDescription(vehicle?: Partial<CustomerVehicle>): string {
  if (!vehicle) return 'Standard Vehicle';
  const parts: string[] = [];
  if (vehicle.year) parts.push(vehicle.year);
  if (vehicle.color) parts.push(vehicle.color);
  if (vehicle.make) parts.push(vehicle.make);
  if (vehicle.model) parts.push(vehicle.model);

  const desc = parts.join(' ').trim() || 'Vehicle';
  if (vehicle.licensePlate) {
    return `${desc} [${vehicle.licensePlate.toUpperCase()}]`;
  }
  return desc;
}

/**
 * Normalizes phone numbers for duplicate checking
 */
export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}
