/**
 * ============================================================================
 * GOOGLE APPS SCRIPT FOR CAR WASH NOTIFICATIONS & WELCOME DISCOUNT EMAILS
 * ============================================================================
 * 
 * Supports:
 * 1. Customer Website Enquiries (routed to business emails)
 * 2. First-Signup 15% Welcome Discount Emails (delivered to customer's email)
 * Cost: 100% Free via Google Apps Script + Gmail
 * ============================================================================
 */

var PRIMARY_EMAIL = 'ritusehrawatai@gmail.com';
var SECONDARY_EMAIL = '';

/**
 * Handle incoming POST requests from the website (Enquiries & Welcome Discount Emails)
 */
function doPost(e) {
  try {
    var data = {};

    // 1. Parse incoming data safely (supports JSON string or form post)
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = (e && e.parameter) ? e.parameter : {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // 2. Ignore bot spam (honeypot field)
    if (data.honeypot && String(data.honeypot).trim() !== '') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Spam detected'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. ACTION A: Welcome Promo Discount Email to new customer
    if (data.type === 'welcome_discount' || data.action === 'welcome_discount') {
      var recipient = (data.customerEmail || data.email || '').toString().trim();
      if (!recipient || !recipient.includes('@')) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          message: 'Valid customer email address is required'
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var businessName = (data.businessName || 'My Car Wash').toString().trim();
      var customerFirstName = (data.customerName || data.firstName || 'Valued Customer').toString().trim().split(' ')[0];
      var promoCode = (data.promoCode || 'WELCOME15').toString().trim();
      var discountPercent = data.discountPercent || 15;
      var expirationDate = (data.expirationDate || '3 months from signup').toString().trim();
      var language = (data.language || 'en').toString().toLowerCase();

      var isSpanish = (language === 'es');

      var subject = isSpanish
        ? '¡Bienvenido a ' + businessName + '! Tu código de descuento del ' + discountPercent + '%'
        : 'Welcome to ' + businessName + '! Your ' + discountPercent + '% Welcome Discount';

      var plainBody = isSpanish
        ? '¡Bienvenido a ' + businessName + '!\n\n' +
          'Hola ' + customerFirstName + ',\n\n' +
          '¡Gracias por registrarte! Tu descuento de bienvenida es:\n\n' +
          discountPercent + '% DE DESCUENTO\n' +
          'Código promocional: ' + promoCode + '\n' +
          'Válido hasta: ' + expirationDate + '\n\n' +
          'Este código se puede usar una vez para un servicio de lavado de autos elegible o complementos. El impuesto se calcula después del descuento.\n\n' +
          'Cómo usar tu código:\n' +
          'Presenta o menciona este código al pagar en la caja registradora de autoservicio o con el cajero.'
        : 'Welcome to ' + businessName + '!\n\n' +
          'Hello ' + customerFirstName + ',\n\n' +
          'Thank you for signing up! Your welcome discount is:\n\n' +
          discountPercent + '% OFF\n' +
          'Promo Code: ' + promoCode + '\n' +
          'Valid until: ' + expirationDate + '\n\n' +
          'This code can be used once toward an eligible car wash service or add-ons. Tax is calculated after the discount.\n\n' +
          'How to use your code:\n' +
          'Present or mention this code at checkout at the register.';

      var htmlBody = 
        '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #0f172a;">' +
        '  <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">' +
        '    <h1 style="color: #0284c7; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">' + escapeHtml(businessName) + '</h1>' +
        '    <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">' + (isSpanish ? 'Lavado de Autos de Calidad' : 'Express Clean & Shine') + '</p>' +
        '  </div>' +
        '  <div style="padding: 24px 0;">' +
        '    <h2 style="font-size: 20px; color: #0f172a; margin: 0 0 8px 0;">' + (isSpanish ? '¡Hola, ' + escapeHtml(customerFirstName) + '!' : 'Welcome, ' + escapeHtml(customerFirstName) + '!') + '</h2>' +
        '    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">' +
        '      ' + (isSpanish ? '¡Gracias por crear tu cuenta de cliente! Como regalo especial de bienvenida, tienes un descuento exclusivo del 15% en tu próximo lavado de autos o complementos.' : 'Thank you for creating your customer account! As a special welcome gift, enjoy an exclusive 15% discount on your next eligible car wash or add-on.') + '' +
        '    </p>' +
        '    <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px dashed #0284c7; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">' +
        '      <span style="display: block; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #0369a1; letter-spacing: 1px;">' + (isSpanish ? 'Tu Código de Descuento de Bienvenida' : 'Your Welcome Promo Code') + '</span>' +
        '      <span style="display: block; font-size: 30px; font-weight: 900; color: #0284c7; letter-spacing: 2px; margin: 8px 0; font-family: monospace;">' + escapeHtml(promoCode) + '</span>' +
        '      <span style="display: inline-block; background-color: #0284c7; color: #ffffff; font-size: 13px; font-weight: bold; padding: 4px 12px; border-radius: 9999px;">' + discountPercent + '% OFF</span>' +
        '      <p style="font-size: 11px; color: #64748b; margin: 10px 0 0 0;">' + (isSpanish ? 'Válido hasta: ' : 'Valid until: ') + '<strong>' + escapeHtml(expirationDate) + '</strong></p>' +
        '    </div>' +
        '    <div style="background-color: #f8fafc; border-radius: 8px; padding: 14px; font-size: 12px; color: #475569; line-height: 1.5;">' +
        '      <p style="margin: 0 0 6px 0;"><strong>' + (isSpanish ? 'Términos y Condiciones:' : 'Terms & Conditions:') + '</strong></p>' +
        '      <ul style="margin: 0; padding-left: 20px;">' +
        '        <li>' + (isSpanish ? 'Válido para un solo uso por cliente.' : 'Single-use promo code valid for one transaction only.') + '</li>' +
        '        <li>' + (isSpanish ? 'Aplica al subtotal antes de impuestos de servicios o complementos elegibles.' : 'Applies to eligible car wash service or add-ons subtotal before tax.') + '</li>' +
        '        <li>' + (isSpanish ? 'El impuesto se calcula sobre el subtotal con descuento.' : 'Tax is calculated on the discounted subtotal.') + '</li>' +
        '        <li>' + (isSpanish ? 'Presenta o menciona este código en la caja registradora.' : 'Present or mention this code at checkout at the register.') + '</li>' +
        '      </ul>' +
        '    </div>' +
        '  </div>' +
        '  <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 11px;">' +
        '    <p style="margin: 0;">' + escapeHtml(businessName) + ' · Express Car Wash</p>' +
        '  </div>' +
        '</div>';

      sendDirectEmail(recipient, subject, plainBody, htmlBody, businessName);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Welcome discount email successfully sent to ' + recipient,
        promoCode: promoCode
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. ACTION B: Standard Enquiry Form Message
    var name = (data.name || 'Website Visitor').toString().trim();
    var email = (data.email || 'no-reply@example.com').toString().trim();
    var phone = (data.phone || 'Not provided').toString().trim();
    var message = (data.message || 'No question provided').toString().trim();
    var submittedAt = (data.timestamp || new Date().toLocaleString()).toString().trim();

    var enquirySubject = 'New Car Wash Enquiry from ' + name;
    
    var enquiryPlainBody = 
      'New Car Wash Enquiry\n\n' +
      'Name: ' + name + '\n' +
      'Email: ' + email + '\n' +
      'Phone: ' + phone + '\n\n' +
      'Message:\n' + message + '\n\n' +
      'Submitted: ' + submittedAt;

    var enquiryHtmlBody = 
      '<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">' +
      '  <h2 style="color: #0284c7; margin-top: 0;">New Car Wash Enquiry</h2>' +
      '  <p><strong>Name:</strong> ' + escapeHtml(name) + '</p>' +
      '  <p><strong>Email:</strong> <a href="mailto:' + escapeHtml(email) + '">' + escapeHtml(email) + '</a></p>' +
      '  <p><strong>Phone:</strong> ' + escapeHtml(phone) + '</p>' +
      '  <p><strong>Submitted:</strong> ' + escapeHtml(submittedAt) + '</p>' +
      '  <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 12px; margin-top: 15px; border-radius: 4px;">' +
      '    <p style="margin: 0; font-weight: bold; color: #475569;">Question / Message:</p>' +
      '    <p style="margin: 8px 0 0; color: #0f172a; white-space: pre-wrap;">' + escapeHtml(message) + '</p>' +
      '  </div>' +
      '</div>';

    sendNotification(enquirySubject, enquiryPlainBody, enquiryHtmlBody, email);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Enquiry sent successfully'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Health check & instant browser test endpoint
 */
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  
  // Instant test URL: https://script.google.com/macros/s/.../exec?test=1
  if (params.test || params.sendTest) {
    try {
      var subject = 'Test Email - Car Wash Service';
      var body = 'This is a test email confirming your Google Apps Script is sending emails successfully!\n\nTime: ' + new Date().toLocaleString();
      sendNotification(subject, body, '<p>' + body + '</p>', 'test@example.com');
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Test email successfully dispatched to ' + PRIMARY_EMAIL
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: err.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    service: 'Car Wash Notification & Welcome Discount Web App',
    primaryDestination: PRIMARY_EMAIL,
    secondaryDestination: SECONDARY_EMAIL,
    supportedActions: ['welcome_discount', 'enquiry'],
    tip: 'Add ?test=1 to URL in browser to trigger an instant test email'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Direct send helper to customer (for Welcome Promo emails)
 */
function sendDirectEmail(recipient, subject, plainBody, htmlBody, senderName) {
  var options = {
    htmlBody: htmlBody,
    name: senderName || 'Car Wash Express'
  };

  try {
    GmailApp.sendEmail(recipient, subject, plainBody, options);
  } catch (err1) {
    MailApp.sendEmail(recipient, subject, plainBody, options);
  }
}

/**
 * Core send helper: uses GmailApp with fallback to MailApp (for business enquiries)
 */
function sendNotification(subject, plainBody, htmlBody, replyToEmail) {
  var options = {
    htmlBody: htmlBody,
    replyTo: replyToEmail,
    name: 'Car Wash Website Notification'
  };

  if (SECONDARY_EMAIL && SECONDARY_EMAIL !== PRIMARY_EMAIL) {
    options.cc = SECONDARY_EMAIL;
  }

  try {
    GmailApp.sendEmail(PRIMARY_EMAIL, subject, plainBody, options);
  } catch (err1) {
    MailApp.sendEmail(PRIMARY_EMAIL, subject, plainBody, options);
  }
}

function escapeHtml(text) {
  return (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Test authorization from Apps Script Editor:
 * 1. Select 'testSendInEditor'
 * 2. Click 'Run'
 * 3. Authorize access
 */
function testSendInEditor() {
  sendNotification(
    'Manual Test from Apps Script Editor',
    'If you see this, your Google Apps Script has full permissions and can send emails!',
    '<p>If you see this, your Google Apps Script has full permissions and can send emails!</p>',
    'test@example.com'
  );
  Logger.log('Email sent successfully to ' + PRIMARY_EMAIL);
}
