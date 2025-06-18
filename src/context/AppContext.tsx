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
  getDocs,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
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
  addTrip: (tripData: Omit<Trip, "id" | "costs" | "status">) => string;
  updateTrip: (trip: Trip) => void;
  deleteTrip: (id: string) => void;
  getTrip: (id: string) => Trip | undefined;

  addCostEntry: (costData: Omit<CostEntry, "id" | "attachments">, files?: FileList) => string;
  updateCostEntry: (updatedCost: CostEntry) => void;
  deleteCostEntry: (id: string) => void;

  completeTrip: (tripId: string) => void;
  updateInvoicePayment: (tripId: string, paymentData: any) => void;

  // Additional Cost Management
  addAdditionalCost: (tripId: string, cost: Omit<AdditionalCost, "id">, files?: FileList) => void;
  removeAdditionalCost: (tripId: string, costId: string) => void;

  // Delay Reasons
  addDelayReason: (tripId: string, delay: Omit<DelayReason, "id">) => void;

  // Missed Loads
  missedLoads: MissedLoad[];
  addMissedLoad: (missedLoad: Omit<MissedLoad, "id">) => string;
  updateMissedLoad: (missedLoad: MissedLoad) => void;
  deleteMissedLoad: (id: string) => void;

  // Diesel
  dieselRecords: DieselConsumptionRecord[];
  addDieselRecord: (record: Omit<DieselConsumptionRecord, "id">) => void;
  updateDieselRecord: (record: DieselConsumptionRecord) => void;
  deleteDieselRecord: (id: string) => void;
  allocateDieselToTrip: (dieselRecordId: string, tripId: string) => void;
  removeDieselFromTrip: (dieselRecordId: string) => void;
  importDieselRecords: (formData: FormData) => Promise<void>;

  // Driver Behavior Events
  driverBehaviorEvents: DriverBehaviorEvent[];
  addDriverBehaviorEvent: (event: Omit<DriverBehaviorEvent, 'id'>, files?: FileList) => void;
  updateDriverBehaviorEvent: (event: DriverBehaviorEvent) => void;
  deleteDriverBehaviorEvent: (id: string) => void;

  // Driver Performance
  getAllDriversPerformance: () => DriverPerformance[];

  // CAR Reports
  carReports: CARReport[];
  addCARReport: (report: Omit<CARReport, 'id'>, files?: FileList) => void;
  updateCARReport: (report: CARReport, files?: FileList) => void;
  deleteCARReport: (id: string) => void;

  // System Cost Rates
  systemCostRates: Record<'USD' | 'ZAR', SystemCostRates>;
  updateSystemCostRates: (currency: 'USD' | 'ZAR', rates: SystemCostRates) => void;

  // Action Items
  actionItems: ActionItem[];
  addActionItem: (item: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => string;
  updateActionItem: (item: ActionItem) => void;
  deleteActionItem: (id: string) => void;
  addActionItemComment: (itemId: string, comment: string) => void;

  // Import/Export
  importTripsFromCSV: (trips: any[]) => void;

  // Connection Status
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
  
  // System Cost Rates
  const [systemCostRates, setSystemCostRates] = useState<Record<'USD' | 'ZAR', SystemCostRates>>(DEFAULT_SYSTEM_COST_RATES);

  // Firestore realtime listeners setup
  useEffect(() => {
    console.log("Setting up Firestore listeners...");
    
    // Trips realtime sync
    const tripsUnsub = onSnapshot(collection(db, "trips"), (snapshot) => {
      console.log("Trips snapshot received:", snapshot.docs.length);
      const tripsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Trip[];
      setTrips(tripsData);
    }, (error) => {
      console.error("Trips listener error:", error);
      setConnectionStatus('disconnected');
    });

    // Missed Loads realtime sync
    const missedLoadsUnsub = onSnapshot(collection(db, "missedLoads"), (snapshot) => {
      console.log("Missed loads snapshot received:", snapshot.docs.length);
      const missedLoadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MissedLoad[];
      setMissedLoads(missedLoadsData);
    }, (error) => {
      console.error("Missed loads listener error:", error);
      setConnectionStatus('disconnected');
    });

    // Diesel Records realtime sync
    const dieselUnsub = onSnapshot(collection(db, "diesel"), (snapshot) => {
      console.log("Diesel records snapshot received:", snapshot.docs.length);
      const dieselData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DieselConsumptionRecord[];
      setDieselRecords(dieselData);
    }, (error) => {
      console.error("Diesel records listener error:", error);
      setConnectionStatus('disconnected');
    });
    
    // Driver Behavior Events realtime sync
    const driverBehaviorUnsub = onSnapshot(collection(db, "driverBehavior"), (snapshot) => {
      console.log("Driver behavior events snapshot received:", snapshot.docs.length);
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DriverBehaviorEvent[];
      setDriverBehaviorEvents(eventsData);
    }, (error) => {
      console.error("Driver behavior events listener error:", error);
      setConnectionStatus('disconnected');
    });

    // CAR Reports realtime sync
    const carReportsUnsub = onSnapshot(collection(db, "carReports"), (snapshot) => {
      console.log("CAR reports snapshot received:", snapshot.docs.length);
      const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CARReport[];
      setCARReports(reportsData);
    }, (error) => {
      console.error("CAR reports listener error:", error);
      setConnectionStatus('disconnected');
    });

    // Action Items realtime sync
    const actionItemsUnsub = onSnapshot(collection(db, 'actionItems'), (snapshot) => {
      console.log("Action items snapshot received:", snapshot.docs.length);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ActionItem[];
      setActionItems(items);
    }, (error) => {
      console.error("Action items listener error:", error);
      setConnectionStatus('disconnected');
    });

    // System Cost Rates sync
    const systemCostRatesUnsub = onSnapshot(collection(db, 'systemCostRates'), (snapshot) => {
      console.log("System cost rates snapshot received:", snapshot.docs.length);
      if (snapshot.docs.length > 0) {
        const ratesData = snapshot.docs.reduce((acc, doc) => {
          const data = doc.data() as SystemCostRates;
          if (data.currency === 'USD' || data.currency === 'ZAR') {
            acc[data.currency] = data;
          }
          return acc;
        }, {} as Record<'USD' | 'ZAR', SystemCostRates>);
        
        // Only update if we have data for both currencies
        if (ratesData.USD && ratesData.ZAR) {
          setSystemCostRates(ratesData);
        }
      }
    }, (error) => {
      console.error("System cost rates listener error:", error);
    });

    return () => {
      console.log("Cleaning up Firestore listeners...");
      tripsUnsub();
      missedLoadsUnsub();
      dieselUnsub();
      driverBehaviorUnsub();
      carReportsUnsub();
      actionItemsUnsub();
      systemCostRatesUnsub();
    };
  }, []);

  // Online/offline status monitor
  useEffect(() => {
    const handleOnline = () => {
      console.log("Browser went online");
      setConnectionStatus('reconnecting');
      enableNetwork(db)
        .then(() => {
          console.log("Firebase network enabled");
          setConnectionStatus('connected');
        })
        .catch((error) => {
          console.error("Failed to enable Firebase network:", error);
          setConnectionStatus('disconnected');
        });
    };
    
    const handleOffline = () => {
      console.log("Browser went offline");
      setConnectionStatus('disconnected');
      disableNetwork(db).catch(error => {
        console.error("Failed to disable Firebase network:", error);
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Trip Management
  const addTrip = (tripData: Omit<Trip, 'id' | 'costs' | 'status'>): string => {
    try {
      console.log("Adding new trip:", tripData);
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
      
      // Clean the object to remove undefined values
      const cleanedTrip = cleanObjectForFirestore(newTrip);
      
      // Add to Firestore
      addDoc(collection(db, "trips"), cleanedTrip)
        .then(docRef => {
          console.log("Trip added with ID:", docRef.id);
          // Update the ID to match Firestore
          updateDoc(docRef, { id: docRef.id });
        })
        .catch(error => {
          console.error("Error adding trip to Firestore:", error);
        });
      
      return newId;
    } catch (error) {
      console.error("Error in addTrip:", error);
      throw error;
    }
  };

  const updateTrip = (updatedTrip: Trip): void => {
    try {
      console.log("Updating trip:", updatedTrip.id);
      const tripDocRef = doc(db, "trips", updatedTrip.id);
      
      // Clean the object to remove undefined values
      const cleanedTrip = cleanObjectForFirestore(updatedTrip);
      
      updateDoc(tripDocRef, cleanedTrip)
        .then(() => {
          console.log("Trip updated successfully");
        })
        .catch(error => {
          console.error("Error updating trip in Firestore:", error);
        });
    } catch (error) {
      console.error("Error in updateTrip:", error);
      throw error;
    }
  };

  const deleteTrip = (id: string): void => {
    try {
      console.log("Deleting trip:", id);
      const tripDocRef = doc(db, "trips", id);
      deleteDoc(tripDocRef)
        .then(() => {
          console.log("Trip deleted successfully");
        })
        .catch(error => {
          console.error("Error deleting trip from Firestore:", error);
        });
    } catch (error) {
      console.error("Error in deleteTrip:", error);
      throw error;
    }
  };

  const getTrip = (id: string): Trip | undefined => {
    return trips.find(trip => trip.id === id);
  };

  // Cost Entry Management
  const addCostEntry = (costData: Omit<CostEntry, "id" | "attachments">, files?: FileList): string => {
    try {
      console.log("Adding cost entry to trip:", costData.tripId);
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

      const newCostEntry: CostEntry = {
        ...costData,
        id: newId,
        attachments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const trip = trips.find((t) => t.id === costData.tripId);
      if (!trip) {
        console.error("Trip not found:", costData.tripId);
        throw new Error("Trip not found");
      }

      const updatedCosts = [...(trip.costs || []), newCostEntry];
      const tripDocRef = doc(db, "trips", costData.tripId);

      // Clean the cost entry to remove undefined values
      const cleanedCostEntry = cleanObjectForFirestore(newCostEntry);
      const cleanedCosts = cleanObjectForFirestore(updatedCosts);

      updateDoc(tripDocRef, { costs: cleanedCosts })
        .then(() => {
          console.log("Cost entry added successfully");
        })
        .catch(error => {
          console.error("Error adding cost entry to Firestore:", error);
        });

      return newId;
    } catch (error) {
      console.error("Error in addCostEntry:", error);
      throw error;
    }
  };

  const updateCostEntry = (updatedCost: CostEntry): void => {
    try {
      console.log("Updating cost entry:", updatedCost.id);
      const trip = trips.find(t => t.id === updatedCost.tripId);
      if (!trip) {
        console.error("Trip not found:", updatedCost.tripId);
        throw new Error("Trip not found");
      }

      const updatedCosts = (trip.costs || []).map(cost => 
        cost.id === updatedCost.id ? { ...updatedCost, updatedAt: new Date().toISOString() } : cost
      );
      
      const tripDocRef = doc(db, "trips", updatedCost.tripId);
      
      // Clean the costs array to remove undefined values
      const cleanedCosts = cleanObjectForFirestore(updatedCosts);
      
      updateDoc(tripDocRef, { costs: cleanedCosts })
        .then(() => {
          console.log("Cost entry updated successfully");
        })
        .catch(error => {
          console.error("Error updating cost entry in Firestore:", error);
        });
    } catch (error) {
      console.error("Error in updateCostEntry:", error);
      throw error;
    }
  };

  const deleteCostEntry = (costEntryId: string): void => {
    try {
      console.log("Deleting cost entry:", costEntryId);
      const trip = trips.find(t => t.costs && t.costs.some(c => c.id === costEntryId));
      if (!trip) {
        console.error("Trip not found for cost entry:", costEntryId);
        throw new Error("Trip not found for cost entry");
      }
      
      const updatedCosts = (trip.costs || []).filter(c => c.id !== costEntryId);
      const tripDocRef = doc(db, "trips", trip.id);
      
      updateDoc(tripDocRef, { costs: updatedCosts })
        .then(() => {
          console.log("Cost entry deleted successfully");
        })
        .catch(error => {
          console.error("Error deleting cost entry from Firestore:", error);
        });
    } catch (error) {
      console.error("Error in deleteCostEntry:", error);
      throw error;
    }
  };

  // Additional Cost Management
  const addAdditionalCost = (tripId: string, cost: Omit<AdditionalCost, "id">, files?: FileList): void => {
    try {
      console.log("Adding additional cost to trip:", tripId);
      const trip = trips.find(t => t.id === tripId);
      if (!trip) {
        console.error("Trip not found:", tripId);
        throw new Error("Trip not found");
      }

      const newId = `AC${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Process supporting documents if files are provided
      const supportingDocuments = files
        ? Array.from(files).map((file, index) => ({
            id: `SD${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
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
        ...cost,
        id: newId,
        supportingDocuments,
      };

      const updatedAdditionalCosts = [...(trip.additionalCosts || []), newCost];
      const tripDocRef = doc(db, "trips", tripId);
      
      // Clean the additional costs array to remove undefined values
      const cleanedAdditionalCosts = cleanObjectForFirestore(updatedAdditionalCosts);
      
      updateDoc(tripDocRef, { additionalCosts: cleanedAdditionalCosts })
        .then(() => {
          console.log("Additional cost added successfully");
        })
        .catch(error => {
          console.error("Error adding additional cost to Firestore:", error);
        });
    } catch (error) {
      console.error("Error in addAdditionalCost:", error);
      throw error;
    }
  };

  const removeAdditionalCost = (tripId: string, costId: string): void => {
    try {
      console.log("Removing additional cost:", costId, "from trip:", tripId);
      const trip = trips.find(t => t.id === tripId);
      if (!trip) {
        console.error("Trip not found:", tripId);
        throw new Error("Trip not found");
      }

      const updatedAdditionalCosts = (trip.additionalCosts || []).filter(c => c.id !== costId);
      const tripDocRef = doc(db, "trips", tripId);
      
      updateDoc(tripDocRef, { additionalCosts: updatedAdditionalCosts })
        .then(() => {
          console.log("Additional cost removed successfully");
        })
        .catch(error => {
          console.error("Error removing additional cost from Firestore:", error);
        });
    } catch (error) {
      console.error("Error in removeAdditionalCost:", error);
      throw error;
    }
  };

  // Delay Reasons
  const addDelayReason = (tripId: string, delay: Omit<DelayReason, "id">): void => {
    try {
      console.log("Adding delay reason to trip:", tripId);
      const trip = trips.find(t => t.id === tripId);
      if (!trip) {
        console.error("Trip not found:", tripId);
        throw new Error("Trip not found");
      }

      const newId = `DR${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newDelay: DelayReason = {
        ...delay,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedDelayReasons = [...(trip.delayReasons || []), newDelay];
      const tripDocRef = doc(db, "trips", tripId);
      
      // Clean the delay reasons array to remove undefined values
      const cleanedDelayReasons = cleanObjectForFirestore(updatedDelayReasons);
      
      updateDoc(tripDocRef, { delayReasons: cleanedDelayReasons })
        .then(() => {
          console.log("Delay reason added successfully");
        })
        .catch(error => {
          console.error("Error adding delay reason to Firestore:", error);
        });
    } catch (error) {
      console.error("Error in addDelayReason:", error);
      throw error;
    }
  };

  // Complete Trip
  const completeTrip = (tripId: string): void => {
    try {
      console.log("Completing trip:", tripId);
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) {
        console.error("Trip not found:", tripId);
        throw new Error("Trip not found");
      }

      const unresolvedFlags = trip.costs?.some(
        (cost) => cost.isFlagged && cost.investigationStatus !== "resolved"
      );
      
      if (unresolvedFlags) {
        console.error("Cannot complete trip: unresolved flagged cost entries present");
        throw new Error(
          "Cannot complete trip: unresolved flagged cost entries present"
        );
      }

      const tripDocRef = doc(db, "trips", tripId);
      updateDoc(tripDocRef, {
        status: "completed",
        completedAt: new Date().toISOString(),
        completedBy: "Current User", // In a real app, use the logged-in user
      })
        .then(() => {
          console.log("Trip completed successfully");
        })
        .catch(error => {
          console.error("Error completing trip in Firestore:", error);
        });
    } catch (error) {
      console.error("Error in completeTrip:", error);
      throw error;
    }
  };

  // Invoice Payment Update
  const updateInvoicePayment = (tripId: string, paymentData: any): void => {
    try {
      console.log("Updating invoice payment for trip:", tripId);
      const trip = trips.find(t => t.id === tripId);
      if (!trip) {
        console.error("Trip not found:", tripId);
        throw new Error("Trip not found");
      }

      const tripDocRef = doc(db, "trips", tripId);
      
      // Clean the payment data to remove undefined values
      const cleanedPaymentData = cleanObjectForFirestore({
        paymentStatus: paymentData.paymentStatus,
        paymentAmount: paymentData.paymentAmount,
        paymentReceivedDate: paymentData.paymentReceivedDate,
        paymentNotes: paymentData.paymentNotes,
        paymentMethod: paymentData.paymentMethod,
        bankReference: paymentData.bankReference,
        updatedAt: new Date().toISOString(),
      });
      
      updateDoc(tripDocRef, cleanedPaymentData)
        .then(() => {
          console.log("Invoice payment updated successfully");
        })
        .catch(error => {
          console.error("Error updating invoice payment in Firestore:", error);
        });
    } catch (error) {
      console.error("Error in updateInvoicePayment:", error);
      throw error;
    }
  };

  // Missed Loads Management
  const addMissedLoad = (missedLoadData: Omit<MissedLoad, "id">): string => {
    try {
      console.log("Adding missed load:", missedLoadData);
      const newId = `ML${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newMissedLoad: MissedLoad = {
        ...missedLoadData,
        id: newId,
      };
      
      // Clean the missed load to remove undefined values
      const cleanedMissedLoad = cleanObjectForFirestore(newMissedLoad);
      
      // Add to Firestore
      addDoc(collection(db, "missedLoads"), cleanedMissedLoad)
        .then(docRef => {
          console.log("Missed load added with ID:", docRef.id);
          // Update the ID to match Firestore
          updateDoc(docRef, { id: docRef.id });
        })
        .catch(error => {
          console.error("Error adding missed load to Firestore:", error);
        });
      
      return newId;
    } catch (error) {
      console.error("Error in addMissedLoad:", error);
      throw error;
    }
  };

  const updateMissedLoad = (missedLoad: MissedLoad): void => {
    try {
      console.log("Updating missed load:", missedLoad.id);
      const missedLoadDocRef = doc(db, "missedLoads", missedLoad.id);
      
      // Clean the missed load to remove undefined values
      const cleanedMissedLoad = cleanObjectForFirestore(missedLoad);
      
      updateDoc(missedLoadDocRef, cleanedMissedLoad)
        .then(() => {
          console.log("Missed load updated successfully");
        })
        .catch(error => {
          console.error("Error updating missed load in Firestore:", error);
        });
    } catch (error) {
      console.error("Error in updateMissedLoad:", error);
      throw error;
    }
  };

  const deleteMissedLoad = (id: string): void => {
    try {
      console.log("Deleting missed load:", id);
      const missedLoadDocRef = doc(db, "missedLoads", id);
      deleteDoc(missedLoadDocRef)
        .then(() => {
          console.log("Missed load deleted successfully");
        })
        .catch(error => {
          console.error("Error deleting missed load from Firestore:", error);
        });
    } catch (error) {
      console.error("Error in deleteMissedLoad:", error);
      throw error;
    }
  };

  // Diesel Management
  const addDieselRecord = (record: Omit<DieselConsumptionRecord, "id">): void => {
    try {
      console.log("Adding diesel record:", record);
      const newId = `DR${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newRecord: DieselConsumptionRecord = {
        ...record,
        id: newId,
      };
      
      // Clean the diesel record to remove undefined values
      const cleanedRecord = cleanObjectForFirestore(newRecord);
      
      // Add to Firestore
      addDoc(collection(db, "diesel"), cleanedRecord)
        .then(docRef => {
          console.log("Diesel record added with ID:", docRef.id);
          // Update the ID to match Firestore
          updateDoc(docRef, { id: docRef.id });
        })
        .catch(error => {
          console.error("Error adding diesel record to Firestore:", error);
        });
    } catch (error) {
      console.error("Error in addDieselRecord:", error);
      throw error;
    }
  };

  const updateDieselRecord = (record: DieselConsumptionRecord): void => {
    try {
      console.log("Updating diesel record:", record.id);
      const recordDocRef = doc(db, "diesel", record.id);
      
      // Clean the diesel record to remove undefined values
      const cleanedRecord = cleanObjectForFirestore(record);
      
      updateDoc(recordDocRef, cleanedRecord)
        .then(() => {
          console.log("Diesel record updated successfully");
        })
        .catch(error => {
          console.error("Error updating diesel record in Firestore:", error);
        });
    } catch (error) {
      console.error("Error in updateDieselRecord:", error);
      throw error;
    }
  };

  const deleteDieselRecord = (id: string): void => {
    try {
      console.log("Deleting diesel record:", id);
      const recordDocRef = doc(db, "diesel", id);
      deleteDoc(recordDocRef)
        .then(() => {
          console.log("Diesel record deleted successfully");
        })
        .catch(error => {
          console.error("Error deleting diesel record from Firestore:", error);
        });
    } catch (error) {
      console.error("Error in deleteDieselRecord:", error);
      throw error;
    }
  };

  const allocateDieselToTrip = (dieselRecordId: string, tripId: string): void => {
    try {
      console.log("Allocating diesel record to trip:", dieselRecordId, tripId);
      const record = dieselRecords.find(r => r.id === dieselRecordId);
      if (!record) {
        console.error("Diesel record not found:", dieselRecordId);
        throw new Error("Diesel record not found");
      }
      
      const trip = trips.find(t => t.id === tripId);
      if (!trip) {
        console.error("Trip not found:", tripId);
        throw new Error("Trip not found");
      }
      
      // Update diesel record with trip ID
      const recordDocRef = doc(db, "diesel", dieselRecordId);
      updateDoc(recordDocRef, { tripId })
        .then(() => {
          console.log("Diesel record allocated to trip successfully");
          
          // Create a cost entry for this diesel record
          const costData: Omit<CostEntry, "id" | "attachments"> = {
            tripId,
            category: "Fuel",
            subCategory: "Diesel",
            amount: record.totalCost,
            currency: trip.revenueCurrency,
            referenceNumber: `FUEL-${record.fleetNumber}-${new Date(record.date).toISOString().split('T')[0]}`,
            date: record.date,
            notes: `Diesel purchase at ${record.fuelStation} - ${record.litresFilled} liters`,
            isFlagged: false,
            isSystemGenerated: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          addCostEntry(costData);
        })
        .catch(error => {
          console.error("Error allocating diesel record to trip in Firestore:", error);
        });
    } catch (error) {
      console.error("Error in allocateDieselToTrip:", error);
      throw error;
    }
  };

  const removeDieselFromTrip = (dieselRecordId: string): void => {
    try {
      console.log("Removing diesel record from trip:", dieselRecordId);
      const record = dieselRecords.find(r => r.id === dieselRecordId);
      if (!record || !record.tripId) {
        console.error("Diesel record not found or not linked to a trip:", dieselRecordId);
        throw new Error("Diesel record not found or not linked to a trip");
      }
      
      // Update diesel record to remove trip ID
      const recordDocRef = doc(db, "diesel", dieselRecordId);
      updateDoc(recordDocRef, { tripId: null })
        .then(() => {
          console.log("Diesel record removed from trip successfully");
          
          // Find and remove the associated cost entry
          const trip = trips.find(t => t.id === record.tripId);
          if (trip) {
            const costEntry = trip.costs.find(c => 
              c.category === "Fuel" && 
              c.subCategory === "Diesel" && 
              c.referenceNumber.includes(record.fleetNumber) &&
              c.date === record.date
            );
            
            if (costEntry) {
              deleteCostEntry(costEntry.id);
            }
          }
        })
        .catch(error => {
          console.error("Error removing diesel record from trip in Firestore:", error);
        });
    } catch (error) {
      console.error("Error in removeDieselFromTrip:", error);
      throw error;
    }
  };

  const importDieselRecords = async (formData: FormData): Promise<void> => {
    try {
      console.log("Importing diesel records from CSV");
      // In a real implementation, this would parse the CSV file and add records
      // For now, we'll just simulate the import
      alert("Diesel records imported successfully");
    } catch (error) {
      console.error("Error in importDieselRecords:", error);
      throw error;
    }
  };

  // Driver Behavior Events
  const addDriverBehaviorEvent = (event: Omit<DriverBehaviorEvent, 'id'>, files?: FileList): void => {
    try {
      console.log("Adding driver behavior event:", event);
      const newId = `DBE${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Process attachments if files are provided
      const attachments: Attachment[] = files
        ? Array.from(files).map((file, index) => ({
            id: `A${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
            filename: file.name,
            fileUrl: URL.createObjectURL(file),
            fileType: file.type,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
            fileData: "",
          }))
        : [];

      const newEvent: DriverBehaviorEvent = {
        ...event,
        id: newId,
        attachments,
        resolved: false,
        date: new Date().toISOString(), // Add date field for compatibility
      };
      
      // Clean the event to remove undefined values
      const cleanedEvent = cleanObjectForFirestore(newEvent);
      
      // Add to Firestore
      addDoc(collection(db, "driverBehavior"), cleanedEvent)
        .then(docRef => {
          console.log("Driver behavior event added with ID:", docRef.id);
          // Update the ID to match Firestore
          updateDoc(docRef, { id: docRef.id });
        })
        .catch(error => {
          console.error("Error adding driver behavior event to Firestore:", error);
        });
    } catch (error) {
      console.error("Error in addDriverBehaviorEvent:", error);
      throw error;
    }
  };

  const updateDriverBehaviorEvent = (event: DriverBehaviorEvent): void => {
    try {
      console.log("Updating driver behavior event:", event.id);
      const eventDocRef = doc(db, "driverBehavior", event.id);
      
      // Clean the event to remove undefined values
      const cleanedEvent = cleanObjectForFirestore(event);
      
      updateDoc(eventDocRef, cleanedEvent)
        .then(() => {
          console.log("Driver behavior event updated successfully");
        })
        .catch(error => {
          console.error("Error updating driver behavior event in Firestore:", error);
        });
    } catch (error) {
      console.error("Error in updateDriverBehaviorEvent:", error);
      throw error;
    }
  };

  const deleteDriverBehaviorEvent = (id: string): void => {
    try {
      console.log("Deleting driver behavior event:", id);
      const eventDocRef = doc(db, "driverBehavior", id);
      deleteDoc(eventDocRef)
        .then(() => {
          console.log("Driver behavior event deleted successfully");
        })
        .catch(error => {
          console.error("Error deleting driver behavior event from Firestore:", error);
        });
    } catch (error) {
      console.error("Error in deleteDriverBehaviorEvent:", error);
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

  // CAR Reports
  const addCARReport = (report: Omit<CARReport, 'id'>, files?: FileList): void => {
    try {
      console.log("Adding CAR report:", report);
      const newId = `CAR${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Process attachments if files are provided
      const attachments: Attachment[] = files
        ? Array.from(files).map((file, index) => ({
            id: `A${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
            filename: file.name,
            fileUrl: URL.createObjectURL(file),
            fileType: file.type,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
            fileData: "",
          }))
        : [];

      const newReport: CARReport = {
        ...report,
        id: newId,
        attachments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Clean the report to remove undefined values
      const cleanedReport = cleanObjectForFirestore(newReport);
      
      // Add to Firestore
      addDoc(collection(db, "carReports"), cleanedReport)
        .then(docRef => {
          console.log("CAR report added with ID:", docRef.id);
          // Update the ID to match Firestore
          updateDoc(docRef, { id: docRef.id });
          
          // If this report is linked to a driver behavior event, update the event
          if (report.referenceEventId) {
            const eventDocRef = doc(db, "driverBehavior", report.referenceEventId);
            updateDoc(eventDocRef, { carReportId: docRef.id });
          }
        })
        .catch(error => {
          console.error("Error adding CAR report to Firestore:", error);
        });
    } catch (error) {
      console.error("Error in addCARReport:", error);
      throw error;
    }
  };

  const updateCARReport = (report: CARReport, files?: FileList): void => {
    try {
      console.log("Updating CAR report:", report.id);
      
      // Process new attachments if files are provided
      const newAttachments: Attachment[] = files
        ? Array.from(files).map((file, index) => ({
            id: `A${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
            filename: file.name,
            fileUrl: URL.createObjectURL(file),
            fileType: file.type,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
            fileData: "",
          }))
        : [];

      const updatedReport: CARReport = {
        ...report,
        attachments: [...(report.attachments || []), ...newAttachments],
        updatedAt: new Date().toISOString(),
      };
      
      // Clean the report to remove undefined values
      const cleanedReport = cleanObjectForFirestore(updatedReport);
      
      const reportDocRef = doc(db, "carReports", report.id);
      updateDoc(reportDocRef, cleanedReport)
        .then(() => {
          console.log("CAR report updated successfully");
        })
        .catch(error => {
          console.error("Error updating CAR report in Firestore:", error);
        });
    } catch (error) {
      console.error("Error in updateCARReport:", error);
      throw error;
    }
  };

  const deleteCARReport = (id: string): void => {
    try {
      console.log("Deleting CAR report:", id);
      const report = carReports.find(r => r.id === id);
      if (!report) {
        console.error("CAR report not found:", id);
        throw new Error("CAR report not found");
      }
      
      const reportDocRef = doc(db, "carReports", id);
      deleteDoc(reportDocRef)
        .then(() => {
          console.log("CAR report deleted successfully");
          
          // If this report is linked to a driver behavior event, update the event
          if (report.referenceEventId) {
            const eventDocRef = doc(db, "driverBehavior", report.referenceEventId);
            updateDoc(eventDocRef, { carReportId: null });
          }
        })
        .catch(error => {
          console.error("Error deleting CAR report from Firestore:", error);
        });
    } catch (error) {
      console.error("Error in deleteCARReport:", error);
      throw error;
    }
  };

  // System Cost Rates
  const updateSystemCostRates = (currency: 'USD' | 'ZAR', rates: SystemCostRates): void => {
    try {
      console.log("Updating system cost rates for currency:", currency);
      setSystemCostRates(prev => ({
        ...prev,
        [currency]: rates,
      }));
      
      // Clean the rates to remove undefined values
      const cleanedRates = cleanObjectForFirestore(rates);
      
      // Save to Firestore
      const ratesDocRef = doc(db, "systemCostRates", currency);
      setDoc(ratesDocRef, cleanedRates)
        .then(() => {
          console.log("System cost rates updated successfully");
        })
        .catch(error => {
          console.error("Error updating system cost rates in Firestore:", error);
        });
    } catch (error) {
      console.error("Error in updateSystemCostRates:", error);
      throw error;
    }
  };

  // Action Items
  const addActionItem = (itemData: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): string => {
    try {
      console.log("Adding action item:", itemData);
      const newId = `AI${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newItem: ActionItem = {
        ...itemData,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'Current User', // Replace with real user info
      };
      
      // Clean the item to remove undefined values
      const cleanedItem = cleanObjectForFirestore(newItem);
      
      // Add to Firestore
      addDoc(collection(db, "actionItems"), cleanedItem)
        .then(docRef => {
          console.log("Action item added with ID:", docRef.id);
          // Update the ID to match Firestore
          updateDoc(docRef, { id: docRef.id });
        })
        .catch(error => {
          console.error("Error adding action item to Firestore:", error);
        });
      
      return newId;
    } catch (error) {
      console.error("Error in addActionItem:", error);
      throw error;
    }
  };

  const updateActionItem = (item: ActionItem): void => {
    try {
      console.log("Updating action item:", item.id);
      const itemDocRef = doc(db, "actionItems", item.id);
      
      // Clean the item to remove undefined values
      const cleanedItem = cleanObjectForFirestore({
        ...item,
        updatedAt: new Date().toISOString(),
      });
      
      updateDoc(itemDocRef, cleanedItem)
        .then(() => {
          console.log("Action item updated successfully");
        })
        .catch(error => {
          console.error("Error updating action item in Firestore:", error);
        });
    } catch (error) {
      console.error("Error in updateActionItem:", error);
      throw error;
    }
  };

  const deleteActionItem = (id: string): void => {
    try {
      console.log("Deleting action item:", id);
      const itemDocRef = doc(db, "actionItems", id);
      deleteDoc(itemDocRef)
        .then(() => {
          console.log("Action item deleted successfully");
        })
        .catch(error => {
          console.error("Error deleting action item from Firestore:", error);
        });
    } catch (error) {
      console.error("Error in deleteActionItem:", error);
      throw error;
    }
  };

  const addActionItemComment = (itemId: string, comment: string): void => {
    try {
      console.log("Adding comment to action item:", itemId);
      const item = actionItems.find(i => i.id === itemId);
      if (!item) {
        console.error("Action item not found:", itemId);
        throw new Error("Action item not found");
      }
      
      const newComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        comment,
        createdAt: new Date().toISOString(),
        createdBy: 'Current User' // Replace with real user info
      };
      
      const updatedItem = {
        ...item,
        comments: [...(item.comments || []), newComment],
        updatedAt: new Date().toISOString()
      };
      
      // Clean the item to remove undefined values
      const cleanedItem = cleanObjectForFirestore(updatedItem);
      
      const itemDocRef = doc(db, "actionItems", itemId);
      updateDoc(itemDocRef, cleanedItem)
        .then(() => {
          console.log("Action item comment added successfully");
        })
        .catch(error => {
          console.error("Error adding action item comment to Firestore:", error);
        });
    } catch (error) {
      console.error("Error in addActionItemComment:", error);
      throw error;
    }
  };

  // Import/Export
  const importTripsFromCSV = (tripsData: any[]): void => {
    try {
      console.log("Importing trips from CSV:", tripsData.length);
      tripsData.forEach(tripData => {
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
        
        // Clean the trip to remove undefined values
        const cleanedTrip = cleanObjectForFirestore(newTrip);
        
        // Add to Firestore
        addDoc(collection(db, "trips"), cleanedTrip)
          .then(docRef => {
            console.log("Imported trip added with ID:", docRef.id);
            // Update the ID to match Firestore
            updateDoc(docRef, { id: docRef.id });
          })
          .catch(error => {
            console.error("Error adding imported trip to Firestore:", error);
          });
      });
    } catch (error) {
      console.error("Error in importTripsFromCSV:", error);
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
    allocateDieselToTrip,
    removeDieselFromTrip,
    importDieselRecords,
    driverBehaviorEvents,
    addDriverBehaviorEvent,
    updateDriverBehaviorEvent,
    deleteDriverBehaviorEvent,
    getAllDriversPerformance,
    carReports,
    addCARReport,
    updateCARReport,
    deleteCARReport,
    systemCostRates,
    updateSystemCostRates,
    actionItems,
    addActionItem,
    updateActionItem,
    deleteActionItem,
    addActionItemComment,
    importTripsFromCSV,
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