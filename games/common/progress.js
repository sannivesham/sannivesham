/**
 * Sannivesham Common Game Progress Module
 * 
 * Provides unified offline-first progress management and Firestore synchronization
 * across all Sannivesham cultural games.
 */
import { db, auth } from "../../firebase-config.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

export function createGameProgress(gameKey, options = {}) {
  const LOCAL_KEY = `sannivesham_${gameKey}_fallback`;
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
    if (markReady) markReady();
    window.dispatchEvent(new CustomEvent("progress:ready"));
  });

  async function fetchCloudProgress() {
    if (!currentUser) return;
    try {
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (userSnap.exists()) {
        const data = userSnap.data();
        cloudData = data.gameProgress?.[gameKey] || { completedLevels: [], metrics: {} };
      } else {
        cloudData = { completedLevels: [], metrics: {} };
      }
    } catch (e) {
      // Offline or network error; gracefully fallback to local cache
      cloudData = null;
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
    return Array.isArray(completedList) && completedList.includes(Number(levelId) - 1);
  }

  function getLevelProgress(levelId) {
    const data = currentUser && cloudData ? cloudData : getLocalFallback();
    const completed = Array.isArray(data.completedLevels) && data.completedLevels.includes(Number(levelId));
    const scoreMetric = data.metrics?.[levelId] || null;
    return {
      completed: completed,
      bestMoves: gameKey === "slidingPuzzle" ? scoreMetric : null,
      bestTime: gameKey !== "slidingPuzzle" ? scoreMetric : null
    };
  }

  async function recordCompletion(levelId, dynamicMetric) {
    levelId = Number(levelId);

    // 1. Always write locally first to keep game execution instant
    const local = getLocalFallback();
    if (!Array.isArray(local.completedLevels)) local.completedLevels = [];
    if (!local.metrics) local.metrics = {};
    if (!local.completedLevels.includes(levelId)) {
      local.completedLevels.push(levelId);
    }
    const existingMetric = local.metrics[levelId];
    local.metrics[levelId] = existingMetric ? Math.min(existingMetric, dynamicMetric) : dynamicMetric;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(local));

    // 2. If user is logged in, sync to their Firestore profile.
    if (currentUser) {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        const currentProgress = userSnap.exists() ? (userSnap.data().gameProgress || {}) : {};
        const standardGameProgress = currentProgress[gameKey] || { completedLevels: [], metrics: {} };
        if (!Array.isArray(standardGameProgress.completedLevels)) standardGameProgress.completedLevels = [];
        if (!standardGameProgress.metrics) standardGameProgress.metrics = {};

        if (!standardGameProgress.completedLevels.includes(levelId)) {
          standardGameProgress.completedLevels.push(levelId);
        }
        const currentBest = standardGameProgress.metrics[levelId];
        standardGameProgress.metrics[levelId] = currentBest ? Math.min(currentBest, dynamicMetric) : dynamicMetric;
        currentProgress[gameKey] = standardGameProgress;

        await setDoc(userRef, { gameProgress: currentProgress }, { merge: true });

        // Refresh cloud cache tracking snapshot
        cloudData = standardGameProgress;
      } catch (e) {
        // Non-blocking sync error
      }
    }
  }

  const instance = {
    isUnlocked,
    getLevelProgress,
    recordCompletion
  };

  window.Progress = instance;
  return instance;
}
