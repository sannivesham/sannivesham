import { db } from "./firebase-config.js";

import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

/* ===========================
   DIFFICULTY SELECTION
=========================== */

let selectedDifficulty = "";

const easyBtn = document.getElementById("easyQuizBtn");
const mediumBtn = document.getElementById("mediumQuizBtn");
const hardBtn = document.getElementById("hardQuizBtn");
const difficultyButtons = [easyBtn, mediumBtn, hardBtn];

function selectDifficulty(level, button) {
  selectedDifficulty = level;
  difficultyButtons.forEach(btn => {
    if (btn) btn.classList.remove("selected-difficulty");
  });
  button.classList.add("selected-difficulty");
}

if (easyBtn) easyBtn.addEventListener("click", () => selectDifficulty("easy", easyBtn));
if (mediumBtn) mediumBtn.addEventListener("click", () => selectDifficulty("medium", mediumBtn));
if (hardBtn) hardBtn.addEventListener("click", () => selectDifficulty("hard", hardBtn));

/* ===========================
   START GENERAL QUIZ
=========================== */

const startGeneralQuiz = document.getElementById("startGeneralQuiz");

if (startGeneralQuiz) {
  startGeneralQuiz.addEventListener("click", () => {
    if (!selectedDifficulty) {
      alert("Easy, Medium లేదా Hard ఎంచుకోండి");
      return;
    }
    window.location.href = `play-quiz.html?type=general&level=${selectedDifficulty}`;
  });
}

/* ===========================
   GENERAL LEADERBOARD
=========================== */

const generalLeaderboardBtn = document.getElementById("generalLeaderboardBtn");

if (generalLeaderboardBtn) {
  generalLeaderboardBtn.addEventListener("click", () => {
    window.location.href = "leaderboard.html?type=general";
  });
}

/* ===========================
   CATEGORY QUIZ START
=========================== */

function openCategoryQuiz(category) {
  window.location.href = `play-quiz.html?type=category&category=${category}`;
}

function openCategoryLeaderboard(category) {
  window.location.href = `leaderboard.html?type=category&category=${category}`;
}

// Use class-based approach since no IDs on category cards
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

/* ===========================
   COMMUNITY SCORES (REALTIME)
=========================== */

const sections = ["hari", "hara", "devi", "telugu"];

sections.forEach(sec => {
  onSnapshot(doc(db, "sectionScores", sec), (snap) => {
    const total = snap.exists() ? (snap.data().total || 0) : 0;
    const el = document.getElementById(`${sec}Score`);
    if (el) el.innerText = total;
  });
});