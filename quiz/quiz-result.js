import { db, auth } from "../firebase-config.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

/* =====================================
   LOCAL STORAGE DATA
===================================== */
const score = Number(localStorage.getItem("quizScore")) || 0;
const total = Number(localStorage.getItem("quizTotal")) || 10;
const type = localStorage.getItem("quizType") || "general";
const level = localStorage.getItem("quizLevel") || "";
const category = localStorage.getItem("quizCategory") || "";
const quizKey = localStorage.getItem("quizKey") || "";

const accuracy = total === 0 ? 0 : Math.round((score / total) * 100);

/* =====================================
   DOM ELEMENTS
===================================== */
const resultType = document.getElementById("resultType");
const finalScore = document.getElementById("finalScore");
const accuracyText = document.getElementById("accuracyText");
const pointsText = document.getElementById("pointsText");
const lifetimeScore = document.getElementById("lifetimeScore");
const communityScore = document.getElementById("communityScore");

const playAgainBtn = document.getElementById("playAgainBtn");
const leaderboardBtn = document.getElementById("leaderboardBtn");

/* =====================================
   RENDER RESULT DETAILS
===================================== */
if (finalScore) finalScore.innerText = `${score} / ${total}`;
if (accuracyText) accuracyText.innerText = `${accuracy}%`;
if (pointsText) pointsText.innerText = `+${score}`;

const levelLabels = {
  easy: "à°¸à±à°²à°­à°‚",
  medium: "à°®à°§à±à°¯à°®à°‚",
  hard: "à°•à°·à±à°Ÿà°‚"
};

const categoryLabels = {
  hari: "à°¹à°°à°¿ à°µà°¿à°­à°¾à°—à°‚",
  hara: "à°¹à°° à°µà°¿à°­à°¾à°—à°‚",
  devi: "à°¦à±‡à°µà°¿ à°µà°¿à°­à°¾à°—à°‚",
  telugu: "à°¤à±†à°²à±à°—à± à°µà°¿à°­à°¾à°—à°‚"
};

if (resultType) {
  if (type === "general") {
    const lvlText = levelLabels[level] || level;
    resultType.innerText = `à°¸à°¾à°§à°¾à°°à°£ à°ªà±à°°à°¶à±à°¨à°¾à°µà°³à°¿ (${lvlText})`;
  } else {
    resultType.innerText = categoryLabels[category] || "à°ªà±à°°à°¶à±à°¨à°¾à°µà°³à°¿";
  }
}

/* =====================================
   USER DATA & COMMUNITY SCORES
===================================== */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (lifetimeScore) lifetimeScore.innerText = "à°²à°¾à°—à°¿à°¨à± à°…à°µà±à°µà°²à±‡à°¦à±";
    if (communityScore) {
      if (type === "category" && category) {
        loadCommunityScoreOnly();
      } else {
        communityScore.innerText = "à°¸à°¾à°§à°¾à°°à°£à°‚";
      }
    }
    return;
  }

  // Load User Lifetime Score
  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();

      // Total lifetime score across all categories
      let totalLifetime = 0;
      Object.keys(data).forEach(k => {
        if (k.startsWith("quizScore_")) {
          totalLifetime += Number(data[k] || 0);
        }
      });

      if (lifetimeScore) lifetimeScore.innerText = `${totalLifetime.toLocaleString()} â­`;
    } else {
      if (lifetimeScore) lifetimeScore.innerText = "0 â­";
    }
  } catch (e) {
    console.error("Error loading user lifetime score:", e);
    if (lifetimeScore) lifetimeScore.innerText = "--";
  }

  // Load Community Score for Categories
  if (type === "category" && category) {
    loadCommunityScoreOnly();
  } else {
    if (communityScore) communityScore.innerText = "à°¸à°¾à°§à°¾à°°à°£à°‚";
  }
});

async function loadCommunityScoreOnly() {
  try {
    const secRef = doc(db, "sectionScores", category);
    const secSnap = await getDoc(secRef);
    if (secSnap.exists()) {
      const totalCommunity = Number(secSnap.data().total) || 0;
      if (communityScore) communityScore.innerText = `${totalCommunity.toLocaleString()}`;
    } else {
      if (communityScore) communityScore.innerText = "0";
    }
  } catch (e) {
    console.error("Error loading community score:", e);
    if (communityScore) communityScore.innerText = "--";
  }
}

/* =====================================
   BUTTON ACTIONS
===================================== */
if (playAgainBtn) {
  playAgainBtn.onclick = () => {
    localStorage.removeItem("quizScore");
    localStorage.removeItem("quizTotal");
    localStorage.removeItem("quizType");
    localStorage.removeItem("quizLevel");
    localStorage.removeItem("quizCategory");
    localStorage.removeItem("quizKey");

    if (type === "general") {
      window.location.href = `play-quiz.html?type=general&level=${level || 'easy'}`;
    } else if (category) {
      window.location.href = `play-quiz.html?type=category&category=${category}`;
    } else {
      window.location.href = "index.html";
    }
  };
}

if (leaderboardBtn) {
  leaderboardBtn.onclick = () => {
    if (type === "general") {
      window.location.href = `leaderboard.html?type=general&level=${level || 'easy'}`;
    } else {
      window.location.href = `leaderboard.html?type=category&category=${category || 'hari'}`;
    }
  };
}

/* =====================================
   CLEANUP ON UNLOAD
===================================== */
window.addEventListener("beforeunload", () => {
  localStorage.removeItem("quizScore");
  localStorage.removeItem("quizTotal");
  localStorage.removeItem("quizType");
  localStorage.removeItem("quizLevel");
  localStorage.removeItem("quizCategory");
  localStorage.removeItem("quizKey");
});