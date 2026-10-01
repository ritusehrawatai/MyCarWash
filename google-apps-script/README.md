# Free Google Apps Script Email Service (Enquiries & Welcome Discounts)

This guide explains how to set up the free Google Apps Script Web App that handles:
1. **First-Signup 15% Welcome Discount Emails:** Automatically emails each new customer their unique `WELCOME15-XXXXXX` promo code and expiration details right after signup.
2. **Customer Website Enquiries:** Delivers visitor contact enquiries directly to **ritusehrawatai@gmail.com** via Gmail.

---

### Architecture Overview

```
Customer Signs Up / Submits Form on Website
       ↓
Google Apps Script Web App (Free)
       ↓
GmailApp.sendEmail (100% Free via Gmail)
       ↓
Delivered directly to Customer Inbox (Promo Code) & Business (Enquiries)
```

- **Cost:** 100% Free (no paid third-party email providers or SMS subscriptions)
- **Zero Subscriptions or Credit Cards**
- **Welcome Discount:** Automatically sends 15% discount code (`WELCOME15-XXXXXX`) to new customers
- **Enquiries:** Delivered directly to `ritusehrawatai@gmail.com`
- **Reply-To:** The customer's email address

---

### Step-by-Step Setup Instructions

#### Step 1: Open Google Apps Script
1. Open your browser and navigate to: **[script.google.com](https://script.google.com)**
2. Sign in with your Google account.
3. Click **+ New project** (top-left button).
4. Name your project **"Car Wash Enquiry Service"** (click "Untitled project" at the top to rename).

#### Step 2: Paste the Code
1. Open the file `google-apps-script/Code.gs` in this repository.
2. Select all code, copy it, and paste it into the Apps Script editor replacing any template code.
3. Click the **Save** icon (disk icon or `Ctrl + S` / `Cmd + S`).

#### Step 3: Deploy as a Web App
1. Click the blue **Deploy** button at the top-right corner.
2. Select **New deployment**.
3. Next to "Select type", click the gear icon (⚙️) and choose **Web app**.
4. Configure the following settings:
   - **Description:** `Production Enquiry Service`
   - **Execute as:** `Me (your Google email)`
   - **Who has access:** `Anyone`  
     *(CRITICAL: You must choose "Anyone" so that visitors on the public website can submit enquiries without having to log into your Google account).*
5. Click **Deploy**.

#### Step 4: Authorize Gmail Sending
1. Google will display an **"Authorization required"** prompt.
2. Click **Authorize access**.
3. Select your Google account.
4. Google will show a screen saying *"Google hasn’t verified this app"*. Click **Advanced** (at the bottom-left), then click **Go to Car Wash Enquiry Service (unsafe)**.
5. Review the permissions (`Send email on your behalf`) and click **Allow**.

#### Step 5: Copy Your Web App URL
1. You will see a dialog with:
   - **Deployment ID**
   - **Web app URL** (format: `https://script.google.com/macros/s/AKfycb.../exec`)
2. Copy the **Web app URL**.

#### Step 6: Configure in the Car Wash Website
You can add this URL to the website in either of two easy ways:

- **Option A (Admin Settings UI):**  
  Log in as Admin on the Car Wash application, go to **Settings → Business Info**, paste the URL into **Google Apps Script Web App URL**, and click **Save Business Information**.

- **Option B (Direct in Enquiry Page):**  
  Visit the **Enquiry page**, expand the **Google Apps Script Free Email Setup** card, paste your URL, and click **Save Endpoint**.

- **Option C (Environment Variable):**  
  Add `VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec` to your `.env` file.

#### Step 7: Test the Form
1. Go to the website footer **Contact & Visit** section.
2. Click **Send an Enquiry**.
3. Enter your Name, Email, optional Phone, and Message.
4. Click **Submit Enquiry**.
5. Check `ritusehrawatai@gmail.com` inbox for the new enquiry email!
