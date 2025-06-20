// ─── Driver Behavior Integration with Google Sheets ───────────────────────────────

import { DriverBehaviorEvent, DriverBehaviorEventType } from '../types';
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

export const IGNORED_EVENTS = ["jolt", "acc_on", "acc_off", "smoking", "unknown"];

// Store processed event fingerprints to avoid duplicates
const processedEvents = new Set<string>();

// Store processed row IDs to avoid duplicates
const processedRowIds = new Set<number>();

// -------------------- Utility Functions --------------------
export function parseDate(dateStr: string): string {
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

// Generate a unique fingerprint for an event to avoid duplicates
function generateEventFingerprint(event: any): string {
  const fields = [
    event.driverName || '',
    event.fleetNumber || '',
    event.eventDate || '',
    event.eventTime || '',
    event.eventType || '',
    event.description || ''
  ];
  return fields.join('|');
}

// Check if we've already processed this event
function isEventProcessed(event: any): boolean {
  // Check by row ID first if available
  if (event.rowId && event.rowId > 0) {
    if (processedRowIds.has(event.rowId)) {
      console.log(`Event already processed by row ID: ${event.rowId}`);
      return true;
    }
    
    // Add to processed row IDs
    processedRowIds.add(event.rowId);
  }
  
  // Also check by fingerprint as a backup
  const fingerprint = generateEventFingerprint(event);
  if (processedEvents.has(fingerprint)) {
    console.log(`Event already processed by fingerprint: ${fingerprint}`);
    return true;
  }
  
  // Add to processed events
  processedEvents.add(fingerprint);
  
  // Limit the size of the sets to prevent memory leaks
  if (processedEvents.size > 1000) {
    // Remove the oldest entries (first 200)
    const iterator = processedEvents.values();
    for (let i = 0; i < 200; i++) {
      processedEvents.delete(iterator.next().value);
    }
  }
  
  if (processedRowIds.size > 1000) {
    // Remove the oldest entries (first 200)
    const iterator = processedRowIds.values();
    for (let i = 0; i < 200; i++) {
      processedRowIds.delete(iterator.next().value);
    }
  }
  
  return false;
}

// -------------------- Main Function --------------------
export async function fetchAndSaveDriverEvents() {
  try {
    // Use a timestamp parameter to avoid caching
    const timestamp = Date.now();
    const scriptUrl = "https://script.google.com/macros/s/AKfycbw5_oPDd7wVIEOxf9rY6wKqUN1aNFuVqGrPl83Z2YKygZiHftyUxU-_sV4Wu_vY1h1vSg/exec";
    const url = `${scriptUrl}?t=${timestamp}`;
    
    console.log("Fetching driver events from:", url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
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
    
    // Track how many new events we processed
    let newEventsCount = 0;
    
    // Process each event
    for (const eventData of events) {
      // Skip if eventType is UNKNOWN
      const eventType = (eventData.eventType || "").toString().trim();
      if (!eventType || eventType.toUpperCase() === "UNKNOWN") {
        console.log("Skipping UNKNOWN event type");
        continue;
      }
      
      // Skip ignored event types
      const rawEventType = eventType.toLowerCase();
      if (IGNORED_EVENTS.includes(rawEventType)) {
        console.log("Ignored event type:", rawEventType);
        continue;
      }
      
      // Skip if we've already processed this event
      if (isEventProcessed(eventData)) {
        console.log("Skipping already processed event:", eventData.eventType, eventData.driverName);
        continue;
      }

      // Process the event data from the "Data" sheet format
      const processedEvent = processEventFromDataSheet(eventData);
      
      if (processedEvent) {
        // Save to Firestore
        await addDriverBehaviorEvent(processedEvent);
        console.log("New driver event saved:", processedEvent);
        newEventsCount++;
      }
    }
    
    console.log(`Processed ${newEventsCount} new driver events out of ${events.length} total events`);
    return newEventsCount;
  } catch (error) {
    console.error("Error fetching and saving driver events:", error);
    return null;
  }
}

// Process event data from the "Data" sheet format
function processEventFromDataSheet(eventData: any): Omit<DriverBehaviorEvent, 'id'> | null {
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
    let mappedEventType: DriverBehaviorEventType = "other";
    const normalizedEventType = rawEventType.replace(/\s+/g, '_').toLowerCase();
    
    // Try to find a matching event type
    for (const [key, value] of Object.entries(eventTypeMap)) {
      if (normalizedEventType.includes(key)) {
        mappedEventType = value as DriverBehaviorEventType;
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
    
    // Create the driver behavior event
    const driverEvent: Omit<DriverBehaviorEvent, 'id'> = {
      driverName: eventData.driverName || "Unknown",
      fleetNumber: eventData.fleetNumber || "Unknown",
      eventDate: parseDate(eventData.eventDate),
      eventTime: eventData.eventTime || "00:00",
      eventType: mappedEventType,
      description: eventData.description || `${eventData.eventType} event detected for ${eventData.driverName}`,
      location: eventData.location || "",
      severity: severity as any,
      reportedBy: "Google Sheets Integration",
      reportedAt: eventData.reportedAt ? new Date(eventData.reportedAt).toISOString() : new Date().toISOString(),
      status: "pending" as any,
      actionTaken: "",
      points: points,
      date: new Date().toISOString(),
      resolved: false,
      serialNumber: eventData.serialNumber,
      latitude: eventData.latitude,
      longitude: eventData.longitude
    };
    
    return driverEvent;
  } catch (error) {
    console.error("Error processing event data:", error);
    return null;
  }
}

// Function to periodically fetch and process driver events
let pollingIntervalId: number | null = null;

export function startDriverEventPolling(intervalMs = 60000) {
  console.log("Starting driver event polling...");
  
  // Stop any existing polling
  if (pollingIntervalId) {
    stopDriverEventPolling(pollingIntervalId);
  }
  
  // Initial fetch
  fetchAndSaveDriverEvents().catch(console.error);
  
  // Set up interval for subsequent fetches
  const intervalId = window.setInterval(() => {
    fetchAndSaveDriverEvents().catch(console.error);
  }, intervalMs);
  
  pollingIntervalId = intervalId;
  
  // Return the interval ID so it can be cleared if needed
  return intervalId;
}

// Function to stop polling
export function stopDriverEventPolling(intervalId: number | null) {
  if (intervalId) {
    window.clearInterval(intervalId);
    console.log("Driver event polling stopped");
    pollingIntervalId = null;
  }
}