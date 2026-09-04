import { db, auth } from "https://sannivesham.com/firebase-config.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const Progress = (() => {
  // Determine which game folder this script is executing inside
  const path = window.location.pathname;
  const GAME_KEY = path.includes("word-search") ? "wordSearch" :
                   path.includes("Sliding-Puzzle") ? "slidingPuzzle" : "sudoku";

  const LOCAL_KEY = `sannivesham_${GAME_KEY}_fallback`;
  let currentUser = null;
  let cloudData = null;

  // Listen to the shared auth state change globally
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
      await fetchCloudProgress();
    } else {
      cloudData = null;
    }
    markReady();
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
      bestMoves: GAME_KEY === "slidingPuzzle" ? scoreMetric : null,
      bestTime: GAME_KEY !== "slidingPuzzle" ? scoreMetric : null
    };
  }

  async function recordCompletion(levelId, dynamicMetric) {
    levelId = Number(levelId);

    // 1. Always write locally first to keep game execution instant
    const local = getLocalFallback();
    if (!local.completedLevels.includes(levelId)) {
      local.completedLevels.push(levelId);
    }
    const existingMetric = local.metrics[levelId];
    local.metrics[levelId] = existingMetric ? Math.min(existingMetric, dynamicMetric) : dynamicMetric;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(local));

    // 2. If user is logged in, sync to their Firestore profile.
    //    setDoc(..., { merge: true }) instead of updateDoc so this still
    //    works when the user document doesn't exist yet (brand-new account) —
    //    updateDoc would previously no-op there and progress never synced.
    if (currentUser) {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        const currentProgress = userSnap.exists() ? (userSnap.data().gameProgress || {}) : {};
        const standardGameProgress = currentProgress[GAME_KEY] || { completedLevels: [], metrics: {} };
        if (!standardGameProgress.completedLevels.includes(levelId)) {
          standardGameProgress.completedLevels.push(levelId);
        }
        const currentBest = standardGameProgress.metrics[levelId];
        standardGameProgress.metrics[levelId] = currentBest ? Math.min(currentBest, dynamicMetric) : dynamicMetric;
        currentProgress[GAME_KEY] = standardGameProgress;

        await setDoc(userRef, { gameProgress: currentProgress }, { merge: true });

        // Refresh local cache tracking snapshot state
        cloudData = standardGameProgress;
      } catch (e) {
        console.error("Failed syncing metrics to cloud database document storage:", e);
      }
    }
  }

  // --- Readiness signal -----------------------------------------------
  // progress.js is loaded as a module, which defers its execution until
  // after the page has parsed. Plain <script> files like game.js run
  // immediately and were reading window.Progress before auth state and
  // the Firestore fetch had resolved, so isUnlocked() would incorrectly
  // report every level beyond 1 as locked. window.ProgressReady lets
  // consumers await the real, settled progress state before deciding
  // whether to redirect a player away from a level.
  let markReady;
  const readyPromise = new Promise((resolve) => { markReady = resolve; });
  window.ProgressReady = readyPromise;

  return { isUnlocked, getLevelProgress, recordCompletion };
})();

window.Progress = Progress;
