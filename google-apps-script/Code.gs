/**
 * ============================================================================
 * GOOGLE APPS SCRIPT FOR CAR WASH CUSTOMER ENQUIRIES
 * ============================================================================
 * 
 * Target Destinations: ritusehrawatai@gmail.com & ritusehrawat@gmail.com
 * Cost: 100% Free
 * ============================================================================
 */

var PRIMARY_EMAIL = 'ritusehrawatai@gmail.com';
var SECONDARY_EMAIL = 'ritusehrawat@gmail.com';

/**
 * Handle incoming POST requests from the website enquiry form
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

    // 3. Extract customer info
    var name = (data.name || 'Website Visitor').toString().trim();
    var email = (data.email || 'no-reply@example.com').toString().trim();
    var phone = (data.phone || 'Not provided').toString().trim();
    var message = (data.message || 'No question provided').toString().trim();
    var submittedAt = (data.timestamp || new Date().toLocaleString()).toString().trim();

    var subject = 'New Car Wash Enquiry from ' + name;
    
    var plainBody = 
      'New Car Wash Enquiry\n\n' +
      'Name: ' + name + '\n' +
      'Email: ' + email + '\n' +
      'Phone: ' + phone + '\n\n' +
      'Message:\n' + message + '\n\n' +
      'Submitted: ' + submittedAt;

    var htmlBody = 
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

    // 4. Send email to primary and CC secondary
    sendNotification(subject, plainBody, htmlBody, email);

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
      var subject = 'Test Email - Car Wash Enquiry Service';
      var body = 'This is a test email confirming your Google Apps Script is sending emails successfully!\n\nTime: ' + new Date().toLocaleString();
      sendNotification(subject, body, '<p>' + body + '</p>', 'test@example.com');
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Test email successfully dispatched to ' + PRIMARY_EMAIL + ' and ' + SECONDARY_EMAIL
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
    service: 'Car Wash Enquiry Web App',
    primaryDestination: PRIMARY_EMAIL,
    secondaryDestination: SECONDARY_EMAIL,
    tip: 'Add ?test=1 to URL in browser to trigger an instant test email'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Core send helper: uses GmailApp with fallback to MailApp
 */
function sendNotification(subject, plainBody, htmlBody, replyToEmail) {
  var options = {
    htmlBody: htmlBody,
    replyTo: replyToEmail,
    name: 'Car Wash Website Enquiry'
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
 * RUN THIS IN THE APPS SCRIPT EDITOR TO TEST AND AUTHORIZE:
 * 1. Select 'testSendInEditor' from the dropdown at the top
 * 2. Click 'Run'
 * 3. Authorize access if prompted
 * 4. Check your inbox!
 */
function testSendInEditor() {
  sendNotification(
    'Manual Test from Apps Script Editor',
    'If you see this, your Google Apps Script has full permissions and can send emails!',
    '<p>If you see this, your Google Apps Script has full permissions and can send emails!</p>',
    'test@example.com'
  );
  Logger.log('Email sent successfully to ' + PRIMARY_EMAIL + ' and ' + SECONDARY_EMAIL);
}
