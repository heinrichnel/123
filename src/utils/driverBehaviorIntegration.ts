// ─── Driver Behavior Integration with Google Sheets ───────────────────────────────

import { DriverBehaviorEvent } from '../types';
import { addDriverBehaviorEvent } from '../firebase';

// -------------------- Mapping Configuration --------------------
export const fleetMap: Record<string, string> = {
  "357660104031745": "23H",
  "357660105416796": "24H",
  "357660105442362": "28H",
  "357660104031307": "31H",
  "357660104031711": "33H"
};

export const driverMap: Record<string, string> = {
  "23H": "Phillimon Kwarire",
  "24H": "Taurayi Vherenaisi",
  "28H": "Adrian Moyo",
  "31H": "Enock Mukonyerwa",
  "33H": "Canaan Chipfurutse"
};

export const eventTypeMap: Record<string, string> = {
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

export const eventRules: Record<string, { severity: string; points: number }> = {
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

export const IGNORED_EVENTS = ["jolt", "acc_on", "acc_off", "smoking"];

// -------------------- Utility Functions --------------------
export function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  try {
    // Check if the date is in YYYY/MM/DD format
    if (dateStr.includes('/')) {
      const [year, month, day] = dateStr.split('/');
      // Convert to YYYY-MM-DD format
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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

// -------------------- Main Function --------------------
export async function fetchAndSaveDriverEventToFirestore() {
  try {
    // Use the exact URL you provided
    const endpointUrl = "https://script.google.com/macros/s/AKfycbwwQKS1kTxxPJuI1b_wAFL7lzgJ3sTVL1hx7OKNu2el8_DmW_V--owrq2tOUKHm9vsYRQ/exec";
    
    console.log("Fetching driver events from:", endpointUrl);
    const response = await fetch(endpointUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Received data:", data);

    // Check if we have a valid response with data
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.log("No new driver events to process");
      return null;
    }

    // Handle both single event and array of events
    const events = Array.isArray(data) ? data : [data];
    
    // Process each event
    for (const eventData of events) {
      // Skip ignored event types
      if (IGNORED_EVENTS.includes(eventData.eventType?.toLowerCase())) {
        console.log("Ignored event type:", eventData.eventType);
        continue;
      }

      // Create driver behavior event object
      const driverEvent: Omit<DriverBehaviorEvent, 'id'> = {
        driverName: eventData.driverName || "Unknown",
        fleetNumber: eventData.fleetNumber || "Unknown",
        eventDate: parseDate(eventData.eventDate),
        eventTime: eventData.eventTime || "00:00",
        eventType: (eventData.eventType?.toLowerCase() || "other") as any,
        description: eventData.description || `${eventData.eventType} event detected`,
        location: eventData.location || "",
        severity: (eventData.severity?.toLowerCase() || "medium") as any,
        reportedBy: "Google Sheets Integration",
        reportedAt: new Date().toISOString(),
        status: "pending" as any,
        actionTaken: "",
        points: eventData.points || 0,
        date: new Date().toISOString(),
        resolved: false
      };

      // Save to Firestore
      await addDriverBehaviorEvent(driverEvent);
      console.log("Driver event saved:", driverEvent);
    }
    
    return events.length;
  } catch (error) {
    console.error("Error fetching and saving driver event:", error);
    return null;
  }
}

// Function to periodically fetch and process driver events
export function startDriverEventPolling(intervalMs = 60000) {
  console.log("Starting driver event polling...");
  
  // Initial fetch
  fetchAndSaveDriverEventToFirestore().catch(console.error);
  
  // Set up interval for subsequent fetches
  const intervalId = setInterval(() => {
    fetchAndSaveDriverEventToFirestore().catch(console.error);
  }, intervalMs);
  
  // Return the interval ID so it can be cleared if needed
  return intervalId;
}

// Function to stop polling
export function stopDriverEventPolling(intervalId: number) {
  if (intervalId) {
    clearInterval(intervalId);
    console.log("Driver event polling stopped");
  }
}