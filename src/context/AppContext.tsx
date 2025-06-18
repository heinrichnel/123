import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Trip,
  CostEntry,
  Attachment,
  AdditionalCost,
  DelayReason,
  MissedLoad,
  DieselConsumptionRecord,
  DriverBehaviorEvent,
  DriverPerformance,
  ActionItem,
  CARReport,
  SystemCostRates,
  DEFAULT_SYSTEM_COST_RATES,
} from "../types/index";
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
  enableNetwork,
  disableNetwork,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { generateTripId, shouldAutoCompleteTrip, isOnline, cleanObjectForFirestore } from "../utils/helpers";
import {
  dieselCollection,
  driverBehaviorCollection,
  carReportsCollection,
  listenToDieselRecords,
  listenToDriverBehaviorEvents,
  listenToCARReports,
  addDieselToFirebase,
  updateDieselInFirebase,
  deleteDieselFromFirebase,
  addDriverBehaviorEventToFirebase,
  updateDriverBehaviorEventToFirebase,
  deleteDriverBehaviorEventToFirebase,
  addCARReportToFirebase,
  updateCARReportInFirebase,
  deleteCARReportFromFirebase
} from '../firebase';

interface AppContextType {
  trips: Trip[];
  addTrip: (trip: Omit<Trip, "id" | "costs" | "status">) => Promise<string>;
  updateTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  getTrip: (id: string) => Trip | undefined;

  addCostEntry: (
    tripId: string,
    costEntry: Omit<CostEntry, "id" | "attachments">,
    files?: FileList
  ) => Promise<string>;
  updateCostEntry: (costEntry: CostEntry) => Promise<void>;
  deleteCostEntry: (id: string) => Promise<void>;

  completeTrip: (tripId: string) => Promise<void>;

  // Missed Loads (following centralized context pattern)
  missedLoads: MissedLoad[];
  addMissedLoad: (missedLoad: Omit<MissedLoad, "id">) => Promise<string>;
  updateMissedLoad: (missedLoad: MissedLoad) => Promise<void>;
  deleteMissedLoad: (id: string) => Promise<void>;

  // Diesel
  dieselRecords: DieselConsumptionRecord[];
  addDieselRecord: (record: DieselConsumptionRecord) => Promise<void>;
  updateDieselRecord: (record: DieselConsumptionRecord) => Promise<void>;
  deleteDieselRecord: (id: string) => Promise<void>;

  // Driver Behavior Events
  driverBehaviorEvents: DriverBehaviorEvent[];
  addDriverBehaviorEvent: (event: Omit<DriverBehaviorEvent, 'id'>, files?: FileList) => Promise<void>;
  updateDriverBehaviorEvent: (event: DriverBehaviorEvent) => Promise<void>;
  deleteDriverBehaviorEvent: (id: string) => Promise<void>;

  // Driver Performance
  getAllDriversPerformance: () => DriverPerformance[];

  // CAR Reports
  carReports: CARReport[];
  addCARReport: (report: Omit<CARReport, 'id'>, files?: FileList) => Promise<void>;
  updateCARReport: (report: CARReport, files?: FileList) => Promise<void>;
  deleteCARReport: (id: string) => Promise<void>;

  // System Cost Rates (following centralized context pattern)
  systemCostRates: Record<'USD' | 'ZAR', SystemCostRates>;
  updateSystemCostRates: (currency: 'USD' | 'ZAR', rates: SystemCostRates) => void;

  // Action Items
  actionItems: ActionItem[];
  addActionItem: (item: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<string>;
  updateActionItem: (item: ActionItem) => Promise<void>;
  deleteActionItem: (id: string) => Promise<void>;
  addActionItemComment: (itemId: string, comment: string) => Promise<void>;

  connectionStatus: "connected" | "disconnected" | "reconnecting";
  isOnline: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [missedLoads, setMissedLoads] = useState<MissedLoad[]>([]);
  const [dieselRecords, setDieselRecords] = useState<DieselConsumptionRecord[]>([]);
  const [driverBehaviorEvents, setDriverBehaviorEvents] = useState<DriverBehaviorEvent[]>([]);
  const [carReports, setCARReports] = useState<CARReport[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  
  // System Cost Rates (following centralized context pattern)
  const [systemCostRates, setSystemCostRates] = useState<Record<'USD' | 'ZAR', SystemCostRates>>(DEFAULT_SYSTEM_COST_RATES);

  // Firestore realtime listeners setup
  useEffect(() => {
    // Trips realtime sync
    const tripsUnsub = onSnapshot(collection(db, "trips"), (snapshot) => {
      const tripsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Trip[];
      setTrips(tripsData);
    }, (error) => {
      console.error("Trips listener error:", error);
      setConnectionStatus('disconnected');
    });

    // Missed Loads realtime sync (following same pattern)
    const missedLoadsUnsub = onSnapshot(collection(db, "missedLoads"), (snapshot) => {
      const missedLoadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MissedLoad[];
      setMissedLoads(missedLoadsData);
    }, (error) => {
      console.error("Missed loads listener error:", error);
      setConnectionStatus('disconnected');
    });

    // Diesel Records realtime sync
    const dieselUnsub = listenToDieselRecords(dieselCollection, setDieselRecords);
    
    // Driver Behavior Events realtime sync
    const driverBehaviorUnsub = listenToDriverBehaviorEvents(driverBehaviorCollection, setDriverBehaviorEvents);

    // CAR Reports realtime sync
    const carReportsUnsub = listenToCARReports(carReportsCollection, setCARReports);

    // Action Items realtime sync
    const actionItemsUnsub = onSnapshot(collection(db, 'actionItems'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ActionItem[];
      setActionItems(items);
    }, (error) => {
      console.error("Action items listener error:", error);
      setConnectionStatus('disconnected');
    });

    return () => {
      tripsUnsub();
      missedLoadsUnsub();
      dieselUnsub();
      driverBehaviorUnsub();
      carReportsUnsub();
      actionItemsUnsub();
    };
  }, []);

  // Online/offline status monitor
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('reconnecting');
      enableNetwork(db)
        .then(() => setConnectionStatus('connected'))
        .catch(() => setConnectionStatus('disconnected'));
    };
    const handleOffline = () => {
      setConnectionStatus('disconnected');
      disableNetwork(db).catch(console.error);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Firebase operations for trips
  const addTripToFirebase = async (trip: Trip) => {
    const cleanTrip = cleanObjectForFirestore(trip);
    const docRef = await addDoc(collection(db, "trips"), cleanTrip);
    return docRef.id;
  };

  const updateTripInFirebase = async (id: string, trip: Trip) => {
    const cleanTrip = cleanObjectForFirestore(trip);
    const docRef = doc(db, "trips", id);
    await updateDoc(docRef, cleanTrip);
  };

  const deleteTripFromFirebase = async (id: string) => {
    const docRef = doc(db, "trips", id);
    await deleteDoc(docRef);
  };

  // Your existing methods now updated to async and use Firestore below:

  const addTrip = async (tripData: Omit<Trip, 'id' | 'costs' | 'status'>): Promise<string> => {
    // Backend validation for End Date
    if (!tripData.endDate) {
      throw new Error('End Date is required');
    }
    if (tripData.startDate && tripData.endDate < tripData.startDate) {
      throw new Error('End Date cannot be earlier than Start Date');
    }
    const newId = generateTripId();
    const newTrip: Trip = {
      ...tripData,
      id: newId,
      costs: [],
      status: 'active',
      paymentStatus: 'unpaid',
      additionalCosts: [],
      delayReasons: [],
      followUpHistory: [],
      clientType: tripData.clientType || 'external',
    };
    await addTripToFirebase(newTrip);
    return newId;
  };

  const updateTrip = async (updatedTrip: Trip): Promise<void> => {
    const cleanTrip = cleanObjectForFirestore(updatedTrip);
    const tripDocRef = doc(db, "trips", updatedTrip.id);
    await updateDoc(tripDocRef, cleanTrip);
  };

  const deleteTrip = async (id: string): Promise<void> => {
    // Implement delete logic if needed
  };

  const getTrip = (id: string): Trip | undefined => {
    return trips.find(trip => trip.id === id);
  };

  // Cost Entry Firestore update helpers:

  const addCostEntry = async (
    tripId: string,
    costEntryData: Omit<CostEntry, "id" | "attachments">,
    files?: FileList
  ): Promise<string> => {
    const newId = `C${Date.now()}`;
    const currentTime = new Date().toISOString();
    
    const attachments: Attachment[] = files
      ? Array.from(files).map((file, index) => ({
          id: `A${Date.now()}-${index}`,
          costEntryId: newId,
          filename: file.name,
          fileUrl: URL.createObjectURL(file),
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: currentTime,
          fileData: "",
        }))
      : [];

    const newCostEntry: CostEntry = {
      ...costEntryData,
      id: newId,
      attachments,
      createdAt: currentTime,
      updatedAt: currentTime,
    };

    const trip = trips.find((t) => t.id === tripId);
    if (!trip) throw new Error("Trip not found");

    const updatedCosts = [...(trip.costs || []), newCostEntry];
    const cleanCosts = cleanObjectForFirestore(updatedCosts);
    const tripDocRef = doc(db, "trips", tripId);

    await updateDoc(tripDocRef, { costs: cleanCosts });

    return newId;
  };

  const updateCostEntry = async (updatedCostEntry: CostEntry): Promise<void> => {
    const trip = trips.find(t => t.id === updatedCostEntry.tripId);
    if (!trip) throw new Error("Trip not found");

    const costEntryWithTimestamp = {
      ...updatedCostEntry,
      updatedAt: new Date().toISOString()
    };

    const updatedCosts = trip.costs.map(cost => 
      cost.id === updatedCostEntry.id ? costEntryWithTimestamp : cost
    );
    
    const cleanCosts = cleanObjectForFirestore(updatedCosts);
    const tripDocRef = doc(db, "trips", updatedCostEntry.tripId);
    await updateDoc(tripDocRef, { costs: cleanCosts });
  };

  const deleteCostEntry = async (costEntryId: string): Promise<void> => {
    const trip = trips.find(t => t.costs.some(c => c.id === costEntryId));
    if (!trip) throw new Error("Trip not found");
    const updatedCosts = trip.costs.filter(c => c.id !== costEntryId);
    const cleanCosts = cleanObjectForFirestore(updatedCosts);
    const tripDocRef = doc(db, "trips", trip.id);
    await updateDoc(tripDocRef, { costs: cleanCosts });
  };

  // Complete Trip
  const completeTrip = async (tripId: string): Promise<void> => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) throw new Error("Trip not found");

    const unresolvedFlags = trip.costs?.some(
      (cost) => cost.isFlagged && cost.investigationStatus !== "resolved"
    );
    if (unresolvedFlags) {
      throw new Error(
        "Cannot complete trip: unresolved flagged cost entries present"
      );
    }

    const updateData = cleanObjectForFirestore({
      status: "completed",
      completedAt: new Date().toISOString(),
      completedBy: "User", // Replace with real user info
    });

    const tripDocRef = doc(db, "trips", tripId);
    await updateDoc(tripDocRef, updateData);
  };

  // Missed Loads Handlers (following uniform handler pattern)
  // Helper to sanitize missed load fields for Firestore
  function sanitizeMissedLoad(load: any) {
    return cleanObjectForFirestore({
      ...load,
      compensationNotes: typeof load.compensationNotes === 'string' ? load.compensationNotes : '',
      resolutionNotes: typeof load.resolutionNotes === 'string' ? load.resolutionNotes : '',
      reasonDescription: typeof load.reasonDescription === 'string' ? load.reasonDescription : '',
      // Add more fields as needed
    });
  }

  const addMissedLoad = async (missedLoadData: Omit<MissedLoad, "id">): Promise<string> => {
    const sanitized = sanitizeMissedLoad(missedLoadData);
    const docRef = await addDoc(collection(db, "missedLoads"), sanitized);
    return docRef.id;
  };

  const updateMissedLoad = async (missedLoad: MissedLoad): Promise<void> => {
    const sanitized = sanitizeMissedLoad(missedLoad);
    const docRef = doc(db, "missedLoads", missedLoad.id);
    await updateDoc(docRef, sanitized);
  };

  const deleteMissedLoad = async (id: string): Promise<void> => {
    const docRef = doc(db, "missedLoads", id);
    await deleteDoc(docRef);
  };

  // System Cost Rates Handler (following uniform handler pattern)
  const updateSystemCostRates = (currency: 'USD' | 'ZAR', rates: SystemCostRates): void => {
    setSystemCostRates(prev => ({
      ...prev,
      [currency]: rates,
    }));
    // Note: In a full implementation, you would also save this to Firestore
    // But preserving current calculation methodology as requested
  };

  // Diesel CRUD
  const addDieselRecord = async (record: DieselConsumptionRecord) => {
    await addDieselToFirebase(record);
  };
  const updateDieselRecord = async (record: DieselConsumptionRecord) => {
    await updateDieselInFirebase(record.id, record);
  };
  const deleteDieselRecord = async (id: string) => {
    await deleteDieselFromFirebase(id);
  };

  // Driver Behavior Event CRUD
  const addDriverBehaviorEvent = async (event: Omit<DriverBehaviorEvent, 'id'>, files?: FileList) => {
    await addDriverBehaviorEventToFirebase(event);
  };
  const updateDriverBehaviorEvent = async (event: DriverBehaviorEvent) => {
    await updateDriverBehaviorEventToFirebase(event.id, event);
  };
  const deleteDriverBehaviorEvent = async (id: string) => {
    await deleteDriverBehaviorEventToFirebase(id);
  };

  // CAR Report CRUD
  const addCARReport = async (report: Omit<CARReport, 'id'>, files?: FileList) => {
    await addCARReportToFirebase(report);
  };
  const updateCARReport = async (report: CARReport, files?: FileList) => {
    await updateCARReportInFirebase(report.id, report);
  };
  const deleteCARReport = async (id: string) => {
    await deleteCARReportFromFirebase(id);
  };

  // Driver Performance Analytics
  const getAllDriversPerformance = (): DriverPerformance[] => {
    // Group events by driver
    const driverEventMap = new Map<string, DriverBehaviorEvent[]>();
    
    driverBehaviorEvents.forEach(event => {
      const key = `${event.driverName}-${event.fleetNumber}`;
      if (!driverEventMap.has(key)) {
        driverEventMap.set(key, []);
      }
      driverEventMap.get(key)!.push(event);
    });

    // Calculate performance metrics for each driver
    const performanceData: DriverPerformance[] = [];

    driverEventMap.forEach((events, driverKey) => {
      const [driverName, fleetNumber] = driverKey.split('-');
      
      const totalEvents = events.length;
      const resolvedEvents = events.filter(e => e.resolved).length;
      const pendingEvents = totalEvents - resolvedEvents;

      // Calculate average resolution time
      const resolvedEventsWithTime = events.filter(e => e.resolved && e.resolvedAt && e.date);
      let averageResolutionTime = 0;
      
      if (resolvedEventsWithTime.length > 0) {
        const totalResolutionTime = resolvedEventsWithTime.reduce((sum, event) => {
          const eventDate = new Date(event.date);
          const resolvedDate = new Date(event.resolvedAt!);
          const diffTime = resolvedDate.getTime() - eventDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }, 0);
        averageResolutionTime = totalResolutionTime / resolvedEventsWithTime.length;
      }

      // Group events by type
      const eventsByType: Record<string, number> = {};
      events.forEach(event => {
        eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      });

      // Group events by severity
      const eventsBySeverity: Record<string, number> = {
        low: 0,
        medium: 0,
        high: 0
      };
      events.forEach(event => {
        const severity = event.severity || 'medium';
        eventsBySeverity[severity] = (eventsBySeverity[severity] || 0) + 1;
      });

      // Calculate performance score (0-100)
      let performanceScore = 100;
      
      // Deduct points based on unresolved events
      performanceScore -= pendingEvents * 5;
      
      // Deduct points based on high severity events
      performanceScore -= (eventsBySeverity.high || 0) * 10;
      performanceScore -= (eventsBySeverity.medium || 0) * 5;
      performanceScore -= (eventsBySeverity.low || 0) * 2;
      
      // Bonus for quick resolution
      if (averageResolutionTime > 0 && averageResolutionTime <= 3) {
        performanceScore += 10;
      } else if (averageResolutionTime > 7) {
        performanceScore -= 5;
      }

      // Ensure score is between 0 and 100
      performanceScore = Math.max(0, Math.min(100, performanceScore));

      // Determine improvement trend (simplified logic)
      const recentEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return eventDate >= thirtyDaysAgo;
      });

      const olderEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        return eventDate >= sixtyDaysAgo && eventDate < thirtyDaysAgo;
      });

      let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (recentEvents.length < olderEvents.length) {
        improvementTrend = 'improving';
      } else if (recentEvents.length > olderEvents.length) {
        improvementTrend = 'declining';
      }

      // Get last event date
      const lastEventDate = events.length > 0 
        ? events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : undefined;

      performanceData.push({
        driverName,
        fleetNumber,
        totalEvents,
        resolvedEvents,
        pendingEvents,
        averageResolutionTime,
        eventsByType,
        eventsBySeverity,
        performanceScore,
        lastEventDate,
        improvementTrend,
        behaviorScore: performanceScore // Add this for compatibility
      });
    });

    return performanceData.sort((a, b) => b.performanceScore - a.performanceScore);
  };

  // Action Items CRUD (Firestore)
  const addActionItem = async (itemData: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const cleanData = cleanObjectForFirestore({
      ...itemData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Current User', // Replace with real user info
    });
    const docRef = await addDoc(collection(db, 'actionItems'), cleanData);
    return docRef.id;
  };

  const updateActionItem = async (item: ActionItem) => {
    const cleanData = cleanObjectForFirestore({
      ...item,
      updatedAt: new Date().toISOString(),
    });
    const docRef = doc(db, 'actionItems', item.id);
    await updateDoc(docRef, cleanData);
  };

  const deleteActionItem = async (id: string) => {
    const docRef = doc(db, 'actionItems', id);
    await deleteDoc(docRef);
  };

  // Add comment to action item
  const addActionItemComment = async (itemId: string, comment: string) => {
    const item = actionItems.find(i => i.id === itemId);
    if (!item) throw new Error("Action item not found");
    
    const newComment = {
      id: `comment-${Date.now()}`,
      comment,
      createdAt: new Date().toISOString(),
      createdBy: 'Current User' // Replace with real user info
    };
    
    const updatedItem = {
      ...item,
      comments: [...(item.comments || []), newComment],
      updatedAt: new Date().toISOString()
    };
    
    await updateActionItem(updatedItem);
  };

  const contextValue: AppContextType = {
    trips,
    addTrip,
    updateTrip,
    deleteTrip,
    getTrip: (id: string) => trips.find((trip) => trip.id === id),
    addCostEntry,
    updateCostEntry,
    deleteCostEntry,
    completeTrip,
    missedLoads,
    addMissedLoad,
    updateMissedLoad,
    deleteMissedLoad,
    dieselRecords,
    addDieselRecord,
    updateDieselRecord,
    deleteDieselRecord,
    driverBehaviorEvents,
    addDriverBehaviorEvent,
    updateDriverBehaviorEvent,
    deleteDriverBehaviorEvent,
    carReports,
    addCARReport,
    updateCARReport,
    deleteCARReport,
    getAllDriversPerformance,
    systemCostRates,
    updateSystemCostRates,
    actionItems,
    addActionItem,
    updateActionItem,
    deleteActionItem,
    addActionItemComment,
    connectionStatus,
    isOnline: isOnline(),
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within an AppProvider");
  return context;
};