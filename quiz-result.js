import { db, auth } from "./firebase-config.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

/* =====================================
   LOCAL STORAGE
===================================== */

const score = Number(localStorage.getItem("quizScore")) || 0;
const total = Number(localStorage.getItem("quizTotal")) || 10;
const type = localStorage.getItem("quizType") || "general";
const level = localStorage.getItem("quizLevel") || "";
const category = localStorage.getItem("quizCategory") || "";
const quizKey = localStorage.getItem("quizKey") || "";

const accuracy =
  total === 0
    ? 0
    : Math.round((score / total) * 100);

/* =====================================
   HTML
===================================== */

const resultType = document.getElementById("resultType");
const finalScore = document.getElementById("finalScore");
const accuracyText = document.getElementById("accuracyText");
const pointsText = document.getElementById("pointsText");

const lifetimeScore = document.getElementById("lifetimeScore");
const communityScore = document.getElementById("communityScore");

/* =====================================
   SHOW RESULT
===================================== */

finalScore.innerText = `${score} / ${total}`;

accuracyText.innerText =
  `Accuracy : ${accuracy}%`;

pointsText.innerText =
  `+${score} Points`;

if (type === "general") {

  resultType.innerText =
    `General Quiz (${level.toUpperCase()})`;

}
else {

  const titles = {
    hari: "Hari Quiz",
    hara: "Hara Quiz",
    devi: "Devi Quiz",
    telugu: "Telugu Quiz"
  };

  resultType.innerText =
    titles[category] || "Quiz";

}

/* =====================================
   USER DATA
===================================== */

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    lifetimeScore.innerText =
      "⭐ Login to save Lifetime Score";

    communityScore.innerText =
      "🌍 Login Required";

    return;

  }

  const userRef =
    doc(db, "users", user.uid);

  try {

    const snap =
      await getDoc(userRef);

    if (snap.exists()) {

      const data = snap.data();

      let scoreKey = "";

      if (type === "general") {

        scoreKey =
          `quizScore_general_${level}`;

      }
      else {

        scoreKey =
          `quizScore_${category}`;

      }

      const totalScore =
        data[scoreKey] || 0;

      lifetimeScore.innerText =
        `⭐ Lifetime Score : ${totalScore}`;

    }
    else {

      lifetimeScore.innerText =
        "⭐ Lifetime Score : 0";

    }

  }
  catch (e) {

    console.error(e);

    lifetimeScore.innerText =
      "⭐ Lifetime Score : --";

  }
    /* =====================================
     COMMUNITY SCORE
  ===================================== */

  if (type === "category") {

    try {

      const secRef = doc(db, "sectionScores", category);

      const secSnap = await getDoc(secRef);

      if (secSnap.exists()) {

        const totalCommunity =
          secSnap.data().total || 0;

        communityScore.innerText =
          `🌍 Community Score : ${totalCommunity}`;

      }
      else {

        communityScore.innerText =
          "🌍 Community Score : 0";

      }

    }
    catch (e) {

      console.error(e);

      communityScore.innerText =
        "🌍 Community Score : --";

    }

  }
  else {

    communityScore.innerText =
      "🌍 General Quiz has separate leaderboards";

  }

});

/* =====================================
   PLAY AGAIN BUTTON
===================================== */

const playAgainBtn =
  document.querySelectorAll(".quiz-bottom-buttons button")[0];

if (playAgainBtn) {

  playAgainBtn.onclick = () => {

    localStorage.removeItem("quizScore");
    localStorage.removeItem("quizTotal");
    localStorage.removeItem("quizType");
    localStorage.removeItem("quizLevel");
    localStorage.removeItem("quizCategory");
    localStorage.removeItem("quizKey");

    window.location.href = "quiz.html";

  };

}

/* =====================================
   LEADERBOARD BUTTON
===================================== */

const leaderboardBtn =
  document.querySelectorAll(".quiz-bottom-buttons button")[1];

if (leaderboardBtn) {

  leaderboardBtn.onclick = () => {

    if (type === "general") {

      window.location.href =
        `leaderboard.html?type=general&level=${level}`;

    }
    else {

      window.location.href =
        `leaderboard.html?type=category&category=${category}`;

    }

  };

}

/* =====================================
   CLEANUP
===================================== */

window.addEventListener("beforeunload", () => {

  localStorage.removeItem("quizScore");
  localStorage.removeItem("quizTotal");
  localStorage.removeItem("quizType");
  localStorage.removeItem("quizLevel");
  localStorage.removeItem("quizCategory");
  localStorage.removeItem("quizKey");

});

/* =====================================
   END
===================================== */

console.log("Quiz Result Loaded Successfully");