import { db, auth } from "../../firebase-config.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const Progress = (() => {
  const GAME_KEY = "fishChallenge";
  const LOCAL_KEY = `sannivesham_${GAME_KEY}_fallback`;
  let currentUser = null;
  let cloudData = null;

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
      await fetchCloudProgress();
    }
    window.ProgressReady = true;
    window.dispatchEvent(new CustomEvent("progress:ready"));
  });

  async function fetchCloudProgress() {
    if (!currentUser) return;
    try {
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (userSnap.exists()) {
        cloudData = userSnap.data().gameProgress?.[GAME_KEY] || { completedLevels: [], metrics: {} };
      }
    } catch (e) {
      console.warn("Fisheye progress fetch failed:", e);
    }
  }

  function getLocalFallback() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY)) || { completedLevels: [], metrics: {} };
    } catch (e) {
      return { completedLevels: [], metrics: {} };
    }
  }

  function isUnlocked(levelId) {
    if (Number(levelId) === 1) return true;
    const completedList = currentUser && cloudData ? cloudData.completedLevels : getLocalFallback().completedLevels;
    return Array.isArray(completedList) && completedList.includes(Number(levelId) - 1);
  }

  function getLevelProgress(levelId) {
    const data = currentUser && cloudData ? cloudData : getLocalFallback();
    const list = Array.isArray(data.completedLevels) ? data.completedLevels : [];
    return { completed: list.includes(Number(levelId)) };
  }

  async function recordCompletion(levelId, dynamicMetric) {
    levelId = Number(levelId);
    const local = getLocalFallback();
    if (!Array.isArray(local.completedLevels)) local.completedLevels = [];
    if (!local.completedLevels.includes(levelId)) {
      local.completedLevels.push(levelId);
    }
    localStorage.setItem(LOCAL_KEY, JSON.stringify(local));

    if (currentUser) {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        let currentProgress = {};
        if (userSnap.exists() && userSnap.data().gameProgress) {
          currentProgress = userSnap.data().gameProgress;
        }
        const standardGameProgress = currentProgress[GAME_KEY] || { completedLevels: [], metrics: {} };
        if (!Array.isArray(standardGameProgress.completedLevels)) {
          standardGameProgress.completedLevels = [];
        }
        if (!standardGameProgress.completedLevels.includes(levelId)) {
          standardGameProgress.completedLevels.push(levelId);
        }
        currentProgress[GAME_KEY] = standardGameProgress;
        await setDoc(userRef, { gameProgress: currentProgress }, { merge: true });
        cloudData = standardGameProgress;
      } catch (e) {
        console.warn("Fisheye progress record error:", e);
      }
    }
  }

  return { isUnlocked, getLevelProgress, recordCompletion };
})();

window.Progress = Progress;
