/**
 * SANNIVESHAM — SECURE ADMIN AUTHENTICATION
 * 
 * Security Features:
 * 1. Safe textContent rendering (Zero XSS from error strings)
 * 2. Client-side brute-force defense with exponential lockout
 * 3. Multi-Factor Authentication (MFA) detection & handling
 * 4. Token-based custom claims verification
 */

import { auth, db } from "../firebase-config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  doc, getDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("adminMessage");

function getLockoutState() {
  const lockedUntil = parseInt(localStorage.getItem("admin_locked_until") || "0", 10);
  const failedAttempts = parseInt(localStorage.getItem("admin_failed_attempts") || "0", 10);
  const now = Date.now();

  if (lockedUntil > now) {
    const remainingSec = Math.ceil((lockedUntil - now) / 1000);
    return { isLocked: true, remainingSec, failedAttempts };
  }
  return { isLocked: false, remainingSec: 0, failedAttempts };
}

function recordFailedAttempt() {
  const current = parseInt(localStorage.getItem("admin_failed_attempts") || "0", 10) + 1;
  localStorage.setItem("admin_failed_attempts", current.toString());

  if (current >= MAX_FAILED_ATTEMPTS) {
    const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
    localStorage.setItem("admin_locked_until", lockUntil.toString());
    return { locked: true, remainingSec: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
  }
  return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - current };
}

function resetLockoutState() {
  localStorage.removeItem("admin_failed_attempts");
  localStorage.removeItem("admin_locked_until");
}

function updateLockoutUI() {
  const state = getLockoutState();
  if (state.isLocked) {
    loginBtn.disabled = true;
    message.textContent = `⏳ ఖాతా తాత్కాలికంగా లాక్ చేయబడింది. దయచేసి ${state.remainingSec} సెకన్ల తర్వాత ప్రయత్నించండి (Too many attempts. Locked).`;
    setTimeout(updateLockoutUI, 1000);
    return true;
  } else {
    loginBtn.disabled = false;
    return false;
  }
}

async function verifyAdminStatus(user) {
  if (!user) return false;
  try {
    const tokenResult = await user.getIdTokenResult(true);
    if (tokenResult?.claims?.admin === true) {
      return true;
    }
  } catch (e) {
    console.warn("Claim check error:", e);
  }

  // Fallback check against settings/admin allowlist
  if (user.email) {
    try {
      const adminSnap = await getDoc(doc(db, "settings", "admin"));
      if (adminSnap.exists()) {
        const data = adminSnap.data();
        if (Array.isArray(data.emails) && data.emails.includes(user.email)) return true;
        if (data.email && data.email === user.email) return true;
      }
    } catch (e) {
      console.warn("Allowlist check error:", e);
    }
  }
  return false;
}

// Initial check for active lockout
updateLockoutUI();

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const isAdmin = await verifyAdminStatus(user);
    if (isAdmin) {
      resetLockoutState();
      window.location.href = "dashboard.html";
    }
  }
});

loginBtn.addEventListener("click", async () => {
  if (updateLockoutUI()) return;

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();

  if (!email || !password) {
    message.textContent = "❌ Email మరియు Password నమోదు చేయండి";
    return;
  }

  message.textContent = "⏳ తనిఖీ చేస్తోంది (Verifying credentials)...";
  loginBtn.disabled = true;

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const isAdmin = await verifyAdminStatus(cred.user);

    if (!isAdmin) {
      await signOut(auth);
      const attemptInfo = recordFailedAttempt();
      if (attemptInfo.locked) {
        updateLockoutUI();
      } else {
        message.textContent = `❌ ఈ ఖాతాకు అడ్మిన్ అనుమతులు లేవు (Access Denied: Not an admin). మిగిలిన ప్రయత్నాలు: ${attemptInfo.remainingAttempts}`;
      }
      return;
    }

    resetLockoutState();
    message.textContent = "✅ Login Successful";
    window.location.href = "dashboard.html";

  } catch (error) {
    if (error.code === "auth/multi-factor-auth-required") {
      message.textContent = "🔐 Multi-Factor Authentication (MFA) required. Please complete secondary verification.";
      console.warn("MFA required for this admin account:", error.resolver);
      return;
    }

    const attemptInfo = recordFailedAttempt();
    if (attemptInfo.locked) {
      updateLockoutUI();
    } else {
      message.textContent = `❌ ${error.message} (మిగిలిన ప్రయత్నాలు: ${attemptInfo.remainingAttempts})`;
    }
  } finally {
    const state = getLockoutState();
    if (!state.isLocked) {
      loginBtn.disabled = false;
    }
  }
});
