// src/firebaseConfig.ts

import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// ✅ Use environment variables from .env
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID,
};

// 🔥 Initialize Firebase App
export const firebaseApp = initializeApp(firebaseConfig);

// ✅ Initialize Firebase App Check with reCAPTCHA v3
const appCheck = initializeAppCheck(firebaseApp, {
  provider: new ReCaptchaV3Provider("6LcQ5mQrAAAAAIKWCSw9mAT5VaA6OKJ8nNFSyK1"), // Your site key
  isTokenAutoRefreshEnabled: true,
});

// 📊 Optional: Initialize Analytics if supported
export const initAnalytics = async () => {
  if (await isSupported()) {
    return getAnalytics(firebaseApp);
  }
  return null;
};