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
  doc
} from "firebase/firestore";

// ————————————————
// 1. Firebase-konfigurasie (gebruik Vite-omgewingveranderlikes)
// ————————————————
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // …ander sleutel/waarde-pare soos nodig
};

// ————————————————
// 2. App & Firestore-initialisering
// ————————————————
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ————————————————
// 3. Versamelings („collections“)
// ————————————————
export const tripsCollection  = collection(db, "trips");
export const dieselCollection = collection(db, "diesel");
// Voeg by: missedLoadsCollection, driverBehaviorCollection, ensovoorts…

// ————————————————
// 4. Netwerkbeheer
// ————————————————
export { enableNetwork, disableNetwork };

// ————————————————
// 5. Real-time Listeners
// ————————————————
// Voorbeeld vir trips:
export const listenToTrips = (
  onUpdate: (docs: any[]) => void,
  onError?: (error: Error) => void
) =>
  onSnapshot(
    tripsCollection,
    snapshot => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(data);
    },
    error => {
      if (onError) onError(error);
      console.error("listenToTrips fout:", error);
    }
  );

// Jy kan soortgelyke listeners skep vir:
// listenToDieselRecords, listenToMissedLoads, listenToDriverBehaviorEvents, listenToActionItems, listenToCARReports

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

// Voeg op dieselfde wyse by:
// addMissedLoadToFirebase, updateMissedLoadInFirebase, deleteMissedLoadFromFirebase
// addDriverBehaviorEventToFirebase, updateDriverBehaviorEventToFirebase, deleteDriverBehaviorEventToFirebase
// addActionItemToFirebase, updateActionItemInFirebase, deleteActionItemFromFirebase
// addCARReportToFirebase, updateCARReportInFirebase, deleteCARReportFromFirebase

// ————————————————
// 7. Verbindingsmonitor (voorbeeld)
// ————————————————
export const monitorConnectionStatus = (
  onOnline: () => void,
  onOffline: () => void
) => {
  enableNetwork(db).then(onOnline).catch(() => onOffline());
  // jy kan hier ‘n interval of event luisteraar insit om herhaaldelik te monitor
};

// ————————————————
// GEEN default-eksport nie
// ————————————————
