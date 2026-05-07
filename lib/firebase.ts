import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import appleConfig from '../firebase-applet-config.json';

// Use environment variables for GitHub/External deployment
// Fallback to applet config for internal preview
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appleConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appleConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appleConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appleConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appleConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appleConfig.appId
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, import.meta.env.VITE_FIREBASE_DATABASE_ID || appleConfig.firestoreDatabaseId);

