// Sannivesham Aksharam — firebase.js
// Connects to Sannivesham Firebase backend with Realtime Firestore and Auth

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Sannivesham Production Firebase Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDH2Fo5K4L2sOn_mH5C3mqG6aIlhpeziFg",
  authDomain: "sannivesham-b4231.firebaseapp.com",
  projectId: "sannivesham-b4231",
  storageBucket: "sannivesham-b4231.firebasestorage.app",
  messagingSenderId: "915869829387",
  appId: "1:915869829387:web:25d1f428a44fb3ef93fa0e",
  measurementId: "G-D4JD43J1QS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Cloudinary Configuration for Media Uploads
export const CLOUDINARY_CONFIG = {
  cloudName: "du5em76za",
  uploadPreset: "sannivesham_upload"
};

// Admin email check list (matches existing Sannivesham admin logic)
export const ADMIN_EMAILS = [
  "admin@sannivesham.com",
  "sannivesham@gmail.com",
  "sanniveshamapp@gmail.com",
  "potturisanjeev@gmail.com"
];

/**
 * Checks if the user has administrative privileges
 */
export async function checkIsAdmin(user) {
  if (!user) return false;
  
  // If user signed in via password or email matches ADMIN_EMAILS
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return true;
  }
  
  // Check settings/admin document in Firestore
  try {
    const adminSnap = await getDoc(doc(db, "settings", "admin"));
    if (adminSnap.exists()) {
      const data = adminSnap.data();
      if (Array.isArray(data.emails) && data.emails.includes(user.email)) return true;
      if (data.email && data.email === user.email) return true;
    }
  } catch (e) {
    console.warn("Could not check settings/admin collection:", e);
  }

  // Check aksharam_admins collection
  try {
    const aksharamAdminSnap = await getDoc(doc(db, "aksharam_admins", user.uid));
    if (aksharamAdminSnap.exists()) return true;
  } catch (e) {
    // collection might not exist yet
  }

  // Fallback check: if user has a verified admin session key stored in sessionStorage
  if (sessionStorage.getItem("aksharam_admin_session") === "true") {
    return true;
  }

  return false;
}

/**
 * Realtime listener for Roadmap curriculum data
 */
export function subscribeToRoadmap(onSuccess, onError) {
  const roadmapDocRef = doc(db, "aksharam_roadmap", "curriculum");
  
  const unsubscribe = onSnapshot(roadmapDocRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.milestones && data.milestones.length > 0) {
        // Cache to localStorage for offline fast boot
        try {
          localStorage.setItem("aksharam_roadmap_cache", JSON.stringify(data.milestones));
        } catch (_) {}
        onSuccess(data.milestones, "cloud");
        return;
      }
    }
    // Document does not exist or is empty in Firestore yet
    onSuccess(null, "empty");
  }, (err) => {
    console.warn("Firestore roadmap subscription warning (falling back to local cache):", err);
    if (onError) onError(err);
  });

  return unsubscribe;
}

/**
 * Save complete Roadmap curriculum to Firestore
 */
export async function saveRoadmapToCloud(milestones) {
  const roadmapDocRef = doc(db, "aksharam_roadmap", "curriculum");
  await setDoc(roadmapDocRef, {
    milestones: milestones,
    updatedAt: serverTimestamp(),
    version: "2.0"
  }, { merge: true });

  // Update local cache
  try {
    localStorage.setItem("aksharam_roadmap_cache", JSON.stringify(milestones));
  } catch (_) {}
}

/**
 * Realtime listener for User Progress (completed sections, streak, xp, quiz scores)
 */
export function subscribeToUserProgress(uid, onUpdate) {
  if (!uid) {
    // Guest user - load from localStorage
    onUpdate(getUserProgressLocal());
    return () => {};
  }

  const userDocRef = doc(db, "aksharam_users", uid);

  const unsubscribe = onSnapshot(userDocRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      // Sync local copy
      saveUserProgressLocal(data);
      onUpdate(data);
    } else {
      // First time user: initialize doc with local progress if any
      const initial = getUserProgressLocal();
      saveUserProgress(uid, initial).then(() => onUpdate(initial)).catch(() => onUpdate(initial));
    }
  }, (err) => {
    console.warn("User progress subscription offline:", err);
    onUpdate(getUserProgressLocal());
  });

  return unsubscribe;
}

/**
 * Save User Progress to Firestore and localStorage
 */
export async function saveUserProgress(uid, progress) {
  // Always update localStorage first for instant responsiveness
  saveUserProgressLocal(progress);

  if (!uid) return;

  try {
    const userDocRef = doc(db, "aksharam_users", uid);
    await setDoc(userDocRef, {
      ...progress,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn("Error saving progress to Firestore:", err);
  }
}

/**
 * LocalStorage Fallback Helpers for offline/guest users
 */
export function getUserProgressLocal() {
  try {
    const raw = localStorage.getItem("aksharam_user_progress");
    if (raw) return JSON.parse(raw);
  } catch (_) {}

  // Fallback defaults
  return {
    completedSections: JSON.parse(localStorage.getItem("aksharam_completed_lessons") || "[]"),
    streak: parseInt(localStorage.getItem("aksharam_streak") || "1", 10),
    xp: parseInt(localStorage.getItem("aksharam_xp") || "50", 10),
    quizScores: {},
    matchScores: {},
    lastActiveDate: new Date().toISOString().split("T")[0]
  };
}

export function saveUserProgressLocal(progress) {
  try {
    localStorage.setItem("aksharam_user_progress", JSON.stringify(progress));
    if (progress.completedSections) {
      localStorage.setItem("aksharam_completed_lessons", JSON.stringify(progress.completedSections));
    }
    if (progress.streak) {
      localStorage.setItem("aksharam_streak", progress.streak.toString());
    }
    if (progress.xp) {
      localStorage.setItem("aksharam_xp", progress.xp.toString());
    }
  } catch (_) {}
}

export {
  app,
  auth,
  db,
  provider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  deleteDoc
};
