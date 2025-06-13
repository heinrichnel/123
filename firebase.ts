import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  collection,
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
  getDocs,
} from 'firebase/firestore';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';

// Your Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyDSvvlVBiZ_QL-FVkjFrQBKIajkIhXNZgE',
  authDomain: 'matanuska-491ad.firebaseapp.com',
  databaseURL: 'https://matanuska-491ad-default-rtdb.firebaseio.com',
  projectId: 'matanuska-491ad',
  storageBucket: 'matanuska-491ad.firebasestorage.app',
  messagingSenderId: '801621513780',
  appId: '1:801621513780:web:e78dc5bc75d846932e1c61',
  measurementId: 'G-52ZKDP6J7Q',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Enable Firestore persistent cache (IndexedDB)
initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

export const db = getFirestore(app);

// Enable Auth persistence (localStorage)
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// Example: Listen for auth state changes
onAuthStateChanged(auth, (user: User | null) => {
  if (user) {
    // Save user info to localStorage
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
});

// Example: Firestore real-time listener
export function subscribeToDoc(
  collectionName: string,
  docId: string,
  callback: (data: Record<string, unknown>) => void
) {
  return onSnapshot(doc(db, collectionName, docId), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    }
  });
}

// Example: Save UI state to localStorage
export function saveUIState(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadUIState<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

// Example: Sign in and sign out
export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
  return signOut(auth);
}

// Export Firestore helpers as needed
export {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
  getDocs,
};

let result: string; // or number, or a custom interface/type

console.log(result);

// Usage in your component (example, place this inside your React component):
// const isOnline = useOnlineStatus();
// {!isOnline && <div className="offline-banner">Offline Mode - Changes will sync when reconnected</div>}