// Firebase setup for Chitravela
// Uses Firebase v9+ modular SDK loaded via CDN in index.html

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, get, update, remove, push, onValue, off,
  onDisconnect, serverTimestamp, runTransaction, child,
  onChildAdded, onChildRemoved
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBdJDprH49eNLWuixLSauZW4n3v8HrIhxY",
  authDomain: "chitravela-app.firebaseapp.com",
  databaseURL: "https://chitravela-app-default-rtdb.firebaseio.com",
  projectId: "chitravela-app",
  storageBucket: "chitravela-app.firebasestorage.app",
  messagingSenderId: "223254663940",
  appId: "1:223254663940:web:319b1f4a34b961ae223651",
  measurementId: "G-RZSXMBDLZD"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

export {
  ref, set, get, update, remove, push, onValue, off,
  onDisconnect, serverTimestamp, runTransaction, child,
  onChildAdded, onChildRemoved,
  signInAnonymously, onAuthStateChanged
};
