import { db, auth } from "https://sannivesham.com/firebase-config.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const Progress = (() => {
  const GAME_KEY = "fishChallenge";
  const LOCAL_KEY = `sannivesham_${GAME_KEY}_fallback`;
  let currentUser = null;
  let cloudData = null;

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) await fetchCloudProgress();
  });

  async function fetchCloudProgress() {
    if (!currentUser) return;
    try {
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (userSnap.exists()) {
        cloudData = userSnap.data().gameProgress?.[GAME_KEY] || { completedLevels: [], metrics: {} };
      }
    } catch (e) { console.error(e); }
  }

  function getLocalFallback() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || { completedLevels: [], metrics: {} }; }
    catch (e) { return { completedLevels: [], metrics: {} }; }
  }

  function isUnlocked(levelId) {
    if (Number(levelId) === 1) return true;
    const completedList = currentUser && cloudData ? cloudData.completedLevels : getLocalFallback().completedLevels;
    return completedList.includes(Number(levelId) - 1);
  }

  function getLevelProgress(levelId) {
    const data = currentUser && cloudData ? cloudData : getLocalFallback();
    return { completed: data.completedLevels.includes(Number(levelId)) };
  }

  async function recordCompletion(levelId, dynamicMetric) {
    levelId = Number(levelId);
    const local = getLocalFallback();
    if (!local.completedLevels.includes(levelId)) local.completedLevels.push(levelId);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(local));

    if (currentUser) {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const currentProgress = userSnap.data().gameProgress || {};
          const standardGameProgress = currentProgress[GAME_KEY] || { completedLevels: [], metrics: {} };
          if (!standardGameProgress.completedLevels.includes(levelId)) standardGameProgress.completedLevels.push(levelId);
          currentProgress[GAME_KEY] = standardGameProgress;
          await updateDoc(userRef, { gameProgress: currentProgress });
          cloudData = standardGameProgress;
        }
      } catch (e) { console.error(e); }
    }
  }

  return { isUnlocked, getLevelProgress, recordCompletion };
})();
window.Progress = Progress;
