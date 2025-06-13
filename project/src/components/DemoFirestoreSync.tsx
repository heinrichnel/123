import React, { useEffect, useState } from 'react';
import { 
  subscribeToDoc, 
  saveUIState, 
  loadUIState, 
  signIn, 
  signOutUser, 
  auth 
} from '../firebase';

const DemoFirestoreSync: React.FC = () => {
  const [docData, setDocData] = useState<Record<string, unknown> | null>(null);
  const [user, setUser] = useState<firebase.User | null>(() => loadUIState('user'));
  const [input, setInput] = useState('');

  useEffect(() => {
    // Listen for auth state changes
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) saveUIState('user', u);
      else saveUIState('user', null);
    });

    // Subscribe to a Firestore document (example: 'settings/demo')
    const unsubDoc = subscribeToDoc('settings', 'demo', setDocData);

    // Restore input from localStorage
    setInput(loadUIState('demoInput') || '');

    return () => {
      unsubAuth();
      unsubDoc();
    };
  }, []);

  // Save input to localStorage on change
  useEffect(() => {
    saveUIState('demoInput', input);
  }, [input]);


  return (
    <div>
      <h2>Demo Firestore Sync & Auth</h2>
      <div>
        {user ? (
          <>
            <div>Signed in as: {user.email}</div>
            <button onClick={() => signOutUser()}>Sign Out</button>
          </>
        ) : (
          <button onClick={() => signIn('test@example.com', 'password123')}>Sign In (Demo)</button>
        )}
      </div>
      <div>
        <h3>Firestore Document Data:</h3>
        <pre>{JSON.stringify(docData, null, 2)}</pre>
      </div>
      <div>
        <h3>Persisted Input:</h3>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type something..."
        />
      </div>
    </div>
  );
};

export default DemoFirestoreSync;