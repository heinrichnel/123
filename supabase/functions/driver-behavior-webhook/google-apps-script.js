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
  
  // Check if this row has already been processed (Column L)
  const resultCell = sheet.getRange(row, 12);
  const resultValue = resultCell.getValue();
  
  if (resultValue && resultValue !== "") {
    Logger.log(`Row ${row} already processed with result: ${resultValue}`);
    return;
  }
  
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
  const response = sendWebhook(payload);
  
  // Update the result cell (Column L)
  if (response && response.success) {
    // Get the next sequence number
    const lastRow = sheet.getLastRow();
    let nextSequence = 1;
    
    for (let i = 2; i <= lastRow; i++) {
      const seqValue = sheet.getRange(i, 12).getValue();
      if (seqValue && !isNaN(parseInt(seqValue))) {
        nextSequence = Math.max(nextSequence, parseInt(seqValue) + 1);
      }
    }
    
    resultCell.setValue(nextSequence);
    Logger.log(`Row ${row} processed successfully with sequence number ${nextSequence}`);
  } else {
    resultCell.setValue("Error");
    Logger.log(`Error processing row ${row}: ${JSON.stringify(response)}`);
  }
}

function sendWebhook(payload) {
  // Your Supabase Edge Function URL
  const webhookUrl = "https://your-project-ref.supabase.co/functions/v1/driver-behavior-webhook";
  
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(webhookUrl, options);
    const responseText = response.getContentText();
    Logger.log("Webhook response: " + responseText);
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      return { success: false, error: "Invalid JSON response" };
    }
  } catch (error) {
    Logger.log("Error sending webhook: " + error.toString());
    return { success: false, error: error.toString() };
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
  
  const response = sendWebhook(payload);
  Logger.log("Test webhook response: " + JSON.stringify(response));
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
    .addItem('Reset Sequence Numbers', 'resetSequenceNumbers')
    .addToUi();
}

/**
 * Send all rows from the Data sheet where eventType is not UNKNOWN
 * and the result column (L) is empty
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
  
  // Find the highest sequence number
  let highestSequence = 0;
  for (let i = 2; i <= lastRow; i++) {
    const seqValue = sheet.getRange(i, 12).getValue();
    if (seqValue && !isNaN(parseInt(seqValue))) {
      highestSequence = Math.max(highestSequence, parseInt(seqValue));
    }
  }
  
  let nextSequence = highestSequence + 1;
  
  // Process each row
  for (let row = 2; row <= lastRow; row++) {
    // Check if this row has already been processed (Column L)
    const resultValue = sheet.getRange(row, 12).getValue();
    if (resultValue && resultValue !== "") {
      skippedCount++;
      continue;
    }
    
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
    
    const response = sendWebhook(payload);
    
    // Update the result cell (Column L)
    if (response && response.success) {
      sheet.getRange(row, 12).setValue(nextSequence++);
      processedCount++;
    } else {
      sheet.getRange(row, 12).setValue("Error");
      Logger.log(`Error processing row ${row}: ${JSON.stringify(response)}`);
    }
    
    // Add a small delay to avoid rate limiting
    Utilities.sleep(1000);
  }
  
  Logger.log(`Processed ${processedCount} driver events, skipped ${skippedCount} events`);
}

/**
 * Reset all sequence numbers in column L
 */
function resetSequenceNumbers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
  if (!sheet) {
    Logger.log("Data sheet not found");
    return;
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log("No data in Data sheet");
    return;
  }
  
  // Clear all sequence numbers
  const range = sheet.getRange(2, 12, lastRow - 1, 1);
  range.clearContent();
  
  Logger.log("Sequence numbers reset");
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
  
  // Get all rows
  const range = sheet.getRange(2, 1, lastRow - 1, 12);
  const values = range.getValues();
  
  // Filter out rows where:
  // 1. eventType (column 5, index 5) is UNKNOWN
  // 2. Result column (column 11, index 11) is empty (not processed yet)
  const events = values
    .map((row, index) => {
      const eventType = row[5]; // Column F - eventType
      const resultValue = row[11]; // Column L - Result
      
      // Skip rows where eventType is UNKNOWN or result is empty
      if (!eventType || eventType === "UNKNOWN" || !resultValue) {
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
        resultNumber: resultValue,
        rowId: index + 2
      };
    })
    .filter(event => event !== null); // Remove null entries
  
  return ContentService.createTextOutput(JSON.stringify(events))
    .setMimeType(ContentService.MimeType.JSON);
}