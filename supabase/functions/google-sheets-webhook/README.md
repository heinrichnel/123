# Google Sheets Webhook Integration

This Supabase Edge Function provides a webhook endpoint for Google Sheets to notify your application about shipping and delivery events.

## Overview

This function:

1. Receives webhook notifications from Google Apps Script running in your Google Sheets
2. Processes two types of events:
   - **Shipped**: Updates existing trips or creates new ones when items are shipped
   - **Delivered**: Updates trips when items are delivered

3. Maintains an audit log of all webhook events

## Setup Instructions

### 1. Deploy the Edge Function

Deploy this function to your Supabase project.

### 2. Set Up Google Apps Script

1. Open your Google Sheet
2. Go to Extensions > Apps Script
3. Create a new script with the following code:

```javascript
function onEdit(e) {
  // Only trigger on edits to the "Order.Shipped" or "Order.Delivered" sheets
  const sheetName = e.source.getActiveSheet().getName();
  if (sheetName !== "Order.Shipped" && sheetName !== "Order.Delivered") {
    return;
  }
  
  // Get the edited row data
  const row = e.range.getRow();
  const sheet = e.source.getActiveSheet();
  
  // Skip header row
  if (row <= 1) {
    return;
  }
  
  // Get the data from the row
  const timestamp = sheet.getRange(row, 1).getValue(); // Column A
  const route = sheet.getRange(row, 5).getValue();     // Column E
  const driverName = sheet.getRange(row, 7).getValue(); // Column G
  const fleetNumber = sheet.getRange(row, 8).getValue(); // Column H
  
  // Determine the action based on the sheet
  const action = sheetName === "Order.Shipped" ? "shipped" : "delivered";
  
  // Prepare the payload
  const payload = {
    action: action,
    timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
    route: route,
    driverName: driverName,
    fleetNumber: fleetNumber,
    sheetName: sheetName,
    rowNumber: row
  };
  
  // Send the webhook
  sendWebhook(payload);
}

function sendWebhook(payload) {
  // Replace with your Supabase Edge Function URL
  const webhookUrl = "https://your-project-ref.supabase.co/functions/v1/google-sheets-webhook";
  
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(webhookUrl, options);
    Logger.log("Webhook response: " + response.getContentText());
  } catch (error) {
    Logger.log("Error sending webhook: " + error.toString());
  }
}

// Test function that can be manually run
function testWebhook() {
  const payload = {
    action: "ping",
    timestamp: new Date().toISOString(),
    message: "Test webhook from Google Apps Script"
  };
  
  sendWebhook(payload);
}
```

3. Replace the `webhookUrl` with your actual Supabase Edge Function URL
4. Save the script
5. Run the `testWebhook` function to test the connection

### 3. Create Webhook Log Table

Create a table in your Supabase database to log webhook events:

```sql
CREATE TABLE webhook_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);
```

## How It Works

### Shipped Events

When a row is added to the "Order.Shipped" sheet:

1. The Google Apps Script triggers and sends a webhook to this function
2. The function looks for an existing active trip with matching fleet number and route
3. If found, it updates the trip with shipping information
4. If not found, it creates a new trip with basic information

### Delivered Events

When a row is added to the "Order.Delivered" sheet:

1. The Google Apps Script triggers and sends a webhook to this function
2. The function finds the matching trip that has been shipped but not delivered
3. It updates the trip with delivery information and calculates the time spent

## Testing

You can test the webhook integration by:

1. Using the `testWebhook` function in Google Apps Script
2. Manually adding rows to your "Order.Shipped" or "Order.Delivered" sheets
3. Checking the webhook_logs table to verify events are being received
4. Verifying trips are being created or updated in your database

## Troubleshooting

If the integration isn't working:

1. Check the Supabase logs for any error messages
2. Verify the webhook URL in your Google Apps Script is correct
3. Check the webhook_logs table for any error messages
4. Ensure your Google Apps Script has permission to make external requests
5. Verify the column mappings match your actual Google Sheet structure