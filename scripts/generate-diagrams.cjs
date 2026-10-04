const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const docx = require('docx');
const PDFDocument = require('pdfkit');

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  ShadingType,
  PageBreak,
} = docx;

// Output paths
const DOCX_PATH_PUBLIC = path.join(__dirname, '../public/car-wash-sequence-diagrams.docx');
const PDF_PATH_PUBLIC = path.join(__dirname, '../public/car-wash-sequence-diagrams.pdf');
const DOCX_PATH_ROOT = path.join(__dirname, '../car-wash-sequence-diagrams.docx');
const PDF_PATH_ROOT = path.join(__dirname, '../car-wash-sequence-diagrams.pdf');

// Helper to escape XML
function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate a pristine SVG Sequence Diagram
 */
function generateSequenceSvg(data) {
  const { title, participants, messages, notes = [] } = data;

  const width = 1200;
  const paddingX = 70;
  const topY = 70;
  const participantWidth = 150;
  const participantHeight = 44;

  const numP = participants.length;
  const colSpacing = (width - 2 * paddingX) / (numP - 1);

  const participantCoords = {};
  participants.forEach((p, idx) => {
    participantCoords[p.id] = paddingX + idx * colSpacing;
  });

  const messageStartY = topY + participantHeight + 35;
  const messageSpacing = 42;
  const totalMessagesHeight = messages.length * messageSpacing;
  const bottomY = messageStartY + totalMessagesHeight + 40;
  const height = bottomY + participantHeight + 50;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <linearGradient id="actorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>
    <linearGradient id="serviceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0369a1" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="storageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#047857" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="extGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6d28d9" />
      <stop offset="100%" stop-color="#7c3aed" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="115%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1" />
    </filter>
    <marker id="arrowSolid" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
      <polygon points="0 1, 8 4.5, 0 8" fill="#0284c7" />
    </marker>
    <marker id="arrowReturn" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
      <polyline points="1 1, 8 4.5, 1 8" fill="none" stroke="#64748b" stroke-width="1.6" />
    </marker>
    <marker id="arrowError" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
      <polygon points="0 1, 8 4.5, 0 8" fill="#e11d48" />
    </marker>
  </defs>

  <!-- Title Banner -->
  <rect x="0" y="0" width="${width}" height="42" fill="#f8fafc" />
  <line x1="0" y1="42" x2="${width}" y2="42" stroke="#e2e8f0" stroke-width="1" />
  <text x="30" y="26" font-size="14" font-weight="bold" fill="#0f172a" letter-spacing="0.5">${escapeXml(title)}</text>
  <rect x="${width - 150}" y="10" width="120" height="22" rx="11" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1" />
  <text x="${width - 90}" y="25" font-size="10" font-weight="bold" fill="#065f46" text-anchor="middle">IMPLEMENTED</text>
`;

  // Draw Lifelines
  participants.forEach(p => {
    const x = participantCoords[p.id];
    svg += `  <line x1="${x}" y1="${topY + participantHeight}" x2="${x}" y2="${bottomY}" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="5 5" />\n`;
  });

  // Draw Top & Bottom Participant Boxes
  function renderParticipantBoxes(yPos) {
    let out = '';
    participants.forEach(p => {
      const x = participantCoords[p.id] - participantWidth / 2;
      let grad = 'url(#serviceGrad)';
      let icon = '⚙️';
      if (p.type === 'actor') { grad = 'url(#actorGrad)'; icon = '👤'; }
      else if (p.type === 'storage') { grad = 'url(#storageGrad)'; icon = '💾'; }
      else if (p.type === 'external') { grad = 'url(#extGrad)'; icon = '🌐'; }

      out += `  <g filter="url(#shadow)">
    <rect x="${x}" y="${yPos}" width="${participantWidth}" height="${participantHeight}" rx="8" fill="${grad}" />
    <text x="${x + participantWidth / 2}" y="${yPos + 26}" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">${icon} ${escapeXml(p.label)}</text>
  </g>\n`;
    });
    return out;
  }

  svg += renderParticipantBoxes(topY);

  // Render Messages
  messages.forEach((msg, idx) => {
    const currentY = messageStartY + idx * messageSpacing;
    const x1 = participantCoords[msg.from];
    const x2 = participantCoords[msg.to];
    const isForward = x2 > x1;
    const isReturn = msg.type === 'return';
    const isError = msg.type === 'error';
    const isSelf = msg.from === msg.to;

    let strokeColor = '#0284c7';
    let marker = 'url(#arrowSolid)';
    let dash = 'none';

    if (isReturn) {
      strokeColor = '#64748b';
      marker = 'url(#arrowReturn)';
      dash = '5 4';
    } else if (isError) {
      strokeColor = '#e11d48';
      marker = 'url(#arrowError)';
      dash = '4 3';
    }

    if (isSelf) {
      // Loopback arrow
      const loopWidth = 35;
      svg += `  <path d="M ${x1} ${currentY - 8} L ${x1 + loopWidth} ${currentY - 8} L ${x1 + loopWidth} ${currentY + 12} L ${x1 + 6} ${currentY + 12}" fill="none" stroke="${strokeColor}" stroke-width="1.8" marker-end="${marker}" />
  <text x="${x1 + loopWidth + 8}" y="${currentY + 6}" font-size="11" font-weight="600" fill="#334155">${escapeXml(msg.text)}</text>\n`;
    } else {
      const targetX = isForward ? x2 - 4 : x2 + 4;
      const textX = (x1 + x2) / 2;
      const textY = currentY - 6;

      svg += `  <line x1="${x1}" y1="${currentY}" x2="${targetX}" y2="${currentY}" stroke="${strokeColor}" stroke-width="1.8" stroke-dasharray="${dash}" marker-end="${marker}" />
  <rect x="${textX - 180}" y="${textY - 12}" width="360" height="15" fill="#ffffff" opacity="0.92" />
  <text x="${textX}" y="${textY}" font-size="11" font-weight="600" fill="${isError ? '#be123c' : '#1e293b'}" text-anchor="middle">${escapeXml(msg.text)}</text>\n`;
    }
  });

  // Bottom participants
  svg += renderParticipantBoxes(bottomY);

  svg += `</svg>`;
  return svg;
}

// Convert SVG to crisp PNG buffer
function svgToPngBuffer(svgString) {
  const resvg = new Resvg(svgString, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Helvetica',
    },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

/**
 * All 9 Workflows Defined Strictly from Code Implementation
 */
const WORKFLOWS = [
  {
    id: 1,
    title: 'Customer Registration & Welcome Promo Dispatch',
    codeName: 'Customer SignUp Workflow',
    purpose: 'Allows a new guest customer to register an account on the public portal, validates uniqueness, generates customer CRM and user account credentials, issues a 15% First-Signup welcome coupon, and triggers an email dispatch webhook.',
    status: 'Implemented',
    sourceFiles: [
      'src/components/Public/CustomerSignUpPage.tsx',
      'src/App.tsx (handleCustomerSignUpSuccess)',
      'src/services/authService.ts',
      'src/services/promoService.ts',
      'src/data/customerData.ts',
    ],
    components: [
      'Customer (Actor)',
      'CustomerSignUpPage (UI)',
      'App.tsx / Auth & Promo Logic (Application Logic)',
      'LocalStorage (Client Storage: customers, accounts, promo_codes)',
      'Google Apps Script Web App (External Email Webhook)',
    ],
    participants: [
      { id: 'user', label: 'Customer', type: 'actor' },
      { id: 'ui', label: 'CustomerSignUpPage', type: 'service' },
      { id: 'logic', label: 'App / Promo Logic', type: 'service' },
      { id: 'db', label: 'LocalStorage DB', type: 'storage' },
      { id: 'ext', label: 'Google Apps Script', type: 'external' },
    ],
    messages: [
      { from: 'user', to: 'ui', text: '1. Inputs Name, Phone, Email & Password', type: 'sync' },
      { from: 'ui', to: 'ui', text: '2. Form Validation: min 6 chars, email pattern', type: 'sync' },
      { from: 'ui', to: 'db', text: '3. Query existing accounts & phones for duplicates', type: 'sync' },
      { from: 'db', to: 'ui', text: '4. Returns existing directory records', type: 'return' },
      { from: 'ui', to: 'logic', text: '5. onSignUpSuccess(newUser, customerProfile, plainPassword)', type: 'sync' },
      { from: 'logic', to: 'db', text: '6. Persist Customer (CUS-######) & UserAccount (USR-######)', type: 'sync' },
      { from: 'logic', to: 'logic', text: '7. generateWelcomePromoCode() -> WELCOME15-XXXXXX', type: 'sync' },
      { from: 'logic', to: 'ext', text: '8. HTTP POST sendWelcomeDiscountEmail() webhook', type: 'sync' },
      { from: 'ext', to: 'logic', text: '9. Delivery Status (sent / not_configured)', type: 'return' },
      { from: 'logic', to: 'db', text: '10. Save PromoCode & Session User (my_car_wash_current_user)', type: 'sync' },
      { from: 'logic', to: 'ui', text: '11. Auto-login & redirect to CustomerDashboard', type: 'return' },
      { from: 'ui', to: 'user', text: '12. Displays Dashboard with Verified Badge & 15% Promo Card', type: 'return' },
    ],
    flowDescription: [
      'Customer fills first name, last name, phone, email, password, and confirm-password fields on the public signup page.',
      'The client component validates field presence, matching passwords, and normalized phone digits.',
      'A duplicate lookup queries localStorage to ensure the email and phone do not already belong to an active customer. If duplicate, a direct "Sign in here" link appears.',
      'Upon submission, App.tsx generates a sequential customer profile (CUS-######) and salted user account hash.',
      'The PromoService automatically creates a 15% discount code valid for 3 months and dispatches an asynchronous HTTP POST webhook to Google Apps Script.',
      'The application commits all entities to localStorage, persists active user session, and immediately navigates to CustomerDashboardPage.',
    ],
    rules: [
      'Password must be at least 6 characters.',
      'Phone numbers are normalized via non-digit regex to prevent duplicate entries.',
      'Welcome discount is strictly set to 15% with a 3-month expiration window.',
      'All newly registered users are enforced with role = "customer" (never Admin or Cashier).',
    ],
    errorPaths: [
      'Duplicate email/phone -> Inline alert with error message and pre-filled sign-in shortcut.',
      'Unconfigured Google Apps Script webhook -> Graceful fallback: promo code is saved locally with "not_configured" delivery status so the user still receives their discount.',
    ],
  },
  {
    id: 2,
    title: 'Customer Authentication & Session Recovery',
    codeName: 'Customer Login Workflow',
    purpose: 'Authenticates registered customers via email, customer ID, or phone number, verifies salted password credentials, executes self-healing for demo accounts, and restores user session.',
    status: 'Implemented',
    sourceFiles: [
      'src/components/Public/CustomerLoginPage.tsx',
      'src/App.tsx (handleCustomerLoginSuccess)',
      'src/services/authService.ts',
      'src/data/customerData.ts',
    ],
    components: [
      'Customer (Actor)',
      'CustomerLoginPage (UI)',
      'authService.ts (Auth Logic)',
      'LocalStorage (Client Storage: accounts, customers, current_user)',
      'CustomerDashboardPage (UI Destination)',
    ],
    participants: [
      { id: 'user', label: 'Customer', type: 'actor' },
      { id: 'ui', label: 'CustomerLoginPage', type: 'service' },
      { id: 'logic', label: 'authService / App', type: 'service' },
      { id: 'db', label: 'LocalStorage DB', type: 'storage' },
      { id: 'dash', label: 'CustomerDashboard', type: 'service' },
    ],
    messages: [
      { from: 'user', to: 'ui', text: '1. Enters Email / Phone / ID and Password', type: 'sync' },
      { from: 'ui', to: 'db', text: '2. Fetch accounts (my_car_wash_auth_accounts)', type: 'sync' },
      { from: 'db', to: 'ui', text: '3. Return account list', type: 'return' },
      { from: 'ui', to: 'logic', text: '4. Match customer role & verifyPassword(plain, hash)', type: 'sync' },
      { from: 'logic', to: 'logic', text: '5. Self-Healing: Update hash if account held demo password', type: 'sync' },
      { from: 'logic', to: 'db', text: '6. Persist updated hash & last_customer_email', type: 'sync' },
      { from: 'ui', to: 'db', text: '7. Set active session in my_car_wash_current_user', type: 'sync' },
      { from: 'ui', to: 'dash', text: '8. Mount CustomerDashboard with active profile', type: 'sync' },
      { from: 'dash', to: 'user', text: '9. Render Dashboard: Wash balance, vehicles, transactions', type: 'return' },
    ],
    flowDescription: [
      'Customer enters identifier and password on CustomerLoginPage (or uses Quick Demo button).',
      'The component normalizes the input, matching against email, internal ID, customer ID, or phone.',
      'authService validates the password hash against the stored record.',
      'A self-healing mechanism automatically updates the stored hash if the user previously had the demo password but entered their newly chosen password.',
      'The last used email is stored in localStorage for pre-filling next time.',
      'Active session is established and the customer dashboard view is rendered.',
    ],
    rules: [
      'Only accounts with role = "customer" are allowed to authenticate on this portal.',
      'Invalid password or unknown account immediately displays localized error.',
      'Session persists across browser tab refreshes via localStorage.',
    ],
    errorPaths: [
      'Account not found -> "Invalid credentials" notification.',
      'Incorrect password -> "Invalid credentials" notification with form preserved.',
    ],
  },
  {
    id: 3,
    title: 'POS Express Wash Checkout & Receipt Generation',
    codeName: 'New Wash / POS Transaction Workflow',
    purpose: 'Handles the in-lane cashier point-of-sale transaction: vehicle category selection, wash package selection, à la carte add-ons, sales tax calculation, payment processing, and printed receipt modal.',
    status: 'Implemented',
    sourceFiles: [
      'src/components/Customers/CustomerPOSSection.tsx',
      'src/components/ServiceSelector.tsx',
      'src/components/AddOnSelector.tsx',
      'src/components/CardPaymentPanel.tsx',
      'src/components/ReceiptModal.tsx',
      'src/App.tsx (handleProcessPayment)',
    ],
    components: [
      'Cashier / Staff (Actor)',
      'POS Register UI (UI)',
      'Payment Engine (Logic: Card / Cash Calculator)',
      'LocalStorage (Client Storage: transactions)',
      'ReceiptModal (UI Destination)',
    ],
    participants: [
      { id: 'user', label: 'Cashier Staff', type: 'actor' },
      { id: 'ui', label: 'POS Register UI', type: 'service' },
      { id: 'logic', label: 'Payment Engine', type: 'service' },
      { id: 'db', label: 'LocalStorage DB', type: 'storage' },
      { id: 'rcpt', label: 'ReceiptModal', type: 'service' },
    ],
    messages: [
      { from: 'user', to: 'ui', text: '1. Select Vehicle Type (Car $0 / SUV +$5)', type: 'sync' },
      { from: 'user', to: 'ui', text: '2. Select Wash (Basic $15, Deluxe $20, Premium $25, Full $35)', type: 'sync' },
      { from: 'user', to: 'ui', text: '3. Select Add-Ons (Hot Wax $5, Tire Shine $5, Vacuum $10)', type: 'sync' },
      { from: 'ui', to: 'ui', text: '4. Calculate Subtotal, Tax (8.25%) & Total', type: 'sync' },
      { from: 'user', to: 'ui', text: '5. Select Payment Method (Cash / Card)', type: 'sync' },
      { from: 'ui', to: 'logic', text: '6. Process tender (Card modal or Cash change calculator)', type: 'sync' },
      { from: 'logic', to: 'logic', text: '7. Generate Transaction Record (TX-..., receiptNumber: RC-####)', type: 'sync' },
      { from: 'logic', to: 'db', text: '8. Append to my_car_wash_transactions', type: 'sync' },
      { from: 'db', to: 'logic', text: '9. Transaction persisted', type: 'return' },
      { from: 'logic', to: 'rcpt', text: '10. Launch ReceiptModal with itemized bill', type: 'sync' },
      { from: 'rcpt', to: 'user', text: '11. Display Printable Receipt & Reset Register', type: 'return' },
    ],
    flowDescription: [
      'Cashier selects vehicle tier (Car or SUV/Truck), wash tier, and optional add-ons in lane.',
      'OrderSummary computes real-time subtotal, 8.25% sales tax, and total amount due.',
      'Cashier selects payment method. If credit/debit card, CardPaymentPanel processes test authorization and returns masked card ref (**** 1234). If cash, change due is computed.',
      'App.tsx constructs a complete Transaction entity with status = "completed".',
      'The transaction is committed to localStorage.',
      'ReceiptModal opens displaying business details, itemized breakdown, tax details, barcode, and print action.',
    ],
    rules: [
      'SUV/Truck category incurs configured vehicle surcharge (default +$5.00).',
      'Sales tax is computed as subtotal * taxRate (default 8.25%).',
      'Receipt numbers are sequentially incremented for customer auditing.',
    ],
    errorPaths: [
      'No wash service selected -> Payment button remains disabled.',
      'Cash tendered is less than order total -> Error prompt to enter full payment amount.',
    ],
  },
  {
    id: 4,
    title: 'Welcome Discount Code Redemption',
    codeName: '15% Promo Code Redemption Workflow',
    purpose: 'Validates and applies the First-Signup 15% discount coupon at checkout, deducts discount from wash subtotal, links transaction record, and flags the coupon as redeemed.',
    status: 'Implemented',
    sourceFiles: [
      'src/components/Customers/CustomerPOSSection.tsx',
      'src/components/OrderSummary.tsx',
      'src/services/promoService.ts (validatePromoCode)',
      'src/App.tsx (handleProcessPayment)',
    ],
    components: [
      'Cashier / Customer (Actor)',
      'OrderSummary (UI)',
      'promoService.ts (Validation & Calculation Logic)',
      'LocalStorage (Client Storage: promo_codes, transactions)',
      'ReceiptModal (UI Destination)',
    ],
    participants: [
      { id: 'user', label: 'Cashier / Customer', type: 'actor' },
      { id: 'ui', label: 'OrderSummary UI', type: 'service' },
      { id: 'logic', label: 'promoService.ts', type: 'service' },
      { id: 'db', label: 'LocalStorage DB', type: 'storage' },
      { id: 'rcpt', label: 'ReceiptModal', type: 'service' },
    ],
    messages: [
      { from: 'user', to: 'ui', text: '1. Enters Promo Code (e.g. WELCOME15-7K8M9P)', type: 'sync' },
      { from: 'ui', to: 'logic', text: '2. validatePromoCode(code, promoCodes, customerId)', type: 'sync' },
      { from: 'logic', to: 'db', text: '3. Lookup code in my_car_wash_promo_codes', type: 'sync' },
      { from: 'db', to: 'logic', text: '4. Returns coupon document', type: 'return' },
      { from: 'logic', to: 'logic', text: '5. Verify status=available & expiresAt > now()', type: 'sync' },
      { from: 'logic', to: 'ui', text: '6. Success: Apply 15% discount on wash subtotal', type: 'return' },
      { from: 'user', to: 'ui', text: '7. Submits checkout payment', type: 'sync' },
      { from: 'ui', to: 'db', text: '8. Mark promo code: status="used", usedAt=now()', type: 'sync' },
      { from: 'ui', to: 'db', text: '9. Save Transaction with promoCode & promoDiscountAmount', type: 'sync' },
      { from: 'ui', to: 'rcpt', text: '10. Render Receipt with 15% Welcome Discount line', type: 'return' },
    ],
    flowDescription: [
      'Cashier or customer enters coupon code into the OrderSummary promo input field.',
      'promoService checks that the code exists, belongs to eligible customer, is unused, and has not passed its 3-month expiration date.',
      'The cart subtotal is reduced by 15% and sales tax is recalculated.',
      'When transaction completes, promo code is updated to status = "used" with timestamp and receipt number.',
      'Printed receipt displays original subtotal, welcome discount reduction, and final total.',
    ],
    rules: [
      'Promo code is strictly single-use; subsequent attempts are rejected.',
      'Expired codes (> 3 months from creation) cannot be redeemed.',
      'Discount applies to the wash service subtotal.',
    ],
    errorPaths: [
      'Non-existent code -> "Invalid promo code" message.',
      'Already used code -> "This promo code has already been redeemed".',
      'Expired code -> "This promo code expired on [date]".',
    ],
  },
  {
    id: 5,
    title: 'Wash Club Membership Subscription',
    codeName: 'Membership Purchase Workflow',
    purpose: 'Enables customers to enroll in monthly or annual wash pass clubs, captures recurring plan terms, initiates payment, records active membership document, and registers initial wash credits.',
    status: 'Implemented',
    sourceFiles: [
      'src/components/Public/MembershipsPage.tsx',
      'src/components/Memberships/MembershipCheckoutModal.tsx',
      'src/App.tsx (handleConfirmMembershipSuccess)',
      'src/data/membershipData.ts',
    ],
    components: [
      'Customer (Actor)',
      'MembershipsPage / Modal (UI)',
      'App.tsx Membership Logic (Application Logic)',
      'LocalStorage (Client Storage: memberships, transactions)',
      'CustomerDashboardPage (UI Destination)',
    ],
    participants: [
      { id: 'user', label: 'Customer', type: 'actor' },
      { id: 'ui', label: 'MembershipCheckoutModal', type: 'service' },
      { id: 'logic', label: 'App.tsx Handlers', type: 'service' },
      { id: 'db', label: 'LocalStorage DB', type: 'storage' },
      { id: 'dash', label: 'CustomerDashboard', type: 'service' },
    ],
    messages: [
      { from: 'user', to: 'ui', text: '1. Selects Plan (e.g. Premium Monthly $39.99)', type: 'sync' },
      { from: 'ui', to: 'ui', text: '2. Check logged-in customer state (prompts login if guest)', type: 'sync' },
      { from: 'user', to: 'ui', text: '3. Enters Card details & confirms Terms of Service', type: 'sync' },
      { from: 'ui', to: 'logic', text: '4. handleConfirmMembershipSuccess(plan, customer, user)', type: 'sync' },
      { from: 'logic', to: 'logic', text: '5. Compute nextBillingDate (+1 mo / +1 yr)', type: 'sync' },
      { from: 'logic', to: 'db', text: '6. Create CustomerMembership (MEM-######, remaining=4)', type: 'sync' },
      { from: 'logic', to: 'db', text: '7. Record Transaction (type: "membership_signup")', type: 'sync' },
      { from: 'db', to: 'logic', text: '8. Saved successfully', type: 'return' },
      { from: 'logic', to: 'dash', text: '9. Route to Customer Dashboard', type: 'sync' },
      { from: 'dash', to: 'user', text: '10. Display Active Membership Card, Barcode & Wash Pass', type: 'return' },
    ],
    flowDescription: [
      'Customer navigates to Memberships page, reviews wash plans, and clicks "Join Wash Pass".',
      'If guest, modal prompts customer to log in or create an account. If authenticated, checkout modal opens.',
      'Customer enters payment method and approves subscription terms.',
      'System calculates billing frequency, expiration date, and allocates 4 included washes.',
      'A new CustomerMembership record (MEM-######) and financial transaction record are saved to localStorage.',
      'Customer dashboard refreshes with active member badge, remaining wash meter, and digital member ID.',
    ],
    rules: [
      'Customer can maintain an active subscription per customer ID.',
      'Initial allocation grants 4 washes for the billing period.',
      'Next billing date is computed based on billingFrequency (monthly vs yearly).',
    ],
    errorPaths: [
      'Unauthenticated user -> Redirects to login prompt with pre-selected plan preserved.',
      'Declined card payment -> Modal displays retry message without saving membership.',
    ],
  },
  {
    id: 6,
    title: 'In-Lane Membership Wash Redemption',
    codeName: 'Membership Usage During POS Workflow',
    purpose: 'Identifies active club members during checkout, validates wash entitlement balance, debits 1 wash from remaining allocation, records audit log, and issues zero-dollar wash transaction.',
    status: 'Implemented',
    sourceFiles: [
      'src/components/Customers/CustomerPOSSection.tsx',
      'src/App.tsx (handleProcessPayment)',
      'src/data/membershipData.ts',
    ],
    components: [
      'Cashier / Member (Actor)',
      'POS Register (UI)',
      'Membership Engine (Application Logic)',
      'LocalStorage (Client Storage: memberships, usages, transactions)',
      'ReceiptModal (UI Destination)',
    ],
    participants: [
      { id: 'user', label: 'Cashier / Member', type: 'actor' },
      { id: 'ui', label: 'POS Register UI', type: 'service' },
      { id: 'logic', label: 'Membership Engine', type: 'service' },
      { id: 'db', label: 'LocalStorage DB', type: 'storage' },
      { id: 'rcpt', label: 'ReceiptModal', type: 'service' },
    ],
    messages: [
      { from: 'user', to: 'ui', text: '1. Selects Member Customer Profile', type: 'sync' },
      { from: 'ui', to: 'db', text: '2. Query active membership (my_car_wash_memberships)', type: 'sync' },
      { from: 'db', to: 'ui', text: '3. Return MEM-###### with remainingWashes balance', type: 'return' },
      { from: 'ui', to: 'ui', text: '4. Display Member Active banner ($0 Wash Price)', type: 'sync' },
      { from: 'user', to: 'ui', text: '5. Selects Payment Method: MEMBERSHIP', type: 'sync' },
      { from: 'ui', to: 'logic', text: '6. Execute redemption: verify remainingWashes > 0', type: 'sync' },
      { from: 'logic', to: 'db', text: '7. Decrement remainingWashes: 4 -> 3', type: 'sync' },
      { from: 'logic', to: 'db', text: '8. Insert MembershipUsage audit log (USG-######)', type: 'sync' },
      { from: 'logic', to: 'db', text: '9. Save Transaction (isMembershipWash=true, discount=$25)', type: 'sync' },
      { from: 'logic', to: 'rcpt', text: '10. Open ReceiptModal showing $0 billed & balance remaining', type: 'return' },
    ],
    flowDescription: [
      'Customer arrives at wash register. Cashier selects customer profile or scans member barcode.',
      'System detects active subscription with positive remaining wash balance.',
      'The eligible plan service displays as $0 Included With Membership.',
      'Cashier selects MEMBERSHIP payment method and confirms checkout.',
      'System decrements customer membership balance, generates a MembershipUsage log (USG-######), and creates a completed transaction.',
      'Receipt prints indicating 100% membership credit and balance remaining.',
    ],
    rules: [
      'Customer must have status = "active" and remainingWashes > 0.',
      'Redeemed wash service must match plan includedServiceId.',
      'Optional add-ons are billed separately or receive plan add-on discount.',
    ],
    errorPaths: [
      'Zero remaining washes -> UI warns balance exhausted; prompts cashier to bill retail or renew.',
      'Expired/cancelled membership -> System prevents $0 redemption and reverts to retail pricing.',
    ],
  },
  {
    id: 7,
    title: 'Staff Administration & Role-Based Authorization',
    codeName: 'Staff & Admin Login Workflow',
    purpose: 'Authenticates store managers and cashier staff members, verifies password hashes, establishes staff session, and provisions role-based navigation tabs (Admin vs Cashier).',
    status: 'Implemented',
    sourceFiles: [
      'src/components/Public/AdminLoginPage.tsx',
      'src/components/Header.tsx',
      'src/services/authService.ts',
      'src/App.tsx (handleAdminLoginSuccess)',
    ],
    components: [
      'Admin / Cashier (Actor)',
      'AdminLoginPage (UI)',
      'authService.ts (Auth Logic)',
      'LocalStorage (Client Storage: accounts, current_user)',
      'Staff Header / POS Register (UI Destination)',
    ],
    participants: [
      { id: 'user', label: 'Admin / Cashier', type: 'actor' },
      { id: 'ui', label: 'AdminLoginPage', type: 'service' },
      { id: 'logic', label: 'authService.ts', type: 'service' },
      { id: 'db', label: 'LocalStorage DB', type: 'storage' },
      { id: 'pos', label: 'Staff POS Workspace', type: 'service' },
    ],
    messages: [
      { from: 'user', to: 'ui', text: '1. Enters Staff Email & Password (or Quick Fill)', type: 'sync' },
      { from: 'ui', to: 'db', text: '2. Fetch staff accounts from my_car_wash_auth_accounts', type: 'sync' },
      { from: 'db', to: 'ui', text: '3. Return account list', type: 'return' },
      { from: 'ui', to: 'logic', text: '4. Filter role="admin"|"cashier" & verifyPassword()', type: 'sync' },
      { from: 'logic', to: 'ui', text: '5. Credentials verified', type: 'return' },
      { from: 'ui', to: 'db', text: '6. Set active user in my_car_wash_current_user', type: 'sync' },
      { from: 'ui', to: 'pos', text: '7. Mount Staff Workspace with role-based navigation', type: 'sync' },
      { from: 'pos', to: 'user', text: '8. Render Staff POS Register with Role Badge', type: 'return' },
    ],
    flowDescription: [
      'Staff member navigates to AdminLoginPage and submits credentials (or clicks Admin/Cashier Quick Fill buttons).',
      'authService queries account directory and verifies password hash.',
      'User role is evaluated: "admin" receives POS, Customers, Memberships, Transactions, and Settings tabs; "cashier" receives POS, Customers, and Transactions.',
      'Session is persisted in localStorage.',
      'Application mounts Staff Header showing live register lane, clock, tax rate, and active role badge.',
    ],
    rules: [
      'Customer accounts are blocked from accessing Admin Login.',
      'Admin role has exclusive access to modify services, vehicle surcharges, and tax rates in Settings.',
      'Password hash is verified using constant-time string comparison.',
    ],
    errorPaths: [
      'Invalid password -> "Invalid credentials" error alert.',
      'Customer account entered on Staff Login -> "Invalid credentials" error alert.',
    ],
  },
  {
    id: 8,
    title: 'Transaction Ledger Audit, Filtering & Voiding',
    codeName: 'Transaction Management Workflow',
    purpose: 'Provides store managers and cashiers with full transaction auditing, real-time receipt filtering, customer history lookup, receipt reprints, and transaction voiding.',
    status: 'Implemented',
    sourceFiles: [
      'src/components/TransactionsPage.tsx',
      'src/components/TransactionsTable.tsx',
      'src/components/TransactionFilters.tsx',
      'src/components/TransactionDetailsModal.tsx',
      'src/App.tsx (handleVoidTransaction)',
    ],
    components: [
      'Staff / Manager (Actor)',
      'TransactionsPage / Table (UI)',
      'TransactionFilters (UI Filter Engine)',
      'LocalStorage (Client Storage: transactions)',
      'TransactionDetailsModal (UI Modal)',
    ],
    participants: [
      { id: 'user', label: 'Store Staff', type: 'actor' },
      { id: 'ui', label: 'TransactionsPage', type: 'service' },
      { id: 'filter', label: 'Filter Engine', type: 'service' },
      { id: 'db', label: 'LocalStorage DB', type: 'storage' },
      { id: 'modal', label: 'DetailsModal', type: 'service' },
    ],
    messages: [
      { from: 'user', to: 'ui', text: '1. Navigates to Transactions Tab', type: 'sync' },
      { from: 'ui', to: 'db', text: '2. Read all transactions (my_car_wash_transactions)', type: 'sync' },
      { from: 'db', to: 'ui', text: '3. Return transaction array', type: 'return' },
      { from: 'user', to: 'filter', text: '4. Inputs Search (Receipt #, Customer, Plate) & Date Filter', type: 'sync' },
      { from: 'filter', to: 'ui', text: '5. Return matching filtered transactions', type: 'return' },
      { from: 'user', to: 'modal', text: '6. Clicks row to view itemized breakdown', type: 'sync' },
      { from: 'modal', to: 'user', text: '7. Displays breakdown, tax, payment ref & Print option', type: 'return' },
      { from: 'user', to: 'modal', text: '8. Clicks "Void Transaction" & confirms prompt', type: 'sync' },
      { from: 'modal', to: 'db', text: '9. Update record: status="voided", voidedAt=now()', type: 'sync' },
      { from: 'db', to: 'ui', text: '10. Saved updated transaction list', type: 'return' },
      { from: 'ui', to: 'user', text: '11. Display VOIDED watermark badge on row & receipt', type: 'return' },
    ],
    flowDescription: [
      'Staff views chronological transaction ledger displaying receipt number, timestamp, customer name, vehicle, payment method, and amount.',
      'Filter engine performs multi-criteria filtering by text search, status (Completed vs Voided), and payment type.',
      'Clicking any record opens TransactionDetailsModal with full line items, discount records, and receipt reprint option.',
      'Staff clicks "Void Transaction" and confirms the modal dialog.',
      'Transaction entity is updated to status = "voided" with an audit timestamp and persisted to localStorage.',
      'Table updates row with red "VOIDED" badge and prevents duplicate voiding.',
    ],
    rules: [
      'Already voided transactions cannot be voided again.',
      'Voiding retains the original financial record for audit trail integrity.',
      'Receipt modal dynamically renders "VOIDED" watermark across reprinted receipt.',
    ],
    errorPaths: [
      'User cancels void prompt -> Transaction remains active and completed.',
    ],
  },
  {
    id: 9,
    title: 'Customer Contact & Webhook Enquiry Dispatch',
    codeName: 'Enquiry Submission Workflow',
    purpose: 'Enables website visitors to submit questions or service quotes, verifies honeypot spam protection, enforces 30-second rate limits, and forwards structured inquiries to a Google Apps Script webhook.',
    status: 'Implemented',
    sourceFiles: [
      'src/components/Public/EnquiryPage.tsx',
      'src/services/enquiryService.ts',
      'google-apps-script/Code.gs',
    ],
    components: [
      'Website Visitor (Actor)',
      'EnquiryPage Form (UI)',
      'enquiryService.ts (Validation & Rate Limiting)',
      'LocalStorage (Client Storage: timestamp, endpoint)',
      'Google Apps Script Web App (External Webhook: ritusehrawatai@gmail.com)',
    ],
    participants: [
      { id: 'user', label: 'Website Visitor', type: 'actor' },
      { id: 'ui', label: 'EnquiryPage Form', type: 'service' },
      { id: 'logic', label: 'enquiryService.ts', type: 'service' },
      { id: 'db', label: 'LocalStorage DB', type: 'storage' },
      { id: 'ext', label: 'Google Apps Script', type: 'external' },
    ],
    messages: [
      { from: 'user', to: 'ui', text: '1. Enters Name, Email, Phone, Message', type: 'sync' },
      { from: 'ui', to: 'logic', text: '2. Client validation (email format, message >= 10 chars)', type: 'sync' },
      { from: 'logic', to: 'logic', text: '3. Honeypot check (hidden field must be empty)', type: 'sync' },
      { from: 'logic', to: 'db', text: '4. Check carwash_last_enquiry_timestamp (30s cooldown)', type: 'sync' },
      { from: 'db', to: 'logic', text: '5. Rate-limit verified', type: 'return' },
      { from: 'logic', to: 'logic', text: '6. Resolve endpoint URL (Settings / Storage / Env)', type: 'sync' },
      { from: 'logic', to: 'ext', text: '7. HTTP POST JSON { name, email, phone, message }', type: 'sync' },
      { from: 'ext', to: 'logic', text: '8. Response: 200 OK (Email sent to ritusehrawatai@gmail.com)', type: 'return' },
      { from: 'logic', to: 'db', text: '9. Save current submission timestamp to localStorage', type: 'sync' },
      { from: 'logic', to: 'ui', text: '10. Return success & Reference Ticket ID', type: 'return' },
      { from: 'ui', to: 'user', text: '11. Display Green Confirmation Banner with Ticket ID', type: 'return' },
    ],
    flowDescription: [
      'Website visitor fills contact form on EnquiryPage with name, email, phone, and inquiry details.',
      'enquiryService checks honeypot field to block automated spam bots.',
      'A 30-second rate-limiting rule checks localStorage to prevent rapid duplicate submissions.',
      'The service resolves the active Google Apps Script Web App URL from Settings, localStorage, or environment variable.',
      'Payload is submitted via HTTP POST to Google Apps Script which delivers the notification email to ritusehrawatai@gmail.com.',
      'EnquiryPage presents a green confirmation card with a generated ticket reference number and resets form.',
    ],
    rules: [
      'Anti-spam honeypot field must remain empty.',
      'Enforces 30-second cooldown period between submissions per browser.',
      'Graceful error handling displays configuration guidance if webhook URL is unset.',
    ],
    errorPaths: [
      'Honeypot filled -> Silently rejected to prevent spam.',
      'Submission within 30 seconds -> Displays rate-limit warning with countdown.',
      'Webhook endpoint unreachable -> Displays offline setup modal with instructions for station administrator.',
    ],
  },
];

async function generateAll() {
  console.log('Generating sequence diagram images and documentation...');

  // 1. Generate SVGs and PNG buffers
  const diagramBuffers = [];
  for (const wf of WORKFLOWS) {
    console.log(`Generating diagram for Workflow ${wf.id}: ${wf.title}`);
    const svg = generateSequenceSvg(wf);
    const pngBuffer = svgToPngBuffer(svg);
    diagramBuffers.push({
      workflow: wf,
      svg,
      pngBuffer,
    });
  }

  // 2. Build Microsoft Word (.docx) Document
  console.log('Building Microsoft Word document (.docx)...');
  const docSections = [];

  // Title & Table of Contents Section
  const coverElements = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1800, after: 300 },
      children: [
        new TextRun({
          text: 'CAR WASH POS & CUSTOMER PORTAL',
          size: 26,
          color: '0284C7',
          bold: true,
          font: 'Arial',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400 },
      children: [
        new TextRun({
          text: 'Current State Sequence Diagrams',
          size: 48,
          color: '0F172A',
          bold: true,
          font: 'Arial',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 1200 },
      children: [
        new TextRun({
          text: 'Technical Architecture & Component Interaction Documentation',
          size: 24,
          color: '64748B',
          font: 'Arial',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 100 },
      children: [
        new TextRun({
          text: `Document Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
          size: 20,
          color: '334155',
          font: 'Arial',
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 1800 },
      children: [
        new TextRun({
          text: 'Version: Current Production Implementation · Status: 100% Implemented (9 Workflows)',
          size: 18,
          color: '047857',
          font: 'Arial',
          bold: true,
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),

    // Table of Contents
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 300 },
      children: [
        new TextRun({
          text: 'Table of Contents',
          size: 32,
          bold: true,
          color: '0F172A',
          font: 'Arial',
        }),
      ],
    }),
  ];

  // Add TOC rows
  WORKFLOWS.forEach(wf => {
    coverElements.push(
      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [
          new TextRun({
            text: `Workflow ${wf.id}: `,
            bold: true,
            color: '0284C7',
            font: 'Arial',
            size: 22,
          }),
          new TextRun({
            text: `${wf.title} `,
            bold: true,
            color: '0F172A',
            font: 'Arial',
            size: 22,
          }),
          new TextRun({
            text: `[${wf.status.toUpperCase()}]`,
            bold: true,
            color: '047857',
            font: 'Arial',
            size: 18,
          }),
        ],
      })
    );
  });

  coverElements.push(new Paragraph({ children: [new PageBreak()] }));

  // Add each workflow section
  const workflowDocElements = [];

  diagramBuffers.forEach(({ workflow: wf, pngBuffer }, index) => {
    workflowDocElements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
        children: [
          new TextRun({
            text: `Workflow ${wf.id}: ${wf.title}`,
            size: 30,
            bold: true,
            color: '0284C7',
            font: 'Arial',
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 60, after: 150 },
        children: [
          new TextRun({ text: 'Implementation Status: ', bold: true, size: 20, font: 'Arial' }),
          new TextRun({ text: 'IMPLEMENTED IN CURRENT CODEBASE', bold: true, color: '047857', size: 20, font: 'Arial' }),
          new TextRun({ text: `  ·  Code Reference: ${wf.codeName}`, color: '64748B', size: 18, font: 'Arial' }),
        ],
      }),
      new Paragraph({
        spacing: { before: 100, after: 80 },
        children: [
          new TextRun({ text: 'Purpose:', bold: true, size: 22, color: '0F172A', font: 'Arial' }),
        ],
      }),
      new Paragraph({
        spacing: { before: 40, after: 200 },
        children: [
          new TextRun({ text: wf.purpose, size: 20, color: '334155', font: 'Arial' }),
        ],
      }),

      // Embedded Sequence Diagram Image
      new Paragraph({
        spacing: { before: 100, after: 80 },
        children: [
          new TextRun({ text: 'Sequence Diagram (Visual Flow):', bold: true, size: 22, color: '0F172A', font: 'Arial' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 250 },
        children: [
          new ImageRun({
            data: pngBuffer,
            transformation: {
              width: 650,
              height: 380,
            },
          }),
        ],
      }),

      // Flow Description
      new Paragraph({
        spacing: { before: 150, after: 80 },
        children: [
          new TextRun({ text: 'Detailed Step-by-Step Flow Description:', bold: true, size: 22, color: '0F172A', font: 'Arial' }),
        ],
      })
    );

    wf.flowDescription.forEach((step, sIdx) => {
      workflowDocElements.push(
        new Paragraph({
          spacing: { before: 40, after: 60 },
          children: [
            new TextRun({ text: `Step ${sIdx + 1}: `, bold: true, color: '0284C7', size: 20, font: 'Arial' }),
            new TextRun({ text: step, size: 20, color: '334155', font: 'Arial' }),
          ],
        })
      );
    });

    // Components & Rules
    workflowDocElements.push(
      new Paragraph({
        spacing: { before: 150, after: 80 },
        children: [
          new TextRun({ text: 'Components Involved:', bold: true, size: 22, color: '0F172A', font: 'Arial' }),
        ],
      })
    );

    wf.components.forEach(comp => {
      workflowDocElements.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 30, after: 30 },
          children: [new TextRun({ text: comp, size: 20, color: '334155', font: 'Arial' })],
        })
      );
    });

    workflowDocElements.push(
      new Paragraph({
        spacing: { before: 150, after: 80 },
        children: [
          new TextRun({ text: 'Business Rules & Validations Enforced:', bold: true, size: 22, color: '0F172A', font: 'Arial' }),
        ],
      })
    );

    wf.rules.forEach(rule => {
      workflowDocElements.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 30, after: 30 },
          children: [new TextRun({ text: rule, size: 20, color: '334155', font: 'Arial' })],
        })
      );
    });

    workflowDocElements.push(
      new Paragraph({
        spacing: { before: 150, after: 80 },
        children: [
          new TextRun({ text: 'Error / Failure Handling:', bold: true, size: 22, color: '991B1B', font: 'Arial' }),
        ],
      })
    );

    wf.errorPaths.forEach(err => {
      workflowDocElements.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 30, after: 30 },
          children: [new TextRun({ text: err, size: 20, color: '991B1B', font: 'Arial' })],
        })
      );
    });

    if (index < diagramBuffers.length - 1) {
      workflowDocElements.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
          },
        },
        children: [...coverElements, ...workflowDocElements],
      },
    ],
  });

  const docxBuffer = await Packer.toBuffer(doc);
  fs.writeFileSync(DOCX_PATH_PUBLIC, docxBuffer);
  fs.writeFileSync(DOCX_PATH_ROOT, docxBuffer);
  console.log(`Word Document saved to ${DOCX_PATH_PUBLIC} and ${DOCX_PATH_ROOT}`);

  // 3. Build PDF Document with PDFKit
  console.log('Building PDF document (.pdf)...');
  await new Promise((resolve, reject) => {
    const pdfDoc = new PDFDocument({
      size: 'A4',
      margin: 40,
      autoFirstPage: false,
      info: {
        Title: 'Car Wash Application — Current State Sequence Diagrams',
        Author: 'AI Studio Engineering',
        Subject: 'System Sequence Diagrams & Architecture Documentation',
      },
    });

    const writeStreamPublic = fs.createWriteStream(PDF_PATH_PUBLIC);
    const writeStreamRoot = fs.createWriteStream(PDF_PATH_ROOT);

    pdfDoc.pipe(writeStreamPublic);
    pdfDoc.pipe(writeStreamRoot);

    // Cover Page
    pdfDoc.addPage({ size: 'A4', layout: 'portrait', margin: 40 });
    pdfDoc.rect(0, 0, pdfDoc.page.width, 12).fill('#0284c7');

    pdfDoc.moveDown(4);
    pdfDoc.fontSize(14).font('Helvetica-Bold').fillColor('#0284c7').text('CAR WASH POS & CUSTOMER PORTAL', { align: 'center' });
    pdfDoc.moveDown(1);
    pdfDoc.fontSize(26).font('Helvetica-Bold').fillColor('#0f172a').text('Current State Sequence Diagrams', { align: 'center' });
    pdfDoc.moveDown(0.5);
    pdfDoc.fontSize(13).font('Helvetica').fillColor('#64748b').text('Complete System Architecture & Component Interaction Flows', { align: 'center' });

    pdfDoc.moveDown(4);
    pdfDoc.rect(pdfDoc.page.width / 2 - 120, pdfDoc.y, 240, 32).fillAndStroke('#ecfdf5', '#a7f3d0');
    pdfDoc.fontSize(11).font('Helvetica-Bold').fillColor('#065f46').text('STATUS: 100% IMPLEMENTED', pdfDoc.page.width / 2 - 120, pdfDoc.y + 10, { width: 240, align: 'center' });

    pdfDoc.moveDown(6);
    pdfDoc.fontSize(11).font('Helvetica-Bold').fillColor('#334155').text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
    pdfDoc.moveDown(0.5);
    pdfDoc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Scope: 9 Core Workflows (Auth, POS, Memberships, Discounts, Management)', { align: 'center' });

    // Table of Contents Page
    pdfDoc.addPage({ size: 'A4', layout: 'portrait', margin: 40 });
    pdfDoc.fontSize(20).font('Helvetica-Bold').fillColor('#0f172a').text('Table of Contents', 40, 50);
    pdfDoc.moveDown(1);

    WORKFLOWS.forEach(wf => {
      const startY = pdfDoc.y;
      pdfDoc.fontSize(11).font('Helvetica-Bold').fillColor('#0284c7').text(`Workflow ${wf.id}: `, 40, startY, { continued: true });
      pdfDoc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text(`${wf.title} `, { continued: true });
      pdfDoc.fontSize(9).font('Helvetica-Bold').fillColor('#059669').text(`[IMPLEMENTED]`, { align: 'right' });
      pdfDoc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`    Target: ${wf.codeName}`, 40, pdfDoc.y + 2);
      pdfDoc.moveDown(0.8);
    });

    // Workflow Pages (Landscape for pristine diagram resolution)
    diagramBuffers.forEach(({ workflow: wf, pngBuffer }) => {
      pdfDoc.addPage({ size: 'A4', layout: 'landscape', margin: 35 });

      // Header Bar
      pdfDoc.rect(0, 0, pdfDoc.page.width, 8).fill('#0284c7');
      pdfDoc.fontSize(16).font('Helvetica-Bold').fillColor('#0284c7').text(`Workflow ${wf.id}: ${wf.title}`, 35, 25);
      pdfDoc.fontSize(9).font('Helvetica-Bold').fillColor('#059669').text('STATUS: IMPLEMENTED', pdfDoc.page.width - 150, 28, { align: 'right', width: 115 });

      pdfDoc.fontSize(9).font('Helvetica').fillColor('#334155').text(`Purpose: ${wf.purpose}`, 35, 48, { width: pdfDoc.page.width - 70 });

      // Embed Diagram PNG Image
      const diagramY = 70;
      const diagramWidth = pdfDoc.page.width - 70;
      const diagramHeight = 275;
      pdfDoc.image(pngBuffer, 35, diagramY, { fit: [diagramWidth, diagramHeight], align: 'center' });

      // Narrative Details below diagram
      const detailY = 360;
      pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Workflow Summary & Key Components:', 35, detailY);

      // Two-column layout for details
      const col1X = 35;
      const col2X = pdfDoc.page.width / 2 + 10;
      const colWidth = pdfDoc.page.width / 2 - 45;

      let curY1 = detailY + 16;
      pdfDoc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0284c7').text('Execution Flow:', col1X, curY1);
      curY1 += 12;

      wf.flowDescription.slice(0, 4).forEach((step, idx) => {
        pdfDoc.fontSize(8).font('Helvetica').fillColor('#334155').text(`• ${step}`, col1X, curY1, { width: colWidth });
        curY1 += 20;
      });

      let curY2 = detailY + 16;
      pdfDoc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0284c7').text('Enforced Business Rules & Error Handling:', col2X, curY2);
      curY2 += 12;

      wf.rules.slice(0, 3).forEach(rule => {
        pdfDoc.fontSize(8).font('Helvetica').fillColor('#334155').text(`✔ ${rule}`, col2X, curY2, { width: colWidth });
        curY2 += 18;
      });

      wf.errorPaths.slice(0, 2).forEach(err => {
        pdfDoc.fontSize(8).font('Helvetica').fillColor('#991b1b').text(`⚠ ${err}`, col2X, curY2, { width: colWidth });
        curY2 += 18;
      });
    });

    pdfDoc.end();

    writeStreamPublic.on('finish', resolve);
    writeStreamPublic.on('error', reject);
  });

  console.log(`PDF Document saved to ${PDF_PATH_PUBLIC} and ${PDF_PATH_ROOT}`);
  console.log('All documentation and sequence diagrams successfully generated!');
}

generateAll().catch(err => {
  console.error('Generation error:', err);
  process.exit(1);
});
