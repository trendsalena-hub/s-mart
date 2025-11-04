import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIij0TnoYPTHAi_gdjDn3PG47Ea2jtdNY",
  authDomain: "alena-trends.firebaseapp.com",
  projectId: "alena-trends",
  storageBucket: "alena-trends.firebasestorage.app",
  messagingSenderId: "86663572684",
  appId: "1:86663572684:web:cdc55b722d3a27f4c00728",
  measurementId: "G-YXSHBPZQQJ"
};

// Initialize Firebase only once
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Export auth and firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
