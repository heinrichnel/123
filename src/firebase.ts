// src/firebase.ts

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  enableNetwork,
  disableNetwork,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  FirestoreError,
  Unsubscribe,
  DocumentData,
  QuerySnapshot
} from "firebase/firestore";

// ————————————————
// 1. Firebase-konfigurasie
// ————————————————
// Gebruik jou Vite-omgewingveranderlikes (vite-env.d.ts het import.meta)
//
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // …ander sleutel/waarde-pare soos nodig
};

// ————————————————
// 2. App & Firestore-initialisering
// ————————————————
// ✅ App
const app = initializeApp(firebaseConfig);

// ✅ Firestore DB
export const db = getFirestore(app);

// ————————————————
// 3. Versamelings (“collections”)
// ————————————————
// Maak seker hierdie name stem ooreen met jou Firestore-struktuur.
export const tripsCollection           = collection(db, "trips");
export const dieselCollection          = collection(db, "diesel");
export const missedLoadsCollection     = collection(db, "missedLoads");
export const driverBehaviorCollection  = collection(db, "driverBehaviorEvents");
export const actionItemsCollection     = collection(db, "actionItems");
export const carReportsCollection      = collection(db, "carReports");

// ————————————————
// 4. Netwerkbeheer
// ————————————————
export { enableNetwork, disableNetwork };

// ————————————————
// 5. Real-time Listeners
// ————————————————
// Helper-tipe vir update-callback
type ListenerCallback = (docs: { id: string; [key: string]: any }[]) => void;
type ErrorCallback    = (error: FirestoreError) => void;

// Algemeen patroon: onSnapshot op collection
function createListener(
  coll: typeof tripsCollection,
  onUpdate: ListenerCallback,
  onError?: ErrorCallback
): Unsubscribe {
  return onSnapshot(
    coll,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(data);
    },
    (error: FirestoreError) => {
      console.error("Firestore listener fout op", coll.id, error);
      if (onError) onError(error);
    }
  );
}

// 🎧 Listeners
export const listenToTrips = (onUpdate: ListenerCallback, onError?: ErrorCallback): Unsubscribe =>
  createListener(tripsCollection, onUpdate, onError);

export const listenToDieselRecords = (onUpdate: ListenerCallback, onError?: ErrorCallback): Unsubscribe =>
  createListener(dieselCollection, onUpdate, onError);

export const listenToMissedLoads = (onUpdate: ListenerCallback, onError?: ErrorCallback): Unsubscribe =>
  createListener(missedLoadsCollection, onUpdate, onError);

export const listenToDriverBehaviorEvents = (onUpdate: ListenerCallback, onError?: ErrorCallback): Unsubscribe =>
  createListener(driverBehaviorCollection, onUpdate, onError);

export const listenToActionItems = (onUpdate: ListenerCallback, onError?: ErrorCallback): Unsubscribe =>
  createListener(actionItemsCollection, onUpdate, onError);

export const listenToCARReports = (onUpdate: ListenerCallback, onError?: ErrorCallback): Unsubscribe =>
  createListener(carReportsCollection, onUpdate, onError);

// ————————————————
// 6. CRUD-funksies
// ————————————————

// Trips
export const addTripToFirebase = (tripData: any) =>
  addDoc(tripsCollection, tripData);

export const updateTripInFirebase = (id: string, tripData: any) =>
  updateDoc(doc(tripsCollection, id), tripData);

export const deleteTripFromFirebase = (id: string) =>
  deleteDoc(doc(tripsCollection, id));

// Diesel
export const addDieselToFirebase = (data: any) =>
  addDoc(dieselCollection, data);

export const updateDieselInFirebase = (id: string, data: any) =>
  updateDoc(doc(dieselCollection, id), data);

export const deleteDieselFromFirebase = (id: string) =>
  deleteDoc(doc(dieselCollection, id));

// Missed Loads
export const addMissedLoadToFirebase = (data: any) =>
  addDoc(missedLoadsCollection, data);

export const updateMissedLoadInFirebase = (id: string, data: any) =>
  updateDoc(doc(missedLoadsCollection, id), data);

export const deleteMissedLoadFromFirebase = (id: string) =>
  deleteDoc(doc(missedLoadsCollection, id));

// Driver Behavior Events
export const addDriverBehaviorEventToFirebase = (data: any) =>
  addDoc(driverBehaviorCollection, data);

export const updateDriverBehaviorEventToFirebase = (id: string, data: any) =>
  updateDoc(doc(driverBehaviorCollection, id), data);

export const deleteDriverBehaviorEventToFirebase = (id: string) =>
  deleteDoc(doc(driverBehaviorCollection, id));

// Action Items
export const addActionItemToFirebase = (data: any) =>
  addDoc(actionItemsCollection, data);

export const updateActionItemInFirebase = (id: string, data: any) =>
  updateDoc(doc(actionItemsCollection, id), data);

export const deleteActionItemFromFirebase = (id: string) =>
  deleteDoc(doc(actionItemsCollection, id));

// CAR Reports
export const addCARReportToFirebase = (data: any) =>
  addDoc(carReportsCollection, data);

export const updateCARReportInFirebase = (id: string, data: any) =>
  updateDoc(doc(carReportsCollection, id), data);

export const deleteCARReportFromFirebase = (id: string) =>
  deleteDoc(doc(carReportsCollection, id));

// ————————————————
// 7. Verbindingsmonitor (opsioneel uitbreibaar)
// ————————————————
export const monitorConnectionStatus = (
  onOnline: () => void,
  onOffline: () => void
): void => {
  enableNetwork(db)
    .then(onOnline)
    .catch(() => onOffline());
  // Jy kan hier byvoeg: disableNetwork(db) vir offline-toetse,
  // of window.addEventListener('online'/‘offline’) as jy browser events wil gebruik.
};

// Geen default export nie
