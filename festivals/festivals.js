import { db } from "../firebase-config.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { slugify } from "../library/reader.js";

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
    const slug = festival.slug || slugify(festival.title) || docItem.id;

    festivalsGrid.innerHTML += `
      <a href="festival-detail.html?slug=${encodeURIComponent(slug)}" class="festival-card">
        <img src="${festival.cardImage}" alt="${festival.title}">
        <div class="festival-name">${festival.title}</div>
      </a>
    `;
  });
}

loadFestivals();