// src/firebaseConfig.ts

import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// ✅ Use environment variables from .env
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDYnxLmGgGEe1vCkQXdWZAKoDeGmG1KLvM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "trip-profit-loss.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "trip-profit-loss",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "trip-profit-loss.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1045340587640",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1045340587640:web:a9e5c5b1c5c5c5b1c5c5c5",
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