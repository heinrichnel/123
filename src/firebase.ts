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
  Firestore,
  DocumentData,
  QuerySnapshot,
} from "firebase/firestore";
import firebaseConfig from "./firebaseConfig.js";

// 1️⃣ Initialize Firebase App and Firestore
const app = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);

// 2️⃣ Collection references
export const tripsCollection = collection(db, "trips");
export const dieselCollection = collection(db, "diesel");
export const missedLoadsCollection = collection(db, "missedLoads");
export const driverBehaviorCollection = collection(db, "driverBehavior");
export const actionItemsCollection = collection(db, "actionItems");
export const carReportsCollection = collection(db, "carReports");

// 3️⃣ Network Control
export { enableNetwork, disableNetwork };

// 4️⃣ Real-time listeners (typed)
function makeListener<T = DocumentData>(
  ref: ReturnType<typeof collection>,
  onUpdate: (docs: (T & { id: string })[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    ref,
    snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as T & { id: string }));
      onUpdate(data);
    },
    err => {
      if (onError) onError(err);
      console.error("Firestore listen error:", err);
    }
  );
}

export const listenToTrips = makeListener;
export const listenToDieselRecords = makeListener;
export const listenToMissedLoads = makeListener;
export const listenToDriverBehaviorEvents = makeListener;
export const listenToActionItems = makeListener;
export const listenToCARReports = makeListener;

// Usage example:
// const unsub = listenToTrips(tripsCollection, (trips) => {...});

// 5️⃣ CRUD functions (generic and typed)
export const addTripToFirebase = (d: any) => addDoc(tripsCollection, d);
export const updateTripInFirebase = (id: string, d: any) => updateDoc(doc(tripsCollection, id), d);
export const deleteTripFromFirebase = (id: string) => deleteDoc(doc(tripsCollection, id));

export const addDieselToFirebase = (d: any) => addDoc(dieselCollection, d);
export const updateDieselInFirebase = (id: string, d: any) => updateDoc(doc(dieselCollection, id), d);
export const deleteDieselFromFirebase = (id: string) => deleteDoc(doc(dieselCollection, id));

export const addMissedLoadToFirebase = (d: any) => addDoc(missedLoadsCollection, d);
export const updateMissedLoadInFirebase = (id: string, d: any) => updateDoc(doc(missedLoadsCollection, id), d);
export const deleteMissedLoadFromFirebase = (id: string) => deleteDoc(doc(missedLoadsCollection, id));

export const addDriverBehaviorEventToFirebase = (d: any) => addDoc(driverBehaviorCollection, d);
export const updateDriverBehaviorEventToFirebase = (id: string, d: any) => updateDoc(doc(driverBehaviorCollection, id), d);
export const deleteDriverBehaviorEventToFirebase = (id: string) => deleteDoc(doc(driverBehaviorCollection, id));

export const addActionItemToFirebase = (d: any) => addDoc(actionItemsCollection, d);
export const updateActionItemInFirebase = (id: string, d: any) => updateDoc(doc(actionItemsCollection, id), d);
export const deleteActionItemFromFirebase = (id: string) => deleteDoc(doc(actionItemsCollection, id));

export const addCARReportToFirebase = (d: any) => addDoc(carReportsCollection, d);
export const updateCARReportInFirebase = (id: string, d: any) => updateDoc(doc(carReportsCollection, id), d);
export const deleteCARReportFromFirebase = (id: string) => deleteDoc(doc(carReportsCollection, id));

// 6️⃣ Connection monitor (optional)
export const monitorConnectionStatus = (
  onOnline: () => void,
  onOffline: () => void
) => {
  enableNetwork(db)
    .then(onOnline)
    .catch(onOffline);
};
