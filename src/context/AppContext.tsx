import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trip, CostEntry, Attachment, AdditionalCost, DelayReason, MissedLoad, DieselConsumptionRecord, DriverBehaviorEvent, ActionItem, CARReport } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { 
  db, 
  tripsCollection, 
  dieselCollection, 
  missedLoadsCollection,
  driverBehaviorCollection,
  actionItemsCollection,
  carReportsCollection,
  listenToTrips,
  listenToDieselRecords,
  listenToMissedLoads,
  listenToDriverBehaviorEvents,
  listenToActionItems,
  listenToCARReports,
  addTripToFirebase,
  updateTripInFirebase,
  deleteTripFromFirebase,
  addDieselToFirebase,
  updateDieselInFirebase,
  deleteDieselFromFirebase,
  addMissedLoadToFirebase,
  updateMissedLoadInFirebase,
  deleteMissedLoadFromFirebase,
  addDriverBehaviorEventToFirebase,
  updateDriverBehaviorEventToFirebase,
  deleteDriverBehaviorEventToFirebase,
  addActionItemToFirebase,
  updateActionItemInFirebase,
  deleteActionItemFromFirebase,
  addCARReportToFirebase,
  updateCARReportInFirebase,
  deleteCARReportFromFirebase,
  monitorConnectionStatus,
  enableFirestoreNetwork,
  disableFirestoreNetwork
} from '../firebase';
import { doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection } from 'firebase/firestore';
import { generateTripId, shouldAutoCompleteTrip, isOnline } from '../utils/helpers';

interface AppContextType {
  trips: Trip[];
  addTrip: (trip: Omit<Trip, 'id' | 'costs' | 'status'>) => string;
  updateTrip: (trip: Trip) => void;
  deleteTrip: (id: string) => void;
  getTrip: (id: string) => Trip | undefined;
  
  addCostEntry: (costEntry: Omit<CostEntry, 'id' | 'attachments'>, files?: FileList) => string;
  updateCostEntry: (costEntry: CostEntry) => void;
  deleteCostEntry: (id: string) => void;
  
  addAttachment: (attachment: Omit<Attachment, 'id'>) => string;
  deleteAttachment: (id: string) => void;
  
  // Additional cost management
  addAdditionalCost: (tripId: string, cost: Omit<AdditionalCost, 'id'>, files?: FileList) => string;
  removeAdditionalCost: (tripId: string, costId: string) => void;
  
  // Delay reason management
  addDelayReason: (tripId: string, delay: Omit<DelayReason, 'id'>) => string;
  
  // Missed load management
  missedLoads: MissedLoad[];
  addMissedLoad: (missedLoad: Omit<MissedLoad, 'id'>) => string;
  updateMissedLoad: (missedLoad: MissedLoad) => void;
  deleteMissedLoad: (id: string) => void;
  
  // Payment management
  updateInvoicePayment: (tripId: string, paymentData: {
    paymentStatus: 'unpaid' | 'partial' | 'paid';
    paymentAmount?: number;
    paymentReceivedDate?: string;
    paymentNotes?: string;
    paymentMethod?: string;
    bankReference?: string;
  }) => void;

  // CSV Import functions
  importTripsFromCSV: (trips: Omit<Trip, 'id' | 'costs' | 'status'>[]) => void;
  importCostsFromCSV: (costs: Omit<CostEntry, 'id' | 'attachments'>[]) => void;
  
  // Diesel consumption management
  dieselRecords: DieselConsumptionRecord[];
  addDieselRecord: (record: Omit<DieselConsumptionRecord, 'id'>) => string;
  updateDieselRecord: (record: DieselConsumptionRecord) => void;
  deleteDieselRecord: (id: string) => void;
  importDieselFromCSV: (records: Omit<DieselConsumptionRecord, 'id'>[]) => void;
  
  // Diesel debrief management
  updateDieselDebrief: (recordId: string, debriefData: {
    debriefDate: string;
    debriefNotes: string;
    debriefSignedBy?: string;
    debriefSignedAt?: string;
  }) => void;
  
  // Diesel trip cost allocation
  allocateDieselToTrip: (dieselId: string, tripId: string) => void;
  removeDieselFromTrip: (dieselId: string) => void;
  
  // Driver behavior management
  driverBehaviorEvents: DriverBehaviorEvent[];
  addDriverBehaviorEvent: (event: Omit<DriverBehaviorEvent, 'id'>, files?: FileList) => string;
  updateDriverBehaviorEvent: (event: DriverBehaviorEvent) => void;
  deleteDriverBehaviorEvent: (id: string) => void;
  getDriverPerformance: (driverName: string) => {
    driverName: string;
    behaviorScore: number;
    totalBehaviorEvents: number;
    totalPoints: number;
    totalTrips: number;
    totalDistance: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    improvementTrend: 'improving' | 'stable' | 'declining';
  };
  getAllDriversPerformance: () => Array<{
    driverName: string;
    behaviorScore: number;
    totalBehaviorEvents: number;
    totalPoints: number;
    totalTrips: number;
    totalDistance: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    improvementTrend: 'improving' | 'stable' | 'declining';
  }>;
  
  // Action items management
  actionItems: ActionItem[];
  addActionItem: (item: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => string;
  updateActionItem: (item: ActionItem) => void;
  deleteActionItem: (id: string) => void;
  addActionItemComment: (itemId: string, comment: string) => void;
  
  // CAR reports management
  carReports: CARReport[];
  addCARReport: (report: Omit<CARReport, 'id' | 'createdAt' | 'updatedAt'>, files?: FileList) => string;
  updateCARReport: (report: CARReport, files?: FileList) => void;
  deleteCARReport: (id: string) => void;
  
  // Connection status
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  isOnline: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [missedLoads, setMissedLoads] = useState<MissedLoad[]>([]);
  const [dieselRecords, setDieselRecords] = useState<DieselConsumptionRecord[]>([]);
  const [driverBehaviorEvents, setDriverBehaviorEvents] = useState<DriverBehaviorEvent[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [carReports, setCARReports] = useState<CARReport[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  
  // Initialize with real-time data from Firebase
  useEffect(() => {
    // Listen for trips
    const unsubscribeTrips = listenToTrips((fetchedTrips) => {
      setTrips(fetchedTrips);
    }, (error) => {
      console.error("Error in trips listener:", error);
      setConnectionStatus('disconnected');
    });
    
    // Listen for missed loads
    const unsubscribeMissedLoads = listenToMissedLoads((fetchedLoads) => {
      setMissedLoads(fetchedLoads);
    }, (error) => {
      console.error("Error in missed loads listener:", error);
    });
    
    // Listen for diesel records
    const unsubscribeDiesel = listenToDieselRecords((fetchedRecords) => {
      setDieselRecords(fetchedRecords);
    }, (error) => {
      console.error("Error in diesel records listener:", error);
    });
    
    // Listen for driver behavior events
    const unsubscribeDriverBehavior = listenToDriverBehaviorEvents((fetchedEvents) => {
      setDriverBehaviorEvents(fetchedEvents);
    }, (error) => {
      console.error("Error in driver behavior events listener:", error);
    });
    
    // Listen for action items
    const unsubscribeActionItems = listenToActionItems((fetchedItems) => {
      setActionItems(fetchedItems);
    }, (error) => {
      console.error("Error in action items listener:", error);
    });
    
    // Listen for CAR reports
    const unsubscribeCARReports = listenToCARReports((fetchedReports) => {
      setCARReports(fetchedReports);
    }, (error) => {
      console.error("Error in CAR reports listener:", error);
    });
    
    // Monitor connection status
    const unsubscribeConnectionMonitor = monitorConnectionStatus(
      () => setConnectionStatus('connected'),
      () => setConnectionStatus('disconnected')
    );
    
    // Cleanup listeners on unmount
    return () => {
      unsubscribeTrips();
      unsubscribeMissedLoads();
      unsubscribeDiesel();
      unsubscribeDriverBehavior();
      unsubscribeActionItems();
      unsubscribeCARReports();
      unsubscribeConnectionMonitor();
    };
  }, []);
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log("Browser online event detected");
      setConnectionStatus('reconnecting');
      enableFirestoreNetwork()
        .then(() => {
          console.log("Firestore network enabled");
          setConnectionStatus('connected');
        })
        .catch(error => {
          console.error("Error enabling Firestore network:", error);
          setConnectionStatus('disconnected');
        });
    };
    
    const handleOffline = () => {
      console.log("Browser offline event detected");
      setConnectionStatus('disconnected');
      disableFirestoreNetwork()
        .catch(error => {
          console.error("Error disabling Firestore network:", error);
        });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const addTrip = (tripData: Omit<Trip, 'id' | 'costs' | 'status'>): string => {
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
      clientType: tripData.clientType || 'external'
    };
    
    // Add to Firebase
    addTripToFirebase(newTrip);
    
    return newId;
  };
  
  const updateTrip = (updatedTrip: Trip): void => {
    // Update in Firebase
    updateTripInFirebase(updatedTrip.id, updatedTrip);
  };
  
  const deleteTrip = (id: string): void => {
    // Delete from Firebase
    deleteTripFromFirebase(id);
  };
  
  const getTrip = (id: string): Trip | undefined => {
    return trips.find(trip => trip.id === id);
  };
  
  const addCostEntry = (costEntryData: Omit<CostEntry, 'id' | 'attachments'>, files?: FileList): string => {
    const newId = `C${Date.now()}`;
    
    const attachments: Attachment[] = files ? Array.from(files).map((file, index) => ({
      id: `A${Date.now()}-${index}`,
      costEntryId: newId,
      filename: file.name,
      fileUrl: URL.createObjectURL(file),
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      fileData: ''
    })) : [];
    
    const newCostEntry: CostEntry = {
      ...costEntryData,
      id: newId,
      attachments
    };
    
    // Find the trip and update it with the new cost entry
    const trip = trips.find(t => t.id === costEntryData.tripId);
    if (trip) {
      const updatedTrip = {
        ...trip,
        costs: [...trip.costs, newCostEntry]
      };
      
      // Check if trip should be auto-completed
      if (shouldAutoCompleteTrip(updatedTrip)) {
        const finalTrip = {
          ...updatedTrip,
          status: 'completed' as const,
          completedAt: new Date().toISOString().split('T')[0],
          completedBy: 'System Auto-Complete',
          autoCompletedAt: new Date().toISOString(),
          autoCompletedReason: 'All investigations resolved - trip automatically completed'
        };
        
        // Update in Firebase
        updateTripInFirebase(trip.id, finalTrip);
      } else {
        // Update in Firebase
        updateTripInFirebase(trip.id, updatedTrip);
      }
    }
    
    return newId;
  };
  
  const updateCostEntry = (updatedCostEntry: CostEntry): void => {
    // Find the trip and update the cost entry
    const trip = trips.find(t => t.id === updatedCostEntry.tripId);
    if (trip) {
      const updatedTrip = {
        ...trip,
        costs: trip.costs.map(cost => 
          cost.id === updatedCostEntry.id ? updatedCostEntry : cost
        )
      };
      
      // Check if trip should be auto-completed
      if (trip.status === 'active' && shouldAutoCompleteTrip(updatedTrip)) {
        const finalTrip = {
          ...updatedTrip,
          status: 'completed' as const,
          completedAt: new Date().toISOString().split('T')[0],
          completedBy: 'System Auto-Complete',
          autoCompletedAt: new Date().toISOString(),
          autoCompletedReason: 'All investigations resolved - trip automatically completed'
        };
        
        // Update in Firebase
        updateTripInFirebase(trip.id, finalTrip);
      } else {
        // Update in Firebase
        updateTripInFirebase(trip.id, updatedTrip);
      }
    }
  };
  
  const deleteCostEntry = (id: string): void => {
    // Find the trip containing this cost entry
    const trip = trips.find(t => t.costs.some(c => c.id === id));
    if (trip) {
      const updatedTrip = {
        ...trip,
        costs: trip.costs.filter(cost => cost.id !== id)
      };
      
      // Update in Firebase
      updateTripInFirebase(trip.id, updatedTrip);
    }
  };
  
  const addAttachment = (attachmentData: Omit<Attachment, 'id'>): string => {
    const newId = `A${Date.now()}`;
    const newAttachment: Attachment = {
      ...attachmentData,
      id: newId
    };
    
    // Find the trip and cost entry to update
    const trip = trips.find(t => t.costs.some(c => c.id === attachmentData.costEntryId));
    if (trip) {
      const updatedTrip = {
        ...trip,
        costs: trip.costs.map(cost => {
          if (cost.id === attachmentData.costEntryId) {
            return {
              ...cost,
              attachments: [...cost.attachments, newAttachment]
            };
          }
          return cost;
        })
      };
      
      // Update in Firebase
      updateTripInFirebase(trip.id, updatedTrip);
    }
    
    return newId;
  };
  
  const deleteAttachment = (id: string): void => {
    // Find the trip and cost entry containing this attachment
    const trip = trips.find(t => 
      t.costs.some(cost => cost.attachments.some(att => att.id === id))
    );
    
    if (trip) {
      const updatedTrip = {
        ...trip,
        costs: trip.costs.map(cost => ({
          ...cost,
          attachments: cost.attachments.filter(att => att.id !== id)
        }))
      };
      
      // Update in Firebase
      updateTripInFirebase(trip.id, updatedTrip);
    }
  };
  
  // Additional cost management
  const addAdditionalCost = (tripId: string, costData: Omit<AdditionalCost, 'id'>, files?: FileList): string => {
    const newId = `AC${Date.now()}`;
    
    const supportingDocuments: Attachment[] = files ? Array.from(files).map((file, index) => ({
      id: `A${Date.now()}-${index}`,
      tripId,
      filename: file.name,
      fileUrl: URL.createObjectURL(file),
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      fileData: ''
    })) : [];
    
    const newAdditionalCost: AdditionalCost = {
      ...costData,
      id: newId,
      supportingDocuments
    };
    
    // Find the trip to update
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      const updatedTrip = {
        ...trip,
        additionalCosts: [...(trip.additionalCosts || []), newAdditionalCost]
      };
      
      // Update in Firebase
      updateTripInFirebase(trip.id, updatedTrip);
    }
    
    return newId;
  };
  
  const removeAdditionalCost = (tripId: string, costId: string): void => {
    // Find the trip to update
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      const updatedTrip = {
        ...trip,
        additionalCosts: (trip.additionalCosts || []).filter(cost => cost.id !== costId)
      };
      
      // Update in Firebase
      updateTripInFirebase(trip.id, updatedTrip);
    }
  };
  
  // Delay reason management
  const addDelayReason = (tripId: string, delayData: Omit<DelayReason, 'id'>): string => {
    const newId = `DR${Date.now()}`;
    
    const newDelayReason: DelayReason = {
      ...delayData,
      id: newId
    };
    
    // Find the trip to update
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      const updatedTrip = {
        ...trip,
        delayReasons: [...(trip.delayReasons || []), newDelayReason]
      };
      
      // Update in Firebase
      updateTripInFirebase(trip.id, updatedTrip);
    }
    
    return newId;
  };
  
  // Missed load management
  const addMissedLoad = (missedLoadData: Omit<MissedLoad, 'id'>): string => {
    const newId = `ML${Date.now()}`;
    const newMissedLoad: MissedLoad = {
      ...missedLoadData,
      id: newId
    };
    
    // Add to Firebase
    addMissedLoadToFirebase(newMissedLoad);
    
    return newId;
  };
  
  const updateMissedLoad = (updatedMissedLoad: MissedLoad): void => {
    // Update in Firebase
    updateMissedLoadInFirebase(updatedMissedLoad.id, updatedMissedLoad);
  };
  
  const deleteMissedLoad = (id: string): void => {
    // Delete from Firebase
    deleteMissedLoadFromFirebase(id);
  };
  
  // Invoice payment management
  const updateInvoicePayment = (tripId: string, paymentData: {
    paymentStatus: 'unpaid' | 'partial' | 'paid';
    paymentAmount?: number;
    paymentReceivedDate?: string;
    paymentNotes?: string;
    paymentMethod?: string;
    bankReference?: string;
  }): void => {
    // Find the trip to update
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      const updatedTrip = {
        ...trip,
        paymentStatus: paymentData.paymentStatus,
        paymentAmount: paymentData.paymentAmount,
        paymentReceivedDate: paymentData.paymentReceivedDate,
        paymentMethod: paymentData.paymentMethod,
        bankReference: paymentData.bankReference,
        status: paymentData.paymentStatus === 'paid' ? 'paid' as const : trip.status
      };

      // Add to follow-up history if payment notes provided
      if (paymentData.paymentNotes) {
        const followUpRecord = {
          id: `FU${Date.now()}`,
          tripId: trip.id,
          followUpDate: new Date().toISOString().split('T')[0],
          contactMethod: 'call' as const,
          responsibleStaff: 'Finance Team',
          responseSummary: `Payment update: ${paymentData.paymentNotes}`,
          status: 'completed' as const,
          priority: 'medium' as const,
          outcome: paymentData.paymentStatus === 'paid' ? 'payment_received' as const : 'partial_payment' as const
        };

        updatedTrip.followUpHistory = [...(trip.followUpHistory || []), followUpRecord];
      }

      // Update in Firebase
      updateTripInFirebase(trip.id, updatedTrip);
    }
  };

  const importTripsFromCSV = (importedTrips: Omit<Trip, 'id' | 'costs' | 'status'>[]): void => {
    // Process each imported trip
    importedTrips.forEach(tripData => {
      addTrip(tripData);
    });
  };

  const importCostsFromCSV = (importedCosts: Omit<CostEntry, 'id' | 'attachments'>[]): void => {
    // Process each imported cost
    importedCosts.forEach(costData => {
      addCostEntry(costData);
    });
  };

  // Diesel consumption management
  const addDieselRecord = (recordData: Omit<DieselConsumptionRecord, 'id'>): string => {
    const newId = `D${Date.now()}`;
    const newRecord: DieselConsumptionRecord = {
      ...recordData,
      id: newId
    };

    // Add to Firebase
    addDieselToFirebase(newRecord);
    
    // If linked to a trip, add a cost entry for the diesel
    if (recordData.tripId) {
      const trip = trips.find(t => t.id === recordData.tripId);
      if (trip) {
        const costEntry: Omit<CostEntry, 'id' | 'attachments'> = {
          tripId: recordData.tripId,
          category: 'Diesel',
          subCategory: `${recordData.fuelStation} - ${recordData.fleetNumber}`,
          amount: recordData.totalCost,
          currency: recordData.currency || 'ZAR',
          referenceNumber: `FUEL-${newId}`,
          date: recordData.date,
          notes: `Diesel: ${recordData.litresFilled}L at ${recordData.fuelStation}. KM: ${recordData.kmReading}. ${recordData.notes || ''}`,
          isFlagged: false,
          isSystemGenerated: false
        };
        
        addCostEntry(costEntry);
      }
    }
    
    return newId;
  };

  const updateDieselRecord = (updatedRecord: DieselConsumptionRecord): void => {
    // Update in Firebase
    updateDieselInFirebase(updatedRecord.id, updatedRecord);
    
    // If trip linkage changed, update cost entries
    const oldRecord = dieselRecords.find(r => r.id === updatedRecord.id);
    if (oldRecord?.tripId !== updatedRecord.tripId) {
      // If previously linked to a trip, remove that cost entry
      if (oldRecord?.tripId) {
        const trip = trips.find(t => t.id === oldRecord.tripId);
        if (trip) {
          const updatedTrip = {
            ...trip,
            costs: trip.costs.filter(cost => cost.referenceNumber !== `FUEL-${updatedRecord.id}`)
          };
          
          // Update in Firebase
          updateTripInFirebase(trip.id, updatedTrip);
        }
      }
      
      // If now linked to a trip, add a new cost entry
      if (updatedRecord.tripId) {
        const trip = trips.find(t => t.id === updatedRecord.tripId);
        if (trip) {
          const costEntry: Omit<CostEntry, 'id' | 'attachments'> = {
            tripId: updatedRecord.tripId,
            category: 'Diesel',
            subCategory: `${updatedRecord.fuelStation} - ${updatedRecord.fleetNumber}`,
            amount: updatedRecord.totalCost,
            currency: updatedRecord.currency || 'ZAR',
            referenceNumber: `FUEL-${updatedRecord.id}`,
            date: updatedRecord.date,
            notes: `Diesel: ${updatedRecord.litresFilled}L at ${updatedRecord.fuelStation}. KM: ${updatedRecord.kmReading}. ${updatedRecord.notes || ''}`,
            isFlagged: false,
            isSystemGenerated: false
          };
          
          addCostEntry(costEntry);
        }
      }
    }
  };

  const deleteDieselRecord = (id: string): void => {
    // Check if linked to a trip and remove cost entry if needed
    const record = dieselRecords.find(r => r.id === id);
    if (record?.tripId) {
      const trip = trips.find(t => t.id === record.tripId);
      if (trip) {
        const updatedTrip = {
          ...trip,
          costs: trip.costs.filter(cost => cost.referenceNumber !== `FUEL-${id}`)
        };
        
        // Update in Firebase
        updateTripInFirebase(trip.id, updatedTrip);
      }
    }
    
    // Delete from Firebase
    deleteDieselFromFirebase(id);
  };

  const importDieselFromCSV = (importedRecords: Omit<DieselConsumptionRecord, 'id'>[]): void => {
    // Process each imported record
    importedRecords.forEach(recordData => {
      addDieselRecord(recordData);
    });
  };
  
  // Diesel debrief management
  const updateDieselDebrief = (recordId: string, debriefData: {
    debriefDate: string;
    debriefNotes: string;
    debriefSignedBy?: string;
    debriefSignedAt?: string;
  }): void => {
    // Find the diesel record to update
    const record = dieselRecords.find(r => r.id === recordId);
    if (record) {
      const updatedRecord = {
        ...record,
        debriefDate: debriefData.debriefDate,
        debriefNotes: debriefData.debriefNotes,
        debriefSignedBy: debriefData.debriefSignedBy,
        debriefSignedAt: debriefData.debriefSignedAt || (debriefData.debriefSignedBy ? new Date().toISOString() : undefined)
      };
      
      // Update in Firebase
      updateDieselInFirebase(recordId, updatedRecord);
    }
  };
  
  // Diesel trip cost allocation
  const allocateDieselToTrip = (dieselId: string, tripId: string): void => {
    // Update the diesel record
    const dieselRecord = dieselRecords.find(r => r.id === dieselId);
    if (!dieselRecord) return;
    
    // Update the diesel record with trip linkage
    updateDieselRecord({
      ...dieselRecord,
      tripId
    });
    
    // Add a cost entry to the trip
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      const costEntry: Omit<CostEntry, 'id' | 'attachments'> = {
        tripId,
        category: 'Diesel',
        subCategory: `${dieselRecord.fuelStation} - ${dieselRecord.fleetNumber}`,
        amount: dieselRecord.totalCost,
        currency: dieselRecord.currency || 'ZAR',
        referenceNumber: `FUEL-${dieselId}`,
        date: dieselRecord.date,
        notes: `Diesel: ${dieselRecord.litresFilled}L at ${dieselRecord.fuelStation}. KM: ${dieselRecord.kmReading}. ${dieselRecord.notes || ''}`,
        isFlagged: false,
        isSystemGenerated: false
      };
      
      addCostEntry(costEntry);
    }
  };
  
  const removeDieselFromTrip = (dieselId: string): void => {
    // Find the diesel record
    const dieselRecord = dieselRecords.find(r => r.id === dieselId);
    if (!dieselRecord || !dieselRecord.tripId) return;
    
    const tripId = dieselRecord.tripId;
    
    // Update the diesel record to remove trip linkage
    updateDieselRecord({
      ...dieselRecord,
      tripId: undefined
    });
    
    // Remove the cost entry from the trip
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      const updatedTrip = {
        ...trip,
        costs: trip.costs.filter(cost => cost.referenceNumber !== `FUEL-${dieselId}`)
      };
      
      // Update in Firebase
      updateTripInFirebase(trip.id, updatedTrip);
    }
  };
  
  // Driver behavior management
  const addDriverBehaviorEvent = (eventData: Omit<DriverBehaviorEvent, 'id'>, files?: FileList): string => {
    const newId = `DBE${Date.now()}`;
    
    // Create attachments for any uploaded files
    const attachments: Attachment[] = files ? Array.from(files).map((file, index) => ({
      id: `A${Date.now()}-${index}`,
      filename: file.name,
      fileUrl: URL.createObjectURL(file),
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString()
    })) : [];
    
    const newEvent: DriverBehaviorEvent = {
      ...eventData,
      id: newId,
      attachments
    };
    
    // Add to Firebase
    addDriverBehaviorEventToFirebase(newEvent);
    
    return newId;
  };
  
  const updateDriverBehaviorEvent = (updatedEvent: DriverBehaviorEvent): void => {
    // Update in Firebase
    updateDriverBehaviorEventToFirebase(updatedEvent.id, updatedEvent);
  };
  
  const deleteDriverBehaviorEvent = (id: string): void => {
    // Delete from Firebase
    deleteDriverBehaviorEventToFirebase(id);
  };
  
  // Calculate driver performance metrics
  const getDriverPerformance = (driverName: string) => {
    // Get all events for this driver
    const driverEvents = driverBehaviorEvents.filter(event => event.driverName === driverName);
    
    // Get all trips for this driver
    const driverTrips = trips.filter(trip => trip.driverName === driverName);
    
    // Calculate total points
    const totalPoints = driverEvents.reduce((sum, event) => sum + (event.points || 0), 0);
    
    // Calculate total distance
    const totalDistance = driverTrips.reduce((sum, trip) => sum + (trip.distanceKm || 0), 0);
    
    // Calculate behavior score (100 - points, minimum 0)
    const behaviorScore = Math.max(0, 100 - totalPoints);
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (behaviorScore >= 85) riskLevel = 'low';
    else if (behaviorScore >= 70) riskLevel = 'medium';
    else if (behaviorScore >= 50) riskLevel = 'high';
    else riskLevel = 'critical';
    
    // Determine improvement trend
    // For demo purposes, we'll use a simple algorithm
    // In a real app, you'd compare recent events to older ones
    const recentEvents = driverEvents.filter(event => {
      const eventDate = new Date(event.eventDate);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return eventDate >= threeMonthsAgo;
    });
    
    const olderEvents = driverEvents.filter(event => {
      const eventDate = new Date(event.eventDate);
      const threeMonthsAgo = new Date();
      const sixMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return eventDate >= sixMonthsAgo && eventDate < threeMonthsAgo;
    });
    
    const recentPointsPerMonth = recentEvents.length > 0 ? 
      recentEvents.reduce((sum, event) => sum + (event.points || 0), 0) / 3 : 0;
    
    const olderPointsPerMonth = olderEvents.length > 0 ? 
      olderEvents.reduce((sum, event) => sum + (event.points || 0), 0) / 3 : 0;
    
    let improvementTrend: 'improving' | 'stable' | 'declining';
    if (recentPointsPerMonth < olderPointsPerMonth * 0.8) improvementTrend = 'improving';
    else if (recentPointsPerMonth > olderPointsPerMonth * 1.2) improvementTrend = 'declining';
    else improvementTrend = 'stable';
    
    return {
      driverName,
      behaviorScore,
      totalBehaviorEvents: driverEvents.length,
      totalPoints,
      totalTrips: driverTrips.length,
      totalDistance,
      riskLevel,
      improvementTrend
    };
  };
  
  // Get performance for all drivers
  const getAllDriversPerformance = () => {
    // Get all unique driver names
    const driverNames = [...new Set([
      ...trips.map(trip => trip.driverName),
      ...driverBehaviorEvents.map(event => event.driverName)
    ])];
    
    // Calculate performance for each driver
    return driverNames.map(driverName => getDriverPerformance(driverName));
  };
  
  // Action items management
  const addActionItem = (itemData: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): string => {
    const newId = `AI${Date.now()}`;
    
    const newItem: ActionItem = {
      ...itemData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Current User' // In a real app, use the logged-in user
    };
    
    // Add to Firebase
    addActionItemToFirebase(newItem);
    
    return newId;
  };
  
  const updateActionItem = (updatedItem: ActionItem): void => {
    // Update in Firebase
    updateActionItemInFirebase(updatedItem.id, {
      ...updatedItem,
      updatedAt: new Date().toISOString()
    });
  };
  
  const deleteActionItem = (id: string): void => {
    // Delete from Firebase
    deleteActionItemFromFirebase(id);
  };
  
  const addActionItemComment = (itemId: string, comment: string): void => {
    // Find the action item
    const item = actionItems.find(i => i.id === itemId);
    if (!item) return;
    
    const newComment = {
      id: `C${Date.now()}`,
      actionItemId: itemId,
      comment,
      createdBy: 'Current User', // In a real app, use the logged-in user
      createdAt: new Date().toISOString()
    };
    
    const updatedItem = {
      ...item,
      comments: [...(item.comments || []), newComment],
      updatedAt: new Date().toISOString()
    };
    
    // Update in Firebase
    updateActionItemInFirebase(itemId, updatedItem);
  };
  
  // CAR reports management
  const addCARReport = (reportData: Omit<CARReport, 'id' | 'createdAt' | 'updatedAt'>, files?: FileList): string => {
    const newId = `CAR${Date.now()}`;
    
    // Create attachments for any uploaded files
    const attachments: Attachment[] = files ? Array.from(files).map((file, index) => ({
      id: `A${Date.now()}-${index}`,
      filename: file.name,
      fileUrl: URL.createObjectURL(file),
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString()
    })) : [];
    
    const newReport: CARReport = {
      ...reportData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments
    };
    
    // Add to Firebase
    addCARReportToFirebase(newReport);
    
    // If linked to a driver behavior event, update the event
    if (reportData.referenceEventId) {
      const event = driverBehaviorEvents.find(e => e.id === reportData.referenceEventId);
      if (event) {
        updateDriverBehaviorEvent({
          ...event,
          carReportId: newId
        });
      }
    }
    
    return newId;
  };
  
  const updateCARReport = (updatedReport: CARReport, files?: FileList): void => {
    // Process new files if provided
    let newAttachments: Attachment[] = [];
    if (files) {
      newAttachments = Array.from(files).map((file, index) => ({
        id: `A${Date.now()}-${index}`,
        filename: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString()
      }));
    }
    
    // Update in Firebase
    updateCARReportInFirebase(updatedReport.id, {
      ...updatedReport,
      updatedAt: new Date().toISOString(),
      attachments: [...(updatedReport.attachments || []), ...newAttachments]
    });
  };
  
  const deleteCARReport = (id: string): void => {
    // Find the report
    const report = carReports.find(r => r.id === id);
    if (!report) return;
    
    // If linked to a driver behavior event, update the event
    if (report.referenceEventId) {
      const event = driverBehaviorEvents.find(e => e.id === report.referenceEventId);
      if (event) {
        updateDriverBehaviorEvent({
          ...event,
          carReportId: undefined
        });
      }
    }
    
    // Delete from Firebase
    deleteCARReportFromFirebase(id);
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
    addAttachment,
    deleteAttachment,
    addAdditionalCost,
    removeAdditionalCost,
    addDelayReason,
    missedLoads,
    addMissedLoad,
    updateMissedLoad,
    deleteMissedLoad,
    updateInvoicePayment,
    importTripsFromCSV,
    importCostsFromCSV,
    dieselRecords,
    addDieselRecord,
    updateDieselRecord,
    deleteDieselRecord,
    importDieselFromCSV,
    updateDieselDebrief,
    allocateDieselToTrip,
    removeDieselFromTrip,
    driverBehaviorEvents,
    addDriverBehaviorEvent,
    updateDriverBehaviorEvent,
    deleteDriverBehaviorEvent,
    getDriverPerformance,
    getAllDriversPerformance,
    actionItems,
    addActionItem,
    updateActionItem,
    deleteActionItem,
    addActionItemComment,
    carReports,
    addCARReport,
    updateCARReport,
    deleteCARReport,
    connectionStatus,
    isOnline: isOnline()
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};