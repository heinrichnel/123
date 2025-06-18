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
  addTrip: (trip: Omit<Trip, "id" | "costs" | "status">) => string;
  updateTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  getTrip: (id: string) => Trip | undefined;

  addCostEntry: (
    tripId: string,
    costEntry: Omit<CostEntry, "id" | "attachments">,
    files?: FileList
  ) => string;
  updateCostEntry: (costEntry: CostEntry) => Promise<void>;
  deleteCostEntry: (id: string) => Promise<void>;

  completeTrip: (tripId: string) => Promise<void>;

  // Additional cost management
  addAdditionalCost: (tripId: string, cost: Omit<AdditionalCost, "id">, files?: FileList) => string;
  removeAdditionalCost: (tripId: string, costId: string) => void;

  // Delay reasons
  addDelayReason: (tripId: string, delay: Omit<DelayReason, "id">) => string;

  // Invoice payment management
  updateInvoicePayment: (tripId: string, paymentData: {
    paymentStatus: 'unpaid' | 'partial' | 'paid';
    paymentAmount?: number;
    paymentReceivedDate?: string;
    paymentNotes?: string;
    paymentMethod?: string;
    bankReference?: string;
  }) => Promise<void>;

  // Import functionality
  importTripsFromCSV: (trips: any[]) => Promise<void>;

  // Missed Loads (following centralized context pattern)
  missedLoads: MissedLoad[];
  addMissedLoad: (missedLoad: Omit<MissedLoad, "id">) => string;
  updateMissedLoad: (missedLoad: MissedLoad) => Promise<void>;
  deleteMissedLoad: (id: string) => Promise<void>;

  // Diesel
  dieselRecords: DieselConsumptionRecord[];
  addDieselRecord: (record: DieselConsumptionRecord) => Promise<void>;
  updateDieselRecord: (record: DieselConsumptionRecord) => Promise<void>;
  deleteDieselRecord: (id: string) => Promise<void>;
  allocateDieselToTrip: (dieselId: string, tripId: string) => Promise<void>;
  removeDieselFromTrip: (dieselId: string) => Promise<void>;

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
  addActionItem: (item: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => string;
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

  const addTrip = (tripData: Omit<Trip, 'id' | 'costs' | 'status'>): string => {
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
    
    // Add to local state immediately for better UX
    setTrips(prev => [...prev, newTrip]);
    
    // Then add to Firebase (fire and forget)
    addTripToFirebase(newTrip).catch(err => {
      console.error("Error adding trip to Firebase:", err);
      // Could revert local state here if needed
    });
    
    return newId;
  };

  const updateTrip = async (updatedTrip: Trip): Promise<void> => {
    const cleanTrip = cleanObjectForFirestore(updatedTrip);
    
    // Update local state immediately
    setTrips(prev => 
      prev.map(trip => trip.id === updatedTrip.id ? updatedTrip : trip)
    );
    
    // Then update in Firebase
    const tripDocRef = doc(db, "trips", updatedTrip.id);
    await updateDoc(tripDocRef, cleanTrip);
  };

  const deleteTrip = async (id: string): Promise<void> => {
    // Update local state immediately
    setTrips(prev => prev.filter(trip => trip.id !== id));
    
    // Then delete from Firebase
    await deleteTripFromFirebase(id);
  };

  const getTrip = (id: string): Trip | undefined => {
    return trips.find(trip => trip.id === id);
  };

  // Cost Entry Firestore update helpers:

  const addCostEntry = (
    tripId: string,
    costEntryData: Omit<CostEntry, "id" | "attachments">,
    files?: FileList
  ): string => {
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
      tripId, // Ensure tripId is set
      attachments,
      createdAt: currentTime,
      updatedAt: currentTime,
    };

    const trip = trips.find((t) => t.id === tripId);
    if (!trip) throw new Error("Trip not found");

    const updatedCosts = [...(trip.costs || []), newCostEntry];
    const cleanCosts = cleanObjectForFirestore(updatedCosts);
    
    // Update local state immediately
    setTrips(prev => 
      prev.map(t => t.id === tripId ? {...t, costs: updatedCosts} : t)
    );
    
    // Then update in Firebase
    const tripDocRef = doc(db, "trips", tripId);
    updateDoc(tripDocRef, { costs: cleanCosts }).catch(err => {
      console.error("Error updating costs in Firebase:", err);
      // Could revert local state here if needed
    });

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
    
    // Update local state immediately
    setTrips(prev => 
      prev.map(t => t.id === trip.id ? {...t, costs: updatedCosts} : t)
    );
    
    // Then update in Firebase
    const tripDocRef = doc(db, "trips", updatedCostEntry.tripId);
    await updateDoc(tripDocRef, { costs: cleanCosts });
  };

  const deleteCostEntry = async (costEntryId: string): Promise<void> => {
    const trip = trips.find(t => t.costs && t.costs.some(c => c.id === costEntryId));
    if (!trip) throw new Error("Trip not found");
    
    const updatedCosts = trip.costs.filter(c => c.id !== costEntryId);
    const cleanCosts = cleanObjectForFirestore(updatedCosts);
    
    // Update local state immediately
    setTrips(prev => 
      prev.map(t => t.id === trip.id ? {...t, costs: updatedCosts} : t)
    );
    
    // Then update in Firebase
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

    // Update local state immediately
    setTrips(prev => 
      prev.map(t => t.id === tripId ? {...t, ...updateData} : t)
    );

    // Then update in Firebase
    const tripDocRef = doc(db, "trips", tripId);
    await updateDoc(tripDocRef, updateData);
  };

  // Additional cost management
  const addAdditionalCost = (
    tripId: string,
    costData: Omit<AdditionalCost, "id">,
    files?: FileList
  ): string => {
    const newId = `AC${Date.now()}`;
    
    const supportingDocuments: Attachment[] = files
      ? Array.from(files).map((file, index) => ({
          id: `ACD${Date.now()}-${index}`,
          costEntryId: newId,
          filename: file.name,
          fileUrl: URL.createObjectURL(file),
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          fileData: "",
        }))
      : [];
    
    const newCost: AdditionalCost = {
      ...costData,
      id: newId,
      supportingDocuments
    };
    
    const trip = trips.find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    
    const updatedAdditionalCosts = [...(trip.additionalCosts || []), newCost];
    const cleanAdditionalCosts = cleanObjectForFirestore(updatedAdditionalCosts);
    
    // Update local state immediately
    setTrips(prev => 
      prev.map(t => t.id === tripId ? {...t, additionalCosts: updatedAdditionalCosts} : t)
    );
    
    // Then update in Firebase
    const tripDocRef = doc(db, "trips", tripId);
    updateDoc(tripDocRef, { additionalCosts: cleanAdditionalCosts }).catch(err => {
      console.error("Error updating additional costs in Firebase:", err);
    });
    
    return newId;
  };
  
  const removeAdditionalCost = (tripId: string, costId: string): void => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    
    const updatedAdditionalCosts = trip.additionalCosts.filter(c => c.id !== costId);
    const cleanAdditionalCosts = cleanObjectForFirestore(updatedAdditionalCosts);
    
    // Update local state immediately
    setTrips(prev => 
      prev.map(t => t.id === tripId ? {...t, additionalCosts: updatedAdditionalCosts} : t)
    );
    
    // Then update in Firebase
    const tripDocRef = doc(db, "trips", tripId);
    updateDoc(tripDocRef, { additionalCosts: cleanAdditionalCosts }).catch(err => {
      console.error("Error removing additional cost in Firebase:", err);
    });
  };

  // Delay reasons
  const addDelayReason = (
    tripId: string,
    delayData: Omit<DelayReason, "id">
  ): string => {
    const newId = `DR${Date.now()}`;
    const currentTime = new Date().toISOString();
    
    const newDelay: DelayReason = {
      ...delayData,
      id: newId,
      tripId,
      date: currentTime,
      createdAt: currentTime,
      updatedAt: currentTime
    };
    
    const trip = trips.find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    
    const updatedDelayReasons = [...(trip.delayReasons || []), newDelay];
    const cleanDelayReasons = cleanObjectForFirestore(updatedDelayReasons);
    
    // Update local state immediately
    setTrips(prev => 
      prev.map(t => t.id === tripId ? {...t, delayReasons: updatedDelayReasons} : t)
    );
    
    // Then update in Firebase
    const tripDocRef = doc(db, "trips", tripId);
    updateDoc(tripDocRef, { delayReasons: cleanDelayReasons }).catch(err => {
      console.error("Error adding delay reason in Firebase:", err);
    });
    
    return newId;
  };

  // Invoice payment management
  const updateInvoicePayment = async (
    tripId: string,
    paymentData: {
      paymentStatus: 'unpaid' | 'partial' | 'paid';
      paymentAmount?: number;
      paymentReceivedDate?: string;
      paymentNotes?: string;
      paymentMethod?: string;
      bankReference?: string;
    }
  ): Promise<void> => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    
    const updateData = cleanObjectForFirestore({
      ...paymentData,
      paymentUpdatedAt: new Date().toISOString(),
      paymentUpdatedBy: 'Current User' // In real app, use actual user
    });
    
    // Update local state immediately
    setTrips(prev => 
      prev.map(t => t.id === tripId ? {...t, ...updateData} : t)
    );
    
    // Then update in Firebase
    const tripDocRef = doc(db, "trips", tripId);
    await updateDoc(tripDocRef, updateData);
  };

  // Import functionality
  const importTripsFromCSV = async (tripsData: any[]): Promise<void> => {
    const newTrips = tripsData.map(data => {
      const tripId = generateTripId();
      return {
        ...data,
        id: tripId,
        costs: [],
        status: 'active',
        paymentStatus: 'unpaid',
        additionalCosts: [],
        delayReasons: [],
        followUpHistory: []
      } as Trip;
    });
    
    // Add to local state immediately
    setTrips(prev => [...prev, ...newTrips]);
    
    // Then add to Firebase
    for (const trip of newTrips) {
      try {
        const cleanTrip = cleanObjectForFirestore(trip);
        await addDoc(collection(db, "trips"), cleanTrip);
      } catch (error) {
        console.error("Error importing trip:", error);
      }
    }
  };

  // Diesel allocation
  const allocateDieselToTrip = async (dieselId: string, tripId: string): Promise<void> => {
    const diesel = dieselRecords.find(d => d.id === dieselId);
    if (!diesel) throw new Error("Diesel record not found");
    
    const trip = trips.find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    
    // Update diesel record
    const updatedDiesel = {
      ...diesel,
      tripId
    };
    
    // Update local state immediately
    setDieselRecords(prev => 
      prev.map(d => d.id === dieselId ? updatedDiesel : d)
    );
    
    // Then update in Firebase
    await updateDieselInFirebase(dieselId, updatedDiesel);
    
    // Create cost entry for the diesel
    const costData: Omit<CostEntry, 'id' | 'attachments'> = {
      tripId,
      category: 'Fuel',
      subCategory: 'Diesel',
      amount: diesel.totalCost,
      currency: 'ZAR', // Default, should be from diesel record
      referenceNumber: `FUEL-${diesel.date}-${diesel.fleetNumber}`,
      date: diesel.date,
      notes: `Fuel purchase at ${diesel.fuelStation}. ${diesel.litresFilled}L at ${diesel.costPerLitre}/L.`,
      isFlagged: false,
      isSystemGenerated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    addCostEntry(tripId, costData);
  };
  
  const removeDieselFromTrip = async (dieselId: string): Promise<void> => {
    const diesel = dieselRecords.find(d => d.id === dieselId);
    if (!diesel) throw new Error("Diesel record not found");
    
    if (!diesel.tripId) return; // Nothing to remove
    
    // Find the trip and remove the associated cost entry
    const trip = trips.find(t => t.id === diesel.tripId);
    if (trip) {
      const fuelCostEntry = trip.costs.find(c => 
        c.category === 'Fuel' && 
        c.subCategory === 'Diesel' && 
        c.referenceNumber.includes(diesel.fleetNumber) &&
        c.referenceNumber.includes(diesel.date)
      );
      
      if (fuelCostEntry) {
        await deleteCostEntry(fuelCostEntry.id);
      }
    }
    
    // Update diesel record
    const updatedDiesel = {
      ...diesel,
      tripId: undefined
    };
    
    // Update local state immediately
    setDieselRecords(prev => 
      prev.map(d => d.id === dieselId ? updatedDiesel : d)
    );
    
    // Then update in Firebase
    await updateDieselInFirebase(dieselId, updatedDiesel);
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

  const addMissedLoad = (missedLoadData: Omit<MissedLoad, "id">): string => {
    const newId = `ML${Date.now()}`;
    const sanitized = sanitizeMissedLoad(missedLoadData);
    
    const newMissedLoad = {
      ...sanitized,
      id: newId
    };
    
    // Update local state immediately
    setMissedLoads(prev => [...prev, newMissedLoad as MissedLoad]);
    
    // Then add to Firebase
    addDoc(collection(db, "missedLoads"), sanitized).catch(err => {
      console.error("Error adding missed load to Firebase:", err);
    });
    
    return newId;
  };

  const updateMissedLoad = async (missedLoad: MissedLoad): Promise<void> => {
    const sanitized = sanitizeMissedLoad(missedLoad);
    
    // Update local state immediately
    setMissedLoads(prev => 
      prev.map(ml => ml.id === missedLoad.id ? missedLoad : ml)
    );
    
    // Then update in Firebase
    const docRef = doc(db, "missedLoads", missedLoad.id);
    await updateDoc(docRef, sanitized);
  };

  const deleteMissedLoad = async (id: string): Promise<void> => {
    // Update local state immediately
    setMissedLoads(prev => prev.filter(ml => ml.id !== id));
    
    // Then delete from Firebase
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
    await addDieselToFirebase(cleanObjectForFirestore(record));
  };
  const updateDieselRecord = async (record: DieselConsumptionRecord) => {
    await updateDieselInFirebase(record.id, cleanObjectForFirestore(record));
  };
  const deleteDieselRecord = async (id: string) => {
    await deleteDieselFromFirebase(id);
  };

  // Driver Behavior Event CRUD
  const addDriverBehaviorEvent = async (event: Omit<DriverBehaviorEvent, 'id'>, files?: FileList) => {
    await addDriverBehaviorEventToFirebase(cleanObjectForFirestore(event));
  };
  const updateDriverBehaviorEvent = async (event: DriverBehaviorEvent) => {
    await updateDriverBehaviorEventToFirebase(event.id, cleanObjectForFirestore(event));
  };
  const deleteDriverBehaviorEvent = async (id: string) => {
    await deleteDriverBehaviorEventToFirebase(id);
  };

  // CAR Report CRUD
  const addCARReport = async (report: Omit<CARReport, 'id'>, files?: FileList) => {
    await addCARReportToFirebase(cleanObjectForFirestore(report));
  };
  const updateCARReport = async (report: CARReport, files?: FileList) => {
    await updateCARReportInFirebase(report.id, cleanObjectForFirestore(report));
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
  const addActionItem = (itemData: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): string => {
    const newId = `AI${Date.now()}`;
    const cleanData = cleanObjectForFirestore({
      ...itemData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Current User', // Replace with real user info
    });
    
    // Update local state immediately
    setActionItems(prev => [...prev, cleanData as ActionItem]);
    
    // Then add to Firebase
    addDoc(collection(db, 'actionItems'), cleanData).catch(err => {
      console.error("Error adding action item to Firebase:", err);
    });
    
    return newId;
  };

  const updateActionItem = async (item: ActionItem): Promise<void> => {
    const cleanData = cleanObjectForFirestore({
      ...item,
      updatedAt: new Date().toISOString(),
    });
    
    // Update local state immediately
    setActionItems(prev => 
      prev.map(ai => ai.id === item.id ? item : ai)
    );
    
    // Then update in Firebase
    const docRef = doc(db, 'actionItems', item.id);
    await updateDoc(docRef, cleanData);
  };

  const deleteActionItem = async (id: string): Promise<void> => {
    // Update local state immediately
    setActionItems(prev => prev.filter(ai => ai.id !== id));
    
    // Then delete from Firebase
    const docRef = doc(db, 'actionItems', id);
    await deleteDoc(docRef);
  };

  // Add comment to action item
  const addActionItemComment = async (itemId: string, comment: string): Promise<void> => {
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
    getTrip,
    addCostEntry,
    updateCostEntry,
    deleteCostEntry,
    completeTrip,
    addAdditionalCost,
    removeAdditionalCost,
    addDelayReason,
    updateInvoicePayment,
    importTripsFromCSV,
    missedLoads,
    addMissedLoad,
    updateMissedLoad,
    deleteMissedLoad,
    dieselRecords,
    addDieselRecord,
    updateDieselRecord,
    deleteDieselRecord,
    allocateDieselToTrip,
    removeDieselFromTrip,
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