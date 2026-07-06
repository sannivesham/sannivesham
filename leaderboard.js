import { db, auth } from "./firebase-config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

/* ===========================================
   URL PARAMETERS
=========================================== */

const params = new URLSearchParams(window.location.search);

const type = params.get("type") || "general";
const category = params.get("category") || "";
const level = params.get("level") || "";

/* ===========================================
   LABELS
=========================================== */

const labels = {
  hari: "హరి",
  hara: "హర",
  devi: "దేవి",
  telugu: "తెలుగు"
};

/* ===========================================
   SCORE KEY
=========================================== */

const scoreKey =
  type === "general"
    ? `quizScore_general_${level}`
    : `quizScore_${category}`;

/* ===========================================
   TITLE
=========================================== */

const title =
  type === "general"
    ? `🏆 General ${level.toUpperCase()} Leaderboard`
    : `🏆 ${labels[category] || category} Leaderboard`;

document.getElementById("lbTitle").innerText = title;

/* ===========================================
   CURRENT USER
=========================================== */

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  await loadLeaderboard();
});

/* ===========================================
   LOAD LEADERBOARD
=========================================== */

async function loadLeaderboard() {

  const lbList = document.getElementById("lbList");

  lbList.innerHTML =
    "<p style='color:rgba(255,255,255,.5);text-align:center'>Loading...</p>";

  try {

    const snapshot =
      await getDocs(collection(db, "users"));

    const users = [];

    snapshot.forEach(docSnap => {

      const data = docSnap.data();

      const score =
        Number(data[scoreKey] || 0);

      const name =
        data.name ||
        data.displayName ||
        data.username ||
        "Unknown";

      if (score > 0) {

        users.push({
          uid: docSnap.id,
          name,
          score
        });

      }

    });

    users.sort((a, b) => b.score - a.score);

    if (users.length === 0) {

      lbList.innerHTML =
        "<p style='color:white;text-align:center'>No Scores Yet</p>";

      return;

    }

    const medals = [
      "🥇",
      "🥈",
      "🥉"
    ];

    lbList.innerHTML = "";

    users.forEach((user, index) => {

      const isMe =
        currentUser &&
        currentUser.uid === user.uid;

      const row = document.createElement("div");

      row.className =
        isMe
          ? "lb-row lb-row-me"
          : "lb-row";

      row.innerHTML = `

        <span class="lb-rank">
          ${medals[index] || (index + 1)}
        </span>

        <span class="lb-name">
          ${user.name}
          ${isMe ? " (You)" : ""}
        </span>

        <span class="lb-score">
          ⭐ ${user.score}
        </span>

      `;

      lbList.appendChild(row);

    });

  }
  catch (error) {

    console.error(error);

    lbList.innerHTML =
      "<p style='color:red;text-align:center'>Failed to load leaderboard.</p>";

  }

}