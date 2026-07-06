import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const festivalsGrid = document.querySelector(".festivals-grid");

async function loadFestivals() {
  const q = query(
    collection(db, "festivals"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  festivalsGrid.innerHTML = "";

  snapshot.forEach((docItem) => {
    const festival = docItem.data();

    festivalsGrid.innerHTML += `
      <a href="festival-detail.html?id=${docItem.id}" class="festival-card">
        <img src="${festival.cardImage}" alt="${festival.title}">
        <div class="festival-name">${festival.title}</div>
      </a>
    `;
  });
}

loadFestivals();