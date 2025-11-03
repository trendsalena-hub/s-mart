// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCIij0TnoYPTHAi_gdjDn3PG47Ea2jtdNY",
  authDomain: "alena-trends.firebaseapp.com",
  projectId: "alena-trends",
  storageBucket: "alena-trends.firebasestorage.app",
  messagingSenderId: "866635726841",
  appId: "1:866635726841:web:cdc55b722d3a27f4c00728",
  measurementId: "G-YYSHQPXDQJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);