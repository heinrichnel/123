/**
 * This script should be added to your Google Sheet via Extensions > Apps Script
 * It will automatically send webhooks when driver behavior events are added to the Data sheet
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
  
  // Get the data from the row based on the specified columns
  const reportedAt = sheet.getRange(row, 1).getValue();     // Column A - reportedAt
  const description = sheet.getRange(row, 2).getValue();    // Column B - description
  const driverName = sheet.getRange(row, 3).getValue();     // Column C - driverName
  const eventDate = sheet.getRange(row, 4).getValue();      // Column D - eventDate
  const eventTime = sheet.getRange(row, 5).getValue();      // Column E - eventTime
  const eventType = sheet.getRange(row, 6).getValue();      // Column F - eventType
  const fleetNumber = sheet.getRange(row, 7).getValue();    // Column G - fleetNumber
  const location = sheet.getRange(row, 8).getValue();       // Column H - location
  const severity = sheet.getRange(row, 9).getValue();       // Column I - severity
  const status = sheet.getRange(row, 10).getValue();        // Column J - status
  const points = sheet.getRange(row, 11).getValue();        // Column K - points
  
  // Skip rows with missing essential data
  if (!eventType || !fleetNumber || !driverName) {
    Logger.log("Skipping row with missing essential data");
    return;
  }
  
  // Skip ignored event types
  const ignoredEvents = ["jolt", "acc_on", "acc_off", "smoking"];
  if (ignoredEvents.includes(eventType.toLowerCase())) {
    Logger.log("Skipping ignored event type: " + eventType);
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
    points: points || 0
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
    eventType: "Harsh Acceleration",
    fleetNumber: "24H",
    location: "View on Map",
    severity: "High",
    status: "Pending",
    points: 10
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
 * Send all rows from the Data sheet
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
  
  // Process each row
  for (let row = 2; row <= lastRow; row++) {
    const reportedAt = sheet.getRange(row, 1).getValue();     // Column A
    const description = sheet.getRange(row, 2).getValue();    // Column B
    const driverName = sheet.getRange(row, 3).getValue();     // Column C
    const eventDate = sheet.getRange(row, 4).getValue();      // Column D
    const eventTime = sheet.getRange(row, 5).getValue();      // Column E
    const eventType = sheet.getRange(row, 6).getValue();      // Column F
    const fleetNumber = sheet.getRange(row, 7).getValue();    // Column G
    const location = sheet.getRange(row, 8).getValue();       // Column H
    const severity = sheet.getRange(row, 9).getValue();       // Column I
    const status = sheet.getRange(row, 10).getValue();        // Column J
    const points = sheet.getRange(row, 11).getValue();        // Column K
    
    // Skip rows with missing essential data
    if (!eventType || !fleetNumber || !driverName) {
      continue;
    }
    
    // Skip ignored event types
    const ignoredEvents = ["jolt", "acc_on", "acc_off", "smoking"];
    if (ignoredEvents.includes(eventType.toLowerCase())) {
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
      points: points || 0
    };
    
    sendWebhook(payload);
    
    // Add a small delay to avoid rate limiting
    Utilities.sleep(1000);
  }
  
  Logger.log(`Processed ${lastRow - 1} driver events`);
}

/**
 * Function to create a simple API endpoint that returns the latest driver events
 * This can be published as a web app to be accessed by the client application
 */
function doGet(e) {
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
  
  // Get the last 10 rows (or fewer if there aren't that many)
  const startRow = Math.max(2, lastRow - 9); // Get up to 10 rows
  const numRows = lastRow - startRow + 1;
  
  const range = sheet.getRange(startRow, 1, numRows, 11);
  const values = range.getValues();
  
  const events = values.map(row => ({
    reportedAt: row[0] || new Date().toISOString(),
    description: row[1] || "",
    driverName: row[2] || "Unknown",
    eventDate: row[3] || new Date().toISOString().split('T')[0],
    eventTime: row[4] || "00:00",
    eventType: row[5] || "other",
    fleetNumber: row[6] || "Unknown",
    location: row[7] || "",
    severity: row[8] || "medium",
    status: row[9] || "pending",
    points: row[10] || 0
  }));
  
  // Filter out ignored event types
  const ignoredEvents = ["jolt", "acc_on", "acc_off", "smoking"];
  const filteredEvents = events.filter(event => 
    !ignoredEvents.includes((event.eventType || "").toString().trim().toLowerCase())
  );
  
  return ContentService.createTextOutput(JSON.stringify(filteredEvents))
    .setMimeType(ContentService.MimeType.JSON);
}