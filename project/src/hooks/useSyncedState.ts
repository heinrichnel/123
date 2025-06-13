import { useEffect, useState } from 'react';
import { db } from '../utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function useSyncedState(key: string, userId: string) {
  const [value, setValue] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) setValue(saved);
  }, [key]);

  // Save to localStorage and Firestore when value changes
  useEffect(() => {
    if (value) {
      localStorage.setItem(key, value);
      setDoc(doc(db, 'userData', userId), { [key]: value }, { merge: true });
    }
  }, [value, key, userId]);

  // Optionally, load from Firestore on mount (overrides localStorage if found)
  useEffect(() => {
    async function fetchFromFirestore() {
      const docSnap = await getDoc(doc(db, 'userData', userId));
      if (docSnap.exists() && docSnap.data()[key]) {
        setValue(docSnap.data()[key]);
      }
    }
    fetchFromFirestore();
  }, [key, userId]);

  return [value, setValue] as const;
}