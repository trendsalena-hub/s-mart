import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCIij0TnoYPTHAi_gdjDn3PG47Ea2jtdNY",
  authDomain: "alena-trends.firebaseapp.com",
  projectId: "alena-trends",
  storageBucket: "alena-trends.firebasestorage.app",
  messagingSenderId: "86663572684",
  appId: "1:86663572684:web:cdc55b722d3a27f4c00728",
  measurementId: "G-YXSHBPZQQJ",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);      // ✅ Initialize Auth first
export const db = getFirestore(app);
export const storage = getStorage(app); // ✅ Then Storage
export default app;
