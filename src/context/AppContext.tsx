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
<<<<<<< HEAD
  SystemCostRates,
  DEFAULT_SYSTEM_COST_RATES,
  COST_CATEGORIES,
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
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { generateTripId, shouldAutoCompleteTrip, isOnline } from "../utils/helpers";
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
import { startDriverEventPolling, stopDriverEventPolling } from '../utils/driverBehaviorIntegration';
=======
} from "../types/index.js";
import { doc, updateDoc, collection, addDoc, onSnapshot } from "firebase/firestore";
import { 
  db, 
  driverBehaviorCollection,
  addDriverBehaviorEventToFirebase,
  updateDriverBehaviorEventToFirebase,
  deleteDriverBehaviorEventToFirebase
} from "../firebase.js";
import { generateTripId, shouldAutoCompleteTrip, isOnline } from "../utils/helpers.js";
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89

interface AppContextType {
  trips: Trip[];
  addTrip: (tripData: Omit<Trip, "id" | "costs" | "status">) => Promise<string>;
  updateTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  bulkDeleteTrips: (ids: string[]) => Promise<void>;
  getTrip: (id: string) => Trip | undefined;

  addCostEntry: (
    tripId: string,
    costData: Omit<CostEntry, "id" | "attachments">, 
    files?: FileList
  ) => Promise<string>;
  updateCostEntry: (costEntry: CostEntry) => Promise<void>;
  deleteCostEntry: (id: string) => Promise<void>;

  completeTrip: (tripId: string) => Promise<void>;
  updateInvoicePayment: (tripId: string, paymentData: any) => Promise<void>;
  allocateDieselToTrip: (dieselId: string, tripId: string) => Promise<void>;
  removeDieselFromTrip: (dieselId: string) => Promise<void>;
  importTripsFromCSV: (trips: any[]) => Promise<void>;
  updateTripStatus: (tripId: string, status: 'shipped' | 'delivered', notes: string) => Promise<void>;

  // Additional Cost Management
  addAdditionalCost: (tripId: string, cost: Omit<AdditionalCost, "id">, files?: FileList) => Promise<string>;
  removeAdditionalCost: (tripId: string, costId: string) => Promise<void>;

  // Delay Reasons
  addDelayReason: (tripId: string, delay: Omit<DelayReason, "id">) => Promise<string>;

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
  importDieselRecords: (formData: FormData) => Promise<void>;

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
  updateSystemCostRates: (currency: 'USD' | 'ZAR', rates: SystemCostRates) => Promise<void>;

  // Action Items
  actionItems: ActionItem[];
  addActionItem: (item: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => string;
  updateActionItem: (item: ActionItem) => Promise<void>;
  deleteActionItem: (id: string) => Promise<void>;
  addActionItemComment: (itemId: string, comment: string) => Promise<void>;

  // Driver Behavior Events
  driverBehaviorEvents: DriverBehaviorEvent[];
  addDriverBehaviorEvent: (event: Omit<DriverBehaviorEvent, 'id'>, files?: FileList) => Promise<string>;
  updateDriverBehaviorEvent: (event: DriverBehaviorEvent) => Promise<void>;
  deleteDriverBehaviorEvent: (id: string) => Promise<void>;
  importDriverBehaviorEventsFromWebhook: () => Promise<{ imported: number; skipped: number }>;

  // Active Trips Import
  importTripsFromWebhook: () => Promise<{ imported: number; skipped: number }>;

  connectionStatus: "connected" | "disconnected" | "reconnecting";
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

  // Load saved system cost rates from localStorage on component mount
  useEffect(() => {
    const savedRates = localStorage.getItem('systemCostRates');
    if (savedRates) {
      try {
        const parsedRates = JSON.parse(savedRates);
        if (parsedRates.USD && parsedRates.ZAR) {
          setSystemCostRates(parsedRates);
        }
      } catch (error) {
        console.error("Error parsing saved system cost rates:", error);
      }
    }
  }, []);

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

<<<<<<< HEAD
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

    // Start polling for driver behavior events from Google Sheets
    const driverEventPollingId = startDriverEventPolling(60000); // Poll every minute

    return () => {
      tripsUnsub();
      missedLoadsUnsub();
      dieselUnsub();
      driverBehaviorUnsub();
      carReportsUnsub();
      actionItemsUnsub();
      stopDriverEventPolling(driverEventPollingId);
=======
    // Driver Behavior Events realtime sync
    const driverBehaviorUnsub = onSnapshot(driverBehaviorCollection, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DriverBehaviorEvent[];
      setDriverBehaviorEvents(eventsData);
    }, (error) => {
      console.error("Driver behavior events listener error:", error);
      setConnectionStatus('disconnected');
    });

    return () => {
      tripsUnsub();
      driverBehaviorUnsub();
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89
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

  // Helper function to remove undefined values from an object
  const removeUndefinedValues = (obj: any): any => {
    const result: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          result[key] = removeUndefinedValues(obj[key]);
        } else {
          result[key] = obj[key];
        }
      }
    });
    return result;
  };

  // Your existing methods now updated to async and use Firestore below:

  const addTrip = async (tripData: Omit<Trip, 'id' | 'costs' | 'status'>): Promise<string> => {
    try {
      // Generate a unique ID for the trip
      const newId = generateTripId();
      
      // Create a new trip object with default values
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
      
      // Add the trip to Firestore first
      const cleanTrip = removeUndefinedValues(newTrip);
      await setDoc(doc(db, "trips", newId), cleanTrip);
      
      // Update local state only after successful Firestore operation
      setTrips(prev => [...prev, newTrip]);
      
      return newId;
    } catch (error) {
      console.error("Error adding trip:", error);
      throw error;
    }
  };

  const updateTrip = async (updatedTrip: Trip): Promise<void> => {
    try {
      // Check if trip exists in Firestore
      const tripDoc = await getDoc(doc(db, "trips", updatedTrip.id));
      if (!tripDoc.exists()) {
        throw new Error(`Trip document does not exist in Firestore:\n\n${updatedTrip.id}`);
      }
      
      // Remove undefined values before updating Firestore
      const cleanTrip = removeUndefinedValues(updatedTrip);
      await updateDoc(doc(db, "trips", updatedTrip.id), cleanTrip);
      
      // Update local state
      setTrips(prev => prev.map(trip => trip.id === updatedTrip.id ? updatedTrip : trip));
    } catch (error) {
      console.error("Error updating trip:", error);
      throw error;
    }
  };

  const deleteTrip = async (id: string): Promise<void> => {
    try {
      // Delete from Firestore first
      await deleteDoc(doc(db, "trips", id));
      
      // Then update local state
      setTrips(prev => prev.filter(trip => trip.id !== id));
    } catch (error) {
      console.error("Error deleting trip:", error);
      throw error;
    }
  };

  // New bulk delete function
  const bulkDeleteTrips = async (ids: string[]): Promise<void> => {
    try {
      // Use a batch write for better performance and atomicity
      const batch = writeBatch(db);
      
      // Add each trip to the batch for deletion
      ids.forEach(id => {
        const tripRef = doc(db, "trips", id);
        batch.delete(tripRef);
      });
      
      // Commit the batch
      await batch.commit();
      
      // Update local state after successful Firestore operation
      setTrips(prev => prev.filter(trip => !ids.includes(trip.id)));
      
    } catch (error) {
      console.error("Error bulk deleting trips:", error);
      throw error;
    }
  };

  const getTrip = (id: string): Trip | undefined => {
    return trips.find(trip => trip.id === id);
  };

  // Cost Entry Firestore update helpers:

  const addCostEntry = async (
    tripId: string,
    costData: Omit<CostEntry, "id" | "attachments">,
    files?: FileList
  ): Promise<string> => {
    try {
      // Generate a unique ID for the cost entry
      const newId = `C${Date.now()}`;
      
      // Process attachments if files are provided
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

      // Create the new cost entry
      const newCostEntry: CostEntry = {
        ...costData,
        id: newId,
        attachments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Find the trip to update
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) {
        throw new Error("Trip document not found in database. Please refresh and try again.");
      }

      // Add the cost entry to the trip's costs array
      const updatedCosts = [...(trip.costs || []), newCostEntry];
      
      // Remove undefined values before updating Firestore
      const cleanCosts = updatedCosts.map(cost => removeUndefinedValues(cost));
      
      // Update the trip document in Firestore
      await updateDoc(doc(db, "trips", tripId), { costs: cleanCosts });
      
      // Update local state only after successful Firestore operation
      setTrips(prev => 
        prev.map(t => 
          t.id === tripId 
            ? { ...t, costs: updatedCosts } 
            : t
        )
      );

      return newId;
    } catch (error) {
      console.error("Error adding cost entry:", error);
      throw error;
    }
  };

  const updateCostEntry = async (updatedCostEntry: CostEntry): Promise<void> => {
    try {
      // Find the trip that contains this cost entry
      const trip = trips.find(t => t.costs.some(c => c.id === updatedCostEntry.id));
      if (!trip) {
        throw new Error("Trip containing this cost entry not found");
      }

      // Update the cost entry in the trip's costs array
      const updatedCosts = trip.costs.map(cost => 
        cost.id === updatedCostEntry.id ? updatedCostEntry : cost
      );
      
      // Remove undefined values before updating Firestore
      const cleanCosts = updatedCosts.map(cost => removeUndefinedValues(cost));
      
      // Update the trip document in Firestore
      await updateDoc(doc(db, "trips", trip.id), { costs: cleanCosts });
      
      // Update local state
      setTrips(prev => 
        prev.map(t => 
          t.id === trip.id 
            ? { ...t, costs: updatedCosts } 
            : t
        )
      );
    } catch (error) {
      console.error("Error updating cost entry:", error);
      throw error;
    }
  };

  const deleteCostEntry = async (costEntryId: string): Promise<void> => {
    try {
      // Find the trip that contains this cost entry
      const trip = trips.find(t => t.costs.some(c => c.id === costEntryId));
      if (!trip) {
        throw new Error("Trip containing this cost entry not found");
      }

      // Remove the cost entry from the trip's costs array
      const updatedCosts = trip.costs.filter(c => c.id !== costEntryId);
      
      // Update the trip document in Firestore
      await updateDoc(doc(db, "trips", trip.id), { costs: updatedCosts });
      
      // Update local state
      setTrips(prev => 
        prev.map(t => 
          t.id === trip.id 
            ? { ...t, costs: updatedCosts } 
            : t
        )
      );
    } catch (error) {
      console.error("Error deleting cost entry:", error);
      throw error;
    }
  };

  // Complete Trip
  const completeTrip = async (tripId: string): Promise<void> => {
    try {
      // Find the trip to complete
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) {
        throw new Error("Trip not found");
      }

      // Update the trip status
      const updatedTrip = {
        ...trip,
        status: "completed" as const,
        completedAt: new Date().toISOString(),
        completedBy: "Current User", // In a real app, use the logged-in user
      };
      
      // Update the trip document in Firestore
      await updateDoc(doc(db, "trips", tripId), removeUndefinedValues(updatedTrip));
      
      // Update local state
      setTrips(prev => 
        prev.map(t => 
          t.id === tripId 
            ? updatedTrip 
            : t
        )
      );
    } catch (error) {
      console.error("Error completing trip:", error);
      throw error;
    }
  };

  // Update invoice payment status
  const updateInvoicePayment = async (tripId: string, paymentData: any): Promise<void> => {
    try {
      // Find the trip to update
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) {
        throw new Error("Trip not found");
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
        paymentUpdatedAt: new Date().toISOString(),
        paymentUpdatedBy: "Current User", // In a real app, use the logged-in user
      };
      
      // Update the trip document in Firestore
      await updateDoc(doc(db, "trips", tripId), removeUndefinedValues(updatedTrip));
      
      // Update local state
      setTrips(prev => 
        prev.map(t => 
          t.id === tripId 
            ? updatedTrip 
            : t
        )
      );
    } catch (error) {
      console.error("Error updating invoice payment:", error);
      throw error;
    }
  };

  // Allocate diesel to trip
  const allocateDieselToTrip = async (dieselId: string, tripId: string): Promise<void> => {
    try {
      // Find the diesel record
      const dieselRecord = dieselRecords.find(r => r.id === dieselId);
      if (!dieselRecord) {
        throw new Error("Diesel record not found");
      }

      // Find the trip
      const trip = trips.find(t => t.id === tripId);
      if (!trip) {
        throw new Error("Trip not found");
      }

      // Update the diesel record with the trip ID
      const updatedDieselRecord = {
        ...dieselRecord,
        tripId,
        updatedAt: new Date().toISOString(),
      };
      
      // Update the diesel record in Firestore
      await updateDieselInFirebase(dieselId, removeUndefinedValues(updatedDieselRecord));
      
      // Create a cost entry for the diesel
      const costData: Omit<CostEntry, "id" | "attachments"> = {
        tripId,
        category: "Fuel",
        subCategory: "Diesel",
        amount: dieselRecord.totalCost,
        currency: dieselRecord.currency || "ZAR",
        referenceNumber: `DIESEL-${dieselRecord.id}`,
        date: dieselRecord.date,
        notes: `Diesel purchase at ${dieselRecord.fuelStation} - ${dieselRecord.litresFilled}L`,
        isFlagged: false,
        isSystemGenerated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Add the cost entry
      await addCostEntry(tripId, costData);
      
      // Update local state
      setDieselRecords(prev => 
        prev.map(r => 
          r.id === dieselId 
            ? updatedDieselRecord 
            : r
        )
      );
    } catch (error) {
      console.error("Error allocating diesel to trip:", error);
      throw error;
    }
  };

  // Remove diesel from trip
  const removeDieselFromTrip = async (dieselId: string): Promise<void> => {
    try {
      // Find the diesel record
      const dieselRecord = dieselRecords.find(r => r.id === dieselId);
      if (!dieselRecord) {
        throw new Error("Diesel record not found");
      }

      // Update the diesel record to remove the trip ID
      const updatedDieselRecord = {
        ...dieselRecord,
        tripId: undefined,
        updatedAt: new Date().toISOString(),
      };
      
      // Update the diesel record in Firestore
      await updateDieselInFirebase(dieselId, removeUndefinedValues(updatedDieselRecord));
      
      // Find and remove the associated cost entry
      if (dieselRecord.tripId) {
        const trip = trips.find(t => t.id === dieselRecord.tripId);
        if (trip) {
          const costEntry = trip.costs.find(c => 
            c.referenceNumber === `DIESEL-${dieselRecord.id}` || 
            c.notes?.includes(`Diesel purchase at ${dieselRecord.fuelStation}`)
          );
          
          if (costEntry) {
            await deleteCostEntry(costEntry.id);
          }
        }
      }
      
      // Update local state
      setDieselRecords(prev => 
        prev.map(r => 
          r.id === dieselId 
            ? updatedDieselRecord 
            : r
        )
      );
    } catch (error) {
      console.error("Error removing diesel from trip:", error);
      throw error;
    }
  };

  // Import trips from CSV
  const importTripsFromCSV = async (tripsData: any[]): Promise<void> => {
    try {
      const importedTrips = [];
      
      for (const tripData of tripsData) {
        // Generate a unique ID for the trip
        const newId = generateTripId();
        
        // Create a new trip object with default values
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
        
        // Add the trip to Firestore
        await setDoc(doc(db, "trips", newId), removeUndefinedValues(newTrip));
        
        importedTrips.push(newTrip);
      }
      
      // Update local state
      setTrips(prev => [...prev, ...importedTrips]);
      
    } catch (error) {
      console.error("Error importing trips from CSV:", error);
      throw error;
    }
  };

  // Update trip status (shipped/delivered)
  const updateTripStatus = async (tripId: string, status: 'shipped' | 'delivered', notes: string): Promise<void> => {
    try {
      // Find the trip to update
      const trip = trips.find(t => t.id === tripId);
      if (!trip) {
        throw new Error("Trip not found");
      }

      // Create update data based on status
      const updateData: Partial<Trip> = {};
      
      if (status === 'shipped') {
        updateData.shippedAt = new Date().toISOString();
        updateData.shippingNotes = notes || undefined;
      } else if (status === 'delivered') {
        updateData.deliveredAt = new Date().toISOString();
        updateData.deliveryNotes = notes || undefined;
      }

      // Update the trip in Firestore
      await updateDoc(doc(db, "trips", tripId), removeUndefinedValues(updateData));
      
      // Update local state
      setTrips(prev => 
        prev.map(t => 
          t.id === tripId 
            ? { ...t, ...updateData } 
            : t
        )
      );

      // Call Google Sheets integration function if available
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-sheets-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ tripId, status })
        });
        
        if (!response.ok) {
          console.warn('Google Sheets integration failed, but trip status was updated successfully');
        }
      } catch (error) {
        console.warn('Google Sheets integration error:', error);
        // Don't throw here - we still want to update the trip status even if the integration fails
      }
    } catch (error) {
      console.error(`Error updating trip status to ${status}:`, error);
      throw error;
    }
  };

  // Additional Cost Management
  const addAdditionalCost = async (
    tripId: string, 
    costData: Omit<AdditionalCost, "id">, 
    files?: FileList
  ): Promise<string> => {
    try {
      // Generate a unique ID for the additional cost
      const newId = `AC${Date.now()}`;
      
      // Process supporting documents if files are provided
      const supportingDocuments: Attachment[] = files
        ? Array.from(files).map((file, index) => ({
            id: `AD${Date.now()}-${index}`,
            costEntryId: newId,
            filename: file.name,
            fileUrl: URL.createObjectURL(file),
            fileType: file.type,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
            fileData: "",
          }))
        : [];

      // Create the new additional cost
      const newAdditionalCost: AdditionalCost = {
        ...costData,
        id: newId,
        supportingDocuments,
      };

      // Find the trip to update
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) {
        throw new Error("Trip not found");
      }

      // Add the additional cost to the trip's additionalCosts array
      const updatedAdditionalCosts = [...(trip.additionalCosts || []), newAdditionalCost];
      
      // Update the trip document in Firestore
      await updateDoc(doc(db, "trips", tripId), { 
        additionalCosts: updatedAdditionalCosts.map(cost => removeUndefinedValues(cost)) 
      });
      
      // Update local state
      setTrips(prev => 
        prev.map(t => 
          t.id === tripId 
            ? { ...t, additionalCosts: updatedAdditionalCosts } 
            : t
        )
      );

      return newId;
    } catch (error) {
      console.error("Error adding additional cost:", error);
      throw error;
    }
  };

  const removeAdditionalCost = async (tripId: string, costId: string): Promise<void> => {
    try {
      // Find the trip
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) {
        throw new Error("Trip not found");
      }

      // Remove the additional cost from the trip's additionalCosts array
      const updatedAdditionalCosts = (trip.additionalCosts || []).filter(c => c.id !== costId);
      
      // Update the trip document in Firestore
      await updateDoc(doc(db, "trips", tripId), { 
        additionalCosts: updatedAdditionalCosts.map(cost => removeUndefinedValues(cost)) 
      });
      
      // Update local state
      setTrips(prev => 
        prev.map(t => 
          t.id === tripId 
            ? { ...t, additionalCosts: updatedAdditionalCosts } 
            : t
        )
      );
    } catch (error) {
      console.error("Error removing additional cost:", error);
      throw error;
    }
  };

  // Delay Reasons
  const addDelayReason = async (tripId: string, delayData: Omit<DelayReason, "id">): Promise<string> => {
    try {
      // Generate a unique ID for the delay reason
      const newId = `DR${Date.now()}`;
      
      // Create the new delay reason
      const newDelayReason: DelayReason = {
        ...delayData,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Find the trip to update
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) {
        throw new Error("Trip not found");
      }

      // Add the delay reason to the trip's delayReasons array
      const updatedDelayReasons = [...(trip.delayReasons || []), newDelayReason];
      
      // Update the trip document in Firestore
      await updateDoc(doc(db, "trips", tripId), { 
        delayReasons: updatedDelayReasons.map(delay => removeUndefinedValues(delay)) 
      });
      
      // Update local state
      setTrips(prev => 
        prev.map(t => 
          t.id === tripId 
            ? { ...t, delayReasons: updatedDelayReasons } 
            : t
        )
      );

      return newId;
    } catch (error) {
      console.error("Error adding delay reason:", error);
      throw error;
    }
  };

  // Missed Loads Handlers (following uniform handler pattern)
  // Helper to sanitize missed load fields for Firestore
  function sanitizeMissedLoad(load: any) {
    return removeUndefinedValues({
      ...load,
      compensationNotes: typeof load.compensationNotes === 'string' ? load.compensationNotes : '',
      resolutionNotes: typeof load.resolutionNotes === 'string' ? load.resolutionNotes : '',
      reasonDescription: typeof load.reasonDescription === 'string' ? load.reasonDescription : '',
    });
  }

  const addMissedLoad = async (missedLoadData: Omit<MissedLoad, "id">): Promise<string> => {
    try {
      // Generate a unique ID for the missed load
      const newId = `ML${Date.now()}`;
      
      // Create the new missed load
      const newMissedLoad: MissedLoad = {
        ...missedLoadData,
        id: newId,
      };
      
      // Add the missed load to Firestore
      const sanitized = sanitizeMissedLoad(newMissedLoad);
      await setDoc(doc(db, "missedLoads", newId), sanitized);
      
      // Update local state
      setMissedLoads(prev => [...prev, newMissedLoad]);
      
      return newId;
    } catch (error) {
      console.error("Error adding missed load:", error);
      throw error;
    }
  };

  const updateMissedLoad = async (missedLoad: MissedLoad): Promise<void> => {
    try {
      // Update the missed load in Firestore
      const sanitized = sanitizeMissedLoad(missedLoad);
      await updateDoc(doc(db, "missedLoads", missedLoad.id), sanitized);
      
      // Update local state
      setMissedLoads(prev => 
        prev.map(ml => 
          ml.id === missedLoad.id 
            ? missedLoad 
            : ml
        )
      );
    } catch (error) {
      console.error("Error updating missed load:", error);
      throw error;
    }
  };

  const deleteMissedLoad = async (id: string): Promise<void> => {
    try {
      // Delete the missed load from Firestore
      await deleteDoc(doc(db, "missedLoads", id));
      
      // Update local state
      setMissedLoads(prev => prev.filter(ml => ml.id !== id));
    } catch (error) {
      console.error("Error deleting missed load:", error);
      throw error;
    }
  };

  // System Cost Rates Handler (following uniform handler pattern)
  const updateSystemCostRates = async (currency: 'USD' | 'ZAR', rates: SystemCostRates): Promise<void> => {
    try {
      // Update in Firestore
      await setDoc(doc(db, "systemCostRates", currency), removeUndefinedValues(rates));
      
      // Update local state
      const updatedRates = {
        ...systemCostRates,
        [currency]: rates,
      };
      
      setSystemCostRates(updatedRates);
      
      // Save to localStorage for persistence
      localStorage.setItem('systemCostRates', JSON.stringify(updatedRates));
    } catch (error) {
      console.error("Error updating system cost rates:", error);
      throw error;
    }
  };

  // Diesel CRUD
  const addDieselRecord = async (record: DieselConsumptionRecord) => {
    await addDieselToFirebase(removeUndefinedValues(record));
    
    // If this is a reefer unit linked to a horse, and the horse is linked to a trip,
    // automatically create a cost entry for the reefer diesel
    if (record.isReeferUnit && record.linkedHorseId) {
      const horseRecord = dieselRecords.find(r => r.id === record.linkedHorseId);
      if (horseRecord?.tripId) {
        // Create a cost entry for the reefer diesel
        const costData: Omit<CostEntry, "id" | "attachments"> = {
          tripId: horseRecord.tripId,
          category: "Fuel",
          subCategory: "Reefer Diesel",
          amount: record.totalCost,
          currency: record.currency || "ZAR",
          referenceNumber: `REEFER-DIESEL-${record.id}`,
          date: record.date,
          notes: `Reefer diesel for ${record.fleetNumber} - ${record.litresFilled}L at ${record.fuelStation}`,
          isFlagged: false,
          isSystemGenerated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await addCostEntry(horseRecord.tripId, costData);
      }
    }
  };
  
  const updateDieselRecord = async (record: DieselConsumptionRecord) => {
    await updateDieselInFirebase(record.id, removeUndefinedValues(record));
    
    // If this is a reefer unit and the linked horse has changed
    if (record.isReeferUnit && record.linkedHorseId) {
      // Find the previous version of this record
      const oldRecord = dieselRecords.find(r => r.id === record.id);
      
      // If the linked horse has changed
      if (oldRecord && oldRecord.linkedHorseId !== record.linkedHorseId) {
        // Remove any existing cost entries from the old horse's trip
        if (oldRecord.linkedHorseId) {
          const oldHorseRecord = dieselRecords.find(r => r.id === oldRecord.linkedHorseId);
          if (oldHorseRecord?.tripId) {
            const trip = trips.find(t => t.id === oldHorseRecord.tripId);
            if (trip) {
              const costEntry = trip.costs.find(c => 
                c.referenceNumber === `REEFER-DIESEL-${record.id}`
              );
              
              if (costEntry) {
                await deleteCostEntry(costEntry.id);
              }
            }
          }
        }
        
        // Add a new cost entry to the new horse's trip
        const newHorseRecord = dieselRecords.find(r => r.id === record.linkedHorseId);
        if (newHorseRecord?.tripId) {
          // Create a cost entry for the reefer diesel
          const costData: Omit<CostEntry, "id" | "attachments"> = {
            tripId: newHorseRecord.tripId,
            category: "Fuel",
            subCategory: "Reefer Diesel",
            amount: record.totalCost,
            currency: record.currency || "ZAR",
            referenceNumber: `REEFER-DIESEL-${record.id}`,
            date: record.date,
            notes: `Reefer diesel for ${record.fleetNumber} - ${record.litresFilled}L at ${record.fuelStation}`,
            isFlagged: false,
            isSystemGenerated: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          await addCostEntry(newHorseRecord.tripId, costData);
        }
      }
      // If only the cost or amount has changed, update the cost entry
      else if (oldRecord && (oldRecord.totalCost !== record.totalCost || oldRecord.litresFilled !== record.litresFilled)) {
        const horseRecord = dieselRecords.find(r => r.id === record.linkedHorseId);
        if (horseRecord?.tripId) {
          const trip = trips.find(t => t.id === horseRecord.tripId);
          if (trip) {
            const costEntry = trip.costs.find(c => 
              c.referenceNumber === `REEFER-DIESEL-${record.id}`
            );
            
            if (costEntry) {
              const updatedCostEntry: CostEntry = {
                ...costEntry,
                amount: record.totalCost,
                notes: `Reefer diesel for ${record.fleetNumber} - ${record.litresFilled}L at ${record.fuelStation}`,
                updatedAt: new Date().toISOString()
              };
              
              await updateCostEntry(updatedCostEntry);
            }
          }
        }
      }
    }
    // If this is a regular diesel record linked to a trip
    else if (!record.isReeferUnit && record.tripId) {
      // Find the previous version of this record
      const oldRecord = dieselRecords.find(r => r.id === record.id);
      
      // If the cost or amount has changed, update the cost entry
      if (oldRecord && (oldRecord.totalCost !== record.totalCost || oldRecord.litresFilled !== record.litresFilled)) {
        const trip = trips.find(t => t.id === record.tripId);
        if (trip) {
          const costEntry = trip.costs.find(c => 
            c.referenceNumber === `DIESEL-${record.id}`
          );
          
          if (costEntry) {
            const updatedCostEntry: CostEntry = {
              ...costEntry,
              amount: record.totalCost,
              currency: record.currency || "ZAR",
              notes: `Diesel purchase at ${record.fuelStation} - ${record.litresFilled}L`,
              updatedAt: new Date().toISOString()
            };
            
            await updateCostEntry(updatedCostEntry);
          }
        }
      }
    }
  };
  
  const deleteDieselRecord = async (id: string) => {
    // Find the diesel record before deleting it
    const record = dieselRecords.find(r => r.id === id);
    
    if (record) {
      // If it's a reefer unit linked to a horse with a trip, remove the cost entry
      if (record.isReeferUnit && record.linkedHorseId) {
        const horseRecord = dieselRecords.find(r => r.id === record.linkedHorseId);
        if (horseRecord?.tripId) {
          const trip = trips.find(t => t.id === horseRecord.tripId);
          if (trip) {
            const costEntry = trip.costs.find(c => 
              c.referenceNumber === `REEFER-DIESEL-${id}`
            );
            
            if (costEntry) {
              await deleteCostEntry(costEntry.id);
            }
          }
        }
      }
      // If it's a regular diesel record linked to a trip, remove the cost entry
      else if (record.tripId) {
        const trip = trips.find(t => t.id === record.tripId);
        if (trip) {
          const costEntry = trip.costs.find(c => 
            c.referenceNumber === `DIESEL-${id}`
          );
          
          if (costEntry) {
            await deleteCostEntry(costEntry.id);
          }
        }
      }
    }
    
    // Delete the diesel record from Firestore
    await deleteDieselFromFirebase(id);
  };
  
  const importDieselRecords = async (formData: FormData) => {
    // This would be implemented to handle CSV import
    console.log("Importing diesel records:", formData);
    // Placeholder for actual implementation
  };

  // Driver Behavior Event CRUD
  const addDriverBehaviorEvent = async (event: Omit<DriverBehaviorEvent, 'id'>, files?: FileList) => {
    await addDriverBehaviorEventToFirebase(removeUndefinedValues(event));
  };
  
  const updateDriverBehaviorEvent = async (event: DriverBehaviorEvent) => {
    await updateDriverBehaviorEventToFirebase(event.id, removeUndefinedValues(event));
  };
  
  const deleteDriverBehaviorEvent = async (id: string) => {
    await deleteDriverBehaviorEventToFirebase(id);
  };

  // CAR Report CRUD
  const addCARReport = async (report: Omit<CARReport, 'id'>, files?: FileList) => {
    await addCARReportToFirebase(removeUndefinedValues(report));
  };
  
  const updateCARReport = async (report: CARReport, files?: FileList) => {
    await updateCARReportInFirebase(report.id, removeUndefinedValues(report));
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
    try {
      // Generate a unique ID for the action item
      const newId = `AI${Date.now()}`;
      
      // Create the new action item
      const newActionItem: ActionItem = {
        ...itemData,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'Current User', // In a real app, use the logged-in user
      };
      
      // Add the action item to Firestore using setDoc with the ID
      setDoc(doc(db, 'actionItems', newId), removeUndefinedValues(newActionItem))
        .catch(error => {
          console.error("Error adding action item to Firestore:", error);
          throw error;
        });
      
      // Update local state
      setActionItems(prev => [...prev, newActionItem]);
      
      return newId;
    } catch (error) {
      console.error("Error adding action item:", error);
      throw error;
    }
  };

  const updateActionItem = async (item: ActionItem): Promise<void> => {
    try {
      // Update the action item in Firestore
      await updateDoc(doc(db, 'actionItems', item.id), {
        ...removeUndefinedValues(item),
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
      setActionItems(prev => 
        prev.map(ai => 
          ai.id === item.id 
            ? { ...item, updatedAt: new Date().toISOString() } 
            : ai
        )
      );
    } catch (error) {
      console.error("Error updating action item:", error);
      throw error;
    }
  };

  const deleteActionItem = async (id: string): Promise<void> => {
    try {
      // Delete the action item from Firestore
      await deleteDoc(doc(db, 'actionItems', id));
      
      // Update local state
      setActionItems(prev => prev.filter(ai => ai.id !== id));
    } catch (error) {
      console.error("Error deleting action item:", error);
      throw error;
    }
  };

  // Add comment to action item
  const addActionItemComment = async (itemId: string, comment: string): Promise<void> => {
    try {
      // Find the action item
      const item = actionItems.find(i => i.id === itemId);
      if (!item) {
        throw new Error("Action item not found");
      }
      
      // Create the new comment
      const newComment = {
        id: `comment-${Date.now()}`,
        comment,
        createdAt: new Date().toISOString(),
        createdBy: 'Current User' // In a real app, use the logged-in user
      };
      
      // Update the action item with the new comment
      const updatedItem = {
        ...item,
        comments: [...(item.comments || []), newComment],
        updatedAt: new Date().toISOString()
      };
      
      // Update the action item in Firestore
      await updateDoc(doc(db, 'actionItems', itemId), removeUndefinedValues(updatedItem));
      
      // Update local state
      setActionItems(prev => 
        prev.map(ai => 
          ai.id === itemId 
            ? updatedItem 
            : ai
        )
      );
    } catch (error) {
      console.error("Error adding comment to action item:", error);
      throw error;
    }
  };

  // Driver Behavior Event functions
  const addDriverBehaviorEvent = async (eventData: Omit<DriverBehaviorEvent, 'id'>, files?: FileList): Promise<string> => {
    const newId = `DB${Date.now()}`;
    const newEvent: DriverBehaviorEvent = {
      ...eventData,
      id: newId,
    };
    await addDriverBehaviorEventToFirebase(newEvent);
    return newId;
  };

  const updateDriverBehaviorEvent = async (event: DriverBehaviorEvent): Promise<void> => {
    await updateDriverBehaviorEventToFirebase(event.id, event);
  };

  const deleteDriverBehaviorEvent = async (id: string): Promise<void> => {
    await deleteDriverBehaviorEventToFirebase(id);
  };

  // Webhook import function for driver behavior events
  const importDriverBehaviorEventsFromWebhook = async (): Promise<{ imported: number; skipped: number }> => {
    try {
      const webhookUrl = 'https://script.google.com/macros/s/AKfycbw5_oPDd7wVIEOxf9rY6wKqUN1aNFuVqGrPl83Z2YKygZiHftyUxU-_sV4Wu_vY1h1vSg/exec';
      const response = await fetch(`${webhookUrl}?sheet=Data`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid response format from webhook');
      }

      let imported = 0;
      let skipped = 0;

      // Get existing events to check for duplicates based on count (column L)
      const existingEventCounts = driverBehaviorEvents.map(event => event.count).filter(count => count !== undefined);

      for (const row of data) {
        try {
          // Skip if event type is UNKNOWN (Column F)
          const eventType = row[5]; // Column F (0-indexed)
          if (!eventType || eventType.toString().toUpperCase() === 'UNKNOWN') {
            skipped++;
            continue;
          }

          // Skip if count already exists (Column L)
          const count = parseInt(row[11]); // Column L (0-indexed)
          if (isNaN(count) || existingEventCounts.includes(count)) {
            skipped++;
            continue;
          }

          // Create new driver behavior event
          const eventData: Omit<DriverBehaviorEvent, 'id'> = {
            reportedAt: row[0] || new Date().toISOString(), // Column A
            driverName: row[2] || '', // Column C
            eventDate: row[3] || '', // Column D
            eventTime: row[4] || '', // Column E
            eventType: eventType, // Column F
            description: eventType, // Column F (as per your requirement)
            fleetNumber: row[6] || '', // Column G
            location: row[7] || '', // Column H
            severity: row[8] || 'medium', // Column I
            status: row[9] || 'pending', // Column J
            points: parseInt(row[10]) || 0, // Column K
            count: count, // Column L
            reportedBy: 'Webhook Import',
            actionTaken: '',
            date: new Date().toISOString()
          };

          await addDriverBehaviorEvent(eventData);
          imported++;
          
          // Add to existing counts to prevent duplicates in same batch
          existingEventCounts.push(count);
          
        } catch (error) {
          console.error('Error processing row:', error, row);
          skipped++;
        }
      }

      return { imported, skipped };
    } catch (error) {
      console.error('Error importing driver behavior events from webhook:', error);
      throw error;
    }
  };

  // Webhook import function for active trips
  const importTripsFromWebhook = async (): Promise<{ imported: number; skipped: number }> => {
    try {
      const webhookUrl = 'https://script.google.com/macros/s/AKfycbxWt9XUjNLKwoT38iWuFh-h8Qs7PxCu2I-KGiJqspIm-jVxiSFeZ-KPOqeVoxxEbhv8/exec';
      const response = await fetch(`${webhookUrl}?sheet=Data`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trips data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid response format from trips webhook');
      }

      let imported = 0;
      let skipped = 0;

      // Get existing trip load references to check for duplicates
      const existingLoadReferences = trips.map(trip => trip.description).filter(desc => desc);

      for (const row of data) {
        try {
          // Extract data from columns
          const fleetNumber = row[0] || ''; // Column A
          const driverName = row[1] || ''; // Column B
          const clientType = row[2] || 'external'; // Column C
          const clientName = row[3] || ''; // Column D
          const loadReference = row[4] || ''; // Column E - unique identifier
          const route = row[5] || ''; // Column F
          const shippedStatus = row[6] || ''; // Column G
          const shippedDate = row[7] || ''; // Column H - start date
          const deliveredStatus = row[9] || ''; // Column J
          const deliveredDate = row[10] || ''; // Column K - end date

          // Skip if load reference is empty or already exists
          if (!loadReference || existingLoadReferences.includes(loadReference)) {
            skipped++;
            continue;
          }

          // Skip if not both SHIPPED and DELIVERED
          if (!shippedStatus || shippedStatus.toString().toUpperCase() !== 'SHIPPED') {
            skipped++;
            continue;
          }

          if (!deliveredStatus || deliveredStatus.toString().toUpperCase() !== 'DELIVERED') {
            skipped++;
            continue;
          }

          // Skip if missing required dates
          if (!shippedDate || !deliveredDate) {
            skipped++;
            continue;
          }

          // Skip if missing essential trip data
          if (!fleetNumber || !driverName || !clientName || !route) {
            skipped++;
            continue;
          }

          // Create new trip
          const tripData: Omit<Trip, 'id' | 'costs' | 'status'> = {
            fleetNumber: fleetNumber,
            driverName: driverName,
            clientName: clientName,
            clientType: clientType === 'internal' ? 'internal' : 'external',
            route: route,
            description: loadReference, // Use load reference as description for tracking
            startDate: shippedDate,
            endDate: deliveredDate,
            baseRevenue: 0, // Default to 0, can be updated later
            revenueCurrency: 'ZAR', // Default currency
            distanceKm: 0, // Default to 0, can be updated later
            additionalCosts: [],
            delayReasons: [],
            followUpHistory: [],
            paymentStatus: 'unpaid'
          };

          await addTrip(tripData);
          imported++;
          
          // Add to existing load references to prevent duplicates in same batch
          existingLoadReferences.push(loadReference);
          
        } catch (error) {
          console.error('Error processing trip row:', error, row);
          skipped++;
        }
      }

      return { imported, skipped };
    } catch (error) {
      console.error('Error importing trips from webhook:', error);
      throw error;
    }
  };

  const contextValue: AppContextType = {
    trips,
    addTrip,
    updateTrip,
    deleteTrip,
    bulkDeleteTrips,
    getTrip,
    addCostEntry,
    updateCostEntry,
    deleteCostEntry,
    completeTrip,
<<<<<<< HEAD
    updateInvoicePayment,
    allocateDieselToTrip,
    removeDieselFromTrip,
    importTripsFromCSV,
    updateTripStatus,
    addAdditionalCost,
    removeAdditionalCost,
    addDelayReason,
    missedLoads,
    addMissedLoad,
    updateMissedLoad,
    deleteMissedLoad,
    dieselRecords,
    addDieselRecord,
    updateDieselRecord,
    deleteDieselRecord,
    importDieselRecords,
=======
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89
    driverBehaviorEvents,
    addDriverBehaviorEvent,
    updateDriverBehaviorEvent,
    deleteDriverBehaviorEvent,
<<<<<<< HEAD
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
=======
    importDriverBehaviorEventsFromWebhook,
    importTripsFromWebhook,
    connectionStatus: "connected",
    isOnline: isOnline(),
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89
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