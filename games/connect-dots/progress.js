import { db, auth } from "../../firebase-config.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const Progress = (() => {
  const GAME_KEY = "connectDots";
  const LOCAL_KEY = `sannivesham_${GAME_KEY}_fallback`;
  let currentUser = null;
  let cloudData = null;

  let markReady;
  const readyPromise = new Promise((resolve) => { markReady = resolve; });
  window.ProgressReady = readyPromise;

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
      await fetchCloudProgress();
    } else {
      cloudData = null;
    }
    markReady();
    window.dispatchEvent(new CustomEvent("progress:ready"));
  });

  async function fetchCloudProgress() {
    if (!currentUser) return;
    try {
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (userSnap.exists()) {
        const data = userSnap.data();
        cloudData = data.gameProgress?.[GAME_KEY] || { completedLevels: [], metrics: {} };
      } else {
        cloudData = { completedLevels: [], metrics: {} };
      }
    } catch (e) {
      console.error("Error fetching progress from Firebase:", e);
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
    const completedList = currentUser && cloudData
      ? cloudData.completedLevels
      : getLocalFallback().completedLevels;
    return completedList.includes(Number(levelId) - 1);
  }

  function getLevelProgress(levelId) {
    const data = currentUser && cloudData ? cloudData : getLocalFallback();
    const completed = data.completedLevels.includes(Number(levelId));
    const scoreMetric = data.metrics?.[levelId] || null;
    return {
      completed: completed,
      bestTime: scoreMetric
    };
  }

  async function recordCompletion(levelId, dynamicMetric = 0) {
    levelId = Number(levelId);
    const local = getLocalFallback();
    if (!local.completedLevels.includes(levelId)) {
      local.completedLevels.push(levelId);
    }
    if (dynamicMetric > 0) {
      const existing = local.metrics[levelId];
      local.metrics[levelId] = existing ? Math.min(existing, dynamicMetric) : dynamicMetric;
    }
    localStorage.setItem(LOCAL_KEY, JSON.stringify(local));

    if (currentUser) {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        const currentProgress = userSnap.exists() ? (userSnap.data().gameProgress || {}) : {};
        const standardGameProgress = currentProgress[GAME_KEY] || { completedLevels: [], metrics: {} };
        if (!standardGameProgress.completedLevels.includes(levelId)) {
          standardGameProgress.completedLevels.push(levelId);
        }
        if (dynamicMetric > 0) {
          const currentBest = standardGameProgress.metrics[levelId];
          standardGameProgress.metrics[levelId] = currentBest ? Math.min(currentBest, dynamicMetric) : dynamicMetric;
        }
        currentProgress[GAME_KEY] = standardGameProgress;
        await setDoc(userRef, { gameProgress: currentProgress }, { merge: true });
        cloudData = standardGameProgress;
      } catch (e) {
        console.error("Failed syncing metrics to cloud database:", e);
      }
    }
  }

  return { isUnlocked, getLevelProgress, recordCompletion };
})();

window.Progress = Progress;
