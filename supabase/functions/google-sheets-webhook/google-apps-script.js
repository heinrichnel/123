/**
 * This script should be added to your Google Sheet via Extensions > Apps Script
 * It will automatically send webhooks when rows are added to the Order.Shipped or Order.Delivered sheets
 */

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
  const timestamp = new Date().toISOString();
  const route = sheet.getRange(row, 5).getValue();     // Column E - Route/Load ref number
  const driverName = sheet.getRange(row, 7).getValue(); // Column G - Driver name
  const fleetNumber = sheet.getRange(row, 8).getValue(); // Column H - Fleet Number
  const clientName = sheet.getRange(row, 9).getValue(); // Column I - Client name
  const startDate = sheet.getRange(row, 10).getValue(); // Column J - Date started
  
  // Prepare the payload
  const payload = {
    sheetName: sheetName,
    timestamp: timestamp,
    route: route,
    driverName: driverName,
    fleetNumber: fleetNumber,
    clientName: clientName,
    startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    rowNumber: row,
    // Include the raw column data for debugging
    E: route,
    G: driverName,
    H: fleetNumber,
    I: clientName,
    J: startDate
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

/**
 * Test function that can be manually run to verify webhook connection
 * Run this function from the Apps Script editor to test
 */
function testWebhook() {
  const payload = {
    action: "ping",
    timestamp: new Date().toISOString(),
    message: "Test webhook from Google Apps Script"
  };
  
  sendWebhook(payload);
}

/**
 * This function will be triggered when the spreadsheet is opened
 * It adds a custom menu to the spreadsheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Webhook Tools')
    .addItem('Test Webhook Connection', 'testWebhook')
    .addItem('Send All Shipped Orders', 'sendAllShippedOrders')
    .addItem('Send All Delivered Orders', 'sendAllDeliveredOrders')
    .addToUi();
}

/**
 * Send all rows from the Order.Shipped sheet
 */
function sendAllShippedOrders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Order.Shipped");
  if (!sheet) {
    Logger.log("Order.Shipped sheet not found");
    return;
  }
  
  sendAllRowsFromSheet(sheet);
}

/**
 * Send all rows from the Order.Delivered sheet
 */
function sendAllDeliveredOrders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Order.Delivered");
  if (!sheet) {
    Logger.log("Order.Delivered sheet not found");
    return;
  }
  
  sendAllRowsFromSheet(sheet);
}

/**
 * Helper function to send all rows from a sheet
 */
function sendAllRowsFromSheet(sheet) {
  const sheetName = sheet.getName();
  const lastRow = sheet.getLastRow();
  
  // Skip if only header row exists
  if (lastRow <= 1) {
    Logger.log(`No data in ${sheetName} sheet`);
    return;
  }
  
  // Process each row
  for (let row = 2; row <= lastRow; row++) {
    const timestamp = new Date().toISOString();
    const route = sheet.getRange(row, 5).getValue();     // Column E
    const driverName = sheet.getRange(row, 7).getValue(); // Column G
    const fleetNumber = sheet.getRange(row, 8).getValue(); // Column H
    const clientName = sheet.getRange(row, 9).getValue(); // Column I
    const startDate = sheet.getRange(row, 10).getValue(); // Column J
    
    // Skip rows with missing essential data
    if (!route || !fleetNumber) {
      continue;
    }
    
    const payload = {
      sheetName: sheetName,
      timestamp: timestamp,
      route: route,
      driverName: driverName,
      fleetNumber: fleetNumber,
      clientName: clientName,
      startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      rowNumber: row,
      E: route,
      G: driverName,
      H: fleetNumber,
      I: clientName,
      J: startDate
    };
    
    sendWebhook(payload);
    
    // Add a small delay to avoid rate limiting
    Utilities.sleep(1000);
  }
  
  Logger.log(`Processed ${lastRow - 1} rows from ${sheetName}`);
}