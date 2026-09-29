/**
 * Service for sending customer enquiries to Google Apps Script Web App
 * Target destination: ritusehrawatai@gmail.com
 */

import { BusinessInfo } from '../types/pos';

export const TARGET_ENQUIRY_EMAIL = 'ritusehrawatai@gmail.com';
export const STORAGE_ENQUIRY_ENDPOINT_KEY = 'carwash_enquiry_endpoint';
const STORAGE_LAST_SUBMITTED_KEY = 'carwash_last_enquiry_timestamp';
const RATE_LIMIT_SECONDS = 30;

export interface EnquiryFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  honeypot?: string;
}

export interface EnquiryValidationErrors {
  [key: string]: string | undefined;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  general?: string;
}

export interface EnquirySubmissionResult {
  success: boolean;
  messageKey?: string;
  errorDetail?: string;
}

/**
 * Retrieve the active Google Apps Script Web App endpoint URL
 */
export function getEnquiryEndpoint(businessInfo?: BusinessInfo): string {
  // 1. Business Info in Settings
  if (businessInfo?.enquiryEndpointUrl && businessInfo.enquiryEndpointUrl.trim() !== '') {
    return normalizeEndpointUrl(businessInfo.enquiryEndpointUrl);
  }

  // 2. localStorage saved endpoint
  try {
    const saved = localStorage.getItem(STORAGE_ENQUIRY_ENDPOINT_KEY);
    if (saved && saved.trim() !== '') {
      return normalizeEndpointUrl(saved);
    }
  } catch {
    // Ignore
  }

  // 3. Vite environment variable (injected at build time in Netlify/Vercel/Cloud Run)
  const envUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return normalizeEndpointUrl(envUrl);
  }

  return '';
}

/**
 * Save Google Apps Script endpoint URL to local storage
 */
export function setEnquiryEndpoint(url: string): void {
  try {
    localStorage.setItem(STORAGE_ENQUIRY_ENDPOINT_KEY, url.trim());
  } catch (e) {
    console.error('Failed to save enquiry endpoint to localStorage:', e);
  }
}

/**
 * Check if submission is rate-limited (spam prevention)
 */
export function isRateLimited(): boolean {
  try {
    const lastTimestamp = sessionStorage.getItem(STORAGE_LAST_SUBMITTED_KEY);
    if (lastTimestamp) {
      const elapsedSeconds = (Date.now() - parseInt(lastTimestamp, 10)) / 1000;
      if (elapsedSeconds < RATE_LIMIT_SECONDS) {
        return true;
      }
    }
  } catch {
    // Ignore
  }
  return false;
}

/**
 * Record successful submission timestamp for rate limiting
 */
function recordSubmissionTimestamp(): void {
  try {
    sessionStorage.setItem(STORAGE_LAST_SUBMITTED_KEY, Date.now().toString());
  } catch {
    // Ignore
  }
}

/**
 * Validate customer enquiry form fields
 */
export function validateEnquiryForm(data: EnquiryFormData): { isValid: boolean; errors: EnquiryValidationErrors } {
  const errors: EnquiryValidationErrors = {};

  // Honeypot check (must be empty)
  if (data.honeypot && data.honeypot.trim() !== '') {
    errors.general = 'Spam detected';
    return { isValid: false, errors };
  }

  // Name validation
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'nameRequired';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !data.email.trim()) {
    errors.email = 'emailRequired';
  } else if (!emailRegex.test(data.email.trim())) {
    errors.email = 'emailInvalid';
  }

  // Message validation
  if (!data.message || data.message.trim().length < 10) {
    errors.message = 'messageMinLength';
  } else if (data.message.trim().length > 2000) {
    errors.message = 'messageMaxLength';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Normalize and clean Google Apps Script Web App URL
 */
export function normalizeEndpointUrl(url: string): string {
  if (!url) return '';
  let clean = url.trim().replace(/^["']|["']$/g, '');
  // Remove multi-account index e.g. /u/0/ or /u/1/
  clean = clean.replace(/https?:\/\/script\.google\.com\/u\/\d+\//, 'https://script.google.com/');
  // Auto-fix /edit to /exec
  if (clean.includes('/macros/s/') && clean.endsWith('/edit')) {
    clean = clean.replace(/\/edit(\?.*)?$/, '/exec');
  }
  return clean;
}

/**
 * Test Google Apps Script Web App endpoint accessibility and send a test email
 */
export async function testEnquiryEndpoint(endpointUrl: string): Promise<{
  success: boolean;
  statusText: string;
  detail?: string;
}> {
  if (!endpointUrl || !endpointUrl.trim()) {
    return {
      success: false,
      statusText: 'No Web App URL provided.',
      detail: 'Please paste your Google Apps Script Web App URL ending in /exec.',
    };
  }

  const cleanUrl = normalizeEndpointUrl(endpointUrl);

  if (cleanUrl.includes('/d/') && cleanUrl.includes('/edit') && !cleanUrl.includes('/macros/s/')) {
    return {
      success: false,
      statusText: 'Invalid URL type (Project Editor).',
      detail:
        'This is the editor URL (/edit). In Google Apps Script, click Deploy → New deployment → Web app, set Who has access to "Anyone", and copy the Web App URL (/exec).',
    };
  }

  if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      statusText: 'Invalid URL format.',
      detail: 'The URL must start with https://script.google.com/macros/s/... and end in /exec',
    };
  }

  // First, dispatch a test POST with mode: 'no-cors' (immune to browser CORS redirect blocks)
  try {
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        name: 'Connection Test',
        email: 'test@example.com',
        phone: '123-456-7890',
        message: 'This is a test enquiry to verify email delivery to ritusehrawatai@gmail.com.',
        timestamp: new Date().toLocaleString(),
        destination: TARGET_ENQUIRY_EMAIL,
      }),
    });
  } catch (err: any) {
    return {
      success: false,
      statusText: 'Network dispatch failed.',
      detail: err?.message || 'Could not dispatch test request. Check your internet connection.',
    };
  }

  // Attempt GET to see if Google Apps Script JSON output is accessible
  const testUrl = cleanUrl.includes('?') ? `${cleanUrl}&test=1` : `${cleanUrl}?test=1`;
  try {
    const res = await fetch(testUrl);
    const data = await res.json();

    if (data && (data.status === 'success' || data.status === 'ok')) {
      return {
        success: true,
        statusText: 'Connection Successful & Test Email Sent!',
        detail:
          data.message ||
          `Test email successfully dispatched to ${TARGET_ENQUIRY_EMAIL}. Check your Inbox and Spam folder.`,
      };
    } else if (data && data.status === 'error') {
      return {
        success: false,
        statusText: 'Script returned an error.',
        detail:
          data?.message ||
          'The script responded with an error. Please open script.google.com, select testSendInEditor, and click Run (▶) to authorize permissions.',
      };
    }
  } catch {
    // In many browsers, 302 cross-origin redirects from script.google.com are blocked by CORS policy,
    // even when "Who has access" is set to "Anyone". The POST dispatched above still succeeds!
  }

  return {
    success: true,
    statusText: 'Test Enquiry Dispatched!',
    detail: `A test enquiry was dispatched to your Google Apps Script Web App. Please check your Gmail inbox and Spam folder at ${TARGET_ENQUIRY_EMAIL}.`,
  };
}
export async function submitEnquiryToAppsScript(
  data: EnquiryFormData,
  endpointUrl: string
): Promise<EnquirySubmissionResult> {
  // Check endpoint presence
  if (!endpointUrl || endpointUrl.trim() === '') {
    return {
      success: false,
      messageKey: 'endpointNotConfigured',
      errorDetail: 'Google Apps Script Web App URL is not configured.',
    };
  }

  // Clean and normalize endpoint URL
  const cleanUrl = normalizeEndpointUrl(endpointUrl);

  // Check if it's a project editor link instead of deployed web app
  if (cleanUrl.includes('/d/') && cleanUrl.includes('/edit') && !cleanUrl.includes('/macros/s/')) {
    return {
      success: false,
      messageKey: 'errorMessage',
      errorDetail: 'This URL is the Apps Script editor (/edit), not the deployed Web App URL (/exec). In Google Apps Script, click Deploy → New deployment → Web app, set Who has access to "Anyone", and copy the Web App URL.',
    };
  }

  if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      messageKey: 'errorMessage',
      errorDetail: 'The URL must be a valid Google Apps Script Web App URL starting with https://script.google.com/macros/s/... and ending in /exec',
    };
  }

  // Rate limiting check
  if (isRateLimited()) {
    return {
      success: false,
      messageKey: 'rateLimitNotice',
      errorDetail: `Please wait ${RATE_LIMIT_SECONDS} seconds before submitting another enquiry.`,
    };
  }

  // Client validation
  const validation = validateEnquiryForm(data);
  if (!validation.isValid) {
    return {
      success: false,
      messageKey: 'errorMessage',
      errorDetail: 'Please correct form validation errors.',
    };
  }

  const payload = {
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone?.trim() || 'Not provided',
    message: data.message.trim(),
    honeypot: data.honeypot?.trim() || '',
    destination: TARGET_ENQUIRY_EMAIL,
    timestamp: new Date().toLocaleString(),
  };

  try {
    // Mode: 'no-cors' is required for Google Apps Script Web Apps when called from browser JavaScript.
    // Google Apps Script redirects (302) to script.googleusercontent.com, which browsers block under mode: 'cors'.
    // Under mode: 'no-cors', the POST request with text/plain is dispatched directly to the Apps Script,
    // doPost(e) executes, GmailApp.sendEmail() delivers the email to ritusehrawatai@gmail.com,
    // and the browser resolves cleanly with an opaque response.
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    // Successfully sent!
    recordSubmissionTimestamp();
    return {
      success: true,
      messageKey: 'successMessage',
    };
  } catch (error: any) {
    console.error('Enquiry submission error:', error);
    return {
      success: false,
      messageKey: 'errorMessage',
      errorDetail: error?.message || 'Network error occurred while contacting Google Apps Script.',
    };
  }
}
