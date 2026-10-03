/**
 * Promotional Discount Service
 * Handles First-Signup 15% Welcome Discount generation, validation, and email delivery.
 */

import { WelcomePromoCode, PromoCodeStatus, BusinessInfo, Customer } from '../types/pos';
import { getEnquiryEndpoint } from './enquiryService';

export const STORAGE_PROMO_CODES_KEY = 'my_car_wash_promo_codes';
export const WELCOME_DISCOUNT_PERCENT = 15;

/**
 * Seed initial promo codes for existing demo customers
 */
export const INITIAL_PROMO_CODES: WelcomePromoCode[] = [
  {
    id: 'PRM-000001',
    code: 'WELCOME15-7K8M9P',
    customerId: 'CUS-000001',
    customerName: 'John Smith',
    customerEmail: 'john.smith@example.com',
    discountPercent: 15,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 75 * 86400000).toISOString(),
    status: 'available',
    emailDeliveryStatus: 'sent',
    emailDeliveryDetail: 'Delivered to john.smith@example.com',
    emailSentAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'PRM-000002',
    code: 'WELCOME15-X2Y4Z8',
    customerId: 'CUS-000002',
    customerName: 'Sarah Connor',
    customerEmail: 'sarah.c@cyberdyne.org',
    discountPercent: 15,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 45 * 86400000).toISOString(),
    status: 'used',
    usedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    receiptNumber: 'RC-1002',
    transactionId: 'tx-mock-002',
    emailDeliveryStatus: 'sent',
    emailDeliveryDetail: 'Delivered to sarah.c@cyberdyne.org',
    emailSentAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
];

/**
 * Calculate expiration date: exactly 3 months from created date
 */
export function calculatePromoExpirationDate(fromDate: Date = new Date()): Date {
  const exp = new Date(fromDate);
  exp.setMonth(exp.getMonth() + 3);
  return exp;
}

/**
 * Check if a promo code has expired
 */
export function isPromoCodeExpired(promo: WelcomePromoCode): boolean {
  return new Date(promo.expiresAt).getTime() < Date.now();
}

/**
 * Return effective promo status ('used' > 'expired' > 'available')
 */
export function getEffectivePromoStatus(promo: WelcomePromoCode): PromoCodeStatus {
  if (promo.status === 'used') return 'used';
  if (isPromoCodeExpired(promo)) return 'expired';
  return 'available';
}

/**
 * Generate a unique promo code in format: WELCOME15-XXXXXX
 * Uses unambiguous characters (excluding 0, O, 1, I) to ensure clarity.
 */
export function generateUniquePromoCode(existingCodes: WelcomePromoCode[]): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let attempts = 0;
  let code = '';

  do {
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `WELCOME15-${suffix}`;
    attempts++;
  } while (
    existingCodes.some((p) => p.code.toUpperCase() === code.toUpperCase()) &&
    attempts < 200
  );

  return code;
}

/**
 * Create a new Welcome Promo Code for a customer
 */
export function createWelcomePromoCode(
  customerId: string,
  customerName?: string,
  customerEmail?: string,
  existingCodes: WelcomePromoCode[] = []
): WelcomePromoCode {
  const now = new Date();
  const expiresAt = calculatePromoExpirationDate(now);
  const code = generateUniquePromoCode(existingCodes);

  return {
    id: `PRM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    code,
    customerId,
    customerName,
    customerEmail,
    discountPercent: WELCOME_DISCOUNT_PERCENT,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'available',
  };
}

export interface PromoValidationResult {
  isValid: boolean;
  promoCode?: WelcomePromoCode;
  errorKey?: string;
  errorMessage?: string;
}

/**
 * Validate promo code for application in POS
 */
export function validatePromoCodeForOrder(
  inputCode: string,
  selectedCustomer: Customer | null | undefined,
  promoCodes: WelcomePromoCode[],
  options?: {
    isRedeemingMembershipWash?: boolean;
    alreadyAppliedCode?: string | null;
  }
): PromoValidationResult {
  const trimmedCode = inputCode.trim().toUpperCase();

  if (!trimmedCode) {
    return {
      isValid: false,
      errorKey: 'errorInvalidCode',
      errorMessage: 'Please enter a promotional code.',
    };
  }

  // 1. Must have customer attached to validate customer-specific code
  if (!selectedCustomer) {
    return {
      isValid: false,
      errorKey: 'errorNoCustomer',
      errorMessage: 'Please select a customer first to apply their welcome discount code.',
    };
  }

  // 2. Find matching promo code in database
  const promo = promoCodes.find((p) => p.code.toUpperCase() === trimmedCode);
  if (!promo) {
    return {
      isValid: false,
      errorKey: 'errorInvalidCode',
      errorMessage: 'Promotional code not found or invalid.',
    };
  }

  // 3. Confirm code belongs to the selected customer
  if (promo.customerId !== selectedCustomer.id) {
    return {
      isValid: false,
      errorKey: 'errorCustomerMismatch',
      errorMessage: 'This promotional code belongs to another customer and cannot be used for this order.',
    };
  }

  // 4. Confirm code has not already been used
  if (promo.status === 'used') {
    const usedDate = promo.usedAt ? new Date(promo.usedAt).toLocaleDateString() : '';
    return {
      isValid: false,
      errorKey: 'errorUsedCode',
      errorMessage: `This promotional code was already redeemed on ${usedDate || 'a previous transaction'}${
        promo.receiptNumber ? ` (Receipt #${promo.receiptNumber})` : ''
      }.`,
    };
  }

  // 5. Confirm code has not expired
  if (isPromoCodeExpired(promo)) {
    const expDate = new Date(promo.expiresAt).toLocaleDateString();
    return {
      isValid: false,
      errorKey: 'errorExpiredCode',
      errorMessage: `This promotional code expired on ${expDate}.`,
    };
  }

  // 6. Check if already applied to current order
  if (options?.alreadyAppliedCode && options.alreadyAppliedCode.toUpperCase() === trimmedCode) {
    return {
      isValid: false,
      errorKey: 'errorAlreadyApplied',
      errorMessage: 'This promotional code is already applied to this order.',
    };
  }

  // 7. Check membership conflict (cannot stack with free membership wash redemption)
  if (options?.isRedeemingMembershipWash) {
    return {
      isValid: false,
      errorKey: 'errorMembershipConflict',
      errorMessage: 'Welcome discount cannot be combined with a free membership wash redemption.',
    };
  }

  return {
    isValid: true,
    promoCode: promo,
  };
}

/**
 * Calculate 15% discount on eligible subtotal (before tax)
 */
export function calculatePromoDiscount(eligibleAmount: number, discountPercent: number = 15): number {
  if (eligibleAmount <= 0) return 0;
  return Math.round(eligibleAmount * (discountPercent / 100) * 100) / 100;
}

/**
 * Send welcome discount email via Google Apps Script Web App
 */
export async function sendWelcomeDiscountEmail(params: {
  endpointUrl: string;
  businessName: string;
  customerName: string;
  customerEmail: string;
  promoCode: string;
  discountPercent: number;
  expirationDate: string;
  language?: string;
}): Promise<{
  success: boolean;
  status: 'sent' | 'not_configured' | 'failed';
  detail: string;
}> {
  const {
    endpointUrl,
    businessName,
    customerName,
    customerEmail,
    promoCode,
    discountPercent,
    expirationDate,
    language = 'en',
  } = params;

  if (!endpointUrl || !endpointUrl.trim()) {
    return {
      success: false,
      status: 'not_configured',
      detail: 'Email delivery endpoint is not configured yet. The welcome discount code was saved to your account.',
    };
  }

  try {
    const payload = {
      type: 'welcome_discount',
      action: 'welcome_discount',
      businessName,
      customerName,
      customerEmail,
      promoCode,
      discountPercent,
      expirationDate,
      language,
      timestamp: new Date().toLocaleString(),
    };

    // Google Apps Script requires text/plain and mode 'no-cors' to avoid browser redirect CORS blocks
    await fetch(endpointUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      status: 'sent',
      detail: `Welcome discount email dispatched to ${customerEmail}`,
    };
  } catch (err: any) {
    console.error('Failed to send welcome discount email:', err);
    return {
      success: false,
      status: 'failed',
      detail: err?.message || 'Network error attempting to send welcome email.',
    };
  }
}

/**
 * Send a test welcome discount email to verify the Google Apps Script Web App connection
 */
export async function testWelcomePromoEmail(
  endpointUrl: string,
  targetEmail: string,
  businessName: string = 'My Car Wash'
): Promise<{
  success: boolean;
  status: 'sent' | 'failed' | 'not_configured';
  detail: string;
}> {
  if (!endpointUrl || !endpointUrl.trim()) {
    return {
      success: false,
      status: 'not_configured',
      detail: 'No Google Apps Script Web App URL provided. Please enter your Web App URL ending in /exec.',
    };
  }

  const cleanUrl = endpointUrl.trim();
  if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      status: 'failed',
      detail: 'Invalid URL format. URL must start with https://script.google.com/macros/s/... and end in /exec',
    };
  }

  return sendWelcomeDiscountEmail({
    endpointUrl: cleanUrl,
    businessName,
    customerName: 'Test Recipient',
    customerEmail: targetEmail.trim(),
    promoCode: 'WELCOME15-TEST',
    discountPercent: 15,
    expirationDate: new Date(Date.now() + 90 * 86400000).toLocaleDateString(),
    language: 'en',
  });
}
