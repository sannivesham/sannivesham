// Sannivesham Central Firebase Configuration & SDK Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDH2Fo5K4L2sOn_mH5C3mqG6aIlhpeziFg",
  authDomain: "sannivesham-b4231.firebaseapp.com",
  projectId: "sannivesham-b4231",
  storageBucket: "sannivesham-b4231.firebasestorage.app",
  messagingSenderId: "915869829387",
  appId: "1:915869829387:web:25d1f428a44fb3ef93fa0e",
  measurementId: "G-D4JD43J1QS"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default { app, auth, db, firebaseConfig };
