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

// Format date as "DD-MMM-YYYY HH:MM AM/PM"
function formatDateTime(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = date.getDate().toString().padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutes = date.getMinutes().toString().padStart(2, "0");
  
  return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
}

// Calculate time spent on trip
function calculateTimeSpent(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h ${diffMinutes}m`;
  } else {
    return `${diffHours}h ${diffMinutes}m`;
  }
}

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse the request body
    const { tripId, status } = await req.json();

    if (!tripId || !status) {
      return new Response(JSON.stringify({ error: "Missing required fields: tripId and status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch the trip data from Supabase
    const { data: trip, error } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: `Error fetching trip: ${error.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!trip) {
      return new Response(JSON.stringify({ error: "Trip not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Determine which sheet to update based on status
    let sheetName;
    if (status === "shipped") {
      sheetName = "Order.Shipped";
    } else if (status === "delivered") {
      sheetName = "Order.Delivered";
    } else {
      return new Response(JSON.stringify({ error: "Invalid status. Must be 'shipped' or 'delivered'" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the Google Sheet
    const doc = await getGoogleSheet();
    const sheet = doc.sheetsByTitle[sheetName];
    
    if (!sheet) {
      return new Response(JSON.stringify({ error: `Sheet '${sheetName}' not found` }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Format the current date and time
    const timestamp = formatDateTime(new Date());
    
    // Calculate time spent if this is a delivery
    let timeSpent = "";
    if (status === "delivered" && trip.shippedAt) {
      timeSpent = calculateTimeSpent(trip.shippedAt, new Date().toISOString());
    }

    // Prepare the row data
    // A → Timestamp, E → Route, G → Driver, H → Fleet Number
    const rowData = {
      'A': timestamp,
      'E': trip.route,
      'G': trip.driverName,
      'H': trip.fleetNumber,
    };
    
    // Add time spent for delivered trips
    if (status === "delivered" && timeSpent) {
      rowData['I'] = timeSpent;
    }

    // Add the row to the sheet
    await sheet.addRow(rowData);

    // Update the trip status in Supabase
    const updateData: any = { status };
    
    // Add timestamp based on status
    if (status === "shipped") {
      updateData.shippedAt = new Date().toISOString();
    } else if (status === "delivered") {
      updateData.deliveredAt = new Date().toISOString();
    }
    
    const { error: updateError } = await supabase
      .from("trips")
      .update(updateData)
      .eq("id", tripId);

    if (updateError) {
      return new Response(JSON.stringify({ error: `Error updating trip status: ${updateError.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Trip ${tripId} status updated to ${status} and added to ${sheetName} sheet`,
      timestamp,
      timeSpent
    }), {
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