import { db } from "../../firebase";

import { initializeApp } from "firebase/app";
import { getFirestore, enableFirestoreNetwork, disableFirestoreNetwork } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ...other config
};

// ✅ Initialize Firebase App
const app = initializeApp(firebaseConfig);

// ✅ Firestore and Auth
export const db = getFirestore(app);

// Add these exports:
export { enableFirestoreNetwork, disableFirestoreNetwork };

/* 🔁 LISTENERS & FIRESTORE INTERACTION FUNCTIONS */

// Placeholder listeners – implement logic later
export const listenToTrips = () => {};
export const listenToDieselRecords = () => {};
export const listenToMissedLoads = () => {};
export const listenToDriverBehaviorEvents = () => {};
export const listenToActionItems = () => {};
export const listenToCARReports = () => {};

// CRUD: Trips
export const addTripToFirebase = () => {};
export const updateTripInFirebase = () => {};
export const deleteTripFromFirebase = () => {};

// CRUD: Diesel
export const addDieselToFirebase = () => {};
export const updateDieselInFirebase = () => {};
export const deleteDieselFromFirebase = () => {};

// CRUD: Missed Loads
export const addMissedLoadToFirebase = () => {};
export const updateMissedLoadInFirebase = () => {};
export const deleteMissedLoadFromFirebase = () => {};

// CRUD: Driver Behaviour
export const addDriverBehaviorEventToFirebase = () => {};
export const updateDriverBehaviorEventToFirebase = () => {};
export const deleteDriverBehaviorEventToFirebase = () => {};

// CRUD: Action Items
export const addActionItemToFirebase = () => {};
export const updateActionItemInFirebase = () => {};
export const deleteActionItemFromFirebase = () => {};

// CRUD: CAR Reports
export const addCARReportToFirebase = () => {};
export const updateCARReportInFirebase = () => {};
export const deleteCARReportFromFirebase = () => {};

// Connectivity Monitor (basic placeholder)
export const monitorConnectionStatus = () => {};

// Only one default export
export default CostForm;
