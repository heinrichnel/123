import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";
import { GoogleSpreadsheet } from "npm:google-spreadsheet@4.1.1";
import { JWT } from "npm:google-auth-library@9.4.1";

// Environment variables will be set in the Supabase dashboard
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Google Sheets credentials - these will be set in the Supabase dashboard
const GOOGLE_PRIVATE_KEY = Deno.env.get("GOOGLE_PRIVATE_KEY")?.replace(/\\n/g, "\n") || "";
const GOOGLE_CLIENT_EMAIL = Deno.env.get("GOOGLE_CLIENT_EMAIL") || "";
const GOOGLE_SHEET_ID = Deno.env.get("GOOGLE_SHEET_ID") || "1bpqVq_OZDexhrCS8fk106lkgFYJ4kWb0Z4qgFqTbaU0";

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Google Sheets client
async function getGoogleSheet() {
  const serviceAccountAuth = new JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
}

// Parse date from "DD-MMM-YYYY HH:MM AM/PM" format
function parseDateTime(dateTimeStr: string): Date | null {
  try {
    // Handle formats like "16-Jun-2025 04:25 PM"
    const months: Record<string, number> = {
      "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
      "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
    };
    
    const parts = dateTimeStr.split(" ");
    if (parts.length !== 3) return null;
    
    const dateParts = parts[0].split("-");
    if (dateParts.length !== 3) return null;
    
    const day = parseInt(dateParts[0]);
    const month = months[dateParts[1]];
    const year = parseInt(dateParts[2]);
    
    if (isNaN(day) || month === undefined || isNaN(year)) return null;
    
    const timeParts = parts[1].split(":");
    if (timeParts.length !== 2) return null;
    
    let hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    
    if (isNaN(hours) || isNaN(minutes)) return null;
    
    // Adjust for AM/PM
    const isPM = parts[2].toUpperCase() === "PM";
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    return new Date(year, month, day, hours, minutes);
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
}

// Function to create a new trip from Google Sheets data
async function createTripFromSheetData(rowData: any) {
  try {
    // Extract data from row
    const route = rowData.E || "";
    const driverName = rowData.G || "";
    const fleetNumber = rowData.H || "";
    const dateTimeStr = rowData.A || "";
    
    if (!route || !driverName || !fleetNumber || !dateTimeStr) {
      throw new Error("Missing required data in sheet row");
    }
    
    // Parse date and time
    const dateTime = parseDateTime(dateTimeStr);
    if (!dateTime) {
      throw new Error(`Invalid date format: ${dateTimeStr}`);
    }
    
    // Format dates for the trip
    const startDate = dateTime.toISOString().split('T')[0];
    
    // Set end date to 7 days after start date by default
    const endDate = new Date(dateTime);
    endDate.setDate(endDate.getDate() + 7);
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Generate a unique ID for the trip
    const tripId = `TRIP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create basic trip data
    const tripData = {
      id: tripId,
      driverName,
      fleetNumber,
      route,
      startDate,
      endDate: endDateStr,
      clientName: "Auto-generated from Google Sheets",
      clientType: "external",
      status: "active",
      costs: [],
      baseRevenue: 0, // No financial data included
      revenueCurrency: "ZAR", // Default currency
      distanceKm: 0, // No distance data included
      shippedAt: dateTime.toISOString(),
      shippingNotes: "Auto-created from Order.Shipped sheet",
      createdAt: new Date().toISOString(),
      createdBy: "Google Sheets Integration"
    };
    
    // Insert the trip into Supabase
    const { error } = await supabase
      .from("trips")
      .insert(tripData);
    
    if (error) {
      throw new Error(`Error inserting trip: ${error.message}`);
    }
    
    return { success: true, tripId, message: "Trip created successfully" };
  } catch (error) {
    console.error("Error creating trip:", error);
    return { success: false, error: error.message };
  }
}

// Function to update a trip's status to delivered
async function updateTripToDelivered(rowData: any) {
  try {
    // Extract data from row
    const route = rowData.E || "";
    const fleetNumber = rowData.H || "";
    const dateTimeStr = rowData.A || "";
    
    if (!route || !fleetNumber || !dateTimeStr) {
      throw new Error("Missing required data in sheet row");
    }
    
    // Parse date and time
    const dateTime = parseDateTime(dateTimeStr);
    if (!dateTime) {
      throw new Error(`Invalid date format: ${dateTimeStr}`);
    }
    
    // Find the trip by route and fleet number
    const { data: trips, error: findError } = await supabase
      .from("trips")
      .select("*")
      .eq("route", route)
      .eq("fleetNumber", fleetNumber)
      .is("deliveredAt", null) // Only get trips that haven't been delivered yet
      .order("createdAt", { ascending: false })
      .limit(1);
    
    if (findError) {
      throw new Error(`Error finding trip: ${findError.message}`);
    }
    
    if (!trips || trips.length === 0) {
      throw new Error(`No matching trip found for route ${route} and fleet ${fleetNumber}`);
    }
    
    const trip = trips[0];
    
    // Update the trip with delivery information
    const { error: updateError } = await supabase
      .from("trips")
      .update({
        deliveredAt: dateTime.toISOString(),
        deliveryNotes: "Auto-updated from Order.Delivered sheet"
      })
      .eq("id", trip.id);
    
    if (updateError) {
      throw new Error(`Error updating trip: ${updateError.message}`);
    }
    
    return { success: true, tripId: trip.id, message: "Trip updated to delivered successfully" };
  } catch (error) {
    console.error("Error updating trip:", error);
    return { success: false, error: error.message };
  }
}

// Function to process new rows from Google Sheets
async function processSheetChanges() {
  try {
    const doc = await getGoogleSheet();
    
    // Process Order.Shipped sheet
    const shippedSheet = doc.sheetsByTitle["Order.Shipped"];
    if (shippedSheet) {
      const shippedRows = await shippedSheet.getRows();
      
      // Get the last processed row index from database
      const { data: lastProcessedData } = await supabase
        .from("sheet_sync_state")
        .select("*")
        .eq("sheet_name", "Order.Shipped")
        .single();
      
      const lastProcessedIndex = lastProcessedData?.last_processed_row || 0;
      
      // Process new rows
      const newShippedRows = shippedRows.slice(lastProcessedIndex);
      
      for (const row of newShippedRows) {
        const result = await createTripFromSheetData(row);
        console.log("Processed shipped row:", result);
      }
      
      // Update the last processed row index
      await supabase
        .from("sheet_sync_state")
        .upsert({
          sheet_name: "Order.Shipped",
          last_processed_row: shippedRows.length,
          last_sync: new Date().toISOString()
        });
    }
    
    // Process Order.Delivered sheet
    const deliveredSheet = doc.sheetsByTitle["Order.Delivered"];
    if (deliveredSheet) {
      const deliveredRows = await deliveredSheet.getRows();
      
      // Get the last processed row index from database
      const { data: lastProcessedData } = await supabase
        .from("sheet_sync_state")
        .select("*")
        .eq("sheet_name", "Order.Delivered")
        .single();
      
      const lastProcessedIndex = lastProcessedData?.last_processed_row || 0;
      
      // Process new rows
      const newDeliveredRows = deliveredRows.slice(lastProcessedIndex);
      
      for (const row of newDeliveredRows) {
        const result = await updateTripToDelivered(row);
        console.log("Processed delivered row:", result);
      }
      
      // Update the last processed row index
      await supabase
        .from("sheet_sync_state")
        .upsert({
          sheet_name: "Order.Delivered",
          last_processed_row: deliveredRows.length,
          last_sync: new Date().toISOString()
        });
    }
    
    return { success: true, message: "Sheet changes processed successfully" };
  } catch (error) {
    console.error("Error processing sheet changes:", error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  try {
    // Allow both GET and POST requests
    // GET for manual triggering, POST for webhook integration
    if (req.method !== "GET" && req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Process the sheet changes
    const result = await processSheetChanges();

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Unexpected error: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});