/**
 * Stripe Terminal Client Service
 * Communicates with AquaShine server-side Stripe Terminal endpoints.
 * All Stripe secret keys and cryptographic operations stay strictly server-side.
 */

export interface TerminalReader {
  id: string;
  object?: string;
  device_type?: string;
  label: string;
  serial_number?: string;
  status: 'online' | 'offline' | 'busy' | string;
  location?: string;
  livemode?: boolean;
  ip_address?: string;
  action?: {
    type: string;
    status: 'in_progress' | 'succeeded' | 'failed' | string;
    failure_code?: string;
    failure_message?: string;
  } | null;
}

export interface TerminalConfigResponse {
  locationId: string;
  defaultReaderId: string;
  testMode: boolean;
  hasSecretKey: boolean;
  publishableKey?: string;
}

export interface CreatePaymentIntentPayload {
  transactionRef: string;
  service: { id: string; name: string; price: number };
  vehicleType: { id: string; name: string; surcharge: number };
  addOns: Array<{ id: string; name: string; price: number }>;
  discountAmount?: number;
  taxRate?: number;
  customerName?: string;
  customerPhone?: string;
}

export interface PaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  amountInCents: number;
  currency: string;
  status: string;
  transactionRef: string;
  isSimulated: boolean;
}

export interface PaymentIntentStatusResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  cardBrand?: string;
  cardLast4?: string;
  cardEntryMethod?: 'contactless' | 'chip' | 'swipe' | 'manual';
  terminalAuthCode?: string;
  maskedCard?: string;
  isSimulated: boolean;
}

export interface TerminalPaymentResult {
  success: boolean;
  paymentIntentId: string;
  readerId: string;
  amount: number;
  cardBrand: string;
  cardLast4: string;
  cardEntryMethod: 'contactless' | 'chip' | 'swipe' | 'manual';
  terminalAuthCode: string;
  maskedCard: string;
  isSimulated: boolean;
}

export async function fetchTerminalConfig(): Promise<TerminalConfigResponse> {
  const res = await fetch('/api/terminal/config');
  if (!res.ok) {
    throw new Error('Failed to retrieve Stripe Terminal config');
  }
  return res.json();
}

export async function updateTerminalConfig(
  payload: Partial<TerminalConfigResponse & { stripeSecretKey?: string; stripePublishableKey?: string }>
): Promise<{ success: boolean; config: TerminalConfigResponse }> {
  const res = await fetch('/api/terminal/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update Terminal configuration');
  }
  return res.json();
}

export async function fetchTerminalReaders(): Promise<{ readers: TerminalReader[]; isSimulated: boolean }> {
  const res = await fetch('/api/terminal/readers');
  if (!res.ok) {
    throw new Error('Failed to fetch card readers');
  }
  return res.json();
}

export async function registerTerminalReader(
  registrationCode: string,
  label: string
): Promise<{ success: boolean; reader: TerminalReader; isSimulated: boolean }> {
  const res = await fetch('/api/terminal/readers/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationCode, label }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to register terminal reader');
  }
  return res.json();
}

export async function createTerminalPaymentIntent(
  payload: CreatePaymentIntentPayload
): Promise<PaymentIntentResponse> {
  const res = await fetch('/api/terminal/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to initiate card reader payment');
  }
  return res.json();
}

export async function processPaymentIntentOnReader(
  readerId: string,
  paymentIntentId: string
): Promise<{ success: boolean; readerId: string; action: any; isSimulated: boolean }> {
  const res = await fetch('/api/terminal/process-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ readerId, paymentIntentId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to dispatch payment to reader');
  }
  return res.json();
}

export async function cancelReaderAction(readerId: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/terminal/cancel-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ readerId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to cancel reader action');
  }
  return res.json();
}

export async function fetchPaymentIntentStatus(
  paymentIntentId: string
): Promise<PaymentIntentStatusResponse> {
  const res = await fetch(`/api/terminal/payment-intent/${encodeURIComponent(paymentIntentId)}`);
  if (!res.ok) {
    throw new Error('Failed to retrieve payment intent status');
  }
  return res.json();
}

export async function simulateTerminalPayment(
  readerId: string,
  paymentIntentId: string,
  outcome: 'approved_contactless' | 'approved_chip' | 'approved_swipe' | 'declined' = 'approved_contactless'
): Promise<{
  success: boolean;
  status: string;
  error?: string;
  cardBrand?: string;
  cardLast4?: string;
  cardEntryMethod?: 'contactless' | 'chip' | 'swipe' | 'manual';
  terminalAuthCode?: string;
  maskedCard?: string;
}> {
  const res = await fetch('/api/terminal/simulate-payment-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ readerId, paymentIntentId, outcome }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to simulate terminal card action');
  }
  return res.json();
}
