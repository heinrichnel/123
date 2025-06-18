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
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "../firebase";
import { cleanObjectForFirestore, isOnline } from "../utils/helpers";
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
  
  // Additional cost management
  addAdditionalCost: (tripId: string, cost: Omit<AdditionalCost, "id">, files?: FileList) => Promise<string>;
  removeAdditionalCost: (tripId: string, costId: string) => Promise<void>;
  
  // Delay reasons
  addDelayReason: (tripId: string, delay: Omit<DelayReason, "id">) => Promise<string>;

  // Invoice payment updates
  updateInvoicePayment: (tripId: string, paymentData: {
    paymentStatus: 'unpaid' | 'partial' | 'paid';
    paymentAmount?: number;
    paymentReceivedDate?: string;
    paymentNotes?: string;
    paymentMethod?: string;
    bankReference?: string;
  }) => Promise<void>;

  // Import trips from CSV
  importTripsFromCSV: (trips: any[]) => Promise<void>;

  // Missed Loads
  missedLoads: MissedLoad[];
  addMissedLoad: (missedLoad: Omit<MissedLoad, "id">) => Promise<string>;
  updateMissedLoad: (missedLoad: MissedLoad) => Promise<void>;
  deleteMissedLoad: (id: string) => Promise<void>;

  // Diesel
  dieselRecords: DieselConsumptionRecord[];
  addDieselRecord: (record: Omit<DieselConsumptionRecord, "id">) => Promise<void>;
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

  // System Cost Rates
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
  
  // System Cost Rates
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

    // Missed Loads realtime sync
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

  // Add a trip to Firestore
  const addTrip = async (tripData: Omit<Trip, 'id' | 'costs' | 'status'>): Promise<string> => {
    try {
      // Backend validation for End Date
      if (!tripData.endDate) {
        throw new Error('End Date is required');
      }
      if (tripData.startDate && tripData.endDate < tripData.startDate) {
        throw new Error('End Date cannot be earlier than Start Date');
      }
      
      // Create a new trip object with default values
      const newTrip = {
        ...tripData,
        costs: [],
        status: 'active',
        paymentStatus: 'unpaid',
        additionalCosts: [],
        delayReasons: [],
        followUpHistory: [],
        clientType: tripData.clientType || 'external',
      };
      
      // Clean the object for Firestore (remove undefined values)
      const cleanedTrip = cleanObjectForFirestore(newTrip);
      
      // Add to Firestore and get the auto-generated ID
      const docRef = await addDoc(collection(db, "trips"), cleanedTrip);
      
      // Return the Firestore-generated ID
      return docRef.id;
    } catch (error) {
      console.error("Error adding trip:", error);
      throw error;
    }
  };

  // Update a trip in Firestore
  const updateTrip = async (updatedTrip: Trip): Promise<void> => {
    try {
      // Clean the object for Firestore
      const cleanedTrip = cleanObjectForFirestore(updatedTrip);
      
      // Update in Firestore
      const tripDocRef = doc(db, "trips", updatedTrip.id);
      await updateDoc(tripDocRef, cleanedTrip);
    } catch (error) {
      console.error("Error updating trip:", error);
      throw error;
    }
  };

  // Delete a trip from Firestore
  const deleteTrip = async (id: string): Promise<void> => {
    try {
      const tripDocRef = doc(db, "trips", id);
      await deleteDoc(tripDocRef);
    } catch (error) {
      console.error("Error deleting trip:", error);
      throw error;
    }
  };

  // Get a trip by ID
  const getTrip = (id: string): Trip | undefined => {
    return trips.find(trip => trip.id === id);
  };

  // Add a cost entry to a trip
  const addCostEntry = async (
    tripId: string,
    costEntryData: Omit<CostEntry, "id" | "attachments">,
    files?: FileList
  ): Promise<string> => {
    try {
      // Generate a unique ID for the cost entry
      const newId = `C${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Process attachments if files are provided
      const attachments: Attachment[] = files
        ? Array.from(files).map((file, index) => ({
            id: `A${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
            costEntryId: newId,
            filename: file.name,
            fileUrl: URL.createObjectURL(file),
            fileType: file.type,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
            fileData: "",
          }))
        : [];

      // Create the complete cost entry object
      const newCostEntry: CostEntry = {
        ...costEntryData,
        id: newId,
        attachments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Find the trip in local state
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) {
        console.error(`Trip not found: ${tripId}`);
        throw new Error(`Trip not found: ${tripId}`);
      }

      // Update the trip's costs array
      const updatedCosts = [...(trip.costs || []), newCostEntry];
      
      // Update the trip in Firestore
      const tripDocRef = doc(db, "trips", tripId);
      
      // Check if the document exists first
      const tripDoc = await getDoc(tripDocRef);
      if (!tripDoc.exists()) {
        throw new Error("Trip document not found in database. Please refresh and try again.");
      }
      
      // Update the document with the new costs array
      await updateDoc(tripDocRef, { costs: updatedCosts });
      
      // Update local state immediately for better UX
      const updatedTrips = trips.map(t => 
        t.id === tripId 
          ? { ...t, costs: updatedCosts } 
          : t
      );
      setTrips(updatedTrips);

      return newId;
    } catch (error) {
      console.error("Error adding cost entry to Firestore:", error);
      throw error;
    }
  };

  // Update a cost entry
  const updateCostEntry = async (updatedCostEntry: CostEntry): Promise<void> => {
    try {
      // Find the trip that contains this cost entry
      const trip = trips.find(t => t.costs && t.costs.some(c => c.id === updatedCostEntry.id));
      if (!trip) {
        throw new Error("Trip not found for this cost entry");
      }

      // Update the cost entry in the trip's costs array
      const updatedCosts = trip.costs.map(cost => 
        cost.id === updatedCostEntry.id ? updatedCostEntry : cost
      );

      // Update the trip in Firestore
      const tripDocRef = doc(db, "trips", trip.id);
      await updateDoc(tripDocRef, { costs: updatedCosts });
      
      // Update local state immediately
      const updatedTrips = trips.map(t => 
        t.id === trip.id 
          ? { ...t, costs: updatedCosts } 
          : t
      );
      setTrips(updatedTrips);
    } catch (error) {
      console.error("Error updating cost entry:", error);
      throw error;
    }
  };

  // Delete a cost entry
  const deleteCostEntry = async (costEntryId: string): Promise<void> => {
    try {
      // Find the trip that contains this cost entry
      const trip = trips.find(t => t.costs && t.costs.some(c => c.id === costEntryId));
      if (!trip) {
        throw new Error("Trip not found for this cost entry");
      }

      // Remove the cost entry from the trip's costs array
      const updatedCosts = trip.costs.filter(c => c.id !== costEntryId);

      // Update the trip in Firestore
      const tripDocRef = doc(db, "trips", trip.id);
      await updateDoc(tripDocRef, { costs: updatedCosts });
      
      // Update local state immediately
      const updatedTrips = trips.map(t => 
        t.id === trip.id 
          ? { ...t, costs: updatedCosts } 
          : t
      );
      setTrips(updatedTrips);
    } catch (error) {
      console.error("Error deleting cost entry:", error);
      throw error;
    }
  };

  // Complete a trip
  const completeTrip = async (tripId: string): Promise<void> => {
    try {
      // Find the trip
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) {
        throw new Error("Trip not found");
      }

      // Check for unresolved flags
      const unresolvedFlags = trip.costs?.some(
        (cost) => cost.isFlagged && cost.investigationStatus !== "resolved"
      );
      if (unresolvedFlags) {
        throw new Error(
          "Cannot complete trip: unresolved flagged cost entries present"
        );
      }

      // Update the trip status in Firestore
      const tripDocRef = doc(db, "trips", tripId);
      await updateDoc(tripDocRef, {
        status: "completed",
        completedAt: new Date().toISOString(),
        completedBy: "Current User", // Replace with real user info
      });
      
      // Update local state immediately
      const updatedTrips = trips.map(t => 
        t.id === tripId 
          ? { 
              ...t, 
              status: "completed", 
              completedAt: new Date().toISOString(),
              completedBy: "Current User"
            } 
          : t
      );
      setTrips(updatedTrips);
    } catch (error) {
      console.error("Error completing trip:", error);
      throw error;
    }
  };

  // Add an additional cost to a trip
  const addAdditionalCost = async (
    tripId: string, 
    costData: Omit<AdditionalCost, "id">, 
    files?: FileList
  ): Promise<string> => {
    try {
      // Generate a unique ID for the additional cost
      const newId = `AC${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Process supporting documents if files are provided
      const supportingDocuments: Attachment[] = files
        ? Array.from(files).map((file, index) => ({
            id: `AD${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
            costEntryId: newId,
            filename: file.name,
            fileUrl: URL.createObjectURL(file),
            fileType: file.type,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
            fileData: "",
          }))
        : [];

      // Create the complete additional cost object
      const newCost: AdditionalCost = {
        ...costData,
        id: newId,
        supportingDocuments
      };

      // Find the trip in local state
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) {
        throw new Error(`Trip not found: ${tripId}`);
      }

      // Update the trip's additionalCosts array
      const updatedAdditionalCosts = [...(trip.additionalCosts || []), newCost];
      
      // Update the trip in Firestore
      const tripDocRef = doc(db, "trips", tripId);
      await updateDoc(tripDocRef, { additionalCosts: updatedAdditionalCosts });
      
      // Update local state immediately
      const updatedTrips = trips.map(t => 
        t.id === tripId 
          ? { ...t, additionalCosts: updatedAdditionalCosts } 
          : t
      );
      setTrips(updatedTrips);

      return newId;
    } catch (error) {
      console.error("Error adding additional cost:", error);
      throw error;
    }
  };

  // Remove an additional cost from a trip
  const removeAdditionalCost = async (tripId: string, costId: string): Promise<void> => {
    try {
      // Find the trip
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) {
        throw new Error(`Trip not found: ${tripId}`);
      }

      // Remove the cost from the trip's additionalCosts array
      const updatedAdditionalCosts = (trip.additionalCosts || []).filter(c => c.id !== costId);
      
      // Update the trip in Firestore
      const tripDocRef = doc(db, "trips", tripId);
      await updateDoc(tripDocRef, { additionalCosts: updatedAdditionalCosts });
      
      // Update local state immediately
      const updatedTrips = trips.map(t => 
        t.id === tripId 
          ? { ...t, additionalCosts: updatedAdditionalCosts } 
          : t
      );
      setTrips(updatedTrips);
    } catch (error) {
      console.error("Error removing additional cost:", error);
      throw error;
    }
  };

  // Add a delay reason to a trip
  const addDelayReason = async (tripId: string, delayData: Omit<DelayReason, "id">): Promise<string> => {
    try {
      // Generate a unique ID for the delay reason
      const newId = `DR${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create the complete delay reason object
      const newDelay: DelayReason = {
        ...delayData,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Find the trip in local state
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) {
        throw new Error(`Trip not found: ${tripId}`);
      }

      // Update the trip's delayReasons array
      const updatedDelayReasons = [...(trip.delayReasons || []), newDelay];
      
      // Update the trip in Firestore
      const tripDocRef = doc(db, "trips", tripId);
      await updateDoc(tripDocRef, { delayReasons: updatedDelayReasons });
      
      // Update local state immediately
      const updatedTrips = trips.map(t => 
        t.id === tripId 
          ? { ...t, delayReasons: updatedDelayReasons } 
          : t
      );
      setTrips(updatedTrips);

      return newId;
    } catch (error) {
      console.error("Error adding delay reason:", error);
      throw error;
    }
  };

  // Update invoice payment status
  const updateInvoicePayment = async (tripId: string, paymentData: {
    paymentStatus: 'unpaid' | 'partial' | 'paid';
    paymentAmount?: number;
    paymentReceivedDate?: string;
    paymentNotes?: string;
    paymentMethod?: string;
    bankReference?: string;
  }): Promise<void> => {
    try {
      // Find the trip
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) {
        throw new Error(`Trip not found: ${tripId}`);
      }

      // Update the trip with payment data
      const updatedTrip = {
        ...trip,
        paymentStatus: paymentData.paymentStatus,
        paymentAmount: paymentData.paymentAmount,
        paymentReceivedDate: paymentData.paymentReceivedDate,
        paymentNotes: paymentData.paymentNotes,
        paymentMethod: paymentData.paymentMethod,
        bankReference: paymentData.bankReference,
        status: paymentData.paymentStatus === 'paid' ? 'paid' : 'invoiced'
      };
      
      // Update the trip in Firestore
      const tripDocRef = doc(db, "trips", tripId);
      await updateDoc(tripDocRef, cleanObjectForFirestore(updatedTrip));
      
      // Update local state immediately
      const updatedTrips = trips.map(t => 
        t.id === tripId ? updatedTrip : t
      );
      setTrips(updatedTrips);
    } catch (error) {
      console.error("Error updating invoice payment:", error);
      throw error;
    }
  };

  // Import trips from CSV
  const importTripsFromCSV = async (tripsData: any[]): Promise<void> => {
    try {
      // Process each trip
      for (const tripData of tripsData) {
        // Create a new trip object with default values
        const newTrip = {
          ...tripData,
          costs: [],
          status: 'active',
          paymentStatus: 'unpaid',
          additionalCosts: [],
          delayReasons: [],
          followUpHistory: [],
          clientType: tripData.clientType || 'external',
        };
        
        // Clean the object for Firestore
        const cleanedTrip = cleanObjectForFirestore(newTrip);
        
        // Add to Firestore
        await addDoc(collection(db, "trips"), cleanedTrip);
      }
    } catch (error) {
      console.error("Error importing trips from CSV:", error);
      throw error;
    }
  };

  // Missed Loads Handlers
  const addMissedLoad = async (missedLoadData: Omit<MissedLoad, "id">): Promise<string> => {
    try {
      // Clean the object for Firestore
      const cleanedData = cleanObjectForFirestore(missedLoadData);
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, "missedLoads"), cleanedData);
      return docRef.id;
    } catch (error) {
      console.error("Error adding missed load:", error);
      throw error;
    }
  };

  const updateMissedLoad = async (missedLoad: MissedLoad): Promise<void> => {
    try {
      // Clean the object for Firestore
      const cleanedData = cleanObjectForFirestore(missedLoad);
      
      // Update in Firestore
      const docRef = doc(db, "missedLoads", missedLoad.id);
      await updateDoc(docRef, cleanedData);
    } catch (error) {
      console.error("Error updating missed load:", error);
      throw error;
    }
  };

  const deleteMissedLoad = async (id: string): Promise<void> => {
    try {
      // Delete from Firestore
      const docRef = doc(db, "missedLoads", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting missed load:", error);
      throw error;
    }
  };

  // System Cost Rates Handler
  const updateSystemCostRates = (currency: 'USD' | 'ZAR', rates: SystemCostRates): void => {
    setSystemCostRates(prev => ({
      ...prev,
      [currency]: rates,
    }));
    // Note: In a full implementation, you would also save this to Firestore
  };

  // Diesel CRUD
  const addDieselRecord = async (record: Omit<DieselConsumptionRecord, "id">) => {
    try {
      // Clean the object for Firestore
      const cleanedData = cleanObjectForFirestore(record);
      
      // Add to Firestore
      await addDieselToFirebase(cleanedData);
    } catch (error) {
      console.error("Error adding diesel record:", error);
      throw error;
    }
  };
  
  const updateDieselRecord = async (record: DieselConsumptionRecord) => {
    try {
      // Clean the object for Firestore
      const cleanedData = cleanObjectForFirestore(record);
      
      // Update in Firestore
      await updateDieselInFirebase(record.id, cleanedData);
    } catch (error) {
      console.error("Error updating diesel record:", error);
      throw error;
    }
  };
  
  const deleteDieselRecord = async (id: string) => {
    try {
      // Delete from Firestore
      await deleteDieselFromFirebase(id);
    } catch (error) {
      console.error("Error deleting diesel record:", error);
      throw error;
    }
  };

  // Allocate diesel to trip
  const allocateDieselToTrip = async (dieselId: string, tripId: string) => {
    try {
      // Find the diesel record
      const dieselRecord = dieselRecords.find(r => r.id === dieselId);
      if (!dieselRecord) {
        throw new Error("Diesel record not found");
      }
      
      // Update the diesel record with the trip ID
      await updateDieselInFirebase(dieselId, { tripId });
      
      // Create a cost entry for the trip
      const costData: Omit<CostEntry, "id" | "attachments"> = {
        tripId,
        category: "Fuel",
        subCategory: "Diesel",
        amount: dieselRecord.totalCost,
        currency: "ZAR", // Default to ZAR, update as needed
        referenceNumber: `DIESEL-${dieselId}`,
        date: dieselRecord.date,
        notes: `Diesel purchase at ${dieselRecord.fuelStation}. ${dieselRecord.litresFilled}L at ${dieselRecord.costPerLitre}/L.`,
        isFlagged: false,
        isSystemGenerated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add the cost entry to the trip
      await addCostEntry(tripId, costData);
    } catch (error) {
      console.error("Error allocating diesel to trip:", error);
      throw error;
    }
  };

  // Remove diesel from trip
  const removeDieselFromTrip = async (dieselId: string) => {
    try {
      // Find the diesel record
      const dieselRecord = dieselRecords.find(r => r.id === dieselId);
      if (!dieselRecord || !dieselRecord.tripId) {
        throw new Error("Diesel record not found or not linked to a trip");
      }
      
      // Find the trip
      const trip = trips.find(t => t.id === dieselRecord.tripId);
      if (!trip) {
        throw new Error("Trip not found");
      }
      
      // Find the cost entry related to this diesel record
      const costEntry = trip.costs.find(c => 
        c.referenceNumber === `DIESEL-${dieselId}` || 
        c.notes?.includes(`Diesel purchase at ${dieselRecord.fuelStation}`)
      );
      
      // Remove the cost entry if found
      if (costEntry) {
        await deleteCostEntry(costEntry.id);
      }
      
      // Update the diesel record to remove the trip ID
      await updateDieselInFirebase(dieselId, { tripId: null });
    } catch (error) {
      console.error("Error removing diesel from trip:", error);
      throw error;
    }
  };

  // Driver Behavior Event CRUD
  const addDriverBehaviorEvent = async (event: Omit<DriverBehaviorEvent, 'id'>, files?: FileList) => {
    try {
      // Clean the object for Firestore
      const cleanedData = cleanObjectForFirestore(event);
      
      // Add to Firestore
      await addDriverBehaviorEventToFirebase(cleanedData);
    } catch (error) {
      console.error("Error adding driver behavior event:", error);
      throw error;
    }
  };
  
  const updateDriverBehaviorEvent = async (event: DriverBehaviorEvent) => {
    try {
      // Clean the object for Firestore
      const cleanedData = cleanObjectForFirestore(event);
      
      // Update in Firestore
      await updateDriverBehaviorEventToFirebase(event.id, cleanedData);
    } catch (error) {
      console.error("Error updating driver behavior event:", error);
      throw error;
    }
  };
  
  const deleteDriverBehaviorEvent = async (id: string) => {
    try {
      // Delete from Firestore
      await deleteDriverBehaviorEventToFirebase(id);
    } catch (error) {
      console.error("Error deleting driver behavior event:", error);
      throw error;
    }
  };

  // CAR Report CRUD
  const addCARReport = async (report: Omit<CARReport, 'id'>, files?: FileList) => {
    try {
      // Clean the object for Firestore
      const cleanedData = cleanObjectForFirestore(report);
      
      // Add to Firestore
      await addCARReportToFirebase(cleanedData);
    } catch (error) {
      console.error("Error adding CAR report:", error);
      throw error;
    }
  };
  
  const updateCARReport = async (report: CARReport, files?: FileList) => {
    try {
      // Clean the object for Firestore
      const cleanedData = cleanObjectForFirestore(report);
      
      // Update in Firestore
      await updateCARReportInFirebase(report.id, cleanedData);
    } catch (error) {
      console.error("Error updating CAR report:", error);
      throw error;
    }
  };
  
  const deleteCARReport = async (id: string) => {
    try {
      // Delete from Firestore
      await deleteCARReportFromFirebase(id);
    } catch (error) {
      console.error("Error deleting CAR report:", error);
      throw error;
    }
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

  // Action Items CRUD
  const addActionItem = async (itemData: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    try {
      // Clean the object for Firestore
      const cleanedData = cleanObjectForFirestore({
        ...itemData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'Current User', // Replace with real user info
      });
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'actionItems'), cleanedData);
      return docRef.id;
    } catch (error) {
      console.error("Error adding action item:", error);
      throw error;
    }
  };

  const updateActionItem = async (item: ActionItem) => {
    try {
      // Clean the object for Firestore
      const cleanedData = cleanObjectForFirestore({
        ...item,
        updatedAt: new Date().toISOString(),
      });
      
      // Update in Firestore
      const docRef = doc(db, 'actionItems', item.id);
      await updateDoc(docRef, cleanedData);
    } catch (error) {
      console.error("Error updating action item:", error);
      throw error;
    }
  };

  const deleteActionItem = async (id: string) => {
    try {
      // Delete from Firestore
      const docRef = doc(db, 'actionItems', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting action item:", error);
      throw error;
    }
  };

  // Add comment to action item
  const addActionItemComment = async (itemId: string, comment: string) => {
    try {
      // Find the action item
      const item = actionItems.find(i => i.id === itemId);
      if (!item) {
        throw new Error("Action item not found");
      }
      
      // Create a new comment
      const newComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        comment,
        createdAt: new Date().toISOString(),
        createdBy: 'Current User' // Replace with real user info
      };
      
      // Update the action item with the new comment
      const updatedItem = {
        ...item,
        comments: [...(item.comments || []), newComment],
        updatedAt: new Date().toISOString()
      };
      
      // Update in Firestore
      await updateActionItem(updatedItem);
    } catch (error) {
      console.error("Error adding comment to action item:", error);
      throw error;
    }
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