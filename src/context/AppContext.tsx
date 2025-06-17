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
import { generateTripId, shouldAutoCompleteTrip, isOnline } from "../utils/helpers";
import {
  dieselCollection,
  driverBehaviorCollection,
  listenToDieselRecords,
  listenToDriverBehaviorEvents,
  addDieselToFirebase,
  updateDieselInFirebase,
  deleteDieselFromFirebase,
  addDriverBehaviorEventToFirebase,
  updateDriverBehaviorEventToFirebase,
  deleteDriverBehaviorEventToFirebase
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
  addDriverBehaviorEvent: (event: Omit<DriverBehaviorEvent, 'id'>) => Promise<void>;
  updateDriverBehaviorEvent: (event: DriverBehaviorEvent) => Promise<void>;
  deleteDriverBehaviorEvent: (id: string) => Promise<void>;

  // System Cost Rates (following centralized context pattern)
  systemCostRates: Record<'USD' | 'ZAR', SystemCostRates>;
  updateSystemCostRates: (currency: 'USD' | 'ZAR', rates: SystemCostRates) => void;

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
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [carReports, setCARReports] = useState<CARReport[]>([]);
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

    return () => {
      tripsUnsub();
      missedLoadsUnsub();
      dieselUnsub();
      driverBehaviorUnsub();
      // Unsubscribe other listeners similarly
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
    const docRef = await addDoc(collection(db, "trips"), trip);
    return docRef.id;
  };

  const updateTripInFirebase = async (id: string, trip: Trip) => {
    const docRef = doc(db, "trips", id);
    await updateDoc(docRef, trip);
  };

  const deleteTripFromFirebase = async (id: string) => {
    const docRef = doc(db, "trips", id);
    await deleteDoc(docRef);
  };

  // Your existing methods now updated to async and use Firestore below:

  const addTrip = async (tripData: Omit<Trip, 'id' | 'costs' | 'status'>): Promise<string> => {
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
    const tripDocRef = doc(db, "trips", updatedTrip.id);
    await updateDoc(tripDocRef, updatedTrip);
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
    const attachments: Attachment[] = files
      ? Array.from(files).map((file, index) => ({
          id: `A${Date.now()}-${index}`,
          costEntryId: newId,
          filename: file.name,
          fileUrl: URL.createObjectURL(file),
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          fileData: "",
        }))
      : [];

    const newCostEntry: CostEntry = {
      ...costEntryData,
      id: newId,
      attachments,
    };

    const trip = trips.find((t) => t.id === tripId);
    if (!trip) throw new Error("Trip not found");

    const updatedCosts = [...(trip.costs || []), newCostEntry];
    const tripDocRef = doc(db, "trips", tripId);

    await updateDoc(tripDocRef, { costs: updatedCosts });

    return newId;
  };

  const updateCostEntry = async (updatedCostEntry: CostEntry): Promise<void> => {
    const trip = trips.find(t => t.id === updatedCostEntry.tripId);
    if (!trip) throw new Error("Trip not found");

    const updatedCosts = trip.costs.map(cost => cost.id === updatedCostEntry.id ? updatedCostEntry : cost);
    const tripDocRef = doc(db, "trips", updatedCostEntry.tripId);
    await updateDoc(tripDocRef, { costs: updatedCosts });
  };

  const deleteCostEntry = async (costEntryId: string): Promise<void> => {
    const trip = trips.find(t => t.costs.some(c => c.id === costEntryId));
    if (!trip) throw new Error("Trip not found");
    const updatedCosts = trip.costs.filter(c => c.id !== costEntryId);
    const tripDocRef = doc(db, "trips", trip.id);
    await updateDoc(tripDocRef, { costs: updatedCosts });
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

    const tripDocRef = doc(db, "trips", tripId);
    await updateDoc(tripDocRef, {
      status: "completed",
      completedAt: new Date().toISOString(),
      completedBy: "User", // Replace with real user info
    });
  };

  // Missed Loads Handlers (following uniform handler pattern)
  const addMissedLoad = async (missedLoadData: Omit<MissedLoad, "id">): Promise<string> => {
    const docRef = await addDoc(collection(db, "missedLoads"), missedLoadData);
    return docRef.id;
  };

  const updateMissedLoad = async (missedLoad: MissedLoad): Promise<void> => {
    const docRef = doc(db, "missedLoads", missedLoad.id);
    await updateDoc(docRef, missedLoad);
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
  const addDriverBehaviorEvent = async (event: Omit<DriverBehaviorEvent, 'id'>) => {
    await addDriverBehaviorEventToFirebase(event);
  };
  const updateDriverBehaviorEvent = async (event: DriverBehaviorEvent) => {
    await updateDriverBehaviorEventToFirebase(event.id, event);
  };
  const deleteDriverBehaviorEvent = async (id: string) => {
    await deleteDriverBehaviorEventToFirebase(id);
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
    systemCostRates,
    updateSystemCostRates,
    connectionStatus: "connected",
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
