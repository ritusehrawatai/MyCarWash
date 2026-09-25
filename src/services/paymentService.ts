/**
 * Payment Service Abstraction
 * 
 * Provides an extensible interface for processing card payments.
 * In this PoC/demo environment, card processing is simulated with realistic
 * latency, validation, and demo card presets.
 * 
 * In production, this module can be replaced with a certified, PCI-compliant
 * tokenized hosted field integration (e.g. Stripe Elements, Square Web Payments SDK,
 * or direct payment terminal EMV reader integration) without storing cardholder data.
 */

export interface DemoCardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  simulateFailure?: boolean;
}

export interface CardPaymentResult {
  success: boolean;
  transactionRef?: string;
  maskedCard?: string;
  cardType?: 'Debit Card' | 'Credit Card';
  errorMessage?: string;
}

/**
 * Validates test/demo card fields.
 * Ensures fields look plausible without saving or submitting real card data.
 */
export function validateDemoCard(details: DemoCardDetails): { isValid: boolean; error?: string } {
  const cleanNumber = details.cardNumber.replace(/[\s-]/g, '');

  if (!cleanNumber || cleanNumber.length < 13 || cleanNumber.length > 19 || !/^\d+$/.test(cleanNumber)) {
    return { isValid: false, error: 'Please enter valid test card information (13-19 digits).' };
  }

  const cleanExpiry = details.expiryDate.trim();
  if (!cleanExpiry || !/^(0[1-9]|1[0-2])\/?([0-9]{2}|[0-9]{4})$/.test(cleanExpiry)) {
    return { isValid: false, error: 'Please enter a valid test expiration date (MM/YY).' };
  }

  const cleanCvv = details.cvv.trim();
  if (!cleanCvv || cleanCvv.length < 3 || cleanCvv.length > 4 || !/^\d+$/.test(cleanCvv)) {
    return { isValid: false, error: 'Please enter a valid test CVV (3 or 4 digits).' };
  }

  return { isValid: true };
}

/**
 * Formats a masked test card reference (e.g., "**** 1234") from the provided test number.
 */
export function getMaskedTestCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  const last4 = digits.slice(-4) || '1234';
  return `**** ${last4}`;
}

/**
 * Simulates processing a card payment through a processor/terminal.
 * Resolves with success or failure after a brief network simulation.
 */
export async function processCardPayment(
  amount: number,
  cardType: 'Debit Card' | 'Credit Card',
  cardDetails: DemoCardDetails
): Promise<CardPaymentResult> {
  // 1. Basic validation
  const validation = validateDemoCard(cardDetails);
  if (!validation.isValid) {
    return {
      success: false,
      errorMessage: validation.error || 'Please enter valid test card information.',
    };
  }

  // 2. Simulate processor latency (750ms)
  await new Promise((resolve) => setTimeout(resolve, 750));

  // 3. Simulated failure trigger (if configured by cashier or test card number ends in 0000)
  const cleanNumber = cardDetails.cardNumber.replace(/\D/g, '');
  if (cardDetails.simulateFailure || cleanNumber.endsWith('0000')) {
    return {
      success: false,
      errorMessage: 'Payment Failed: Card declined by simulated issuer (Insufficient funds or test decline).',
    };
  }

  // 4. Simulated successful response
  return {
    success: true,
    transactionRef: `AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    maskedCard: getMaskedTestCard(cardDetails.cardNumber),
    cardType,
  };
}
