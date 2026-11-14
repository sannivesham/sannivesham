import { auth, db } from "../firebase-config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  doc, getDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

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

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const isAdmin = await verifyAdminStatus(user);
    if (isAdmin) {
      window.location.href = "dashboard.html";
    }
  }
});

const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("adminMessage");

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();

  if (!email || !password) {
    message.innerHTML = "❌ Email మరియు Password నమోదు చేయండి";
    return;
  }

  message.innerHTML = "⏳ తనిఖీ చేస్తోంది (Verifying credentials)...";

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const isAdmin = await verifyAdminStatus(cred.user);

    if (!isAdmin) {
      await signOut(auth);
      message.innerHTML = "❌ ఈ ఖాతాకు అడ్మిన్ అనుమతులు లేవు (Access Denied: Not an authorized admin).";
      return;
    }

    message.innerHTML = "✅ Login Successful";
    window.location.href = "dashboard.html";
  } catch (error) {
    message.innerHTML = "❌ " + error.message;
  }
});
