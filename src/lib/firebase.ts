import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";

/* Firebase web config. These values are public identifiers (not secrets) —
   access is protected by Authentication + the rules in /firestore.rules.
   Any NEXT_PUBLIC_FIREBASE_* env variable overrides the value below. */
const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC0RQy_tfE12idZ8-6-pt5hrWX6I6eneno",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bar-cum-restaurant.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bar-cum-restaurant",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bar-cum-restaurant.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "202353700719",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:202353700719:web:d4948f56a47853882c829a",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-17JP2VFPZN",
};

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(cfg);
function makeFirestore(): Firestore {
  try {
    // an optional field left `undefined` must not make a save fail
    return initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    return getFirestore(app); // already initialised (hot reload)
  }
}
export const firestore: Firestore = makeFirestore();
export const fbAuth: Auth = getAuth(app);
