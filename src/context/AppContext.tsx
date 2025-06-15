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
} from "../types/index";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
import { db } from "../firebase"; // adjust path if needed
import { generateTripId, shouldAutoCompleteTrip, isOnline } from "../utils/helpers";

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

    // TODO: Add other listeners for missedLoads, dieselRecords, etc., same pattern

    return () => {
      tripsUnsub();
      // Unsubscribe other listeners similarly
    };
  }, []);

  // Online/offline status monitor
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('reconnecting');
      enableFirestoreNetwork()
        .then(() => setConnectionStatus('connected'))
        .catch(() => setConnectionStatus('disconnected'));
    };
    const handleOffline = () => {
      setConnectionStatus('disconnected');
      disableFirestoreNetwork().catch(console.error);
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
