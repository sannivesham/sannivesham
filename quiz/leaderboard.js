import { db, auth } from "../firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

/* =========================================================
   1. STATE & URL PARAMETERS
   ========================================================= */
const urlParams = new URLSearchParams(window.location.search);
let currentType = urlParams.get("type") || "category";
let currentCategory = urlParams.get("category") || (currentType === "category" ? "hari" : "");
let currentLevel = urlParams.get("level") || (currentType === "general" ? "easy" : "");

// Fallback sanity check
if (currentType === "category" && !currentCategory) {
  currentCategory = "hari";
}
if (currentType === "general" && !currentLevel) {
  currentLevel = "easy";
}

let currentUser = null;

const labels = {
  hari: "à°¹à°°à°¿",
  hara: "à°¹à°°",
  devi: "à°¦à±‡à°µà°¿",
  telugu: "à°¤à±†à°²à±à°—à±"
};

const levelLabels = {
  easy: "à°¸à±à°²à°­à°‚",
  medium: "à°®à°§à±à°¯à°®à°‚",
  hard: "à°•à°·à±à°Ÿà°‚"
};

/* =========================================================
   2. AUTH STATE LISTENER
   ========================================================= */
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  await loadLeaderboard();
});

/* =========================================================
   3. TAB SWITCHING LOGIC
   ========================================================= */
const tabButtons = document.querySelectorAll(".lb-tab-btn");

function updateActiveTabButton() {
  tabButtons.forEach(btn => {
    const bType = btn.dataset.type;
    const bCat = btn.dataset.cat || "";
    const bLvl = btn.dataset.level || "";

    let match = false;
    if (currentType === "category" && bType === "category" && bCat === currentCategory) {
      match = true;
    } else if (currentType === "general" && bType === "general" && bLvl === currentLevel) {
      match = true;
    }

    if (match) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const bType = btn.dataset.type;
    currentType = bType;

    if (bType === "category") {
      currentCategory = btn.dataset.cat;
      currentLevel = "";
      window.history.replaceState(null, "", `leaderboard.html?type=category&category=${currentCategory}`);
    } else {
      currentCategory = "";
      currentLevel = btn.dataset.level;
      window.history.replaceState(null, "", `leaderboard.html?type=general&level=${currentLevel}`);
    }

    updateActiveTabButton();
    loadLeaderboard();
  });
});

/* =========================================================
   4. LOAD LEADERBOARD DATA
   ========================================================= */
async function loadLeaderboard() {
  updateActiveTabButton();

  const titleEl = document.getElementById("lbTitle");
  const subtitleEl = document.getElementById("lbSubtitle");
  const podiumEl = document.getElementById("lbPodium");
  const listEl = document.getElementById("lbList");

  // Determine score key and titles
  let scoreKey = "";
  let displayTitle = "";
  let displaySubtitle = "";

  if (currentType === "general") {
    scoreKey = `quizScore_general_${currentLevel}`;
    const lvlText = levelLabels[currentLevel] || currentLevel;
    displayTitle = `ðŸ† à°¸à°¾à°§à°¾à°°à°£ à°ªà±à°°à°¶à±à°¨à°¾à°µà°³à°¿ (${lvlText}) à°…à°—à±à°°à°¸à±à°¥à°¾à°¨à°¾à°²à±`;
    displaySubtitle = `à°¸à°¾à°§à°¾à°°à°£ à°ªà±à°°à°¶à±à°¨à°¾à°µà°³à°¿ ${lvlText} à°¸à±à°¥à°¾à°¯à°¿à°²à±‹ à°…à°¤à±à°¯à°§à°¿à°• à°ªà°¾à°¯à°¿à°‚à°Ÿà±à°²à± à°¸à°¾à°§à°¿à°‚à°šà°¿à°¨ à°µà°¾à°°à±`;
  } else {
    scoreKey = `quizScore_${currentCategory}`;
    const catText = labels[currentCategory] || currentCategory;
    displayTitle = `ðŸ† ${catText} à°µà°¿à°­à°¾à°—à°‚ à°…à°—à±à°°à°¸à±à°¥à°¾à°¨ à°ªà°Ÿà±à°Ÿà°¿à°•`;
    displaySubtitle = `${catText} à°µà°¿à°­à°¾à°—à°‚à°²à±‹ à°…à°¤à±à°¯à±à°¤à±à°¤à°® à°«à°²à°¿à°¤à°¾à°²à± à°¸à°¾à°§à°¿à°‚à°šà°¿à°¨ à°œà±à°žà°¾à°¨ à°¸à°¾à°§à°•à±à°²à±`;
  }

  if (titleEl) titleEl.innerText = displayTitle;
  if (subtitleEl) subtitleEl.innerText = displaySubtitle;

  if (podiumEl) podiumEl.style.display = "none";
  if (listEl) {
    listEl.innerHTML = "<p style='color:rgba(255,209,102,0.7); text-align:center; padding:24px;'>à°…à°—à±à°°à°¸à±à°¥à°¾à°¨à°¾à°² à°µà°¿à°µà°°à°¾à°²à± à°²à±‹à°¡à± à°…à°µà±à°¤à±à°¨à±à°¨à°¾à°¯à°¿...</p>";
  }

  try {
    const snapshot = await getDocs(collection(db, "users"));
    const users = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const score = Number(data[scoreKey] || 0);
      const name = data.name || data.displayName || data.username || "à°œà±à°žà°¾à°¨ à°¸à°¾à°§à°•à±à°¡à±";

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
      if (podiumEl) podiumEl.style.display = "none";
      if (listEl) {
        listEl.innerHTML = `
          <div style="text-align:center; padding:32px 18px; color:var(--quiz-text-muted);">
            <div style="font-size:2.4rem; margin-bottom:12px;">ðŸŒŸ</div>
            <h3 style="color:#ffd166; font-size:1.25rem; margin-bottom:8px;">à°‡à°‚à°•à°¾ à°Žà°µà°°à±‚ à°¸à±à°•à±‹à°°à± à°¨à°®à±‹à°¦à± à°šà±‡à°¯à°²à±‡à°¦à±</h3>
            <p>à°ˆ à°µà°¿à°­à°¾à°—à°‚à°²à±‹ à°®à±€à°°à±‡ à°®à±Šà°¦à°Ÿà°—à°¾ à°ªà±à°°à°¶à±à°¨à°¾à°µà°³à°¿ à°ªà±‚à°°à±à°¤à°¿à°šà±‡à°¸à°¿ à°®à±Šà°¦à°Ÿà°¿ à°¸à±à°¥à°¾à°¨à°¾à°¨à±à°¨à°¿ à°•à±ˆà°µà°¸à°‚ à°šà±‡à°¸à±à°•à±‹à°‚à°¡à°¿!</p>
          </div>
        `;
      }
      return;
    }

    // Top 3 for Podium
    const top3 = users.slice(0, 3);
    const rest = users.slice(3);

    if (podiumEl && top3.length > 0) {
      podiumEl.style.display = "flex";
      podiumEl.innerHTML = "";

      // Order: 2nd, 1st, 3rd for podium effect
      const podiumOrder = [
        { rank: 2, item: top3[1], medal: "ðŸ¥ˆ", cls: "rank-2" },
        { rank: 1, item: top3[0], medal: "ðŸ¥‡", cls: "rank-1" },
        { rank: 3, item: top3[2], medal: "ðŸ¥‰", cls: "rank-3" }
      ];

      podiumOrder.forEach(p => {
        if (!p.item) return;
        const isMe = currentUser && currentUser.uid === p.item.uid;
        const card = document.createElement("div");
        card.className = `podium-card ${p.cls}`;
        card.innerHTML = `
          <span class="podium-medal">${p.medal}</span>
          <div class="podium-name">${p.item.name} ${isMe ? "<span style='color:#ffd166;'>(à°®à±€à°°à±)</span>" : ""}</div>
          <div class="podium-score">â­ ${p.item.score.toLocaleString()}</div>
          <div style="font-size:0.8rem; color:var(--quiz-text-muted); margin-top:4px;">${p.rank}à°µ à°¸à±à°¥à°¾à°¨à°‚</div>
        `;
        podiumEl.appendChild(card);
      });
    }

    // Leaderboard list rows
    if (listEl) {
      listEl.innerHTML = "";

      users.forEach((user, index) => {
        const isMe = currentUser && currentUser.uid === user.uid;
        const row = document.createElement("div");
        row.className = isMe ? "lb-row lb-row-me" : "lb-row";

        let rankBadge = `${index + 1}`;
        if (index === 0) rankBadge = "ðŸ¥‡";
        else if (index === 1) rankBadge = "ðŸ¥ˆ";
        else if (index === 2) rankBadge = "ðŸ¥‰";

        row.innerHTML = `
          <div class="lb-left">
            <span class="lb-rank">${rankBadge}</span>
            <span class="lb-name">
              ${user.name}
              ${isMe ? " <span style='color:var(--quiz-gold); font-weight:800;'>(à°®à±€à°°à±)</span>" : ""}
            </span>
          </div>
          <span class="lb-score">â­ ${user.score.toLocaleString()}</span>
        `;
        listEl.appendChild(row);
      });
    }

  } catch (error) {
    console.error("Leaderboard load failed:", error);
    if (listEl) {
      listEl.innerHTML = "<p style='color:#e74c3c; text-align:center; padding:20px;'>à°…à°—à±à°°à°¸à±à°¥à°¾à°¨à°¾à°²à± à°²à±‹à°¡à± à°šà±‡à°¯à°¡à°‚à°²à±‹ à°²à±‹à°ªà°‚ à°¤à°²à±†à°¤à±à°¤à°¿à°‚à°¦à°¿. à°¦à°¯à°šà±‡à°¸à°¿ à°®à°³à±à°³à±€ à°ªà±à°°à°¯à°¤à±à°¨à°¿à°‚à°šà°‚à°¡à°¿.</p>";
    }
  }
}