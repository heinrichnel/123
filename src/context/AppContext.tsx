import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trip, CostEntry, Attachment, AdditionalCost, DelayReason, MissedLoad, DieselConsumptionRecord, DriverBehaviorEvent, ActionItem, CARReport } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import { enableFirestoreNetwork, disableFirestoreNetwork, db } from '../firebase.js';
import { generateTripId, shouldAutoCompleteTrip, isOnline } from '../utils/helpers.ts';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';

interface AppContextType {
  // ... as you have already defined ...
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
      clientType: tripData.clientType || 'external',
    };
    // Fire and forget async call (you can convert this to async if preferred)
    addTripToFirebase(newTrip).catch(console.error);
    return newId;
  };

  const updateTrip = (updatedTrip: Trip): void => {
    updateTripInFirebase(updatedTrip.id, updatedTrip).catch(console.error);
  };

  const deleteTrip = (id: string): void => {
    deleteTripFromFirebase(id).catch(console.error);
  };

  const getTrip = (id: string): Trip | undefined => {
    return trips.find(trip => trip.id === id);
  };

  // Cost Entry Firestore update helpers:

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
      attachments,
    };

    const trip = trips.find(t => t.id === costEntryData.tripId);
    if (trip) {
      const updatedTrip = {
        ...trip,
        costs: [...trip.costs, newCostEntry]
      };

      // Auto complete check:
      if (shouldAutoCompleteTrip(updatedTrip)) {
        updatedTrip.status = 'completed';
        updatedTrip.completedAt = new Date().toISOString().split('T')[0];
        updatedTrip.completedBy = 'System Auto-Complete';
        updatedTrip.autoCompletedAt = new Date().toISOString();
        updatedTrip.autoCompletedReason = 'All investigations resolved - trip automatically completed';
      }

      updateTripInFirebase(trip.id, updatedTrip).catch(console.error);
    }

    return newId;
  };

  const updateCostEntry = (updatedCostEntry: CostEntry): void => {
    const trip = trips.find(t => t.id === updatedCostEntry.tripId);
    if (trip) {
      const updatedTrip = {
        ...trip,
        costs: trip.costs.map(cost => cost.id === updatedCostEntry.id ? updatedCostEntry : cost),
      };

      if (trip.status === 'active' && shouldAutoCompleteTrip(updatedTrip)) {
        updatedTrip.status = 'completed';
        updatedTrip.completedAt = new Date().toISOString().split('T')[0];
        updatedTrip.completedBy = 'System Auto-Complete';
        updatedTrip.autoCompletedAt = new Date().toISOString();
        updatedTrip.autoCompletedReason = 'All investigations resolved - trip automatically completed';
      }

      updateTripInFirebase(trip.id, updatedTrip).catch(console.error);
    }
  };

  const deleteCostEntry = (id: string): void => {
    const trip = trips.find(t => t.costs.some(c => c.id === id));
    if (trip) {
      const updatedTrip = {
        ...trip,
        costs: trip.costs.filter(cost => cost.id !== id)
      };
      updateTripInFirebase(trip.id, updatedTrip).catch(console.error);
    }
  };

  // Keep all your other existing methods unchanged...

  // Finally, your context value:

  const contextValue: AppContextType = {
    trips,
    addTrip,
    updateTrip,
    deleteTrip,
    getTrip,
    addCostEntry,
    updateCostEntry,
    deleteCostEntry,
    // ... all other existing methods from your code ...
    addAttachment: (attachmentData) => {
      const newId = `A${Date.now()}`;
      const newAttachment: Attachment = { ...attachmentData, id: newId };
      const trip = trips.find(t => t.costs.some(c => c.id === attachmentData.costEntryId));
      if (trip) {
        const updatedTrip = {
          ...trip,
          costs: trip.costs.map(cost => {
            if (cost.id === attachmentData.costEntryId) {
              return { ...cost, attachments: [...cost.attachments, newAttachment] };
            }
            return cost;
          })
        };
        updateTripInFirebase(trip.id, updatedTrip).catch(console.error);
      }
      return newId;
    },
    deleteAttachment: (id: string) => {
      const trip = trips.find(t => t.costs.some(cost => cost.attachments.some(att => att.id === id)));
      if (trip) {
        const updatedTrip = {
          ...trip,
          costs: trip.costs.map(cost => ({
            ...cost,
            attachments: cost.attachments.filter(att => att.id !== id)
          }))
        };
        updateTripInFirebase(trip.id, updatedTrip).catch(console.error);
      }
    },
    // ...rest of your existing methods...
    missedLoads,
    addMissedLoad: (missedLoad) => {
      // implement your addMissedLoadToFirebase here
      // ... similar pattern ...
      return 'some-id';
    },
    updateMissedLoad: (missedLoad) => { /* your existing implementation */ },
    deleteMissedLoad: (id) => { /* your existing implementation */ },
    dieselRecords,
    addDieselRecord: (record) => { /* your existing implementation */ return 'some-id'; },
    updateDieselRecord: (record) => { /* your existing implementation */ },
    deleteDieselRecord: (id) => { /* your existing implementation */ },
    importDieselFromCSV: (records) => { /* your existing implementation */ },
    updateDieselDebrief: (id, data) => { /* your existing implementation */ },
    allocateDieselToTrip: (dieselId, tripId) => { /* your existing implementation */ },
    removeDieselFromTrip: (dieselId) => { /* your existing implementation */ },
    driverBehaviorEvents,
    addDriverBehaviorEvent: (event, files) => { /* your existing implementation */ return 'some-id'; },
    updateDriverBehaviorEvent: (event) => { /* your existing implementation */ },
    deleteDriverBehaviorEvent: (id) => { /* your existing implementation */ },
    getDriverPerformance: (driverName) => { /* your existing implementation */ return { driverName, behaviorScore: 100, totalBehaviorEvents: 0, totalPoints: 0, totalTrips: 0, totalDistance: 0, riskLevel: 'low', improvementTrend: 'stable' }; },
    getAllDriversPerformance: () => { /* your existing implementation */ return []; },
    actionItems,
    addActionItem: (item) => { /* your existing implementation */ return 'some-id'; },
    updateActionItem: (item) => { /* your existing implementation */ },
    deleteActionItem: (id) => { /* your existing implementation */ },
    addActionItemComment: (itemId, comment) => { /* your existing implementation */ },
    carReports,
    addCARReport: (report, files) => { /* your existing implementation */ return 'some-id'; },
    updateCARReport: (report, files) => { /* your existing implementation */ },
    deleteCARReport: (id) => { /* your existing implementation */ },
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
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
