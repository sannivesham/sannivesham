import { db, auth } from "../firebase-config.js";
import {
  doc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

/* =========================================================
   1. NUMBER COUNT-UP ANIMATION HELPER
   ========================================================= */
function animateValue(element, start, end, duration = 800) {
  if (!element) return;
  start = Number(start) || 0;
  end = Number(end) || 0;
  if (start === end) {
    element.innerText = end.toLocaleString();
    return;
  }
  const range = end - start;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + range * ease);
    element.innerText = current.toLocaleString();
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.innerText = end.toLocaleString();
    }
  }
  requestAnimationFrame(update);
}

/* =========================================================
   2. DIFFICULTY SELECTION FOR GENERAL QUIZ
   ========================================================= */
let selectedDifficulty = "";

const easyBtn = document.getElementById("easyQuizBtn");
const mediumBtn = document.getElementById("mediumQuizBtn");
const hardBtn = document.getElementById("hardQuizBtn");
const difficultyButtons = [easyBtn, mediumBtn, hardBtn].filter(Boolean);

function selectDifficulty(level, button) {
  selectedDifficulty = level;
  difficultyButtons.forEach(btn => {
    btn.classList.remove("selected-difficulty");
  });
  if (button) button.classList.add("selected-difficulty");
}

if (easyBtn) easyBtn.addEventListener("click", () => selectDifficulty("easy", easyBtn));
if (mediumBtn) mediumBtn.addEventListener("click", () => selectDifficulty("medium", mediumBtn));
if (hardBtn) hardBtn.addEventListener("click", () => selectDifficulty("hard", hardBtn));

/* =========================================================
   3. START GENERAL QUIZ
   ========================================================= */
const startGeneralQuiz = document.getElementById("startGeneralQuiz");
if (startGeneralQuiz) {
  startGeneralQuiz.addEventListener("click", () => {
    if (!selectedDifficulty) {
      alert("దయచేసి సులభం, మధ్యమం లేదా కష్టం స్థాయిలలో ఒకదాన్ని ఎంచుకోండి.");
      return;
    }
    window.location.href = `play-quiz.html?type=general&level=${selectedDifficulty}`;
  });
}

const generalLeaderboardBtn = document.getElementById("generalLeaderboardBtn");
if (generalLeaderboardBtn) {
  generalLeaderboardBtn.addEventListener("click", () => {
    const lvl = selectedDifficulty || "easy";
    window.location.href = `leaderboard.html?type=general&level=${lvl}`;
  });
}

/* =========================================================
   4. CATEGORY QUIZ START & LEADERBOARD NAVIGATION
   ========================================================= */
function openCategoryQuiz(category) {
  window.location.href = `play-quiz.html?type=category&category=${category}`;
}

function openCategoryLeaderboard(category) {
  window.location.href = `leaderboard.html?type=category&category=${category}`;
}

const categoryCards = document.querySelectorAll(".quiz-category-card");
categoryCards.forEach(card => {
  const startBtn = card.querySelector(".quiz-start-btn");
  const lbBtn = card.querySelector(".quiz-leaderboard-btn");
  const cat = card.dataset.category;

  if (startBtn) {
    startBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openCategoryQuiz(cat);
    });
  }

  if (lbBtn) {
    lbBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openCategoryLeaderboard(cat);
    });
  }
});

/* =========================================================
   5. REAL-TIME COMMUNITY SCORES (సమూహ ఫలితం)
   ========================================================= */
const sections = ["hari", "hara", "devi", "telugu"];
const currentScores = {
  hari: 0,
  hara: 0,
  devi: 0,
  telugu: 0
};

sections.forEach(sec => {
  onSnapshot(doc(db, "sectionScores", sec), (snap) => {
    const total = snap.exists() ? (Number(snap.data().total) || 0) : 0;
    const el = document.getElementById(`${sec}Score`);
    if (el) {
      animateValue(el, currentScores[sec], total, 900);
      currentScores[sec] = total;
    }
  }, (err) => {
    console.warn(`Error streaming community score for ${sec}:`, err);
  });
});

/* =========================================================
   6. USER LIFETIME PERSONAL SCORE
   ========================================================= */
const loadingBox = document.getElementById("userScoreLoading");
const loggedInBox = document.getElementById("userScoreLoggedIn");
const loggedOutBox = document.getElementById("userScoreLoggedOut");

const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");
const userLifetimeTotal = document.getElementById("userLifetimeTotal");
const userScoreHari = document.getElementById("userScoreHari");
const userScoreHara = document.getElementById("userScoreHara");
const userScoreDevi = document.getElementById("userScoreDevi");
const userScoreTelugu = document.getElementById("userScoreTelugu");
const userScoreGeneral = document.getElementById("userScoreGeneral");

onAuthStateChanged(auth, async (user) => {
  if (loadingBox) loadingBox.style.display = "none";

  if (!user) {
    if (loggedInBox) loggedInBox.style.display = "none";
    if (loggedOutBox) loggedOutBox.style.display = "flex";
    return;
  }

  if (loggedOutBox) loggedOutBox.style.display = "none";
  if (loggedInBox) loggedInBox.style.display = "block";

  // Display user info
  const displayName = user.displayName || user.email?.split("@")[0] || "సాధకుడు";
  if (userName) userName.innerText = `నమస్కారం, ${displayName}! 🙏`;
  if (userAvatar) {
    const firstLetter = displayName.charAt(0).toUpperCase();
    userAvatar.innerText = firstLetter || "🕉️";
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();

      const hari = Number(data.quizScore_hari || 0);
      const hara = Number(data.quizScore_hara || 0);
      const devi = Number(data.quizScore_devi || 0);
      const telugu = Number(data.quizScore_telugu || 0);

      const genEasy = Number(data.quizScore_general_easy || 0);
      const genMed = Number(data.quizScore_general_medium || 0);
      const genHard = Number(data.quizScore_general_hard || 0);
      const general = genEasy + genMed + genHard;

      let total = hari + hara + devi + telugu + general;
      Object.keys(data).forEach(k => {
        if (k.startsWith("quizScore_") &&
            !["quizScore_hari", "quizScore_hara", "quizScore_devi", "quizScore_telugu",
              "quizScore_general_easy", "quizScore_general_medium", "quizScore_general_hard"].includes(k)) {
          total += Number(data[k] || 0);
        }
      });

      animateValue(userLifetimeTotal, 0, total, 1000);
      animateValue(userScoreHari, 0, hari, 800);
      animateValue(userScoreHara, 0, hara, 800);
      animateValue(userScoreDevi, 0, devi, 800);
      animateValue(userScoreTelugu, 0, telugu, 800);
      animateValue(userScoreGeneral, 0, general, 800);
    } else {
      if (userLifetimeTotal) userLifetimeTotal.innerText = "0";
      if (userScoreHari) userScoreHari.innerText = "0";
      if (userScoreHara) userScoreHara.innerText = "0";
      if (userScoreDevi) userScoreDevi.innerText = "0";
      if (userScoreTelugu) userScoreTelugu.innerText = "0";
      if (userScoreGeneral) userScoreGeneral.innerText = "0";
    }
  } catch (err) {
    console.warn("User lifetime score load error:", err);
  }
});
