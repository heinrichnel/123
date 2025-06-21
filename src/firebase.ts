import {
  getFirestore,
  initializeFirestore,
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
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  setDoc,
  writeBatch,
} from "firebase/firestore";
<<<<<<< HEAD
import { firebaseApp } from "./firebaseConfig";
=======
import { firebaseConfig } from "./firebaseConfig.tsx";
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89

// Use custom Firestore database ID from .env
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || undefined;
export const db: Firestore = databaseId
  ? initializeFirestore(firebaseApp, { databaseId })
  : getFirestore(firebaseApp);

// 🔗 Collection references
export const tripsCollection = collection(db, "trips");
export const dieselCollection = collection(db, "diesel");
export const missedLoadsCollection = collection(db, "missedLoads");
export const driverBehaviorCollection = collection(db, "driverBehavior");
export const actionItemsCollection = collection(db, "actionItems");
export const carReportsCollection = collection(db, "carReports");

// 🌐 Network Controls
export { enableNetwork, disableNetwork };

// 📡 Listener factory
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
      console.error("Firestore listen error:", err);
      onError?.(err);
    }
  );
}

// 🔄 Shared listeners
export const listenToTrips = makeListener;
export const listenToDieselRecords = makeListener;
export const listenToMissedLoads = makeListener;
export const listenToDriverBehaviorEvents = makeListener;
export const listenToActionItems = makeListener;
export const listenToCARReports = makeListener;

// 📁 CRUD helpers
function createDoc<T>(ref: ReturnType<typeof collection>, data: T) {
  return addDoc(ref, data);
}

function updateDocById<T>(ref: ReturnType<typeof collection>, id: string, data: Partial<T>) {
  return updateDoc(doc(ref, id), data);
}

function deleteDocById(ref: ReturnType<typeof collection>, id: string) {
  return deleteDoc(doc(ref, id));
}

// 🚛 Trips
export const addTripToFirebase = (data: object) => createDoc(tripsCollection, data);
export const updateTripInFirebase = (id: string, data: object) =>
  updateDocById(tripsCollection, id, data);
export const deleteTripFromFirebase = (id: string) =>
  deleteDocById(tripsCollection, id);

// 🛢️ Diesel
export const addDieselToFirebase = (data: object) => createDoc(dieselCollection, data);
export const updateDieselInFirebase = (id: string, data: object) =>
  updateDocById(dieselCollection, id, data);
export const deleteDieselFromFirebase = (id: string) =>
  deleteDocById(dieselCollection, id);

// 📉 Missed Loads
export const addMissedLoadToFirebase = (data: object) => createDoc(missedLoadsCollection, data);
export const updateMissedLoadInFirebase = (id: string, data: object) =>
  updateDocById(missedLoadsCollection, id, data);
export const deleteMissedLoadFromFirebase = (id: string) =>
  deleteDocById(missedLoadsCollection, id);

// 👨‍✈️ Driver Behavior
export const addDriverBehaviorEventToFirebase = (data: object) =>
  createDoc(driverBehaviorCollection, data);
export const updateDriverBehaviorEventToFirebase = (id: string, data: object) =>
  updateDocById(driverBehaviorCollection, id, data);
export const deleteDriverBehaviorEventToFirebase = (id: string) =>
  deleteDocById(driverBehaviorCollection, id);

// 🚗 CAR Reports
export const addCARReportToFirebase = (data: object) => createDoc(carReportsCollection, data);
export const updateCARReportInFirebase = (id: string, data: object) =>
  updateDocById(carReportsCollection, id, data);
export const deleteCARReportFromFirebase = (id: string) =>
  deleteDocById(carReportsCollection, id);

// ✅ Action Items
export const addActionItemToFirebase = (data: object) => createDoc(actionItemsCollection, data);
export const updateActionItemInFirebase = (id: string, data: object) =>
  updateDocById(actionItemsCollection, id, data);
export const deleteActionItemFromFirebase = (id: string) =>
  deleteDocById(actionItemsCollection, id);

// 🔌 Monitor connectivity
export const monitorConnectionStatus = (
  onOnline: () => void,
  onOffline: () => void
) => {
  enableNetwork(db)
    .then(onOnline)
    .catch(onOffline);
};

// Google Sheets Integration
export const listenToGoogleSheetChanges = () => {
  // This would be implemented in a Firebase Cloud Function
  console.log("Setting up Google Sheets integration listener");
};

// Export the addDriverBehaviorEvent function for the integration
export const addDriverBehaviorEvent = async (eventData: any) => {
  try {
    // Generate a unique ID for the event
    const eventId = `EVENT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Add the ID to the event data
    const eventWithId = {
      ...eventData,
      id: eventId
    };
    
    // Add to Firestore
    await setDoc(doc(driverBehaviorCollection, eventId), eventWithId);
    
    return eventId;
  } catch (error) {
    console.error("Error adding driver behavior event:", error);
    throw error;
  }
};