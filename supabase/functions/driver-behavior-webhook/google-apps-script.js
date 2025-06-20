/**
 * This script should be added to your Google Sheet via Extensions > Apps Script
 * It will automatically send webhooks when driver behavior events are added to the Data sheet
 * and provide a web app endpoint for fetching the latest events
 */

function onEdit(e) {
  // Only trigger on edits to the Data sheet
  const sheetName = e.source.getActiveSheet().getName();
  if (sheetName !== "Data") {
    return;
  }
  
  // Get the edited row data
  const row = e.range.getRow();
  const sheet = e.source.getActiveSheet();
  
  // Skip header row
  if (row <= 1) {
    return;
  }
  
  // Get the event type (Column F)
  const eventType = sheet.getRange(row, 6).getValue();
  
  // Only process rows where eventType is not "UNKNOWN"
  if (!eventType || eventType === "UNKNOWN") {
    Logger.log("Skipping row with UNKNOWN event type");
    return;
  }
  
  // Get the data from the row based on the specified columns
  const reportedAt = sheet.getRange(row, 1).getValue();     // Column A - reportedAt
  const description = sheet.getRange(row, 2).getValue();    // Column B - description
  const driverName = sheet.getRange(row, 3).getValue();     // Column C - driverName
  const eventDate = sheet.getRange(row, 4).getValue();      // Column D - eventDate
  const eventTime = sheet.getRange(row, 5).getValue();      // Column E - eventTime
  // eventType already retrieved above                      // Column F - eventType
  const fleetNumber = sheet.getRange(row, 7).getValue();    // Column G - fleetNumber
  const location = sheet.getRange(row, 8).getValue();       // Column H - location
  const severity = sheet.getRange(row, 9).getValue();       // Column I - severity
  const status = sheet.getRange(row, 10).getValue();        // Column J - status
  const points = sheet.getRange(row, 11).getValue();        // Column K - points
  
  // Skip rows with missing essential data
  if (!fleetNumber || !driverName) {
    Logger.log("Skipping row with missing essential data");
    return;
  }
  
  // Prepare the payload
  const payload = {
    reportedAt: reportedAt || new Date().toISOString(),
    description: description || "",
    driverName: driverName || "Unknown",
    eventDate: eventDate || new Date().toISOString().split('T')[0],
    eventTime: eventTime || "00:00",
    eventType: eventType || "other",
    fleetNumber: fleetNumber || "Unknown",
    location: location || "",
    severity: severity || "medium",
    status: status || "pending",
    points: points || 0,
    rowId: row // Include the row ID to help with deduplication
  };
  
  // Send the webhook
  sendWebhook(payload);
}

function sendWebhook(payload) {
  // Your Supabase Edge Function URL
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
    reportedAt: "2025/06/20",
    description: "Possible Harsh Acceleration",
    driverName: "Taurayi Vherenaisi",
    eventDate: "2024/06/21",
    eventTime: "00:45",
    eventType: "Harsh Acceleration", // Not UNKNOWN
    fleetNumber: "24H",
    location: "View on Map",
    severity: "High",
    status: "Pending",
    points: 10,
    rowId: -1 // Test row ID
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
    .addItem('Reset Last Processed Row', 'resetLastProcessedRow')
    .addItem('Get Last Processed Row', 'getLastProcessedRow')
    .addToUi();
}

/**
 * Send all rows from the Data sheet where eventType is not UNKNOWN
 */
function sendAllDriverEvents() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
  if (!sheet) {
    Logger.log("Data sheet not found");
    return;
  }
  
  const lastRow = sheet.getLastRow();
  
  // Skip if only header row exists
  if (lastRow <= 1) {
    Logger.log("No data in Data sheet");
    return;
  }
  
  let processedCount = 0;
  let skippedCount = 0;
  
  // Process each row
  for (let row = 2; row <= lastRow; row++) {
    // Check if eventType is UNKNOWN
    const eventType = sheet.getRange(row, 6).getValue();
    if (!eventType || eventType === "UNKNOWN") {
      skippedCount++;
      continue;
    }
    
    const reportedAt = sheet.getRange(row, 1).getValue();     // Column A
    const description = sheet.getRange(row, 2).getValue();    // Column B
    const driverName = sheet.getRange(row, 3).getValue();     // Column C
    const eventDate = sheet.getRange(row, 4).getValue();      // Column D
    const eventTime = sheet.getRange(row, 5).getValue();      // Column E
    // eventType already retrieved above                      // Column F
    const fleetNumber = sheet.getRange(row, 7).getValue();    // Column G
    const location = sheet.getRange(row, 8).getValue();       // Column H
    const severity = sheet.getRange(row, 9).getValue();       // Column I
    const status = sheet.getRange(row, 10).getValue();        // Column J
    const points = sheet.getRange(row, 11).getValue();        // Column K
    
    // Skip rows with missing essential data
    if (!fleetNumber || !driverName) {
      skippedCount++;
      continue;
    }
    
    const payload = {
      reportedAt: reportedAt || new Date().toISOString(),
      description: description || "",
      driverName: driverName || "Unknown",
      eventDate: eventDate || new Date().toISOString().split('T')[0],
      eventTime: eventTime || "00:00",
      eventType: eventType || "other",
      fleetNumber: fleetNumber || "Unknown",
      location: location || "",
      severity: severity || "medium",
      status: status || "pending",
      points: points || 0,
      rowId: row
    };
    
    sendWebhook(payload);
    processedCount++;
    
    // Add a small delay to avoid rate limiting
    Utilities.sleep(1000);
  }
  
  Logger.log(`Processed ${processedCount} driver events, skipped ${skippedCount} events with UNKNOWN type`);
}

/**
 * Function to create a simple API endpoint that returns the latest driver events
 * This can be published as a web app to be accessed by the client application
 */
function doGet(e) {
  // Get the last processed row from Properties Service
  const userProperties = PropertiesService.getUserProperties();
  const lastProcessedRow = parseInt(userProperties.getProperty('lastProcessedRow') || '0');
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Data sheet not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Only get rows that haven't been processed yet
  const startRow = Math.max(2, lastProcessedRow + 1);
  
  // If there are no new rows, return empty array
  if (startRow > lastRow) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const numRows = lastRow - startRow + 1;
  
  const range = sheet.getRange(startRow, 1, numRows, 11);
  const values = range.getValues();
  
  const events = values.map((row, index) => {
    const eventType = row[5]; // Column F - eventType
    
    // Skip rows where eventType is UNKNOWN
    if (!eventType || eventType === "UNKNOWN") {
      return null;
    }
    
    return {
      reportedAt: row[0] || new Date().toISOString(),
      description: row[1] || "",
      driverName: row[2] || "Unknown",
      eventDate: row[3] || new Date().toISOString().split('T')[0],
      eventTime: row[4] || "00:00",
      eventType: eventType,
      fleetNumber: row[6] || "Unknown",
      location: row[7] || "",
      severity: row[8] || "medium",
      status: row[9] || "pending",
      points: row[10] || 0,
      rowId: startRow + index
    };
  }).filter(event => event !== null); // Remove null entries (UNKNOWN events)
  
  // Update the last processed row
  if (numRows > 0) {
    userProperties.setProperty('lastProcessedRow', lastRow.toString());
  }
  
  return ContentService.createTextOutput(JSON.stringify(events))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Reset the last processed row (for testing)
 */
function resetLastProcessedRow() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('lastProcessedRow', '1'); // Reset to just the header row
  Logger.log("Last processed row reset to 1");
}

/**
 * Get the current last processed row (for debugging)
 */
function getLastProcessedRow() {
  const userProperties = PropertiesService.getUserProperties();
  const lastProcessedRow = userProperties.getProperty('lastProcessedRow') || '0';
  Logger.log("Last processed row: " + lastProcessedRow);
  return lastProcessedRow;
}