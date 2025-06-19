import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";

// Environment variables will be set in the Supabase dashboard
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Only allow POST requests for webhook data
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the request body
    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Received webhook payload:", JSON.stringify(payload));

    // Validate the payload
    if (!payload || !payload.action) {
      return new Response(JSON.stringify({ error: "Invalid payload structure" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process based on action type
    let result;
    switch (payload.action) {
      case "shipped":
        result = await processShippedEvent(payload);
        break;
      case "delivered":
        result = await processDeliveredEvent(payload);
        break;
      case "ping":
        // Simple ping to test the webhook is working
        result = { success: true, message: "Webhook received ping successfully" };
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${payload.action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Log the webhook event
    await logWebhookEvent(payload, result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    
    return new Response(JSON.stringify({ 
      error: `Unexpected error processing webhook: ${error.message}`,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Process a shipped event from Google Sheets
async function processShippedEvent(payload: any) {
  try {
    // Extract data from payload
    const { fleetNumber, route, driverName, timestamp } = payload;
    
    if (!fleetNumber || !route) {
      return { success: false, error: "Missing required fields: fleetNumber and route" };
    }

    // Find matching active trip
    const { data: trips, error: findError } = await supabase
      .from("trips")
      .select("*")
      .eq("fleetNumber", fleetNumber)
      .eq("route", route)
      .eq("status", "active")
      .is("shippedAt", null)
      .order("createdAt", { ascending: false })
      .limit(1);
    
    if (findError) {
      throw new Error(`Error finding trip: ${findError.message}`);
    }
    
    if (!trips || trips.length === 0) {
      // No matching trip found, create a new one
      return await createNewTripFromShippedEvent(payload);
    }
    
    const trip = trips[0];
    
    // Update the trip with shipping information
    const { error: updateError } = await supabase
      .from("trips")
      .update({
        shippedAt: timestamp || new Date().toISOString(),
        shippingNotes: "Updated via Google Sheets webhook"
      })
      .eq("id", trip.id);
    
    if (updateError) {
      throw new Error(`Error updating trip: ${updateError.message}`);
    }
    
    return { 
      success: true, 
      tripId: trip.id, 
      message: "Existing trip updated with shipping information",
      action: "updated"
    };
  } catch (error) {
    console.error("Error processing shipped event:", error);
    return { success: false, error: error.message };
  }
}

// Create a new trip from shipped event data
async function createNewTripFromShippedEvent(payload: any) {
  try {
    const { fleetNumber, route, driverName, timestamp } = payload;
    
    // Generate a unique ID for the trip
    const tripId = `TRIP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Set default dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // Default to 7 days duration
    
    // Create basic trip data
    const tripData = {
      id: tripId,
      driverName: driverName || "Unknown Driver",
      fleetNumber,
      route,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      clientName: "Auto-generated from Google Sheets",
      clientType: "external",
      status: "active",
      costs: [],
      baseRevenue: 0, // No financial data included
      revenueCurrency: "ZAR", // Default currency
      distanceKm: 0, // No distance data included
      shippedAt: timestamp || new Date().toISOString(),
      shippingNotes: "Auto-created from Google Sheets webhook",
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
    
    return { 
      success: true, 
      tripId, 
      message: "New trip created from shipped event",
      action: "created"
    };
  } catch (error) {
    console.error("Error creating trip from shipped event:", error);
    return { success: false, error: error.message };
  }
}

// Process a delivered event from Google Sheets
async function processDeliveredEvent(payload: any) {
  try {
    // Extract data from payload
    const { fleetNumber, route, timestamp } = payload;
    
    if (!fleetNumber || !route) {
      return { success: false, error: "Missing required fields: fleetNumber and route" };
    }
    
    // Find matching active trip that has been shipped but not delivered
    const { data: trips, error: findError } = await supabase
      .from("trips")
      .select("*")
      .eq("fleetNumber", fleetNumber)
      .eq("route", route)
      .eq("status", "active")
      .not("shippedAt", "is", null)
      .is("deliveredAt", null)
      .order("createdAt", { ascending: false })
      .limit(1);
    
    if (findError) {
      throw new Error(`Error finding trip: ${findError.message}`);
    }
    
    if (!trips || trips.length === 0) {
      return { 
        success: false, 
        error: `No matching shipped trip found for route ${route} and fleet ${fleetNumber}` 
      };
    }
    
    const trip = trips[0];
    
    // Calculate time spent on delivery
    let timeSpent = "";
    if (trip.shippedAt) {
      const shippedDate = new Date(trip.shippedAt);
      const deliveredDate = timestamp ? new Date(timestamp) : new Date();
      
      const diffMs = deliveredDate.getTime() - shippedDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      timeSpent = diffDays > 0 ? `${diffDays}d ${diffHours}h` : `${diffHours}h`;
    }
    
    // Update the trip with delivery information
    const { error: updateError } = await supabase
      .from("trips")
      .update({
        deliveredAt: timestamp || new Date().toISOString(),
        deliveryNotes: `Updated via Google Sheets webhook. Time spent: ${timeSpent}`,
        timeSpent: timeSpent
      })
      .eq("id", trip.id);
    
    if (updateError) {
      throw new Error(`Error updating trip: ${updateError.message}`);
    }
    
    return { 
      success: true, 
      tripId: trip.id, 
      message: "Trip updated with delivery information",
      timeSpent
    };
  } catch (error) {
    console.error("Error processing delivered event:", error);
    return { success: false, error: error.message };
  }
}

// Log webhook events for auditing
async function logWebhookEvent(payload: any, result: any) {
  try {
    const logEntry = {
      event_type: payload.action,
      payload: JSON.stringify(payload),
      result: JSON.stringify(result),
      created_at: new Date().toISOString()
    };
    
    await supabase.from("webhook_logs").insert(logEntry);
  } catch (error) {
    console.error("Error logging webhook event:", error);
    // Don't throw - this is a non-critical operation
  }
}