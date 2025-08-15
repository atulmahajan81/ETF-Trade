import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ✅ ACTUAL FIREBASE CONFIG FOR "eft-trade" PROJECT
const firebaseConfig = {
  apiKey: "AIzaSyAxTxdrtPcvd2771oLSo76jluUGrJTh4jQ",
  authDomain: "eft-trade.firebaseapp.com",
  projectId: "eft-trade",
  storageBucket: "eft-trade.firebasestorage.app",
  messagingSenderId: "950459287167",
  appId: "1:950459287167:web:2b0e0161b306e3068c214a",
  measurementId: "G-WF9M2HMBJM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app; 