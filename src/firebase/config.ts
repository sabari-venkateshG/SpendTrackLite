
'use client';

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';

// Store the instances in a module-level variable to ensure they are singletons.
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function getFirebase() {
  // This function will only be called on the client side,
  // so `window` will always be defined.
  if (typeof window !== 'undefined') {
    // Check if Firebase has already been initialized.
    if (!getApps().length) {
      // This config object is now created only on the client,
      // where process.env variables are available.
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
      
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      firestore = getFirestore(app);

      if (process.env.NEXT_PUBLIC_EMULATOR_HOST) {
        // @ts-ignore - auth.emulatorConfig is not in the type definition but is a reliable check
        if (!auth.emulatorConfig) {
          try {
            console.log(`Connecting to Firebase emulators at ${process.env.NEXT_PUBLIC_EMULATOR_HOST}`);
            connectAuthEmulator(auth, `http://${process.env.NEXT_PUBLIC_EMULATOR_HOST}:9099`, { disableWarnings: true });
            connectFirestoreEmulator(firestore, process.env.NEXT_PUBLIC_EMULATOR_HOST, 8080);
          } catch (e) {
            console.error('Error connecting to Firebase emulators:', e);
          }
        }
      }
    } else {
      // If already initialized, get the existing instances.
      app = getApp();
      auth = getAuth(app);
      firestore = getFirestore(app);
    }
  }
  
  // The variables will be defined here because of the client-side check.
  // @ts-ignore
  return { app, auth, firestore };
}

export { getFirebase };
