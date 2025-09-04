// Firebase v8 configuration for React Native
import firebase from 'firebase';
import 'firebase/auth';
import 'firebase/firestore';

// Firebase configuration from web UI project
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
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export Firebase services
export const auth = firebase.auth();
export const db = firebase.firestore();
export default firebase;
