# Google Sheets Integration Setup

This guide will help you set up Google Sheets integration for order tracking and logging.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

## Step 2: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `jci-color-run-sheets`
   - Click "Create and Continue"
   - Skip role assignment (optional)
   - Click "Done"

## Step 3: Create and Download JSON Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Download the JSON file - **keep this secure!**

## Step 4: Share Google Sheet with Service Account

1. Create a new Google Sheet or use an existing one
2. Copy the **Spreadsheet ID** from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Click "Share" button in Google Sheets
4. Add the service account email (found in the JSON file as `client_email`)
5. Give it "Editor" permissions
6. Click "Send"

## Step 5: Configure Environment Variables

Add these environment variables to your `.env` file or Railway:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_NAME=Orders
```

**Important Notes:**
- `GOOGLE_SHEETS_CREDENTIALS` should be the entire JSON content as a string
- In Railway, you can paste the entire JSON file content
- Make sure to escape quotes properly if setting in `.env` file
- Or use Railway's environment variable editor which handles JSON better

## Step 6: Test the Integration

1. Create a test order through your website
2. Check your Google Sheet - you should see:
   - Headers automatically created
   - New row with order information
   - Timestamp, order number, customer details, etc.

## What Gets Logged

The system logs the following events to Google Sheets:

1. **ORDER_CREATED** - When a new order is created
2. **PAYMENT_COMPLETED** - When payment is successfully processed
3. **STATUS_UPDATED** - When admin manually updates order/payment status

Each log entry includes:
- Timestamp
- Order Number
- Customer Name, Email, Phone
- Ticket Type
- Quantity
- Total Amount
- Order Status
- Payment Status
- Action Type
- Notes (additional context)

## Troubleshooting

### No data appearing in sheet
- Check that service account email has "Editor" access to the sheet
- Verify `GOOGLE_SHEETS_ID` matches the spreadsheet ID from URL
- Check server logs for Google Sheets API errors

### Authentication errors
- Verify JSON credentials are correctly formatted
- Ensure the JSON is properly escaped in environment variables
- Check that the service account key hasn't been revoked

### Sheet not found errors
- Verify the spreadsheet ID is correct
- Ensure the sheet name matches `GOOGLE_SHEETS_NAME` (default: "Orders")
- Check that the sheet exists and is accessible

## Security Notes

- **Never commit** the service account JSON file to git
- Store credentials securely in environment variables
- Use Railway's encrypted environment variables
- Regularly rotate service account keys for security
