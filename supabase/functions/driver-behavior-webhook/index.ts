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

// -------------------- Mapping Configuration --------------------
const fleetMap: Record<string, string> = {
  "357660104031745": "23H",
  "357660105416796": "24H",
  "357660105442362": "28H",
  "357660104031307": "31H",
  "357660104031711": "33H"
};

const driverMap: Record<string, string> = {
  "23H": "Phillimon Kwarire",
  "24H": "Taurayi Vherenaisi",
  "28H": "Adrian Moyo",
  "31H": "Enock Mukonyerwa",
  "33H": "Canaan Chipfurutse"
};

const eventTypeMap: Record<string, string> = {
  "harsh_acceleration": "harsh_acceleration",
  "seatbelt_violation_beep": "seatbelt_violation",
  "seatbelt_violation": "seatbelt_violation",
  "cell_phone_use_beep": "phone_usage",
  "fatigue_alert_beep": "fatigue_alert",
  "fatigue_alert": "fatigue_alert",
  "harsh_braking": "harsh_braking",
  "speedlimit": "speeding",
  "lane_weaving": "lane_weaving",
  "distracted_driver_beep": "distracted",
  "distracted": "distracted",
  "tailgating": "tailgating",
  "passenger": "passenger",
  "obstruction": "obstruction",
  "wrong_pin_code": "wrong_pin_code",
  "violent_left_turn": "violent_left_turn",
  "violent_right_turn": "violent_right_turn",
  "de_acceleration": "de_acceleration",
  "acceleration": "acceleration",
  "button_pressed": "button_pressed",
  "tamper": "tamper",
  "accident": "accident"
};

const eventRules: Record<string, { severity: string; points: number }> = {
  "harsh_acceleration": { severity: "high", points: 10 },
  "seatbelt_violation": { severity: "high", points: 10 },
  "phone_usage": { severity: "medium", points: 5 },
  "fatigue_alert": { severity: "high", points: 10 },
  "harsh_braking": { severity: "high", points: 10 },
  "speeding": { severity: "high", points: 10 },
  "lane_weaving": { severity: "high", points: 5 },
  "distracted": { severity: "high", points: 10 },
  "passenger": { severity: "medium", points: 3 },
  "tailgating": { severity: "high", points: 7 },
  "obstruction": { severity: "medium", points: 4 },
  "wrong_pin_code": { severity: "low", points: 2 },
  "violent_left_turn": { severity: "medium", points: 5 },
  "violent_right_turn": { severity: "medium", points: 5 },
  "de_acceleration": { severity: "medium", points: 3 },
  "acceleration": { severity: "medium", points: 3 },
  "button_pressed": { severity: "low", points: 1 },
  "tamper": { severity: "high", points: 8 },
  "accident": { severity: "critical", points: 50 }
};

const IGNORED_EVENTS = ["jolt", "acc_on", "acc_off", "smoking", "unknown"];

// Parse date from various formats
function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  try {
    // Check if the date is in YYYY/MM/DD format
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        // Convert to YYYY-MM-DD format
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // If it's already in YYYY-MM-DD format or another format
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error("Error parsing date:", error);
    return new Date().toISOString().split('T')[0];
  }
}

// Track processed row IDs to avoid duplicates
const processedRowIds = new Set<number>();

// Load processed row IDs from database
async function loadProcessedRowIds() {
  try {
    const { data, error } = await supabase
      .from("processed_driver_events")
      .select("row_id");
    
    if (error) {
      console.error("Error loading processed row IDs:", error);
      return;
    }
    
    if (data) {
      data.forEach(item => processedRowIds.add(item.row_id));
    }
    
    console.log(`Loaded ${processedRowIds.size} processed row IDs`);
  } catch (error) {
    console.error("Error loading processed row IDs:", error);
  }
}

// Save a processed row ID to the database
async function saveProcessedRowId(rowId: number) {
  try {
    const { error } = await supabase
      .from("processed_driver_events")
      .insert({ row_id: rowId });
    
    if (error) {
      console.error("Error saving processed row ID:", error);
    }
  } catch (error) {
    console.error("Error saving processed row ID:", error);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Load processed row IDs on first request
    if (processedRowIds.size === 0) {
      await loadProcessedRowIds();
    }
    
    // For GET requests, return the latest events
    if (req.method === "GET") {
      // Get the latest driver behavior events from the database
      const { data, error } = await supabase
        .from("driver_behavior_events")
        .select("*")
        .order("reported_at", { ascending: false })
        .limit(10);
      
      if (error) {
        throw new Error(`Error fetching events: ${error.message}`);
      }
      
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only allow POST requests for webhook data
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the request body
    let data;
    try {
      data = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Received driver behavior event:", JSON.stringify(data));

    // Check if this row has already been processed
    const rowId = data.rowId || -1;
    if (rowId > 0 && processedRowIds.has(rowId)) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Event already processed",
        alreadyProcessed: true
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if eventType is UNKNOWN
    const eventType = (data.eventType || "").toString().trim();
    if (!eventType || eventType.toUpperCase() === "UNKNOWN") {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Event ignored: UNKNOWN event type",
        ignored: true
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process the data from the "Data" sheet format
    // The data comes in the format specified with columns A-L
    const driverEvent = processEventFromDataSheet(data);
    
    if (!driverEvent) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Event ignored or invalid data format" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Write to Supabase
    const { data: savedEvent, error } = await supabase
      .from("driver_behavior_events")
      .insert(driverEvent)
      .select();

    if (error) {
      console.error("Error saving driver event:", error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark this row as processed
    if (rowId > 0) {
      processedRowIds.add(rowId);
      await saveProcessedRowId(rowId);
    }

    // Log the webhook event
    await supabase.from("webhook_logs").insert({
      event_type: "driver_behavior",
      payload: data,
      result: driverEvent,
      created_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Driver behavior event recorded successfully",
      event: savedEvent
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing driver behavior webhook:", error);
    
    return new Response(JSON.stringify({ 
      error: `Unexpected error processing webhook: ${error.message}`,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Process event data from the "Data" sheet format
function processEventFromDataSheet(eventData: any) {
  try {
    // Skip if eventType is UNKNOWN
    const eventType = (eventData.eventType || "").toString().trim();
    if (!eventType || eventType.toUpperCase() === "UNKNOWN") {
      return null;
    }
    
    // Skip ignored event types
    const rawEventType = eventType.toLowerCase();
    if (IGNORED_EVENTS.includes(rawEventType)) {
      return null;
    }
    
    // Map the event type to our standardized types
    let mappedEventType = "other";
    const normalizedEventType = rawEventType.replace(/\s+/g, '_').toLowerCase();
    
    // Try to find a matching event type
    for (const [key, value] of Object.entries(eventTypeMap)) {
      if (normalizedEventType.includes(key)) {
        mappedEventType = value;
        break;
      }
    }
    
    // Get severity and points from rules or from the data
    let severity = (eventData.severity || "medium").toLowerCase();
    let points = parseInt(eventData.points) || 0;
    
    // If we have rules for this event type, use them
    if (eventRules[mappedEventType]) {
      severity = eventRules[mappedEventType].severity;
      points = eventRules[mappedEventType].points;
    }
    
    // Create driver behavior event object
    const driverEvent = {
      id: `EVENT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      driver_name: eventData.driverName || "Unknown",
      fleet_number: eventData.fleetNumber || "Unknown",
      event_date: parseDate(eventData.eventDate),
      event_time: eventData.eventTime || "00:00",
      event_type: mappedEventType,
      description: eventData.description || `${eventData.eventType} event detected for ${eventData.driverName}`,
      location: eventData.location || "",
      severity: severity,
      reported_by: "Google Sheets Integration",
      reported_at: new Date().toISOString(),
      status: "pending",
      action_taken: "",
      points: points,
      date: new Date().toISOString(),
      resolved: false,
      row_id: eventData.rowId || -1,
      serial_number: eventData.serialNumber,
      latitude: eventData.latitude,
      longitude: eventData.longitude
    };
    
    return driverEvent;
  } catch (error) {
    console.error("Error processing event data:", error);
    return null;
  }
}