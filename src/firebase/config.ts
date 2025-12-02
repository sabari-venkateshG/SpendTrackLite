
// Use client directive for Firebase client-side code
'use client';

// Import the Firebase app and auth modules
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

function initializeFirebase() {
  if (typeof window !== "undefined") {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      firestore = getFirestore(app);

      if (process.env.NEXT_PUBLIC_EMULATOR_HOST) {
        const host = process.env.NEXT_PUBLIC_EMULATOR_HOST;
        try {
          console.log(`Connecting to Firebase emulators at ${host}`);
          connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
          connectFirestoreEmulator(firestore, host, 8080);
        } catch (e) {
          console.error('Error connecting to Firebase emulators:');
          console.error(e);
        }
      }
    } else {
      app = getApp();
      auth = getAuth(app);
      firestore = getFirestore(app);
    }
  }
  return { app, auth, firestore };
}

function getFirebase() {
    if(!app) {
        initializeFirebase();
    }
    return { app, auth, firestore };
}


export const firebaseApp = app;
export const firebaseAuth = auth;
export const firebaseFirestore = firestore;
export { getFirebase };
