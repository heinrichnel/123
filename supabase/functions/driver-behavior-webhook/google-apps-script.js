/**
 * This script should be added to your Google Sheet via Extensions > Apps Script
 * It will automatically send webhooks when driver behavior events are added to the sheet
 */

function onEdit(e) {
  // Only trigger on edits to the driver behavior events sheet
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

/**
 * Test function that can be manually run to verify webhook connection
 * Run this function from the Apps Script editor to test
 */
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

/**
 * This function will be triggered when the spreadsheet is opened
 * It adds a custom menu to the spreadsheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Driver Events')
    .addItem('Test Webhook Connection', 'testWebhook')
    .addItem('Send All Driver Events', 'sendAllDriverEvents')
    .addToUi();
}

/**
 * Send all rows from the DriverEvents sheet
 */
function sendAllDriverEvents() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DriverEvents");
  if (!sheet) {
    Logger.log("DriverEvents sheet not found");
    return;
  }
  
  const lastRow = sheet.getLastRow();
  
  // Skip if only header row exists
  if (lastRow <= 1) {
    Logger.log("No data in DriverEvents sheet");
    return;
  }
  
  // Process each row
  for (let row = 2; row <= lastRow; row++) {
    const serialNumber = sheet.getRange(row, 1).getValue();
    const eventType = sheet.getRange(row, 2).getValue();
    const eventTime = sheet.getRange(row, 3).getValue();
    const latitude = sheet.getRange(row, 4).getValue();
    const longitude = sheet.getRange(row, 5).getValue();
    
    // Skip rows with missing essential data
    if (!serialNumber || !eventType) {
      continue;
    }
    
    const payload = {
      serialNumber: serialNumber,
      eventType: eventType,
      eventTime: eventTime,
      latitude: latitude,
      longitude: longitude
    };
    
    sendWebhook(payload);
    
    // Add a small delay to avoid rate limiting
    Utilities.sleep(1000);
  }
  
  Logger.log(`Processed ${lastRow - 1} driver events`);
}