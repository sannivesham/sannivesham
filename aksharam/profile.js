// Sannivesham Aksharam — profile.js
// Displays user profile and real-time learning progress from Firebase Firestore

import {
  auth,
  onAuthStateChanged,
  signOut,
  subscribeToUserProgress,
  getUserProgressLocal
} from "./firebase.js";

const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const profilePhoto = document.getElementById("profilePhoto");
const logoutBtn = document.getElementById("logoutBtn");

const userLevel = document.getElementById("userLevel");
const userLessons = document.getElementById("userLessons");
const userStreak = document.getElementById("userStreak");
const userXp = document.getElementById("userXp");

function renderUserStats(progress) {
  const completed = progress?.completedSections || [];
  const streak = progress?.streak || 1;
  const xp = progress?.xp || (completed.length * 50 + 20);

  if (userLessons) userLessons.textContent = completed.length.toString();
  if (userStreak) userStreak.textContent = `${streak} Day${streak === 1 ? '' : 's'}`;
  if (userXp) userXp.textContent = `${xp} XP`;

  if (userLevel) {
    if (completed.length >= 6) userLevel.textContent = "Level 4 • Real-World";
    else if (completed.length >= 4) userLevel.textContent = "Level 3 • Syllables";
    else if (completed.length >= 2) userLevel.textContent = "Level 2 • Consonants";
    else userLevel.textContent = "Level 1 • Foundations";
  }
}

let progressUnsub = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "signin.html";
    return;
  }

  if (userName) userName.textContent = user.displayName || user.email.split("@")[0];
  if (userEmail) userEmail.textContent = user.email;

  if (profilePhoto) {
    if (user.photoURL) {
      profilePhoto.src = user.photoURL;
    } else {
      const initial = (user.displayName || user.email || 'U')[0].toUpperCase();
      profilePhoto.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=7A2048&color=ffffff&size=300`;
    }
  }

  // Subscribe to realtime progress
  if (progressUnsub) progressUnsub();
  progressUnsub = subscribeToUserProgress(user.uid, (progress) => {
    renderUserStats(progress);
  });
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    if (progressUnsub) progressUnsub();
    await signOut(auth);
    window.location.href = "signin.html";
  });
}
