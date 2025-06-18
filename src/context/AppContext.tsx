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

interface AppContextType {
  trips: Trip[];
  addTrip: (tripData: Omit<Trip, "id" | "costs" | "status">) => string;
  updateTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  getTrip: (id: string) => Trip | undefined;

  addCostEntry: (
    costData: Omit<CostEntry, "id" | "attachments">, 
    files?: FileList
  ) => string;
  updateCostEntry: (costEntry: CostEntry) => Promise<void>;
  deleteCostEntry: (id: string) => Promise<void>;

  completeTrip: (tripId: string) => Promise<void>;
  updateInvoicePayment: (tripId: string, paymentData: any) => Promise<void>;
  allocateDieselToTrip: (dieselId: string, tripId: string) => Promise<void>;
  removeDieselFromTrip: (dieselId: string) => Promise<void>;
  importTripsFromCSV: (trips: any[]) => Promise<void>;

  // Additional Cost Management
  addAdditionalCost: (tripId: string, cost: Omit<AdditionalCost, "id">, files?: FileList) => Promise<string>;
  removeAdditionalCost: (tripId: string, costId: string) => Promise<void>;

  // Delay Reasons
  addDelayReason: (tripId: string, delay: Omit<DelayReason, "id">) => Promise<string>;

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
  updateSystemCostRates: (currency: 'USD' | 'ZAR', rates: SystemCostRates) => void;

  // Action Items
  actionItems: ActionItem[];
  addActionItem: (item: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => string;
  updateActionItem: (item: ActionItem) => Promise<void>;
  deleteActionItem: (id: string) => Promise<void>;
  addActionItemComment: (itemId: string, comment: string) => Promise<void>;

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

  const addTrip = (tripData: Omit<Trip, 'id' | 'costs' | 'status'>): string => {
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
    const cleanTrip = removeUndefinedValues(newTrip);
    setDoc(doc(db, "trips", newId), cleanTrip)
      .catch(error => {
        console.error("Error adding trip to Firestore:", error);
        throw error;
      });
    
    // Update local state
    setTrips(prev => [...prev, newTrip]);
    
    return newId;
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
      await deleteDoc(doc(db, "trips", id));
      setTrips(prev => prev.filter(trip => trip.id !== id));
    } catch (error) {
      console.error("Error deleting trip:", error);
      throw error;
    }
  };

  const getTrip = (id: string): Trip | undefined => {
    return trips.find(trip => trip.id === id);
  };

  // Cost Entry Firestore update helpers:

  const addCostEntry = (
    costData: Omit<CostEntry, "id" | "attachments">,
    files?: FileList
  ): string => {
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
      const trip = trips.find((t) => t.id === costData.tripId);
      if (!trip) {
        throw new Error("Trip document not found in database. Please refresh and try again.");
      }

      // Add the cost entry to the trip's costs array
      const updatedCosts = [...(trip.costs || []), newCostEntry];
      
      // Remove undefined values before updating Firestore
      const cleanCostEntry = removeUndefinedValues(newCostEntry);
      const cleanCosts = updatedCosts.map(cost => removeUndefinedValues(cost));
      
      // Update the trip document in Firestore
      updateDoc(doc(db, "trips", costData.tripId), { costs: cleanCosts })
        .catch(error => {
          console.error("Error adding cost entry to Firestore:", error);
          throw error;
        });
      
      // Update local state
      setTrips(prev => 
        prev.map(t => 
          t.id === costData.tripId 
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

      // Check for unresolved flags
      const unresolvedFlags = trip.costs?.some(
        (cost) => cost.isFlagged && cost.investigationStatus !== "resolved"
      );
      if (unresolvedFlags) {
        throw new Error(
          "Cannot complete trip: unresolved flagged cost entries present"
        );
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
      addCostEntry(costData);
      
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
        tripId: null,
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

  const addMissedLoad = (missedLoadData: Omit<MissedLoad, "id">): string => {
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
      addDoc(collection(db, "missedLoads"), sanitized)
        .catch(error => {
          console.error("Error adding missed load to Firestore:", error);
          throw error;
        });
      
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
    await addDieselToFirebase(removeUndefinedValues(record));
  };
  
  const updateDieselRecord = async (record: DieselConsumptionRecord) => {
    await updateDieselInFirebase(record.id, removeUndefinedValues(record));
  };
  
  const deleteDieselRecord = async (id: string) => {
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
      
      // Add the action item to Firestore
      addDoc(collection(db, 'actionItems'), removeUndefinedValues(newActionItem))
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
    updateInvoicePayment,
    allocateDieselToTrip,
    removeDieselFromTrip,
    importTripsFromCSV,
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