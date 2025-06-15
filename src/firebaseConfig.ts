// src/firebaseConfig.ts

import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// ✅ Gebruik omgewingsveranderlikes uit .env
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// 🔥 Firebase App initialiseer
export const firebaseApp = initializeApp(firebaseConfig);

// 📊 Optioneel: Analytics initialiseer net as dit beskikbaar is
export const initAnalytics = async () => {
  if (await isSupported()) {
    return getAnalytics(firebaseApp);
  }
  return null;
};
