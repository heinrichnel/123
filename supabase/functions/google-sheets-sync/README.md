# Google Sheets Integration for Trip Status Updates

This Supabase Edge Function integrates your trip management system with Google Sheets, automatically updating your spreadsheet when trip statuses change.

## Overview

When a trip's status is updated to "shipped" or "delivered" in your application, this function:

1. Updates the corresponding sheet in your Google Spreadsheet
2. Records the timestamp in the appropriate column
3. Calculates time spent on delivery (for delivered trips)
4. Updates the trip record in your database

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Sheets API for your project

### 2. Create a Service Account

1. In your Google Cloud project, go to "IAM & Admin" > "Service Accounts"
2. Create a new service account
3. Grant it the "Editor" role
4. Create a new JSON key and download it

### 3. Share Your Google Sheet

1. Open your Google Sheet at: https://docs.google.com/spreadsheets/d/1bpqVq_OZDexhrCS8fk106lkgFYJ4kWb0Z4qgFqTbaU0/edit
2. Click "Share" and add the email address of your service account with "Editor" permissions

### 4. Configure Supabase Environment Variables

In the Supabase dashboard, add these environment variables to your Edge Function:

```
GOOGLE_PRIVATE_KEY=your-private-key-from-json-file
GOOGLE_CLIENT_EMAIL=your-service-account-email
GOOGLE_SHEET_ID=1bpqVq_OZDexhrCS8fk106lkgFYJ4kWb0Z4qgFqTbaU0
```

## How It Works

1. When a trip status is updated to "shipped" or "delivered" in your app, the function is called
2. The function connects to Google Sheets using your service account credentials
3. It adds a new row to either the "Order.Shipped" or "Order.Delivered" sheet with:
   - Column A: Current timestamp in format "DD-MMM-YYYY HH:MM AM/PM"
   - Column E: Trip route
   - Column G: Driver name
   - Column H: Fleet number
   - Column I: Time spent (for delivered trips only)
4. The trip record is updated in your database with the appropriate timestamp

## Testing

You can test the function by:

1. Updating a trip's status to "shipped" or "delivered" in your application
2. Checking your Google Sheet to verify the new row was added
3. Confirming the trip record was updated in your database

## Troubleshooting

If the integration isn't working:

1. Check the Supabase logs for any error messages
2. Verify your Google service account has proper permissions on the sheet
3. Ensure all environment variables are correctly set
4. Confirm the sheet names match exactly: "Order.Shipped" and "Order.Delivered"