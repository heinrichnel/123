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
  "passenger": "passenger",
  "tailgating": "tailgating",
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

const IGNORED_EVENTS = ["jolt", "acc_on", "acc_off", "smoking"];

// Split date and time from a datetime string
function splitDateTime(dateTimeStr: string): { date: string, time: string } {
  if (!dateTimeStr) return { date: "", time: "" };
  
  try {
    // Handle different date formats
    // Format: DD/MM/YY HH:mm:SS
    if (dateTimeStr.includes('/')) {
      const [datePart, timePart] = dateTimeStr.split(' ');
      if (!datePart || !timePart) return { date: "", time: "" };
      
      const [day, month, year] = datePart.split('/');
      // Convert to YYYY-MM-DD format
      const formattedDate = `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const formattedTime = timePart.substring(0, 5); // Extract HH:mm
      
      return {
        date: formattedDate,
        time: formattedTime
      };
    }
    
    // Format: YYYY-MM-DD HH:mm:SS or other formats with dash
    const [date, time] = dateTimeStr.split(' ');
    return {
      date: date || new Date().toISOString().split('T')[0],
      time: time ? time.substring(0, 5) : ""
    };
  } catch (error) {
    console.error("Error splitting date time:", error);
    return { 
      date: new Date().toISOString().split('T')[0], 
      time: new Date().toTimeString().split(' ')[0].substring(0, 5) 
    };
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

    // --- Raw event type extraction & filtering ---
    const rawEventType = (data.eventType || data["Event Type"] || "").toString().trim().toLowerCase();
    if (IGNORED_EVENTS.includes(rawEventType)) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Ignored event type", 
        eventType: rawEventType 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Event Type Mapping ---
    const mappedEventType =
      eventTypeMap[rawEventType] ||
      eventTypeMap[rawEventType.replace(/_/g, ' ')] ||
      "other";

    // --- Serial Number/Fleet/Driver Mapping ---
    const serialNumber = data.serialNumber || data["Serial Number"] || "";
    const fleetNumber = fleetMap[serialNumber] || "Unknown";
    const driverName = driverMap[fleetNumber] || "Unknown";

    // --- Event Time Parsing ---
    const eventTimeRaw = data.eventTime || data["Event Time"] || "";
    const { date: eventDate, time: eventTime } = splitDateTime(eventTimeRaw);

    // --- Location Parsing ---
    const latitude = data.latitude || data["Latitude"] || "";
    const longitude = data.longitude || data["Longitude"] || "";
    const location = `${latitude}, ${longitude}`;

    // --- Event Rules for Severity/Points ---
    const rules = eventRules[mappedEventType] || { severity: "medium", points: 0 };

    // --- Final Event Object Construction ---
    const driverEvent = {
      id: `EVENT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      driverName,
      fleetNumber,
      eventDate: eventDate || new Date().toISOString().split('T')[0],
      eventTime: eventTime || new Date().toTimeString().split(' ')[0].substring(0, 5),
      eventType: mappedEventType,
      description: `${mappedEventType.replace(/_/g, ' ')} event detected for ${fleetNumber}`,
      location,
      severity: rules.severity,
      reportedBy: "Google Sheets Integration",
      reportedAt: new Date().toISOString(),
      status: "pending",
      actionTaken: "",
      points: rules.points,
      serialNumber,
      latitude,
      longitude,
      date: new Date().toISOString()
    };

    // --- Write to Supabase ---
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