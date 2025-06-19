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
  "seatbelt_violation": "seatbelt_violation",
  "cell_phone_use_beep": "phone_usage",
  "fatigue_alert": "fatigue_alert",
  "harsh_braking": "harsh_braking",
  "speedlimit": "speeding",
  "lane_weaving": "lane_weaving",
  "distracted_driver_beep": "distracted",
  "Harsh Acceleration": "harsh_acceleration",
  "Seatbelt Violation": "seatbelt_violation",
  "Fatigue Alert": "fatigue_alert",
  "Harsh Braking": "harsh_braking",
  "SpeedLimit": "speeding",
  "Lane Weaving": "lane_weaving",
  "Distracted": "distracted",
  "Passenger": "passenger",
  "Tailgating": "tailgating",
  "Obstruction": "obstruction",
  "Wrong PIN Code": "wrong_pin_code",
  "Violent Left Turn": "violent_left_turn",
  "Violent Right Turn": "violent_right_turn",
  "De-Acceleration": "de_acceleration",
  "Acceleration": "acceleration",
  "Button Pressed": "button_pressed",
  "Smoking": "smoking",
  "Tamper": "tamper",
  "Accident": "accident"
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
  "smoking": { severity: "medium", points: 4 },
  "tamper": { severity: "high", points: 8 },
  "accident": { severity: "critical", points: 50 }
};

export const IGNORED_EVENTS = ["jolt", "acc_on", "acc_off"];

// -------------------- Utility Functions --------------------
export function splitDateTime(dateTimeStr: string): { date: string, time: string } {
  if (!dateTimeStr) return { date: "", time: "" };
  
  try {
    const [date, time] = dateTimeStr.split(' ');
    return {
      date: date ? date.replace(/-/g, '/') : "",
      time: time ? time.substring(0, 5) : ""
    };
  } catch (error) {
    console.error("Error splitting date time:", error);
    return { date: "", time: "" };
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

    // --- Raw event type extraction & filtering ---
    const rawEventType = (data.eventType || data["Event Type"] || "").toString().trim().toLowerCase();
    if (IGNORED_EVENTS.includes(rawEventType)) {
      console.log("Ignored event type:", rawEventType);
      return;
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
    const driverEvent: Omit<DriverBehaviorEvent, 'id'> = {
      driverName,
      fleetNumber,
      eventDate: eventDate || new Date().toISOString().split('T')[0],
      eventTime: eventTime || new Date().toTimeString().split(' ')[0].substring(0, 5),
      eventType: mappedEventType as any,
      description: `${mappedEventType.replace(/_/g, ' ')} event detected for ${fleetNumber}`,
      location,
      severity: rules.severity as any,
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

    // --- Write to Firestore ---
    await addDriverBehaviorEvent(driverEvent);
    console.log("Driver event saved:", driverEvent);
    
    return driverEvent;
  } catch (error) {
    console.error("Error fetching and saving driver event:", error);
    throw error;
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