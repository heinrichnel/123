# Google Sheets Listener for Automated Trip Creation

This Supabase Edge Function automatically creates and updates trips in your application based on data from Google Sheets.

## Overview

This function:

1. Monitors your Google Sheet for new entries in two specific sheets:
   - **Order.Shipped**: Creates new trips when rows are added
   - **Order.Delivered**: Updates existing trips to "delivered" status

2. Extracts data from specific columns:
   - Column E: Route
   - Column G: Driver name
   - Column H: Fleet number
   - Column A: Date and time (in format "16-Jun-2025 04:25 PM")

3. Maintains synchronization state to avoid duplicate processing

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

### 5. Create Sync State Table

Create a table in your Supabase database to track synchronization state:

```sql
CREATE TABLE sheet_sync_state (
  id SERIAL PRIMARY KEY,
  sheet_name TEXT NOT NULL UNIQUE,
  last_processed_row INTEGER NOT NULL DEFAULT 0,
  last_sync TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert initial records
INSERT INTO sheet_sync_state (sheet_name, last_processed_row) 
VALUES ('Order.Shipped', 0), ('Order.Delivered', 0);
```

## How It Works

### Trip Creation (Order.Shipped)

When a new row is added to the "Order.Shipped" sheet:

1. The function extracts route, driver name, fleet number, and date/time
2. It creates a new trip with status "active" and marks it as shipped
3. The trip is created with minimal data - no financial or cost information
4. Operations staff will need to complete the trip details manually

### Trip Update (Order.Delivered)

When a new row is added to the "Order.Delivered" sheet:

1. The function extracts route and fleet number to identify the trip
2. It finds the most recently created matching trip that hasn't been delivered yet
3. The trip is updated with delivery information and timestamp

## Scheduling

For automatic synchronization, set up a cron job to call this function periodically:

1. In the Supabase dashboard, go to "Edge Functions"
2. Select this function
3. Click "Schedule"
4. Set up a schedule (e.g., every 15 minutes)

## Testing

You can test the function by:

1. Adding a new row to the "Order.Shipped" sheet
2. Calling the function manually via the Supabase dashboard
3. Checking your database to verify the new trip was created

## Troubleshooting

If the integration isn't working:

1. Check the Supabase logs for any error messages
2. Verify your Google service account has proper permissions on the sheet
3. Ensure all environment variables are correctly set
4. Confirm the sheet names match exactly: "Order.Shipped" and "Order.Delivered"
5. Check the format of your date/time values in column A