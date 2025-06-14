// src/firebase.ts

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  enableNetwork,
  disableNetwork,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { firebaseConfig } from './firebaseConfig';

// ✅ Initialize Firebase App
const app = initializeApp(firebaseConfig);

// ✅ Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// ✅ Optional: Enable Analytics (only in production and browser)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log('📊 Firebase Analytics enabled');
    } else {
      console.warn('⚠️ Firebase Analytics not supported in this browser');
    }
  });
}
export { analytics };

// ✅ Firestore network control
export const enableFirestoreNetwork = () => enableNetwork(db);
export const disableFirestoreNetwork = () => disableNetwork(db);

// ✅ Export Firebase app
export { app };

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
