import { db, auth } from "./firebase-config.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const grid = document.getElementById("poojaGodsGrid");

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function loadGods() {
  const q = query(collection(db, "poojaGods"), orderBy("order", "asc"));
  const snapshot = await getDocs(q);

  grid.innerHTML = "";

  if (snapshot.empty) {
    grid.innerHTML = `<p style="color:white; text-align:center;">ఇంకా దేవుళ్ళు జోడించలేదు.</p>`;
    return;
  }

  snapshot.forEach((item) => {
    const god = item.data();
    grid.innerHTML += `
      <a href="pooja-room.html?god=${item.id}" class="story-card pooja-god-card" data-god-id="${item.id}">
        <img src="${god.image}" alt="${god.name}">
        <div class="story-name">${god.name}</div>
        <div class="pooja-done-badge">✅ నేడు పూజ పూర్తయింది</div>
      </a>
    `;
  });

  markCompletedGods();
}

async function markCompletedGods() {
  const today = getTodayString();
  const doneIds = new Set();

  const user = auth.currentUser;

  if (user) {
    const q = query(
      collection(db, "poojaProgress"),
      where("uid", "==", user.uid),
      where("date", "==", today)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach((d) => doneIds.add(d.data().godId));
  } else {
    const stored = JSON.parse(localStorage.getItem("poojaProgress") || "{}");
    if (stored.date === today && Array.isArray(stored.gods)) {
      stored.gods.forEach((id) => doneIds.add(id));
    }
  }

  doneIds.forEach((id) => {
    const card = grid.querySelector(`[data-god-id="${id}"]`);
    if (card) card.classList.add("pooja-done-today");
  });
}

onAuthStateChanged(auth, () => {
  markCompletedGods();
});

loadGods();
