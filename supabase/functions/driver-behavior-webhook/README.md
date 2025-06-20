# Driver Behavior Webhook Integration

This Supabase Edge Function provides a webhook endpoint for receiving driver behavior events from your telematics system or Google Sheets.

## Overview

This function:

1. Receives driver behavior event data from external systems
2. Maps device serial numbers to fleet numbers and drivers
3. Normalizes event types and calculates severity/points
4. Creates driver behavior events in your database
5. Maintains an audit log of all webhook events

## Setup Instructions

### 1. Deploy the Edge Function

Deploy this function to your Supabase project.

### 2. Configure Mapping Tables

The function includes mapping tables for:

- Serial numbers to fleet numbers
- Fleet numbers to drivers
- Event types to standardized values
- Event rules (severity and points)

Update these mappings in the function code to match your fleet and driver information.

### 3. Set Up Google Apps Script

If you're using Google Sheets as a data source:

1. Open your Google Sheet
2. Go to Extensions > Apps Script
3. Create a new script with the following code:

```javascript
function onEdit(e) {
  // Only trigger on edits to the driver behavior sheet
  const sheetName = e.source.getActiveSheet().getName();
  if (sheetName !== "DriverEvents") {
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
  const serialNumber = sheet.getRange(row, 1).getValue();
  const eventType = sheet.getRange(row, 2).getValue();
  const eventTime = sheet.getRange(row, 3).getValue();
  const latitude = sheet.getRange(row, 4).getValue();
  const longitude = sheet.getRange(row, 5).getValue();
  
  // Prepare the payload
  const payload = {
    serialNumber: serialNumber,
    eventType: eventType,
    eventTime: eventTime,
    latitude: latitude,
    longitude: longitude
  };
  
  // Send the webhook
  sendWebhook(payload);
}

function sendWebhook(payload) {
  // Replace with your Supabase Edge Function URL
  const webhookUrl = "https://your-project-ref.supabase.co/functions/v1/driver-behavior-webhook";
  
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
    serialNumber: "357660104031745",
    eventType: "Harsh Braking",
    eventTime: "2025-01-15 14:30",
    latitude: "-17.8252",
    longitude: "31.0335"
  };
  
  sendWebhook(payload);
}
```

4. Replace the `webhookUrl` with your actual Supabase Edge Function URL
5. Save the script
6. Run the `testWebhook` function to test the connection

## How It Works

### Event Processing

When a driver behavior event is received:

1. The function extracts the event type, serial number, and other details
2. It maps the serial number to a fleet number using the `fleetMap`
3. It maps the fleet number to a driver using the `driverMap`
4. It normalizes the event type using the `eventTypeMap`
5. It determines severity and points using the `eventRules`
6. It creates a new driver behavior event in your database

### Event Filtering

The function ignores certain event types listed in the `IGNORED_EVENTS` array, such as:
- "jolt"
- "acc_on"
- "acc_off"

These are typically system events that don't represent driver behavior issues.

## Testing

You can test the webhook integration by:

1. Using the `testWebhook` function in Google Apps Script
2. Sending a POST request directly to the function URL with a payload like:

```json
{
  "serialNumber": "357660104031745",
  "eventType": "Harsh Braking",
  "eventTime": "2025-01-15 14:30",
  "latitude": "-17.8252",
  "longitude": "31.0335"
}
```

3. Checking your database to verify the event was created
4. Checking the webhook_logs table to verify events are being received

## Troubleshooting

If the integration isn't working:

1. Check the Supabase logs for any error messages
2. Verify the webhook URL in your Google Apps Script is correct
3. Check the webhook_logs table for any error messages
4. Ensure your mapping tables are correctly configured
5. Verify the event type is not in the IGNORED_EVENTS list