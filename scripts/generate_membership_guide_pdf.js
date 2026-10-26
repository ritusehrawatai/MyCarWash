import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const outputPath = path.join(process.cwd(), 'public', 'AquaShine_Membership_User_Guide.pdf');

// Ensure public directory exists
const publicDir = path.dirname(outputPath);
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const doc = new PDFDocument({
  size: 'A4',
  margin: 45,
  bufferPages: true,
  info: {
    Title: 'AquaShine Membership Program User Guide & Requirements',
    Author: 'AquaShine Car Wash Systems',
    Subject: 'Standard Operating Procedures & Customer Portal Documentation',
    Keywords: 'Car Wash, Membership, User Guide, POS, Subscriptions',
  },
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Palette
const PRIMARY = '#1D4ED8'; // Blue 700
const ACCENT = '#0284C7';  // Cyan 600
const DARK = '#0F172A';    // Slate 900
const MUTED = '#475569';   // Slate 600
const LIGHT_BG = '#F1F5F9';// Slate 100
const BORDER = '#CBD5E1';  // Slate 300
const SUCCESS = '#059669'; // Emerald 600

function drawHeader(title, subtitle) {
  // Top brand accent stripe
  doc.rect(45, 30, doc.page.width - 90, 4).fill(PRIMARY);

  doc.fontSize(20).fillColor(PRIMARY).font('Helvetica-Bold').text('AquaShine', 45, 42);
  doc.fontSize(9).fillColor(ACCENT).font('Helvetica-Bold').text('THE ULTIMATE SHINE, EVERY SINGLE TIME', 150, 50);

  doc.fontSize(14).fillColor(DARK).font('Helvetica-Bold').text(title, 45, 70);
  if (subtitle) {
    doc.fontSize(10).fillColor(MUTED).font('Helvetica').text(subtitle, 45, 88);
  }
  doc.moveTo(45, 105).lineTo(doc.page.width - 45, 105).strokeColor(BORDER).stroke();
  doc.y = 115;
}

function drawSectionHeading(text) {
  if (doc.y > 680) {
    doc.addPage();
    drawHeader('Membership Program User Guide', 'Standard Operating Procedures & System Specifications');
  }
  doc.moveDown(0.8);
  doc.rect(45, doc.y, 4, 18).fill(ACCENT);
  doc.fontSize(13).fillColor(PRIMARY).font('Helvetica-Bold').text(`  ${text}`, 52, doc.y + 2);
  doc.moveDown(0.6);
}

function drawSubHeading(text) {
  if (doc.y > 700) {
    doc.addPage();
    drawHeader('Membership Program User Guide', 'Standard Operating Procedures & System Specifications');
  }
  doc.moveDown(0.4);
  doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold').text(text, 45);
  doc.moveDown(0.3);
}

function drawParagraph(text) {
  if (doc.y > 720) {
    doc.addPage();
    drawHeader('Membership Program User Guide', 'Standard Operating Procedures & System Specifications');
  }
  doc.fontSize(9.5).fillColor(MUTED).font('Helvetica').text(text, 45, doc.y, {
    width: doc.page.width - 90,
    align: 'justify',
    lineGap: 3,
  });
  doc.moveDown(0.5);
}

function drawBullet(title, desc) {
  if (doc.y > 720) {
    doc.addPage();
    drawHeader('Membership Program User Guide', 'Standard Operating Procedures & System Specifications');
  }
  const x = 55;
  doc.circle(x - 3, doc.y + 4.5, 2.5).fill(ACCENT);
  doc.fontSize(9.5).fillColor(DARK).font('Helvetica-Bold').text(`${title}: `, x + 5, doc.y, { continued: true });
  doc.fillColor(MUTED).font('Helvetica').text(desc, {
    width: doc.page.width - 105,
    lineGap: 2,
  });
  doc.moveDown(0.3);
}

function drawCallout(title, text) {
  if (doc.y > 670) {
    doc.addPage();
    drawHeader('Membership Program User Guide', 'Standard Operating Procedures & System Specifications');
  }
  const startY = doc.y;
  const boxWidth = doc.page.width - 90;
  doc.rect(45, startY, boxWidth, 48).fillAndStroke('#EFF6FF', '#BFDBFE');
  doc.rect(45, startY, 4, 48).fill(PRIMARY);

  doc.fontSize(10).fillColor(PRIMARY).font('Helvetica-Bold').text(title, 56, startY + 8);
  doc.fontSize(8.5).fillColor(DARK).font('Helvetica').text(text, 56, startY + 22, {
    width: boxWidth - 20,
    lineGap: 2,
  });
  doc.y = startY + 56;
}

// ==========================================
// PAGE 1: OVERVIEW & MEMBERSHIP TIERS
// ==========================================
drawHeader('AquaShine Membership Program User Guide', 'Requirements, POS Redemption Workflows & Customer Portal Operations');

drawSectionHeading('1. Executive Overview');
drawParagraph('The AquaShine Car Wash Membership Program is an automated, recurring subscription designed to maximize recurring customer retention, increase average lifetime customer value (LTV), and deliver a frictionless express checkout experience for commuters and fleet vehicle operators.');
drawParagraph('Members pay a predictable monthly or annual rate to receive guaranteed wash credits every billing cycle, priority lane access, and exclusive discounts on premium vehicle enhancements and add-ons.');

drawSectionHeading('2. Membership Plans & Specifications');
drawParagraph('AquaShine provides two distinct service levels, each available in either Monthly or Annual billing frequencies:');

drawBullet('Basic Monthly ($29.99 / month)', 'Includes 4 exterior Basic Washes per billing cycle. Spot-free rinse, high-pressure wheel blaster, and power dry. 10% discount applied to all selected add-ons.');
drawBullet('Basic Yearly ($299.99 / year)', 'Same 4 Basic Washes per month with 17% annual savings (equivalent to 2 full months free). 10% discount on add-ons.');
drawBullet('Premium Monthly ($39.99 / month - Most Popular)', 'Includes 4 Premium Washes per cycle with clear-coat protectant, ceramic gloss finish, undercarriage wash, and tire shine. 10% discount on all optional add-ons.');
drawBullet('Premium Yearly ($399.99 / year - Best Value)', 'Full annual pass covering 4 Premium Washes each month, year-round ceramic protection, priority express queue, and 10% off add-ons.');

drawCallout('Key Rule: Monthly Allowance Allocation', 'Every plan provides 4 complete washes per 30-day billing cycle. Unused washes expire at the end of the billing period and do not roll over. On renewal, the wash balance resets automatically back to 4.');

// ==========================================
// PAGE 2: POS REDEMPTION & CASHIER OPERATIONS
// ==========================================
doc.addPage();
drawHeader('POS In-Person Wash Redemption Guide', 'Standard Operating Procedures for Cashiers and Bay Attendants');

drawSectionHeading('3. Cashier POS Redemption Workflow');
drawParagraph('When an enrolled member arrives at the drive-thru or counter, the Point of Sale terminal automatically handles plan validation and price deductions:');

drawBullet('Step 1: Identify Customer', 'Ask for customer phone number, name, or vehicle license plate. Select the matching customer record from the POS customer search list.');
drawBullet('Step 2: Service Selection', 'Select the vehicle type (Car, SUV, Truck, Van) and the desired wash package (Basic or Premium Wash).');
drawBullet('Step 3: Automated Pass Recognition', 'The system immediately checks whether the customer holds an active membership. If the chosen wash matches the plan\'s included tier (e.g., Premium Wash on a Premium Plan) and remaining washes > 0:');
doc.moveDown(0.2);
doc.fontSize(9).fillColor(SUCCESS).font('Helvetica-Bold').text('    ✓ Base wash price is automatically reduced to $0.00 ("Wash Covered by Pass")', 55);
doc.fontSize(9).fillColor(SUCCESS).font('Helvetica-Bold').text('    ✓ 10% Member Discount is automatically calculated on any selected add-ons', 55);
doc.moveDown(0.4);

drawBullet('Step 4: Payment Tender', 'If total is $0.00, click "Membership Pass" to immediately finalize. If add-ons are included, the customer pays the remaining discounted balance via Card, Cash, or Tap.');
drawBullet('Step 5: Automated Balance Decrement', 'Upon sale completion, the customer\'s remaining wash balance automatically decrements by 1 (e.g. from 4 to 3), and a timestamped audit record is generated.');

drawSectionHeading('4. Edge Cases & Over-Limit Rules');
drawBullet('Allowance Exhaustion (0 Washes Remaining)', 'If a member has already used all 4 washes within the current 30-day cycle, the base wash is charged at standard price. However, their 10% member discount on add-ons remains active until renewal.');
drawBullet('Upgrading Service at POS', 'If a Basic Plan member requests a Premium Wash, the cashier selects the Premium package. The standard price applies (or plan difference if promotional discount applies).');
drawBullet('Multiple Vehicles under One Member', 'Members can register multiple family or business vehicles under their profile. The cashier selects the specific vehicle serviced during checkout for clear audit records.');

// ==========================================
// PAGE 3: CUSTOMER PORTAL & CANCELLATION
// ==========================================
doc.addPage();
drawHeader('Customer Self-Service Portal & Administration', 'Account Management, Security, and Plan Lifecycles');

drawSectionHeading('5. Customer Portal Functionality');
drawParagraph('Enrolled members have 24/7 access to their dedicated self-service portal (/customer-portal) from any smartphone or browser:');

drawBullet('Real-Time Balance Tracker', 'Live dashboard widget showing remaining washes (e.g. "3 of 4 Washes Remaining") and progress bar.');
drawBullet('Billing & Renewal Schedule', 'Clear display of next auto-renewal date, plan name, and billing frequency.');
drawBullet('Vehicle Fleet Management', 'Ability to add, edit, or remove personal vehicles and license plates with instantaneous POS synchronization.');
drawBullet('Itemized Wash History', 'Comprehensive digital receipts detailing date, time, location, wash package, and vehicle serviced for every transaction.');
drawBullet('1-Click Cancellation', 'Customers can cancel their membership directly in their portal at any time without having to call or wait in line.');

drawSectionHeading('6. Subscription Cancellation & Billing Lifecycle');
drawParagraph('AquaShine strictly enforces fair, transparent subscription practices:');
drawBullet('Immediate Cancellation Access', 'When a member clicks "Cancel Membership", the plan status transitions to "cancelled".');
drawBullet('End-of-Period Benefit Retention', 'Members continue to enjoy their remaining wash credits and add-on discounts until the current paid period ends (expirationDate). No further billing occurs.');
drawBullet('Zero Hidden Fees', 'No cancellation penalties, contracts, or minimum commitment periods.');

drawCallout('Audit Trail & Compliance', 'Every membership creation, wash redemption, and cancellation generates an immutable log with transaction IDs, timestamps, and operator IDs stored in the audit ledger.');

// Page Numbers Footer
const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(i);
  doc.fontSize(8).fillColor('#94A3B8').font('Helvetica').text(
    `AquaShine Car Wash Systems © ${new Date().getFullYear()} • Membership Program Operating Guide • Page ${i + 1} of ${range.count}`,
    45,
    doc.page.height - 35,
    { align: 'center', width: doc.page.width - 90 }
  );
}

doc.end();

writeStream.on('finish', () => {
  console.log(`[PDF Generator] Successfully generated: ${outputPath}`);
});
